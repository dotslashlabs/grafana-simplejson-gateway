import { IsNotEmpty, IsNumberString, Allow } from 'class-validator';
import { Readable } from 'stream';

type FORMAT = 'json';

export enum TargetType {
  timeserie = 'timeserie',
  table = 'table',
}

export class ReqRangeRaw {
  @Allow()
  from: string;

  @Allow()
  to: string;
}

export class ReqRange {
  @Allow()
  from: string;

  @Allow()
  to: string;

  @Allow()
  raw: ReqRangeRaw;
}

export class ReqTarget {
  @IsNumberString()
  refId!: string;

  @IsNotEmpty()
  target!: string;

  @IsNotEmpty()
  type!: TargetType;
}

export class ReqFilter {
  @Allow()
  key: string;

  @Allow()
  operator: string;

  @Allow()
  value: string;
}

export class ReqRangeQuery {
  @Allow()
  range: ReqRange;

  @Allow()
  rangeRaw: ReqRangeRaw;
}

export class ReqQuery extends ReqRangeQuery {
  @Allow()
  panelId: number;

  @Allow()
  interval: string;

  @Allow()
  intervalMs: number;

  @Allow()
  targets!: [ReqTarget];

  @Allow()
  adhocFilters: [ReqFilter];

  @Allow()
  format: FORMAT;

  @Allow()
  maxDataPoints: number;

  @Allow()
  timezone: string;

  @Allow()
  scopedVars: any;
}

export class ReqSearch {
  @Allow()
  target!: string;
}

export interface SearchResponse {
  text: string;
  value: number|string;
}

export class Annotation {
  @Allow()
  name: string;

  @Allow()
  datasource: string;

  @Allow()
  iconColor: string;

  @Allow()
  enable: boolean;

  @Allow()
  query: string;
}

export class ReqAnnotation extends ReqRangeQuery {
  @Allow()
  annotation!: Annotation;
}

export abstract class SimpleJSONResponse {
  target!: string;
  refId: string;

  constructor(target: string|ReqTarget, refId?: string) {
    if (typeof target !== 'string') {
      this.target = target.target;
      this.refId = target.refId;
    } else {
      this.target = target;
      this.refId = refId;
    }
  }

  async populateFromStream(source: Readable, transformFn?: (o: any) => any[]) {
    return await Utils.readStream(source, row => {
      this.addRow(transformFn ? transformFn(row) : row);
    });
  }

  abstract addRow(r: any[]): SimpleJSONResponse;
}

export class TimeserieResponse extends SimpleJSONResponse {
  type: string = TargetType.timeserie;
  datapoints: Array<[number, number]> = [];

  addRow(r: [number, number], skipLengthCheck: boolean = false) {
    if (!skipLengthCheck && r.length !== 2) {
      throw new Error('Row must contain 2 items.');
    }

    this.datapoints.push(r);
    return this;
  }

  populate(arr: any[], transformRow?: (r: any) => [number, number], skipLengthCheck: boolean = false) {
    arr.forEach(r => this.addRow(transformRow ? transformRow(r) : (r as [number, number]), skipLengthCheck));
    return this;
  }

  async populateFromStream(source: Readable, transformFn?: (o: any) => [number, number]) {
    return super.populateFromStream(source, transformFn);
  }

  isEmpty() {
    return (this.datapoints.length === 0);
  }

}

export enum ResColumnType {
  number = 'number',
  string = 'string',
  date = 'date',
  time = 'time',
}

export class TableResponse extends SimpleJSONResponse {
  type: string = TargetType.table;
  rows: any[][] = [];
  columns: Array<{ text: string, type: ResColumnType }> = [];

  setColumns(columns: Array<{ text: string, type: ResColumnType }>) {
    this.columns = columns;
    return this;
  }

  addColumn(column: { text: string, type: ResColumnType }) {
    this.columns.push(column);
  }

  addRow(r: Array<string|number|Date>, skipLengthCheck: boolean = false) {
    if (!this.columns.length) {
      throw new Error(`Columns must be set using "setColumns(...)" before rows can be added.`);
    }

    if (!skipLengthCheck && r.length !== this.columns.length) {
      throw new Error(`Row must contain ${this.columns.length} items.`);
    }

    this.rows.push(r);
    return this;
  }

  populate(arr: any[], transformRow?: (r: any) => Array<string|number|Date>, skipLengthCheck: boolean = false) {
    arr.forEach(r => this.addRow(transformRow ? transformRow(r) : r, skipLengthCheck));
    return this;
  }

  async populateFromStream(source: Readable, transformFn?: (o: any) => Array<string|number|Date>) {
    return super.populateFromStream(source, transformFn);
  }

  isEmpty() {
    return (this.rows.length === 0);
  }

}

export interface AnnotationResponse {
  annotation: Annotation;
  time: number;
  title: string;
  text?: string;
  tags?: string[];
}

export interface TagKeyResponse {
  type: ResColumnType;
  text: string;
}

export class ReqTagValues {
  @Allow()
  key!: string;
}

export interface TagValueResponse {
  text: string|number|Date;
}

export class Utils {

  static populate(
    target: TimeserieResponse,
    source: Readable,
    valueColumn: string,
    timestampColumn: string = 'timestamp',
    transformFn?: (o: any) => any,
  ) {
    let inspectedTimeCol = false;
    let isTimeColDate = false;

    return Utils.readStream(source, row => {
      if (transformFn) {
        row = transformFn(row);
      }

      if (!inspectedTimeCol) {
        isTimeColDate = (row[timestampColumn] instanceof Date);
        inspectedTimeCol = true;
      }

      target.addRow([row[valueColumn], isTimeColDate
        ? row[timestampColumn].getTime()
        : row[timestampColumn]]);
    });
  }

  static readStream(readable: Readable, chunkCallback?: (r: any) => void) {
    return new Promise((resolve, reject) => {
      const chunks = chunkCallback ? undefined : [];
      readable.on('error', reject);
      readable.on('end', () => chunkCallback ? resolve() : resolve(Buffer.concat(chunks)));
      readable.on('data', chunk => chunkCallback ? chunkCallback(chunk) : chunks.push(chunk));
    });
  }

  static getDefaultResponse(reqTarget: ReqTarget) {
    return (reqTarget.type === TargetType.timeserie)
      ? new TimeserieResponse(reqTarget.target, reqTarget.refId)
      : new TableResponse(reqTarget.target, reqTarget.refId);
  }

}

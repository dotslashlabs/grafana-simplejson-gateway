import { ReqQuery, ReqTarget, SimpleJSONResponse, TargetType, ReqSearch, SearchResponse,
         ReqAnnotation, AnnotationResponse, TagKeyResponse, TagValueResponse, ReqTagValues } from './simplejson.dto';

export enum QueryProviderType {
  query = 'query',
  search = 'search',
  annotation = 'annotation',
  tagKey = 'tagKey',
  tagValue = 'tagValue',
}

export interface IQueryProvider {
  readonly target: string;
  readonly type: QueryProviderType;
}

export abstract class QueryProvider implements IQueryProvider {
  type = QueryProviderType.query;

  constructor(readonly target: string, private readonly handledTargetTypes: TargetType[]) {

  }

  canHandleTargetType(targetType: TargetType): boolean {
    return this.handledTargetTypes.some(t => t === targetType);
  }

  abstract async invoke(reqTarget: ReqTarget, reqQuery: ReqQuery): Promise<SimpleJSONResponse[]>;

}

export abstract class SearchProvider implements IQueryProvider {
  type = QueryProviderType.search;

  constructor(readonly target: string) {

  }

  abstract async invoke(reqSearch: ReqSearch): Promise<SearchResponse[]>;

}

export abstract class AnnotationProvider implements IQueryProvider {
  type = QueryProviderType.annotation;

  constructor(readonly target: string) {

  }

  abstract async invoke(reqAnnotation: ReqAnnotation): Promise<AnnotationResponse[]>;

}

export abstract class TagKeyProvider implements IQueryProvider {
  type = QueryProviderType.tagKey;

  constructor(readonly target: string) {

  }

  abstract async invoke(reqTagKey: any): Promise<TagKeyResponse[]>;

}

export abstract class TagValueProvider implements IQueryProvider {
  type = QueryProviderType.tagValue;

  constructor(readonly target: string) {

  }

  abstract async invoke(reqTagValues: ReqTagValues): Promise<TagValueResponse[]>;

}

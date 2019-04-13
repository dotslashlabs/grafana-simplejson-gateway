import { Injectable } from '@nestjs/common';
import { QueryProvider, AnnotationProvider, TagKeyProvider, SearchProvider, TagValueProvider } from '../common/query-provider';
import { QueryRegistryService } from '../common/query-registry.service';
import { SimpleJSONResponse, ReqQuery, ReqTarget, TargetType, TimeserieResponse,
         TableResponse, ResColumnType, ReqAnnotation, AnnotationResponse, TagKeyResponse,
         ReqSearch, SearchResponse } from '../common/simplejson.dto';
import axios from 'axios';
import { ReqTagValues, TagValueResponse } from '../common/simplejson.dto';

@Injectable()
export class DummyService {

  constructor(registryService: QueryRegistryService) {
    registryService.register(new DummyQueryProvider('Dummy', [TargetType.timeserie, TargetType.table]))
      .register(new DummySearchProvider('var1'))
      .register(new DummyAnnotationProvider('Dummy'))
      .register(new DummyTagKeyProvider('Dummy'))
      .register(new DummyTagValueProvider('TagKey1'));
  }

}

class DummyQueryProvider extends QueryProvider {

  async invoke(reqTarget: ReqTarget, reqQuery: ReqQuery): Promise<SimpleJSONResponse[]> {
    const responses = [];

    const SAMPLE_DATA = await /* some db or API op */ Promise.resolve([
      { date: new Date(Date.now() - (2 * 3600000)) /* 2 hrs ago */, metric: 'Dummy Metric', value: 100 },
      { date: new Date(Date.now() - (5 * 60000)) /* 5 mins ago */, metric: 'Dummy Metric', value: 200 },
    ]);

    switch (reqTarget.type) {
      case TargetType.timeserie:
        const timeserieResponse = new TimeserieResponse(reqTarget);
        timeserieResponse.populate(SAMPLE_DATA, (o: any) => [ o.value, o.date.getTime() ]);
        // if data is a Readable object stream, use
        // await timeserieResponse.populateFromStream(readable, o => [ o.value, o.date.getTime() ]);

        responses.push(timeserieResponse);

        // we can also respond with more than one timeserie for a single "target"
        const timeserieResponse2 = new TimeserieResponse('Multi-series', reqTarget.refId);
        timeserieResponse2.populate(SAMPLE_DATA, (o: any) => [ o.value - 50, o.date.getTime() ]);
        responses.push(timeserieResponse2);
        break;

      case TargetType.table:
        const tableResponse = new TableResponse(reqTarget);
        tableResponse.setColumns([
          { text: 'Id', type: ResColumnType.number },
          { text: 'Name', type: ResColumnType.string },
          { text: 'E-mail', type: ResColumnType.string },
          { text: 'Body', type: ResColumnType.string },
        ]);

        tableResponse.populate(
          (await axios({ url: 'https://jsonplaceholder.typicode.com/comments' })).data,
          (o: any) => [
            o.id,
            o.name,
            o.email,
            o.body,
          ]);

        responses.push(tableResponse);
        break;
    }

    return Promise.resolve(responses);
  }

}

class DummySearchProvider extends SearchProvider {

  invoke(reqSearch: ReqSearch): Promise<SearchResponse[]> {
    return Promise.resolve([
      { text: 'Value 1', value: 1 },
      { text: 'Value 2', value: 2 },
      { text: 'Value 3', value: 3 },
      { text: 'Value 4', value: 4 },
    ]);
  }

}

class DummyAnnotationProvider extends AnnotationProvider {

  invoke(reqAnnotation: ReqAnnotation): Promise<AnnotationResponse[]> {
    return Promise.resolve([
      {
        annotation: reqAnnotation.annotation,
        time: (Date.now() - 3600000),
        title: 'Dummy Annotation',
      },
    ]);
  }

}

class DummyTagKeyProvider extends TagKeyProvider {

  invoke(reqTagKey: any): Promise<TagKeyResponse[]> {
    return Promise.resolve([
      { type: ResColumnType.string, text: 'TagKey1' },
    ]);
  }

}

class DummyTagValueProvider extends TagValueProvider {

  invoke(reqTagValues: ReqTagValues): Promise<TagValueResponse[]> {
    return Promise.resolve([
      { text: 'TagValue1' },
      { text: 'TagValue2' },
    ]);
  }

}

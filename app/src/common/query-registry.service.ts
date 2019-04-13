import { Injectable } from '@nestjs/common';
import { IQueryProvider, QueryProviderType, SearchProvider, QueryProvider,
         AnnotationProvider, TagKeyProvider, TagValueProvider } from './query-provider';
import {
  ReqQuery, ReqTarget, SimpleJSONResponse, ReqSearch, SearchResponse, ReqAnnotation,
  AnnotationResponse, TagKeyResponse, TagValueResponse, ReqTagValues } from './simplejson.dto';

@Injectable()
export class QueryRegistryService {

  private providerMap: Map<QueryProviderType, Map<string, IQueryProvider>> = new Map();

  register(queryProvider: IQueryProvider, targetName: string = queryProvider.target) {
    if (!this.providerMap.has(queryProvider.type)) {
      this.providerMap.set(queryProvider.type, new Map<string, IQueryProvider>());
    }

    if (this.targetExists(targetName, queryProvider.type)) {
      // tslint:disable-next-line:no-console
      console.warn(`Replacing existing target:${targetName}`);
    }

    this.providerMap.get(queryProvider.type).set(targetName, queryProvider);
    return this;
  }

  private targetExists(targetName: string, queryProviderType: QueryProviderType = QueryProviderType.query) {
    return (this.providerMap.has(queryProviderType)
            && this.providerMap.get(queryProviderType).has(targetName));
  }

  private getProvider(targetName: string, queryProviderType: QueryProviderType = QueryProviderType.query): IQueryProvider {
    if (!this.providerMap.has(queryProviderType)) {
      throw new Error(`Query provider type not found: ${queryProviderType}`);
    }

    const targetMap: Map<string, IQueryProvider> = this.providerMap.get(queryProviderType);
    if (!targetMap.has(targetName)) {
      throw new Error(`Query provider not found for target: ${targetName}`);
    }

    return targetMap.get(targetName);
  }

  getTargetNames() {
    return [ ...this.providerMap.get(QueryProviderType.query).keys() ].sort();
  }

  async resolveQuery(reqQuery: ReqQuery): Promise<{ errors: string[], results: SimpleJSONResponse[] }> {
    const targets = reqQuery.targets;
    const { unhandled, handled } = this.resolveTargets(targets.map(t => t.target), QueryProviderType.query);
    const errors: string[] = unhandled.length ? [ `Unhandled targets: "${unhandled.join('", "')}"` ] : [];
    const unhandledTargetTypes: ReqTarget[] = [];

    const tasks = handled.reduce((acc, { target, provider }) => {
      const p = provider as QueryProvider;
      const reqTarget = targets.find(t => t.target === target);

      if (p.canHandleTargetType(reqTarget.type)) {
        acc.push({ target, provider, invoke: () => p.invoke(reqTarget, reqQuery) });
      } else {
        unhandledTargetTypes.push(reqTarget);
      }

      return acc;
    }, [] as Array<Task<SimpleJSONResponse>>);

    if (unhandledTargetTypes.length) {
      errors.push(`Unhandled target types: "${unhandledTargetTypes.map(t => `${t.target}:type:${t.type}`).join('", "')}"`);
    }

    if (!tasks.length) {
      return { errors, results: ([] as SimpleJSONResponse[]) };
    }

    return { errors, results: await this.invokeTasks<SimpleJSONResponse>(tasks, errors) };
  }

  async resolveSearch(reqSearch: ReqSearch): Promise<{ errors: string[], results: SearchResponse[] }> {
    const { unhandled, handled } = this.resolveTargets([ reqSearch.target ], QueryProviderType.search);
    const errors: string[] = unhandled.length ? [ `Unhandled targets: "${unhandled.join('", "')}"` ] : [];

    const tasks: Array<Task<SearchResponse>> = handled.map(({ target, provider }) => {
      return { target, provider, invoke: () => (provider as SearchProvider).invoke(reqSearch) };
    });

    return { errors, results: await this.invokeTasks(tasks, errors) };
  }

  async resolveAnnotation(reqAnnotation: ReqAnnotation): Promise<{ errors: string[], results: AnnotationResponse[] }> {
    const { handled } = this.resolveTargets([
      reqAnnotation.annotation.query,
      reqAnnotation.annotation.name,
    ], QueryProviderType.annotation);

    const errors: string[] = [];

    const tasks: Array<Task<AnnotationResponse>> = handled.map(({ target, provider }) => {
      return { target, provider, invoke: () => (provider as AnnotationProvider).invoke(reqAnnotation) };
    });

    return { errors, results: await this.invokeTasks(tasks, errors) };
  }

  async resolveTagKeys(reqTagKeys: any): Promise<{ errors: string[], results: TagKeyResponse[] }> {
    const errors: string[] = [];

    if (!this.providerMap.has(QueryProviderType.tagKey)) {
      return { errors, results: [] };
    }

    const tasks: Array<Task<TagKeyResponse>> = [
      ...this.providerMap.get(QueryProviderType.tagKey).values(),
    ].map(provider => {
      return { provider, invoke: () => (provider as TagKeyProvider).invoke(reqTagKeys) };
    });

    const results = await this.invokeTasks(tasks, errors);
    results.sort((a, b) => `${a.text}`.localeCompare(`${b.text}`));
    return { errors, results };
  }

  async resolveTagValues(reqTagValues: ReqTagValues): Promise<{ errors: string[], results: TagValueResponse[] }> {
    const { unhandled, handled } = this.resolveTargets([ reqTagValues.key ], QueryProviderType.tagValue);
    const errors: string[] = unhandled.length ? [ `Unhandled tag keys: "${unhandled.join('", "')}"` ] : [];

    const tasks: Array<Task<TagValueResponse>> = handled.map(({ target, provider }) => {
      return { target, provider, invoke: () => (provider as TagValueProvider).invoke(reqTagValues) };
    });

    const results = await this.invokeTasks(tasks, errors);
    results.sort((a, b) => `${a.text}`.localeCompare(`${b.text}`));
    return { errors, results };
  }

  private resolveTargets(targetNames: string[], queryProviderType: QueryProviderType) {
    return targetNames.reduce((acc, target) => {
      if (target) {
        try {
          const provider = this.getProvider(target, queryProviderType);
          acc.handled.push({ target, provider });
          return acc;
        } catch (err) {
          // ignore
        }

        acc.unhandled.push(target);
      }

      return acc;
    }, { unhandled: [], handled: [] } as {
      unhandled: string[],
      handled: Array<{ target: string, provider: IQueryProvider }>,
    });
  }

  private async invokeTasks<T>(tasks: Array<Task<T>>, errors?: string[]): Promise<T[]> {
    const results = await Promise.all(tasks.map(async ({ target, provider, invoke }) => {
      try {
        return await invoke();
      } catch (err) {
        if (errors) {
          errors.push(`Failed to query target:${target || 'NONE'} by provider:${provider.constructor.name}: ${err.message}`);
        } else {
          throw err;
        }
      }
    }));

    return results.reduce((a, b) => a.concat(b), []);
  }

}

interface Task<T> {
  provider: IQueryProvider;
  target?: string;
  invoke: () => Promise<T[]>;
}

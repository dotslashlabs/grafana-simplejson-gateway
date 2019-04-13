import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import { QueryRegistryService } from './common/query-registry.service';
import { ReqQuery, ReqSearch, ReqAnnotation, ReqTagValues } from './common/simplejson.dto';
import { FastifyReply } from 'fastify';

@Controller()
export class AppController {

  constructor(private readonly registry: QueryRegistryService) {
  }

  @Get()
  root() {
    return { success: true };
  }

  @Post('/query')
  async query(@Body() reqQuery: ReqQuery, @Res() reply: FastifyReply<any>) {
    const { errors, results } = await this.registry.resolveQuery(reqQuery);
    this.respond(reply, results, errors);
  }

  @Post('/search')
  async search(@Body() reqSearch: ReqSearch, @Res() reply: FastifyReply<any>) {
    if (!reqSearch.target) {
      return this.respond(reply, this.registry.getTargetNames());
    }

    const { errors, results } = await this.registry.resolveSearch(reqSearch);
    this.respond(reply, results, errors);
  }

  @Post('/annotations')
  async annotations(@Body() reqAnnotation: ReqAnnotation, @Res() reply: FastifyReply<any>) {
    const { errors, results } = await this.registry.resolveAnnotation(reqAnnotation);
    this.respond(reply, results, errors);
  }

  @Post('/tag-keys')
  async tagKeys(@Body() reqTagKeys: any, @Res() reply: FastifyReply<any>) {
    const { errors, results } = await this.registry.resolveTagKeys(reqTagKeys);
    this.respond(reply, results, errors);
  }

  @Post('/tag-values')
  async tagValues(@Body() reqTagValues: ReqTagValues, @Res() reply: FastifyReply<any>) {
    const { errors, results } = await this.registry.resolveTagValues(reqTagValues);
    this.respond(reply, results, errors);
  }

  private respond(reply: FastifyReply<any>, results: any, errors?: string[]) {
    if (errors.length) {
      reply.header('X-DATASOURCE-ERR', errors.join('. '));
    }

    reply.send(results);
  }

}

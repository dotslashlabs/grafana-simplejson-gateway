import { Module } from '@nestjs/common';
import { QueryRegistryService } from './query-registry.service';

@Module({
  providers: [QueryRegistryService],
  exports: [QueryRegistryService],
})
export class CommonModule {}

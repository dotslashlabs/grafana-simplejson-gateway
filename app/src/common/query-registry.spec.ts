import { Test, TestingModule } from '@nestjs/testing';
import { QueryRegistryService } from './query-registry.service';

describe('QueryRegistryService', () => {
  let service: QueryRegistryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueryRegistryService],
    }).compile();

    service = module.get<QueryRegistryService>(QueryRegistryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

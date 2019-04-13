import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { CommonModule } from './common/common.module';

describe('App Controller', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CommonModule],
      controllers: [AppController],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

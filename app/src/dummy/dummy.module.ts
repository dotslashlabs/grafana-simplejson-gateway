import { Module } from '@nestjs/common';
import { DummyService } from './dummy.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  providers: [DummyService],
})
export class DummyModule {}

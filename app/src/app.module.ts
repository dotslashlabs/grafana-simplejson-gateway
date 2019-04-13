import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
// import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from './config.module';
import { CommonModule } from './common/common.module';
import { DummyModule } from './dummy/dummy.module';
import { MyDataModule } from './my-data/my-data.module';

@Module({
  imports: [
    // TypeOrmModule.forRoot(),
    ConfigModule,
    CommonModule,

    DummyModule,

    MyDataModule,
  ],
  controllers: [AppController],
})
export class AppModule {

}

import { Module } from '@nestjs/common';
import { DataSourcesController } from './data-sources.controller';
import { WorkersModule } from '../workers/workers.module';

@Module({
  imports: [WorkersModule],
  controllers: [DataSourcesController],
})
export class DataSourcesModule {}

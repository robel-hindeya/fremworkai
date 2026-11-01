import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { WorkersModule } from '../workers/workers.module';

@Module({
  imports: [WorkersModule],
  controllers: [TasksController],
})
export class TasksModule {}

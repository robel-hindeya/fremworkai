import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { LedgerModule } from '../ledger/ledger.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { WorkersModule } from '../workers/workers.module';

@Module({
  imports: [LedgerModule, BudgetsModule, WorkersModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}

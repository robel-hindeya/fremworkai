import { Module } from '@nestjs/common';
import { WorkersService } from './workers.service';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [LedgerModule],
  providers: [WorkersService],
  exports: [WorkersService],
})
export class WorkersModule {}

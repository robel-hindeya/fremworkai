import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { CurrentWorkspaceId } from '../../common/decorators/current-workspace.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { LedgerService } from './ledger.service';
import { Transaction } from '@fremwork/types';

@ApiTags('Unified Ledger')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Workspace-Id', required: true })
@Controller('transactions')
@UseGuards(AuthGuard, WorkspaceGuard)
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get()
  @ApiOperation({ summary: 'Get filtered transactions list and totals in minor units' })
  getTransactions(
    @CurrentWorkspaceId() wsId: string,
    @Query('type') type?: 'all' | 'income' | 'expense',
    @Query('q') q?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('category') category?: string,
    @Query('limit') limit = 50,
  ) {
    const { rows, totals } = this.ledgerService.findAll(wsId, {
      type,
      q,
      from,
      to,
      category,
      limit: Number(limit),
    });

    return {
      success: true,
      data: rows,
      totals,
    };
  }

  @Post()
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Record manual transaction into the ledger' })
  addTransaction(@CurrentWorkspaceId() wsId: string, @Body() body: any) {
    const tx = this.ledgerService.create(wsId, body);
    return { success: true, data: tx };
  }

  @Put(':id')
  @Patch(':id')
  @Roles('owner', 'admin', 'member', 'accountant')
  @ApiOperation({ summary: 'Update category, note, or review status' })
  updateTransaction(
    @CurrentWorkspaceId() wsId: string,
    @Param('id') id: string,
    @Body() patch: Partial<Transaction>,
  ) {
    const updated = this.ledgerService.update(wsId, id, patch);
    return { success: true, data: updated };
  }

  @Delete(':id')
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Delete transaction from the ledger' })
  deleteTransaction(@CurrentWorkspaceId() wsId: string, @Param('id') id: string) {
    const deleted = this.ledgerService.delete(wsId, id);
    if (!deleted) {
      throw new NotFoundException({
        code: 'not_found',
        message: 'Transaction not found.',
      });
    }

    return { success: true, message: 'Transaction deleted.' };
  }
}

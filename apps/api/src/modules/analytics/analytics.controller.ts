import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { CurrentWorkspaceId } from '../../common/decorators/current-workspace.decorator';

@ApiTags('Analytics')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Workspace-Id', required: true })
@Controller('analytics')
@UseGuards(AuthGuard, WorkspaceGuard)
export class AnalyticsController {
  @Get()
  @ApiOperation({ summary: 'Get financial analytics breakdown across custom ranges' })
  getAnalytics(
    @CurrentWorkspaceId() wsId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return {
      success: true,
      data: {
        workspaceId: wsId,
        dateRange: { from: from || '2025-11-01', to: to || '2026-10-31' },
        totals: {
          revenueMinor: 257770000,
          expensesMinor: 187660000,
          netProfitMinor: 70110000,
          operatingCashFlowMinor: 58590000,
          netMarginPct: 27.2,
        },
        expenseBreakdown: [
          { category: 'Payroll', amountMinor: 9420000, sharePct: 52.8 },
          { category: 'Cost of services', amountMinor: 2186000, sharePct: 12.3 },
          { category: 'Contractors', amountMinor: 1340000, sharePct: 7.5 },
          { category: 'Rent & Utilities', amountMinor: 1250000, sharePct: 7.0 },
          { category: 'Marketing', amountMinor: 1185000, sharePct: 6.6 },
          { category: 'Software', amountMinor: 964000, sharePct: 5.4 },
          { category: 'Other', amountMinor: 1485000, sharePct: 8.4 },
        ],
      },
    };
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { CurrentWorkspaceId } from '../../common/decorators/current-workspace.decorator';

@ApiTags('Overview')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Workspace-Id', required: true })
@Controller('overview')
@UseGuards(AuthGuard, WorkspaceGuard)
export class OverviewController {
  @Get()
  @ApiOperation({ summary: 'Get overview KPIs, trends, and AI ledger insights' })
  getOverview(@CurrentWorkspaceId() wsId: string, @Query('period') period?: string) {
    return {
      success: true,
      data: {
        workspaceId: wsId,
        period: period || 'October 2026',
        cashMinor: 41260000, // $412,600.00
        runwayMonths: 2.3,
        kpis: {
          totalRevenueMinor: 24680000,
          totalExpensesMinor: 17830000,
          netProfitMinor: 6850000,
          operatingCashFlowMinor: 5420000,
          netMarginPct: 27.8,
        },
        monthlySeries: {
          months: ['May 26', 'Jun 26', 'Jul 26', 'Aug 26', 'Sep 26', 'Oct 26'],
          revenueMinor: [20810000, 22150000, 22990000, 22430000, 23860000, 24680000],
          expensesMinor: [16240000, 16010000, 16680000, 17120000, 16940000, 17830000],
        },
        insights: [
          {
            kind: 'unusual expense',
            title: 'Travel up 58% on September',
            body: '$5,120 against $3,240. Two flights were booked less than 7 days before departure.',
            severity: 'err',
          },
          {
            kind: 'revenue change',
            title: 'Licensing grew 6.1% month over month',
            body: 'Northwind Labs renewed early. Subscriptions also grew 3.1%, led by Lumen Health.',
            severity: 'ok',
          },
          {
            kind: 'cash risk',
            title: 'Cash flow fell 12.3% while profit held',
            body: '$86,400 in receivables is more than 45 days old across three clients.',
            severity: 'warn',
          },
          {
            kind: 'saving',
            title: '14 unused software seats',
            body: 'Across Slack, HubSpot and Figma, worth about $1,180 a month, or $14,160 a year.',
            severity: 'info',
          },
        ],
      },
    };
  }
}

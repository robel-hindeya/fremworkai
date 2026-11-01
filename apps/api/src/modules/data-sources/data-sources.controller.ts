import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { CurrentWorkspaceId } from '../../common/decorators/current-workspace.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { DataSource } from '@fremwork/types';
import { WorkersService } from '../workers/workers.service';

@ApiTags('Data Sources')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Workspace-Id', required: true })
@Controller('data-sources')
@UseGuards(AuthGuard, WorkspaceGuard)
export class DataSourcesController {
  private sources: DataSource[] = [
    { id: 'qb', workspaceId: 'default-workspace-harbor-pine', provider: 'quickbooks', name: 'QuickBooks Online', detail: 'Harbor & Pine Co. · synced 5 minutes ago', status: 'connected', createdAt: new Date().toISOString() },
    { id: 'bank', workspaceId: 'default-workspace-harbor-pine', provider: 'bank', name: 'Commercial Bank of Ethiopia', detail: 'Operating account ··2210', status: 'error', errorCode: 'source_auth_expired', createdAt: new Date().toISOString() },
    { id: 'stripe', workspaceId: 'default-workspace-harbor-pine', provider: 'stripe', name: 'Stripe', detail: 'Importing 14 months of history', status: 'syncing', progress: 64, createdAt: new Date().toISOString() },
    { id: 'xero', workspaceId: 'default-workspace-harbor-pine', provider: 'xero', name: 'Xero', detail: 'Use instead of, or alongside, QuickBooks', status: 'disconnected', createdAt: new Date().toISOString() },
    { id: 'gusto', workspaceId: 'default-workspace-harbor-pine', provider: 'gusto', name: 'Gusto', detail: 'Salaries, taxes and benefits', status: 'disconnected', createdAt: new Date().toISOString() },
  ];

  constructor(private readonly workersService: WorkersService) {}

  @Get()
  @ApiOperation({ summary: 'List all accounting and banking connections' })
  getDataSources(@CurrentWorkspaceId() wsId: string) {
    const list = this.sources.filter((s) => s.workspaceId === wsId);
    return { success: true, data: list };
  }

  @Post(':id/sync')
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Trigger sync job for data source' })
  async syncSourceExplicit(@CurrentWorkspaceId() wsId: string, @Param('id') id: string) {
    return this.handleSync(wsId, id);
  }

  @Post(':id')
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Trigger sync or reconnect for data source' })
  async syncSource(@CurrentWorkspaceId() wsId: string, @Param('id') id: string) {
    return this.handleSync(wsId, id);
  }

  private async handleSync(wsId: string, id: string) {
    const source = this.sources.find((s) => s.id === id && s.workspaceId === wsId);
    if (!source) {
      throw new NotFoundException({ code: 'not_found', message: 'Data source not found.' });
    }

    // Enqueue background sync worker job
    await this.workersService.enqueue({
      jobType: 'source.sync',
      workspaceId: wsId,
      data: { sourceId: id, provider: source.provider },
    });

    source.status = 'connected';
    source.errorCode = undefined;
    source.lastSyncedAt = new Date().toISOString();
    source.detail = 'Synced just now';

    return { success: true, message: `${source.name} synced successfully.`, data: source };
  }

  @Delete(':id')
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Disconnect data source' })
  disconnectSource(@CurrentWorkspaceId() wsId: string, @Param('id') id: string) {
    const source = this.sources.find((s) => s.id === id && s.workspaceId === wsId);
    if (!source) {
      throw new NotFoundException({ code: 'not_found', message: 'Data source not found.' });
    }

    source.status = 'disconnected';
    source.detail = 'Disconnected';
    return { success: true, message: `${source.name} disconnected.`, data: source };
  }
}

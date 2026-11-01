import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Workspaces')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Workspace-Id', required: true })
@Controller('workspaces')
@UseGuards(AuthGuard)
export class WorkspacesController {
  // In-memory / DB storage
  private workspaces = new Map<string, any>([
    [
      'default-workspace-harbor-pine',
      {
        id: 'default-workspace-harbor-pine',
        legalName: 'Harbor & Pine Co.',
        industry: 'E-commerce & Retail',
        country: 'ET',
        currency: 'USD',
        fiscalYearStart: 1,
        accountingBasis: 'accrual',
        reserveMonths: 3.0,
        tin: 'TIN-928174',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  ]);

  @Post()
  @ApiOperation({ summary: 'Create a new company workspace during onboarding' })
  createWorkspace(@Body() body: any, @CurrentUser() user: any) {
    const id = `ws-${Date.now().toString(36)}`;
    const workspace = {
      id,
      legalName: body.legalName || 'My Company Inc.',
      industry: body.industry || 'Technology',
      country: body.country || 'ET',
      currency: body.currency || 'USD',
      fiscalYearStart: body.fiscalYearStart || 1,
      accountingBasis: body.accountingBasis || 'accrual',
      reserveMonths: body.reserveMonths || 3.0,
      tin: body.tin || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.workspaces.set(id, workspace);
    return { success: true, data: workspace };
  }

  @Get(':id')
  @UseGuards(WorkspaceGuard)
  @ApiOperation({ summary: 'Get company workspace info and financial policies' })
  getWorkspace(@Param('id') id: string) {
    const ws = this.workspaces.get(id);
    if (!ws) {
      throw new NotFoundException({
        code: 'not_found',
        message: 'Workspace not found.',
      });
    }
    return { success: true, data: ws };
  }

  @Patch(':id')
  @UseGuards(WorkspaceGuard)
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Update company settings or reserve policies' })
  updateWorkspace(@Param('id') id: string, @Body() patch: any) {
    const ws = this.workspaces.get(id);
    if (!ws) {
      throw new NotFoundException({
        code: 'not_found',
        message: 'Workspace not found.',
      });
    }
    const updated = { ...ws, ...patch, updatedAt: new Date().toISOString() };
    this.workspaces.set(id, updated);
    return { success: true, data: updated };
  }
}

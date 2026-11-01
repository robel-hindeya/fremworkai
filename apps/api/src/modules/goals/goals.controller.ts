import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { CurrentWorkspaceId } from '../../common/decorators/current-workspace.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Goal } from '@fremwork/types';

@ApiTags('Goals')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Workspace-Id', required: true })
@Controller('goals')
@UseGuards(AuthGuard, WorkspaceGuard)
export class GoalsController {
  private goals: Goal[] = [
    {
      id: 'g-1',
      workspaceId: 'default-workspace-harbor-pine',
      type: 'Savings target',
      name: 'Six-month cash reserve',
      currentMinor: 41260000,
      targetMinor: 106980000,
      startMinor: 25000000,
      targetDate: '2027-06-30',
      status: 'Behind pace',
      aiGuidance: 'At the current $54k average OCF, you reach target in October 2027.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'g-2',
      workspaceId: 'default-workspace-harbor-pine',
      type: 'Revenue target',
      name: 'Q4 revenue of $760k',
      currentMinor: 24680000,
      targetMinor: 76000000,
      startMinor: 0,
      targetDate: '2026-12-31',
      status: 'On track',
      aiGuidance: 'October is at 32% with a third of the quarter completed.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'g-3',
      workspaceId: 'default-workspace-harbor-pine',
      type: 'Expense reduction',
      name: 'Cut software spend 20%',
      currentMinor: 964000,
      targetMinor: 770000,
      startMinor: 964000,
      targetDate: '2027-01-31',
      status: 'Not started',
      aiGuidance: '14 unused seats across Slack, HubSpot, and Figma recover $1,180/mo.',
      createdAt: new Date().toISOString(),
    },
  ];

  @Get()
  @ApiOperation({ summary: 'Get financial targets and AI tracking guidance' })
  getGoals(@CurrentWorkspaceId() wsId: string) {
    const list = this.goals.filter((g) => g.workspaceId === wsId);
    return { success: true, data: list };
  }

  @Post()
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Create new savings or revenue goal' })
  createGoal(@CurrentWorkspaceId() wsId: string, @Body() body: any) {
    const id = body.id || `g-${Date.now().toString(36)}`;
    const targetMinor = body.targetMinor ?? Math.round(Number(body.target) * 100);
    const curMinor = body.currentMinor ?? Math.round(Number(body.cur || 0) * 100);

    const goal: Goal = {
      id,
      workspaceId: wsId,
      type: body.type || 'Savings target',
      name: body.name,
      currentMinor: curMinor,
      targetMinor,
      startMinor: curMinor,
      targetDate: body.targetDate || body.date || '2027-06-30',
      status: 'On track',
      aiGuidance: `Tracking pace toward $${(targetMinor / 100).toLocaleString()}.`,
      createdAt: new Date().toISOString(),
    };

    this.goals.push(goal);
    return { success: true, data: goal };
  }

  @Put(':id')
  @Patch(':id')
  @Roles('owner', 'admin', 'member')
  updateGoal(@CurrentWorkspaceId() wsId: string, @Param('id') id: string, @Body() patch: Partial<Goal>) {
    const idx = this.goals.findIndex((g) => g.id === id && g.workspaceId === wsId);
    if (idx === -1) {
      throw new NotFoundException({ code: 'not_found', message: 'Goal not found.' });
    }
    this.goals[idx] = { ...this.goals[idx], ...patch };
    return { success: true, data: this.goals[idx] };
  }

  @Delete(':id')
  @Roles('owner', 'admin')
  deleteGoal(@CurrentWorkspaceId() wsId: string, @Param('id') id: string) {
    this.goals = this.goals.filter((g) => !(g.id === id && g.workspaceId === wsId));
    return { success: true, message: 'Goal deleted.' };
  }
}

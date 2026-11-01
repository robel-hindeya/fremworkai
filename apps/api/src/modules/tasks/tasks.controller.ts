import {
  Controller,
  Get,
  Post,
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
import { ScheduledTask } from '@fremwork/types';
import { WorkersService } from '../workers/workers.service';

@ApiTags('Scheduled Tasks')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Workspace-Id', required: true })
@Controller(['tasks', 'scheduled'])
@UseGuards(AuthGuard, WorkspaceGuard)
export class TasksController {
  private tasks: ScheduledTask[] = [
    {
      id: 't1',
      workspaceId: 'default-workspace-harbor-pine',
      name: 'Weekly financial summary',
      prompt: 'Summarize last week’s revenue, expenses and cash position, with anything unusual.',
      cron: '0 8 * * 1',
      timezone: 'Africa/Addis_Ababa',
      deliverTo: 'selam@harborpine.co',
      enabled: true,
      nextRunAt: 'Mon, Nov 2 · 8:00 AM',
      lastRunStatus: 'completed',
      createdAt: new Date().toISOString(),
    },
    {
      id: 't2',
      workspaceId: 'default-workspace-harbor-pine',
      name: 'Monthly expense analysis',
      prompt: 'Break down last month’s expenses by category versus budget and flag overspending.',
      cron: '0 9 1 * *',
      timezone: 'Africa/Addis_Ababa',
      deliverTo: 'selam@harborpine.co',
      enabled: true,
      nextRunAt: 'Sun, Nov 1 · 9:00 AM',
      lastRunStatus: 'completed',
      createdAt: new Date().toISOString(),
    },
    {
      id: 't3',
      workspaceId: 'default-workspace-harbor-pine',
      name: 'Revenue report',
      prompt: 'Report revenue by stream and top customers for the week.',
      cron: '0 17 * * 5',
      timezone: 'Africa/Addis_Ababa',
      deliverTo: 'selam@harborpine.co',
      enabled: true,
      nextRunAt: 'Fri, Nov 6 · 5:00 PM',
      lastRunStatus: 'failed',
      lastRunError: 'Bank feed disconnected',
      createdAt: new Date().toISOString(),
    },
    {
      id: 't4',
      workspaceId: 'default-workspace-harbor-pine',
      name: 'Cash flow monitoring',
      prompt: 'Check cash against the 3-month reserve and alert me if runway drops below 2 months.',
      cron: '0 7 * * *',
      timezone: 'Africa/Addis_Ababa',
      deliverTo: 'selam@harborpine.co',
      enabled: true,
      nextRunAt: 'Sat, Oct 31 · 7:00 AM',
      lastRunStatus: 'completed',
      createdAt: new Date().toISOString(),
    },
    {
      id: 't5',
      workspaceId: 'default-workspace-harbor-pine',
      name: 'Quarterly board pack draft',
      prompt: 'Draft the quarterly board pack: P&L, balance sheet, cash flow and commentary.',
      cron: '0 10 5 */3 *',
      timezone: 'Africa/Addis_Ababa',
      deliverTo: 'selam@harborpine.co',
      enabled: false,
      nextRunAt: 'Tue, Jan 5 · 10:00 AM',
      lastRunStatus: 'completed',
      createdAt: new Date().toISOString(),
    },
  ];

  constructor(private readonly workersService: WorkersService) {}

  @Get()
  @ApiOperation({ summary: 'List all scheduled prompt tasks for company' })
  getTasks(@CurrentWorkspaceId() wsId: string) {
    const list = this.tasks.filter((t) => t.workspaceId === wsId);
    return { success: true, data: list };
  }

  @Post()
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Create new recurring scheduled prompt' })
  createTask(@CurrentWorkspaceId() wsId: string, @Body() body: any) {
    const id = body.id || `t${Date.now().toString(36)}`;
    const task: ScheduledTask = {
      id,
      workspaceId: wsId,
      name: body.name || 'Untitled task',
      prompt: body.prompt || '',
      cron: body.cron || '0 9 * * 1',
      timezone: body.timezone || 'Africa/Addis_Ababa',
      deliverTo: body.deliverTo || 'selam@harborpine.co',
      enabled: body.enabled !== false,
      nextRunAt: body.nextRunAt || body.next || 'Next cycle',
      lastRunStatus: 'running',
      createdAt: new Date().toISOString(),
    };

    this.tasks.push(task);
    return { success: true, data: task };
  }

  @Post(':id/run')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Execute scheduled task immediately' })
  async runTaskExplicit(@CurrentWorkspaceId() wsId: string, @Param('id') id: string) {
    return this.executeTask(wsId, id);
  }

  @Post(':id')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Execute or trigger scheduled task' })
  async runTask(@CurrentWorkspaceId() wsId: string, @Param('id') id: string) {
    return this.executeTask(wsId, id);
  }

  private async executeTask(wsId: string, id: string) {
    const task = this.tasks.find((t) => t.id === id && t.workspaceId === wsId);
    if (!task) {
      throw new NotFoundException({ code: 'not_found', message: 'Task not found.' });
    }

    if (id === 't3' || id === 't-3') {
      task.lastRunStatus = 'failed';
      task.lastRunError = 'Bank feed disconnected';
      return {
        success: false,
        message: 'Bank feed disconnected. Reconnect your bank feed first.',
        task,
        data: task,
      };
    }

    // Enqueue background processing job
    await this.workersService.enqueue({
      jobType: 'task.run',
      workspaceId: wsId,
      data: { taskId: id, prompt: task.prompt, name: task.name },
    });

    task.lastRunStatus = 'completed';
    task.lastRunError = undefined;
    return {
      success: true,
      message: `Task "${task.name}" ran successfully. Result generated in notifications.`,
      task,
      data: task,
    };
  }

  @Patch(':id')
  @Roles('owner', 'admin')
  updateTask(
    @CurrentWorkspaceId() wsId: string,
    @Param('id') id: string,
    @Body() patch: Partial<ScheduledTask>,
  ) {
    const idx = this.tasks.findIndex((t) => t.id === id && t.workspaceId === wsId);
    if (idx === -1) {
      throw new NotFoundException({ code: 'not_found', message: 'Task not found.' });
    }
    this.tasks[idx] = { ...this.tasks[idx], ...patch };
    return { success: true, data: this.tasks[idx] };
  }

  @Delete(':id')
  @Roles('owner', 'admin')
  deleteTask(@CurrentWorkspaceId() wsId: string, @Param('id') id: string) {
    this.tasks = this.tasks.filter((t) => !(t.id === id && t.workspaceId === wsId));
    return { success: true, message: 'Task deleted.' };
  }
}

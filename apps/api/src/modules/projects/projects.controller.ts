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
import { Project } from '@fremwork/types';

@ApiTags('Projects')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Workspace-Id', required: true })
@Controller('projects')
@UseGuards(AuthGuard, WorkspaceGuard)
export class ProjectsController {
  private projects: Project[] = [
    {
      id: 'q4-board-pack',
      workspaceId: 'default-workspace-harbor-pine',
      name: 'Q4 Board Pack',
      description: 'Statements, commentary and KPI pack for the December board meeting.',
      chatsCount: 2,
      filesCount: 3,
      reportsCount: 2,
      updatedAt: 'Today',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'cost-reduction',
      workspaceId: 'default-workspace-harbor-pine',
      name: 'Cost reduction 2026',
      description: 'Finding savings across software, travel and contractors without slowing delivery.',
      chatsCount: 1,
      filesCount: 2,
      reportsCount: 1,
      updatedAt: 'Yesterday',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'seed-extension',
      workspaceId: 'default-workspace-harbor-pine',
      name: 'Seed extension',
      description: 'Runway modelling and investor data room prep for the 2027 raise.',
      chatsCount: 2,
      filesCount: 2,
      reportsCount: 1,
      updatedAt: 'Oct 27',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'fy27-budget',
      workspaceId: 'default-workspace-harbor-pine',
      name: 'FY2027 annual budget',
      description: 'Department budgets, hiring plan and revenue targets for next year.',
      chatsCount: 1,
      filesCount: 1,
      reportsCount: 0,
      updatedAt: 'Oct 21',
      createdAt: new Date().toISOString(),
    },
  ];

  @Get()
  @ApiOperation({ summary: 'List workspace projects' })
  getProjects(@CurrentWorkspaceId() wsId: string) {
    const list = this.projects.filter((p) => p.workspaceId === wsId);
    return { success: true, data: list };
  }

  @Post()
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Create new project workspace' })
  createProject(@CurrentWorkspaceId() wsId: string, @Body() body: any) {
    const slug = (body.name || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-') || `proj-${Date.now()}`;
    const id = `${slug}-${Math.floor(Math.random() * 1000)}`;

    const project: Project = {
      id,
      workspaceId: wsId,
      name: body.name,
      description: body.desc || body.description || 'No description yet.',
      chatsCount: 0,
      filesCount: 0,
      reportsCount: 0,
      updatedAt: 'Just now',
      createdAt: new Date().toISOString(),
    };

    this.projects.push(project);
    return { success: true, data: project };
  }

  @Get(':id')
  getProject(@CurrentWorkspaceId() wsId: string, @Param('id') id: string) {
    const project = this.projects.find((p) => p.id === id && p.workspaceId === wsId);
    if (!project) {
      throw new NotFoundException({ code: 'not_found', message: 'Project not found.' });
    }
    return { success: true, data: project };
  }

  @Put(':id')
  @Patch(':id')
  @Roles('owner', 'admin', 'member')
  updateProject(@CurrentWorkspaceId() wsId: string, @Param('id') id: string, @Body() patch: Partial<Project>) {
    const idx = this.projects.findIndex((p) => p.id === id && p.workspaceId === wsId);
    if (idx === -1) {
      throw new NotFoundException({ code: 'not_found', message: 'Project not found.' });
    }
    this.projects[idx] = { ...this.projects[idx], ...patch, updatedAt: 'Just now' };
    return { success: true, data: this.projects[idx] };
  }

  @Delete(':id')
  @Roles('owner', 'admin')
  deleteProject(@CurrentWorkspaceId() wsId: string, @Param('id') id: string) {
    this.projects = this.projects.filter((p) => !(p.id === id && p.workspaceId === wsId));
    return { success: true, message: 'Project deleted.' };
  }
}

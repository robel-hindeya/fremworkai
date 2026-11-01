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
import { BudgetsService } from './budgets.service';
import { Budget } from '@fremwork/types';

@ApiTags('Budgets')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Workspace-Id', required: true })
@Controller('budgets')
@UseGuards(AuthGuard, WorkspaceGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  @ApiOperation({ summary: 'Get category budgets and actuals in minor units' })
  getBudgets(@CurrentWorkspaceId() wsId: string) {
    const list = this.budgetsService.findAll(wsId);
    return { success: true, data: list };
  }

  @Post()
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Create monthly category budget' })
  createBudget(@CurrentWorkspaceId() wsId: string, @Body() body: any) {
    const item = this.budgetsService.create(wsId, body);
    return { success: true, data: item };
  }

  @Put(':id')
  @Patch(':id')
  @Roles('owner', 'admin', 'member')
  updateBudget(
    @CurrentWorkspaceId() wsId: string,
    @Param('id') id: string,
    @Body() patch: Partial<Budget>,
  ) {
    const updated = this.budgetsService.update(wsId, id, patch);
    return { success: true, data: updated };
  }

  @Delete(':id')
  @Roles('owner', 'admin')
  deleteBudget(@CurrentWorkspaceId() wsId: string, @Param('id') id: string) {
    const deleted = this.budgetsService.delete(wsId, id);
    if (!deleted) {
      throw new NotFoundException({ code: 'not_found', message: 'Budget not found.' });
    }
    return { success: true, message: 'Budget deleted.' };
  }
}

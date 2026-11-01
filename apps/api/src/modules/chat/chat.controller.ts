import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Res,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { CurrentWorkspaceId } from '../../common/decorators/current-workspace.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReasoningMode } from '@fremwork/types';
import { ChatService } from './chat.service';

@ApiTags('AI Assistant')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Workspace-Id', required: true })
@Controller('conversations')
@UseGuards(AuthGuard, WorkspaceGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @ApiOperation({ summary: 'Get recent conversations for sidebar' })
  getConversations(@CurrentWorkspaceId() wsId: string) {
    const list = this.chatService.getConversations(wsId);
    return { success: true, data: list };
  }

  @Post()
  @ApiOperation({ summary: 'Start a new conversation thread' })
  createConversation(
    @CurrentWorkspaceId() wsId: string,
    @CurrentUser() user: any,
    @Body() body: { title?: string; projectId?: string },
  ) {
    const convo = this.chatService.createConversation(
      wsId,
      user?.id || 'usr-1',
      body.title,
      body.projectId,
    );
    return { success: true, data: convo };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full conversation thread with message history' })
  getConversation(@CurrentWorkspaceId() wsId: string, @Param('id') id: string) {
    const convo = this.chatService.getConversation(wsId, id);
    return { success: true, data: convo };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete conversation thread' })
  deleteConversation(@CurrentWorkspaceId() wsId: string, @Param('id') id: string) {
    const deleted = this.chatService.deleteConversation(wsId, id);
    if (!deleted) {
      throw new NotFoundException({
        code: 'not_found',
        message: 'Conversation not found.',
      });
    }
    return { success: true, message: 'Conversation deleted.' };
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Ask question with Server-Sent Events (SSE) streaming answer blocks' })
  async streamMessage(
    @CurrentWorkspaceId() wsId: string,
    @Param('id') id: string,
    @Body() body: { text: string; mode?: ReasoningMode; uploadIds?: string[] },
    @Res() res: Response,
  ) {
    return this.chatService.streamResponse(
      wsId,
      id,
      body.text,
      body.mode || 'Balanced',
      res,
    );
  }
}

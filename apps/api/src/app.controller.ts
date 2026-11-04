import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Root')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'API index and status' })
  getRoot(@Req() req: Request, @Res() res: Response) {
    if (req.accepts('html') && !req.xhr && !req.headers.authorization) {
      return res.redirect('/v1/docs');
    }
    return res.json({
      name: 'Fremwork Financial API',
      version: '1.0.0',
      status: 'operational',
      documentation: '/v1/docs',
      health: '/v1/health',
      endpoints: {
        docs: '/v1/docs',
        health: '/v1/health',
        overview: '/v1/overview',
        transactions: '/v1/transactions',
        budgets: '/v1/budgets',
        conversations: '/v1/conversations',
      },
    });
  }

  @Get('v1')
  @ApiOperation({ summary: 'V1 API base index' })
  getV1Root(@Req() req: Request, @Res() res: Response) {
    return this.getRoot(req, res);
  }
}

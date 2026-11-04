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
      return res.type('html').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fremwork Financial OS</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0A0A0A; color: #FFFFFF; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 24px; }
    .card { background: #141414; border: 1px solid #262626; border-radius: 12px; padding: 36px; max-width: 580px; width: 100%; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
    .badge { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; background: rgba(34, 197, 94, 0.1); color: #22C55E; padding: 4px 10px; border-radius: 999px; margin-bottom: 20px; font-weight: 500; }
    .pulse { width: 8px; height: 8px; border-radius: 50%; background: #22C55E; box-shadow: 0 0 10px #22C55E; }
    h1 { font-size: 28px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 8px; }
    p { color: #8C8C8C; font-size: 14.5px; line-height: 1.6; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 28px; }
    .stat { background: #1C1C1C; border: 1px solid #2E2E2E; border-radius: 8px; padding: 12px 14px; }
    .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; }
    .stat-val { font-size: 15px; font-weight: 600; color: #EEE; margin-top: 4px; }
    .actions { display: flex; flex-direction: column; gap: 10px; }
    .btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 18px; border-radius: 8px; font-size: 14px; font-weight: 500; text-decoration: none; transition: all 0.15s; }
    .btn-primary { background: #FFFFFF; color: #0A0A0A; }
    .btn-primary:hover { background: #E5E5E5; }
    .btn-secondary { background: #1F1F1F; color: #CCCCCC; border: 1px solid #333333; }
    .btn-secondary:hover { background: #2A2A2A; color: #FFFFFF; }
    footer { margin-top: 24px; text-align: center; color: #555; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <span class="pulse"></span>
      API & Autonomous Financial AI Operational
    </div>
    <h1>Fremwork Platform</h1>
    <p>Unified financial operating system with automated multi-tool ledger intelligence, Google Gemini 2.5 copilot, and multi-tenant accounting integration.</p>
    
    <div class="grid">
      <div class="stat">
        <div class="stat-label">AI Engine</div>
        <div class="stat-val">Gemini 2.5 Multi-Tool</div>
      </div>
      <div class="stat">
        <div class="stat-label">Ledger Engine</div>
        <div class="stat-val">Live Unified Ledger</div>
      </div>
      <div class="stat">
        <div class="stat-label">Security & Auth</div>
        <div class="stat-val">Supabase RLS Enabled</div>
      </div>
      <div class="stat">
        <div class="stat-label">API Version</div>
        <div class="stat-val">v1.0 (OAS 3.0)</div>
      </div>
    </div>

    <div class="actions">
      <a href="/chat" class="btn btn-primary">Open Web Application →</a>
      <a href="/v1/docs" class="btn btn-secondary">Interactive Swagger Documentation</a>
      <a href="/v1/health" class="btn btn-secondary">Infrastructure Health Check</a>
    </div>
  </div>
  <footer>Fremwork Technologies Inc. · All systems operational</footer>
</body>
</html>`);
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

  @Get('v1/docs')
  @ApiOperation({ summary: 'Interactive Swagger UI documentation' })
  getSwaggerDocs(@Res() res: Response) {
    return res.type('html').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Fremwork API · Swagger UI</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css" />
  <style>
    body { margin: 0; background: #fafafa; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .swagger-ui .topbar { display: none !important; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.min.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: '/v1/docs-json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`);
  }
}

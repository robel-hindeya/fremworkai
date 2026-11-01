import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'API and infrastructure health check' })
  check() {
    return {
      status: 'ok',
      service: 'fremwork-api',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}

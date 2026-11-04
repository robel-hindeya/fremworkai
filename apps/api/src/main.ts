import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { FremworkExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('FremworkBootstrap');
  const app = await NestFactory.create(AppModule);

  // Set global API prefix (excluding root / and /v1 for index & swagger redirect)
  app.setGlobalPrefix('v1', { exclude: ['/', 'v1'] });

  // Enable CORS for frontend & Vercel deployments
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'https://app.fremwork.com', 'https://staging.app.fremwork.com'];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Workspace-Id'],
  });

  // Global exception filter for unified error envelope
  app.useGlobalFilters(new FremworkExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('Fremwork API')
    .setDescription('NestJS Backend API for Fremwork Financial Workspace & AI Assistant')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-Workspace-Id', in: 'header' }, 'X-Workspace-Id')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('v1/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`Fremwork NestJS API running on: http://localhost:${port}/v1`);
  logger.log(`API Documentation available at: http://localhost:${port}/v1/docs`);
}

bootstrap();

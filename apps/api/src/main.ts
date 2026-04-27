/**
 * Actionable Justice OS — NestJS API Service
 *
 * Entry point. Configures CORS, validation, and boots.
 */
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  app.useWebSocketAdapter(new IoAdapter(app));

  // CORS — restrict to frontend origin in production
  const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
  app.enableCors({
    origin: [frontendOrigin, 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`🚀 [api] running on http://localhost:${port}`);
  logger.log(`   /healthz          → http://localhost:${port}/healthz`);
  logger.log(`   /grievance/intent → http://localhost:${port}/grievance/intent`);
  logger.log(`   /grievance        → http://localhost:${port}/grievance`);
  logger.log(`   /sos/trigger      → http://localhost:${port}/sos/trigger  (WebSocket: /sos ns)`);
  logger.log(`   Clerk:  ${process.env.CLERK_SECRET_KEY ? 'configured' : 'DEV MODE (bypassed)'}`);
  logger.log(`   Redis:  ${process.env.REDIS_URL || 'localhost:6379'}`);
  logger.log(`   AI:     ${process.env.AI_SERVICE_URL || 'http://localhost:8000'}`);
}

bootstrap();

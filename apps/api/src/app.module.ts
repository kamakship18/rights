/**
 * Root application module.
 *
 * Wires all feature modules, BullMQ, Clerk auth, and the SOS gateway.
 */
import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { ClerkAuthMiddleware } from './modules/auth/auth.module';
import { GrievanceModule } from './modules/grievance/grievance.module';
import { NoticeModule } from './modules/notice/notice.module';
import { FilingModule } from './modules/filing/filing.module';
import { SosModule } from './modules/sos/sos.module';
import { CommunityModule } from './modules/community/community.module';
import { ProfileModule }      from './modules/profile/profile.module';
import { PerformanceModule }  from './modules/performance/performance.module';
import { PrismaService }      from './prisma.service';

/**
 * Parse REDIS_URL into IORedis-compatible connection options.
 * Supports redis:// and rediss:// (TLS for Upstash).
 */
function parseRedisUrl() {
  const raw = process.env.REDIS_URL || 'redis://localhost:6379';
  try {
    const url = new URL(raw);
    return {
      host: url.hostname || 'localhost',
      port: parseInt(url.port || '6379', 10),
      password: url.password || undefined,
      username: url.username || undefined,
      ...(raw.startsWith('rediss://') ? { tls: {} } : {}),
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}

@Module({
  imports: [
    // BullMQ with Redis connection (parsed from REDIS_URL)
    BullModule.forRoot({ connection: parseRedisUrl() }),
    GrievanceModule,
    NoticeModule,
    FilingModule,
    SosModule,
    CommunityModule,
    ProfileModule,
    PerformanceModule,
  ],
  controllers: [AppController],
  providers: [PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ClerkAuthMiddleware)
      .exclude(
        { path: 'healthz',     method: RequestMethod.GET },
        { path: 'performance', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}

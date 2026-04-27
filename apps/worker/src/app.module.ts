import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { PrismaService } from './prisma.service';
import { SendGridService } from './filing/sendgrid.service';
import { parseRedisUrl } from './redis.util';
import { DailyReconciliationService } from './cron/daily.tick';
import { NoticeProcessor } from './queues/notice.processor';
import { FollowupProcessor } from './queues/followup.processor';
import { EscalationProcessor } from './queues/escalation.processor';

@Module({
  imports: [
    BullModule.forRoot({ connection: parseRedisUrl() }),
    BullModule.registerQueue(
      { name: 'notice' },
      { name: 'followup' },
      { name: 'escalation' },
    ),
  ],
  controllers: [AppController],
  providers: [
    PrismaService,
    SendGridService,
    DailyReconciliationService,
    NoticeProcessor,
    FollowupProcessor,
    EscalationProcessor,
  ],
})
export class AppModule {}

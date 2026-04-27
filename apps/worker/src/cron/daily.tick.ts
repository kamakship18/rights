import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as cron from 'node-cron';
import { PrismaService } from '../prisma.service';
import { SEVEN_DAYS_MS } from '@repo/shared';

@Injectable()
export class DailyReconciliationService implements OnModuleInit {
  private readonly logger = new Logger(DailyReconciliationService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('notice') private readonly noticeQueue: Queue,
    @InjectQueue('followup') private readonly followupQueue: Queue,
    @InjectQueue('escalation') private readonly escalationQueue: Queue,
  ) {}

  onModuleInit() {
    const schedule = process.env.CRON_SCHEDULE || this.defaultSchedule();
    const timeZone = process.env.CRON_TZ || (schedule === '0 9 * * *' ? 'Asia/Kolkata' : undefined);
    this.logger.log(
      `Reconciliation cron: ${schedule} ${timeZone ? `(${timeZone})` : ''}`,
    );
    if (timeZone) {
      cron.schedule(
        schedule,
        () => {
          void this.run();
        },
        { timezone: timeZone },
      );
    } else {
      cron.schedule(schedule, () => {
        void this.run();
      });
    }
  }

  private defaultSchedule(): string {
    return process.env.NODE_ENV === 'production' ? '0 9 * * *' : '* * * * *';
  }

  async run() {
    const t0 = Date.now();
    const now = new Date();
    const sevenAgo = new Date(now.getTime() - SEVEN_DAYS_MS);
    this.logger.log(`[reconciliation] tick at ${now.toISOString()}`);

    const pending = await this.prisma.grievance.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: new Date(now.getTime() - 2 * 60 * 1000) },
        events: { none: { kind: 'FILED' } },
      },
      select: { id: true, userId: true },
    });

    let nPending = 0;
    for (const g of pending) {
      try {
        await this.noticeQueue.add(
          'send-notice',
          { grievanceId: g.id, userId: g.userId },
          {
            jobId: `notice-cron-${g.id}-${t0}`,
            removeOnComplete: 500,
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
          },
        );
        nPending += 1;
      } catch (e) {
        this.logger.warn(`re-notice for ${g.id} failed: ${(e as Error).message}`);
      }
    }

    const filedStuck = await this.prisma.grievance.findMany({
      where: {
        status: 'FILED',
        filedAt: { not: null, lt: sevenAgo },
        events: { none: { kind: 'FOLLOWUP_7D' } },
      },
    });
    let nFiled = 0;
    for (const g of filedStuck) {
      try {
        await this.followupQueue.add(
          'run-followup',
          { grievanceId: g.id },
          { jobId: `followup-cron-${g.id}-${t0}`, removeOnComplete: 500, attempts: 3 },
        );
        nFiled += 1;
      } catch (e) {
        this.logger.warn(`re-follow for ${g.id} failed: ${(e as Error).message}`);
      }
    }

    const withFollowUpOld = await this.prisma.grievance.findMany({
      where: {
        status: 'FOLLOWED_UP',
        AND: [
          { events: { some: { kind: 'FOLLOWUP_7D', sentAt: { lt: sevenAgo } } } },
          { events: { none: { kind: 'ESCALATION_14D' } } },
        ],
      },
      select: { id: true },
    });

    let nEsc = 0;
    for (const g of withFollowUpOld) {
      try {
        await this.escalationQueue.add(
          'run-escalation',
          { grievanceId: g.id },
          { jobId: `escalation-cron-${g.id}-${t0}`, removeOnComplete: 500, attempts: 3 },
        );
        nEsc += 1;
      } catch (err) {
        this.logger.warn(
          `re-escalation for ${g.id} failed: ${(err as Error).message}`,
        );
      }
    }

    this.logger.log(
      `[reconciliation] enqueued: pending->notice=${nPending}, filed>7d->followup=${nFiled}, followed+7d->escalation=${nEsc} in ${Date.now() - t0}ms`,
    );
  }
}

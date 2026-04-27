import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { SendGridService } from '../filing/sendgrid.service';
import { NoticeBuilder, getFirstFollowupDelayMs } from '@repo/shared';
import { buildInitialNoticeData } from '../notice/notice-data.util';

@Processor('notice')
export class NoticeProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(NoticeProcessor.name);
  private noticeBuilder!: NoticeBuilder;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sendgrid: SendGridService,
    @InjectQueue('followup') private readonly followupQueue: Queue,
  ) {
    super();
  }

  onModuleInit() {
    this.noticeBuilder = new NoticeBuilder();
  }

  private followupQueueOpts(demo: string | null) {
    return (filedAt: Date) => {
      const d = getFirstFollowupDelayMs(demo);
      return Math.max(0, filedAt.getTime() + d - Date.now());
    };
  }

  private async ensureFollowupScheduled(
    grievanceId: string,
    demo: string | null,
    filedAt: Date,
  ) {
    const j = await this.followupQueue.getJob(`followup-${grievanceId}`);
    if (j) {
      return;
    }
    const delay = this.followupQueueOpts(demo)(filedAt);
    await this.followupQueue.add(
      'run-followup',
      { grievanceId },
      {
        delay,
        jobId: `followup-${grievanceId}`,
        removeOnComplete: 1000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );
    this.logger.warn(`repaired followup job for ${grievanceId} (delay ${delay}ms)`);
  }

  async process(job: Job<{ grievanceId: string; userId: string }>) {
    if (job.name !== 'send-notice') {
      this.logger.warn(`unknown job name: ${job.name}`);
      return;
    }

    const { grievanceId } = job.data;
    const now = new Date();

    const grievance = await this.prisma.grievance.findUnique({
      where: { id: grievanceId },
      include: { officer: true, user: true, events: true },
    });

    if (!grievance) {
      this.logger.warn(`grievance not found: ${grievanceId}`);
      return;
    }

    if (grievance.status === 'RESOLVED') {
      this.logger.log(`grievance ${grievanceId} resolved, skipping notice`);
      return;
    }

    const hasFiled = grievance.events.some((e) => e.kind === 'FILED');

    if (grievance.status === 'FILED' && hasFiled) {
      if (grievance.filedAt) {
        await this.ensureFollowupScheduled(
          grievanceId,
          grievance.demoSpeed,
          grievance.filedAt,
        );
      }
      this.logger.log(`grievance ${grievanceId} already FILED, idempotent skip / repaired`);
      return;
    }

    if (grievance.status !== 'PENDING') {
      this.logger.log(`grievance ${grievanceId} status ${grievance.status}, skipping initial notice`);
      return;
    }

    const built = this.noticeBuilder.build(buildInitialNoticeData(grievance));
    const result = await this.sendgrid.send({
      to: grievance.officer.email,
      subject: built.subject,
      html: built.html,
      text: built.text,
      idempotencyKey: `filed-${grievanceId}-v1`,
    });

    if (!result.success) {
      this.logger.error(`SendGrid failed for ${grievanceId} — rethrowing for Bull retry`);
      throw new Error(result.error || 'email failed');
    }

    const delay = getFirstFollowupDelayMs(grievance.demoSpeed);

    await this.prisma.$transaction(async (tx) => {
      await tx.noticeEvent.create({
        data: {
          grievanceId,
          kind: 'FILED',
          channel: 'EMAIL',
          payload: { jobId: String(job.id) },
        },
      });
      await tx.grievance.update({
        where: { id: grievanceId },
        data: { status: 'FILED', filedAt: now },
      });
    });

    try {
      await this.followupQueue.add(
        'run-followup',
        { grievanceId },
        {
          delay,
          jobId: `followup-${grievanceId}`,
          removeOnComplete: 1000,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      );
    } catch (e) {
      this.logger.error(`followup enqueue failed for ${grievanceId} — will rely on idempotent repair`);
      throw e;
    }

    this.logger.log(
      `FILED + scheduled followup in ${delay}ms (demoSpeed=${grievance.demoSpeed ?? '—'}) — ${grievanceId}`,
    );
  }

  @OnWorkerEvent('failed')
  onJobFailed(
    job: Job<{ grievanceId: string; userId: string }> | undefined,
    err: Error,
  ) {
    if (!job || job.name !== 'send-notice') {
      return;
    }
    const max = (job.opts.attempts ?? 3) as number;
    if (job.attemptsMade < max) {
      return;
    }
    this.logger.error(
      `Notice job finally failed for ${job.data.grievanceId} after ${job.attemptsMade} attempts: ${err?.message}`,
    );
  }
}

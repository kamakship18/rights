import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { SendGridService } from '../filing/sendgrid.service';
import { NoticeBuilder, getEscalationAfterFollowupDelayMs } from '@repo/shared';
import { buildFollowupNoticeData } from '../notice/notice-data.util';

@Processor('followup')
export class FollowupProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(FollowupProcessor.name);
  private noticeBuilder!: NoticeBuilder;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sendgrid: SendGridService,
    @InjectQueue('escalation') private readonly escalationQueue: Queue,
  ) {
    super();
  }

  onModuleInit() {
    this.noticeBuilder = new NoticeBuilder();
  }

  private nextEscalationDelay(
    followupEventSentAt: Date,
    demo: string | null,
  ): number {
    const d = getEscalationAfterFollowupDelayMs(demo);
    return Math.max(0, followupEventSentAt.getTime() + d - Date.now());
  }

  private async ensureEscalationJob(
    grievanceId: string,
    followupEventSentAt: Date,
    demo: string | null,
  ) {
    const j = await this.escalationQueue.getJob(`escalation-${grievanceId}`);
    if (j) {
      return;
    }
    const delay = this.nextEscalationDelay(followupEventSentAt, demo);
    await this.escalationQueue.add(
      'run-escalation',
      { grievanceId },
      {
        delay,
        jobId: `escalation-${grievanceId}`,
        removeOnComplete: 1000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );
    this.logger.warn(`repaired escalation job for ${grievanceId} (delay ${delay}ms)`);
  }

  async process(job: Job<{ grievanceId: string }>) {
    if (job.name !== 'run-followup') {
      this.logger.warn(`unknown followup name: ${job.name}`);
      return;
    }
    const { grievanceId } = job.data;

    const g = await this.prisma.grievance.findUnique({
      where: { id: grievanceId },
      include: { officer: true, user: true, events: true },
    });
    if (!g) {
      this.logger.warn(`grievance not found: ${grievanceId}`);
      return;
    }
    if (g.status === 'RESOLVED' || g.status === 'ESCALATED') {
      return;
    }
    if (g.events.some((e) => e.kind === 'FOLLOWUP_7D')) {
      if (g.status === 'FOLLOWED_UP') {
        const ev = g.events.find((e) => e.kind === 'FOLLOWUP_7D');
        if (ev) {
          await this.ensureEscalationJob(
            grievanceId,
            ev.sentAt,
            g.demoSpeed,
          );
        }
        this.logger.log(`followup already done for ${grievanceId}, repaired / skip`);
      }
      return;
    }
    if (g.status !== 'FILED') {
      this.logger.log(
        `grievance ${grievanceId} not FILED (is ${g.status}) — skip followup`,
      );
      return;
    }

    const built = this.noticeBuilder.build(buildFollowupNoticeData(g));
    const r = await this.sendgrid.send({
      to: g.officer.email,
      subject: built.subject,
      html: built.html,
      text: built.text,
      idempotencyKey: `followup-7d-${grievanceId}-v1`,
    });
    if (!r.success) {
      throw new Error(r.error || 'followup email failed');
    }

    const evRow = await this.prisma.$transaction(async (tx) => {
      const e = await tx.noticeEvent.create({
        data: {
          grievanceId,
          kind: 'FOLLOWUP_7D',
          channel: 'EMAIL',
          payload: { jobId: String(job.id) },
        },
      });
      await tx.grievance.update({
        where: { id: grievanceId },
        data: { status: 'FOLLOWED_UP' },
      });
      return e;
    });

    const delay = getEscalationAfterFollowupDelayMs(g.demoSpeed);
    await this.escalationQueue.add(
      'run-escalation',
      { grievanceId },
      {
        delay,
        jobId: `escalation-${grievanceId}`,
        removeOnComplete: 1000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );

    this.logger.log(
      `FOLLOWUP_7D + scheduled escalation in ${delay}ms — ${grievanceId} (demo=${g.demoSpeed ?? '—'})`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(
    job: Job<{ grievanceId: string }> | undefined,
    err: Error,
  ) {
    if (!job || job.name !== 'run-followup' || !job.data) {
      return;
    }
    const max = (job.opts.attempts ?? 3) as number;
    if (job.attemptsMade < max) {
      return;
    }
    this.logger.error(
      `Followup failed for ${job.data.grievanceId} after ${job.attemptsMade} attempts: ${err?.message}`,
    );
  }
}

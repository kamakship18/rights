import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SendGridService } from '../filing/sendgrid.service';
import { NoticeBuilder } from '@repo/shared';
import { buildEscalationNoticeData } from '../notice/notice-data.util';

@Processor('escalation')
export class EscalationProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(EscalationProcessor.name);
  private noticeBuilder!: NoticeBuilder;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sendgrid: SendGridService,
  ) {
    super();
  }

  onModuleInit() {
    this.noticeBuilder = new NoticeBuilder();
  }

  async process(job: Job<{ grievanceId: string }>) {
    if (job.name !== 'run-escalation') {
      this.logger.warn(`unknown escalation name: ${job.name}`);
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
    if (g.status === 'RESOLVED') {
      return;
    }
    if (g.events.some((e) => e.kind === 'ESCALATION_14D')) {
      this.logger.log(`escalation already sent for ${grievanceId}, skip`);
      return;
    }
    const hasFollow = g.events.some((e) => e.kind === 'FOLLOWUP_7D');
    if (!hasFollow) {
      this.logger.log(
        `grievance ${grievanceId} has no FOLLOWUP_7D event yet — skip escalation`,
      );
      return;
    }
    if (g.status !== 'FOLLOWED_UP' && !(g.status === 'FILED' && hasFollow)) {
      this.logger.log(
        `grievance ${grievanceId} not eligible for escalation (status=${g.status}) — skip`,
      );
      return;
    }

    const childOfficer = g.officer;
    const parent = childOfficer.parentId
      ? await this.prisma.officer.findUnique({ where: { id: childOfficer.parentId } })
      : null;
    const cc = parent?.email;
    const ccId = parent?.id ?? null;

    const built = this.noticeBuilder.build(buildEscalationNoticeData(g));
    const r = await this.sendgrid.send({
      to: g.officer.email,
      cc,
      subject: built.subject,
      html: built.html,
      text: built.text,
      idempotencyKey: `escalation-14d-${grievanceId}-v1`,
    });
    if (!r.success) {
      throw new Error(r.error || 'escalation email failed');
    }

    await this.prisma.$transaction([
      this.prisma.noticeEvent.create({
        data: {
          grievanceId,
          kind: 'ESCALATION_14D',
          channel: 'EMAIL',
          payload: { jobId: String(job.id), ccOfficerId: ccId },
        },
      }),
      this.prisma.grievance.update({
        where: { id: grievanceId },
        data: { status: 'ESCALATED' },
      }),
    ]);

    this.logger.log(`ESCALATION_14D (ccOfficerId=${ccId}) — ${grievanceId}`);
  }

  @OnWorkerEvent('failed')
  onFailed(
    job: Job<{ grievanceId: string }> | undefined,
    err: Error,
  ) {
    if (!job || job.name !== 'run-escalation' || !job.data) {
      return;
    }
    const max = (job.opts.attempts ?? 3) as number;
    if (job.attemptsMade < max) {
      return;
    }
    this.logger.error(
      `Escalation failed for ${job.data.grievanceId} after ${job.attemptsMade} attempts: ${err?.message}`,
    );
  }
}

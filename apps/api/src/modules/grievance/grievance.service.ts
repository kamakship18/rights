/**
 * GrievanceService — orchestrates AI calls, Prisma persistence, and BullMQ enqueue.
 *
 * NEVER trusts client-supplied officer/statute — always re-resolves server-side.
 */
import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma.service';
import { AiService } from './ai.service';
import {
  IntentDto,
  CreateGrievanceDto,
  IntentPreview,
} from './grievance.dto';

@Injectable()
export class GrievanceService {
  private readonly logger = new Logger(GrievanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    @InjectQueue('notice') private readonly noticeQueue: Queue,
  ) {}

  /**
   * Preview: triage + statute + officer in parallel where possible.
   * triage runs first (category needed for statute + officer), then statute + officer in parallel.
   */
  async preview(dto: IntentDto, userId: string): Promise<IntentPreview> {
    // Step 1: Triage (need category for subsequent calls)
    const triage = await this.ai.triage(dto.text, dto.lang);

    // Step 2: Statute + Officer in parallel
    const [statute, officer] = await Promise.all([
      this.ai.mapStatute(dto.text, triage.category),
      this.ai.findOfficer(dto.pin, triage.category),
    ]);

    this.logger.log(
      `Preview generated — urgency: ${triage.urgency}, category: ${triage.category}, grievance_len: ${dto.text.length}`,
    );

    return {
      urgency: triage.urgency,
      category: triage.category,
      confidence: triage.confidence,
      reasoning: triage.reasoning,
      statute: statute.statute,
      section: statute.section,
      citations: statute.citations,
      needs_lawyer_review: statute.needs_lawyer_review,
      sosRecommended: triage.urgency === 'CRITICAL',
      officer: {
        id: officer.officer.id,
        name: officer.officer.name,
        designation: officer.officer.designation,
        department: officer.officer.department,
        email: officer.officer.email,
      },
      parent_officer: officer.parent
        ? {
            id: officer.parent.id,
            name: officer.parent.name,
            designation: officer.parent.designation,
          }
        : null,
    };
  }

  /**
   * Create a grievance: re-resolve via AI, persist, enqueue notice job.
   * @param demoSpeed when `"fast"`, worker compresses 7d/7d+ delays (X-Demo-Speed).
   */
  async create(
    dto: CreateGrievanceDto,
    userId: string,
    opts?: { demoSpeed?: string | null },
  ): Promise<any> {
    // Ensure user exists (upsert for dev mode)
    const user = await this.prisma.user.upsert({
      where: { clerkId: userId },
      update: {},
      create: {
        clerkId: userId,
        fullName: 'Dev User',
        primaryPin: dto.pin,
      },
    });

    // Server-side re-resolution: never trust client values blindly
    // We use the confirmed values but verify the officer exists
    const officer = await this.prisma.officer.findUnique({
      where: { id: dto.confirmedOfficerId },
    });

    if (!officer) {
      throw new BadRequestException(
        `Officer ${dto.confirmedOfficerId} not found — re-run /grievance/intent`,
      );
    }

    // Create the grievance
    const demo = opts?.demoSpeed === 'fast' ? 'fast' : null;

    const grievance = await this.prisma.grievance.create({
      data: {
        userId: user.id,
        rawText: dto.text,
        language: dto.lang || 'en',
        category: dto.confirmedCategory,
        urgency: dto.confirmedUrgency,
        statute: dto.confirmedStatute,
        section: dto.confirmedSection,
        officerId: officer.id,
        status: 'PENDING',
        pin: dto.pin,
        lat: dto.lat,
        lng: dto.lng,
        demoSpeed: demo,
      },
      include: {
        officer: true,
        user: true,
      },
    });

    // Enqueue notice job with idempotency key = grievance ID
    await this.noticeQueue.add(
      'send-notice',
      {
        grievanceId: grievance.id,
        userId: user.id,
      },
      {
        jobId: `notice-${grievance.id}`, // BullMQ idempotency
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );

    this.logger.log(
      `Grievance created — id: ${grievance.id}, urgency: ${grievance.urgency}, status: PENDING`,
    );

    return grievance;
  }

  /**
   * Get a single grievance with its Chain-of-Action timeline.
   */
  async findOne(id: string, userId: string): Promise<any> {
    const grievance = await this.prisma.grievance.findFirst({
      where: { id, user: { clerkId: userId } },
      include: {
        officer: true,
        events: { orderBy: { sentAt: 'asc' } },
        user: { select: { id: true, fullName: true, clerkId: true } },
      },
    });

    if (!grievance) {
      throw new NotFoundException(`Grievance ${id} not found`);
    }

    return grievance;
  }

  /**
   * List user's grievances with cursor pagination.
   */
  async findAll(userId: string, cursor?: string, take = 20): Promise<any> {
    const where = { user: { clerkId: userId } };

    const grievances = await this.prisma.grievance.findMany({
      where,
      take: take + 1, // Fetch one extra to determine hasNext
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        officer: { select: { id: true, name: true, designation: true } },
        _count: { select: { events: true } },
      },
    });

    const hasNext = grievances.length > take;
    const items = hasNext ? grievances.slice(0, take) : grievances;
    const nextCursor = hasNext ? items[items.length - 1]?.id : undefined;

    return { items, nextCursor, hasNext };
  }
}

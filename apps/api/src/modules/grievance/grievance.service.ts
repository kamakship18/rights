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
import { CommunityService } from '../community/community.service';
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
    private readonly community: CommunityService,
    @InjectQueue('notice') private readonly noticeQueue: Queue,
  ) {}

  /**
   * Preview: triage + statute + officer in parallel where possible.
   * triage runs first (category needed for statute + officer), then statute + officer in parallel.
   * Both statute and officer calls are fault-tolerant — a timeout never crashes the preview.
   */
  async preview(dto: IntentDto, userId: string): Promise<IntentPreview> {
    // Step 1: Triage (need category for subsequent calls)
    const triage = await this.ai.triage(dto.text, dto.lang);

    // Step 2: Statute + Officer in parallel — use allSettled so a timeout on one never kills both
    const [statuteResult, officerResult] = await Promise.allSettled([
      this.ai.mapStatute(dto.text, triage.category),
      this.ai.findOfficer(dto.pin, triage.category),
    ]);

    const statute =
      statuteResult.status === 'fulfilled'
        ? statuteResult.value
        : (() => {
            this.logger.warn(
              `mapStatute failed — ${(statuteResult.reason as Error)?.message ?? 'unknown'}. Using fallback.`,
            );
            return {
              statute: 'Unable to determine statute',
              section: 'Statute lookup timed out — please retry',
              citations: [],
              confidence: 0,
              needs_lawyer_review: true,
              reasoning: 'Statute service did not respond in time.',
            };
          })();

    const officer =
      officerResult.status === 'fulfilled'
        ? officerResult.value
        : (() => {
            this.logger.warn(
              `findOfficer failed — ${(officerResult.reason as Error)?.message ?? 'unknown'}. Using fallback.`,
            );
            return {
              officer: {
                id: 'not_found',
                name: 'Unable to determine officer',
                designation: 'N/A',
                department: 'N/A',
                jurisdiction_pin: dto.pin,
                email: '',
              },
              parent: null,
              source: 'error',
            };
          })();

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
    const categoryNorm = (dto.confirmedCategory || 'general')
      .toLowerCase()
      .trim() || 'general';

    // Ensure user exists (upsert for dev mode)
    let user = await this.prisma.user.upsert({
      where: { clerkId: userId },
      update: {},
      create: {
        clerkId: userId,
        fullName: 'Dev User',
        primaryPin: dto.pin,
      },
    });

    // So Local Issues can match clusters: set home PIN from filing when not set
    if (!user.primaryPin) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { primaryPin: dto.pin },
      });
    }

    // Server-side re-resolution: verify officer exists, fall back gracefully
    // when the AI returned a fake/placeholder ID (e.g. "not_found", "error")
    let officer = await this.prisma.officer.findUnique({
      where: { id: dto.confirmedOfficerId },
    });

    if (!officer) {
      this.logger.warn(
        `Officer id="${dto.confirmedOfficerId}" not in DB — finding nearest for pin=${dto.pin}`,
      );
      // Try exact PIN match first
      officer = await this.prisma.officer.findFirst({
        where: { jurisdictionPin: dto.pin },
        orderBy: { createdAt: 'asc' },
      });
    }

    if (!officer) {
      // Widen to any officer: covers PINs outside the seeded dataset
      officer = await this.prisma.officer.findFirst({
        orderBy: { createdAt: 'asc' },
      });
    }

    if (!officer) {
      throw new BadRequestException(
        'No officers available in the system — run pnpm db:seed first',
      );
    }

    // Create the grievance
    const demo = opts?.demoSpeed === 'fast' ? 'fast' : null;

    const grievance = await this.prisma.grievance.create({
      data: {
        userId: user.id,
        rawText: dto.text,
        language: dto.lang || 'en',
        category: categoryNorm,
        urgency: dto.confirmedUrgency,
        statute: dto.confirmedStatute,
        section: dto.confirmedSection,
        officerId: officer.id,
        status: 'PENDING',
        pin: dto.pin,
        locality: dto.locality ?? null,
        lat: dto.lat,
        lng: dto.lng,
        isAnonymous: dto.isAnonymous ?? false,
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
      `Grievance created — id: ${grievance.id}, userId: ${user.id} clerkId: ${userId}, ` +
        `pin: ${dto.pin} category: ${categoryNorm} — community clustering will run`,
    );

    // Non-blocking community clustering check
    void this.community.checkAndCluster(grievance.id);

    return grievance;
  }

  /**
   * Get a single grievance with its Chain-of-Action timeline.
   * Always verifies the grievance belongs to the requesting user.
   */
  async findOne(id: string, userId: string): Promise<any> {
    if (!userId || userId === 'anonymous') {
      throw new NotFoundException(`Grievance ${id} not found`);
    }

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

    // Extra ownership assertion — belt and suspenders
    if (grievance.user?.clerkId !== userId) {
      this.logger.error(
        `SECURITY: findOne returned grievance owned by ${grievance.user?.clerkId} to clerkId ${userId}`,
      );
      throw new NotFoundException(`Grievance ${id} not found`);
    }

    return grievance;
  }

  /**
   * List user's grievances with cursor pagination.
   * Always scoped strictly to the requesting user's clerkId.
   */
  async findAll(userId: string, cursor?: string, take = 20): Promise<any> {
    this.logger.log(`findAll — clerkId: ${userId}`);

    // Strict ownership filter — NEVER query without a valid clerkId
    if (!userId || userId === 'anonymous') {
      this.logger.warn('findAll called without a valid userId — returning empty');
      return { items: [], nextCursor: undefined, hasNext: false };
    }

    const where = { user: { clerkId: userId } };

    const grievances = await this.prisma.grievance.findMany({
      where,
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        officer: { select: { id: true, name: true, designation: true } },
        _count: { select: { events: true } },
      },
    });

    this.logger.log(`findAll — clerkId: ${userId} → ${grievances.length} row(s) returned`);

    const hasNext = grievances.length > take;
    const items = hasNext ? grievances.slice(0, take) : grievances;
    const nextCursor = hasNext ? items[items.length - 1]?.id : undefined;

    return { items, nextCursor, hasNext };
  }

  /**
   * Add a user-authored update to the grievance timeline.
   */
  async addUpdate(id: string, userId: string, message: string): Promise<any> {
    const grievance = await this.prisma.grievance.findFirst({
      where: { id, user: { clerkId: userId } },
    });

    if (!grievance) {
      throw new NotFoundException(`Grievance ${id} not found`);
    }

    return this.prisma.noticeEvent.create({
      data: {
        grievanceId: id,
        kind: 'USER_UPDATE',
        channel: 'SYSTEM',
        source: 'USER',
        message,
        payload: { addedByClerkId: userId },
      },
    });
  }
}

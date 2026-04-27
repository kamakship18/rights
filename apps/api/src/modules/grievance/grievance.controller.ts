/**
 * GrievanceController — HTTP endpoints for grievance lifecycle.
 */
import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { GrievanceService } from './grievance.service';
import { IntentDtoSchema, CreateGrievanceDtoSchema } from './grievance.dto';
import { AddGrievanceUpdateDtoSchema } from '@repo/shared';

@Controller('grievance')
export class GrievanceController {
  private readonly logger = new Logger(GrievanceController.name);

  constructor(private readonly service: GrievanceService) {}

  /**
   * POST /grievance/intent
   * Calls AI triage + statute + officer, returns a preview card.
   */
  @Post('intent')
  @HttpCode(HttpStatus.OK)
  async intent(@Body() body: unknown, @Req() req: Request) {
    const parsed = IntentDtoSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const userId = req.userId || 'anonymous';
    return this.service.preview(parsed.data, userId);
  }

  /**
   * POST /grievance
   * Persists grievance (PENDING), enqueues notice job, returns 201.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: unknown,
    @Req() req: Request,
    @Query('demoSpeed') demoParam?: string,
  ): Promise<any> {
    const parsed = CreateGrievanceDtoSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const userId = req.userId || 'anonymous';
    const h = (req.get('X-Demo-Speed') || '').toLowerCase();
    const q = (demoParam || '').toLowerCase();
    const demoSpeed = h === 'fast' || q === 'fast' ? 'fast' : null;
    return this.service.create(parsed.data, userId, { demoSpeed });
  }

  /**
   * GET /grievance/:id
   * Returns grievance with Chain-of-Action timeline (NoticeEvents ordered).
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request): Promise<any> {
    const userId = req.userId || 'anonymous';
    return this.service.findOne(id, userId);
  }

  /**
   * GET /grievance
   * Lists user's grievances with cursor pagination.
   * Query: ?cursor=xxx&take=20
   */
  @Get()
  async findAll(
    @Query('cursor') cursor: string | undefined,
    @Query('take') take: string | undefined,
    @Req() req: Request,
  ): Promise<any> {
    const userId = req.userId || 'anonymous';
    const pageSize = take ? Math.min(parseInt(take, 10), 50) : 20;
    return this.service.findAll(userId, cursor, pageSize);
  }

  /**
   * POST /grievance/:id/update
   * Adds a user-authored note to the grievance timeline.
   */
  @Post(':id/update')
  @HttpCode(HttpStatus.CREATED)
  async addUpdate(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: Request,
  ): Promise<any> {
    const parsed = AddGrievanceUpdateDtoSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    const userId = req.userId || 'anonymous';
    return this.service.addUpdate(id, userId, parsed.data.message);
  }
}

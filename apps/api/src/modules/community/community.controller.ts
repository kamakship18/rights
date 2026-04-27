/**
 * CommunityController — exposes community grievance data.
 *
 * GET /community          — user's local issues (their PIN)
 * GET /community/pin/:pin — any pin (for future admin / public view)
 */
import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { CommunityService } from './community.service';

@Controller('community')
export class CommunityController {
  constructor(private readonly service: CommunityService) {}

  @Get()
  async listForUser(@Req() req: Request): Promise<any[]> {
    const userId = req.userId || 'anonymous';
    return this.service.listForUser(userId);
  }

  @Get('pin/:pin')
  async listByPin(@Param('pin') pin: string): Promise<any[]> {
    return this.service.listByPin(pin);
  }
}

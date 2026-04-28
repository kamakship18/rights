/**
 * PerformanceController — public endpoints for transparency data.
 *
 * No auth required: leaderboard data is intentionally public.
 */
import { Controller, Get, Query } from '@nestjs/common';
import { PerformanceService } from './performance.service';

@Controller('performance')
export class PerformanceController {
  constructor(private readonly service: PerformanceService) {}

  /**
   * GET /performance
   * Returns the full performance report.
   * Optional ?pin=110001 to filter by jurisdiction PIN.
   */
  @Get()
  getReport(@Query('pin') pin?: string) {
    return this.service.getReport(pin || undefined);
  }
}

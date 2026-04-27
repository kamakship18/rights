/**
 * ProfileController
 *
 * GET  /profile    — fetch current user's DB profile
 * PATCH /profile   — update fullName, phone, location, primaryPin + mark profileComplete
 */
import {
  Controller,
  Get,
  Patch,
  Body,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { ProfileService } from './profile.service';
import { UpdateProfileDtoSchema } from '@repo/shared';

@Controller('profile')
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  @Get()
  getProfile(@Req() req: Request) {
    const userId = req.userId || 'anonymous';
    return this.service.getProfile(userId);
  }

  @Patch()
  updateProfile(@Body() body: unknown, @Req() req: Request) {
    const parsed = UpdateProfileDtoSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    const userId = req.userId || 'anonymous';
    return this.service.updateProfile(userId, parsed.data);
  }
}

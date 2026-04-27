import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import type { UpdateProfileDto } from '@repo/shared';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getProfile(clerkId: string) {
    this.logger.log(`getProfile — clerkId: ${clerkId}`);
    const profile = await this.prisma.user.upsert({
      where: { clerkId },
      update: {},
      create: { clerkId, fullName: 'Citizen' },
      select: {
        id: true,
        clerkId: true,
        fullName: true,
        phone: true,
        location: true,
        primaryPin: true,
        profileComplete: true,
        createdAt: true,
      },
    });

    // Sanity check: the returned record MUST belong to the requesting user.
    // If this ever fails it indicates a data integrity violation — log loudly.
    if (profile.clerkId !== clerkId) {
      this.logger.error(
        `SECURITY: getProfile returned clerkId ${profile.clerkId} for requesting user ${clerkId}`,
      );
      throw new Error('User isolation violation detected');
    }

    return profile;
  }

  async updateProfile(clerkId: string, dto: UpdateProfileDto) {
    this.logger.log(`updateProfile — clerkId: ${clerkId}`);

    const current = await this.prisma.user.findUnique({ where: { clerkId } });
    const newFullName = dto.fullName ?? current?.fullName ?? '';
    const newPin = dto.primaryPin ?? current?.primaryPin ?? '';
    const profileComplete = !!newFullName && !!newPin;

    const updated = await this.prisma.user.upsert({
      where: { clerkId },
      update: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.primaryPin !== undefined && { primaryPin: dto.primaryPin }),
        profileComplete,
      },
      create: {
        clerkId,
        fullName: dto.fullName || 'Citizen',
        phone: dto.phone,
        location: dto.location,
        primaryPin: dto.primaryPin,
        profileComplete,
      },
      select: {
        id: true,
        clerkId: true,
        fullName: true,
        phone: true,
        location: true,
        primaryPin: true,
        profileComplete: true,
      },
    });

    if (updated.clerkId !== clerkId) {
      this.logger.error(
        `SECURITY: updateProfile returned clerkId ${updated.clerkId} for requesting user ${clerkId}`,
      );
      throw new Error('User isolation violation detected');
    }

    return updated;
  }
}

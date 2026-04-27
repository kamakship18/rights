import { Module } from '@nestjs/common';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';
import { FilingModule } from '../filing/filing.module';
import { PrismaService } from '../../prisma.service';

@Module({
  imports: [FilingModule],
  controllers: [CommunityController],
  providers: [CommunityService, PrismaService],
  exports: [CommunityService],
})
export class CommunityModule {}

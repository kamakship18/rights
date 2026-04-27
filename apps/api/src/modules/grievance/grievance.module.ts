import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { GrievanceController } from './grievance.controller';
import { GrievanceService } from './grievance.service';
import { AiService } from './ai.service';
import { PrismaService } from '../../prisma.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'notice' }),
  ],
  controllers: [GrievanceController],
  providers: [GrievanceService, AiService, PrismaService],
  exports: [GrievanceService, AiService],
})
export class GrievanceModule {}

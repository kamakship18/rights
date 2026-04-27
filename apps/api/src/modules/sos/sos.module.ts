import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { SosController } from './sos.controller';
import { SosService } from './sos.service';
import { SosGateway } from './sos.gateway';
import { GooglePlacesClient } from './providers/places.client';
import { TwilioSosClient } from './providers/twilio.client';

@Module({
  providers: [PrismaService, SosService, SosGateway, GooglePlacesClient, TwilioSosClient],
  controllers: [SosController],
  exports: [SosService, SosGateway],
})
export class SosModule {}

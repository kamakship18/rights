import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { GooglePlacesClient, NearestPlace } from './providers/places.client';
import { TwilioSosClient } from './providers/twilio.client';
import { SosGateway } from './sos.gateway';
import { toE164 } from './phone.util';
import type { CreateContactBody, SosTriggerBody, UpdateContactBody } from './sos.dto';

@Injectable()
export class SosService {
  private readonly logger = new Logger(SosService.name);
  private static readonly WALL_MS = 4000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly places: GooglePlacesClient,
    private readonly twilio: TwilioSosClient,
    private readonly gateway: SosGateway,
  ) {}

  private async resolveUser(clerkId: string) {
    return this.prisma.user.upsert({
      where: { clerkId },
      create: { clerkId, fullName: 'Citizen' },
      update: {},
    });
  }

  async listContacts(clerkId: string) {
    const user = await this.resolveUser(clerkId);
    return this.prisma.emergencyContact.findMany({ where: { userId: user.id } });
  }

  async addContact(clerkId: string, body: CreateContactBody) {
    const user = await this.resolveUser(clerkId);
    return this.prisma.emergencyContact.create({
      data: { userId: user.id, name: body.name, phone: toE164(body.phone), relation: body.relation },
    });
  }

  async updateContact(
    clerkId: string,
    contactId: string,
    body: UpdateContactBody,
  ) {
    const user = await this.resolveUser(clerkId);
    const c = await this.prisma.emergencyContact.findFirst({
      where: { id: contactId, userId: user.id },
    });
    if (!c) {
      throw new NotFoundException('Contact not found');
    }
    if (
      body.name === undefined &&
      body.phone === undefined &&
      body.relation === undefined
    ) {
      return c;
    }
    return this.prisma.emergencyContact.update({
      where: { id: contactId },
      data: {
        ...(body.name != null && { name: body.name }),
        ...(body.phone != null && { phone: toE164(body.phone) }),
        ...(body.relation !== undefined && { relation: body.relation ?? null }),
      },
    });
  }

  async removeContact(clerkId: string, contactId: string) {
    const user = await this.resolveUser(clerkId);
    const c = await this.prisma.emergencyContact.findFirst({
      where: { id: contactId, userId: user.id },
    });
    if (!c) {
      throw new NotFoundException('Contact not found');
    }
    await this.prisma.emergencyContact.delete({ where: { id: contactId } });
  }

  private buildText(
    citizen: string,
    lat: number,
    lng: number,
    police: NearestPlace[],
    hospitals: NearestPlace[],
    custom?: string,
  ) {
    const loc = `https://maps.google.com/?q=${lat},${lng}`;
    const p0 = police[0]?.name || 'N/A';
    const h0 = hospitals[0]?.name || 'N/A';
    const line = custom ? `${custom} ` : '';
    return (
      `${line}[SOS from ${citizen}] ` +
      `location: ${loc} Nearest: ${p0}, ${h0}.` +
      ` (Dial ERSS: tel:112)`
    );
  }

  async trigger(clerkId: string, body: SosTriggerBody) {
    const t0 = Date.now();
    const user = await this.resolveUser(clerkId);
    const contacts = await this.prisma.emergencyContact.findMany({ where: { userId: user.id } });
    if (contacts.length === 0) {
      throw new BadRequestException('Add at least one emergency contact first');
    }

    await this.prisma.noticeEvent.create({
      data: {
        userId: user.id,
        grievanceId: null,
        kind: 'SOS_BROADCAST',
        channel: 'SYSTEM',
        payload: { lat: body.lat, lng: body.lng, message: body.message || null, startedAt: t0 },
      },
    });
    this.logger.log(`SOS_BROADCAST stored for user ${user.id}`);

    const { police, hospitals } = await this.places.getPoliceAndHospitals(body.lat, body.lng);
    if (!police.length) {
      this.logger.warn('Google Places: no police in radius (Places down or no results) — broadcast continues');
    }
    if (!hospitals.length) {
      this.logger.warn('Google Places: no hospitals in radius (Places down or no results) — broadcast continues');
    }

    const text = this.buildText(
      user.fullName,
      body.lat,
      body.lng,
      police,
      hospitals,
      body.message,
    );

    const wallLeft = SosService.WALL_MS - (Date.now() - t0);
    if (wallLeft <= 0) {
      this.logger.warn('SOS: 4s budget exhausted before broadcast; returning partial');
      return { tel: 'tel:112', broadcastedTo: 0, places: { police, hospitals } };
    }

    const deadline = t0 + SosService.WALL_MS;
    let broadcastedTo = 0;
    const jobs = contacts.map(
      (c) =>
        (async () => {
          const phoneE164 = toE164(c.phone);
          const [rSms, rWa] = await Promise.all([
            this.twilio.sendSms(phoneE164, text),
            this.twilio.sendWhatsapp(phoneE164, text),
          ]);
          const sOk = rSms.ok;
          const wOk = rWa.ok;
          const sms = sOk
            ? { ok: true as const }
            : { ok: false as const, error: !rSms.ok ? rSms.error : 'unknown' };
          const whatsapp = wOk
            ? { ok: true as const }
            : { ok: false as const, error: !rWa.ok ? rWa.error : 'unknown' };
          this.gateway.pushDeliveryStatus(user.id, { contactId: c.id, delivery: { sms, whatsapp } });
          if (sOk || wOk) {
            broadcastedTo += 1;
          }
        })(),
    );

    await Promise.race([
      Promise.allSettled(jobs),
      new Promise<void>((r) => {
        setTimeout(
          () => {
            this.logger.log(`SOS: ${SosService.WALL_MS}ms window elapsed; returning (Twilio in-flight may continue until channel limits)`);
            r();
          },
          Math.max(0, deadline - Date.now()),
        );
      }),
    ]);

    return { tel: 'tel:112' as const, broadcastedTo, places: { police, hospitals } };
  }
}

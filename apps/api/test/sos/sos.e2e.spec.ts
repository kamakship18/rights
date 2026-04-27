/**
 * Google Places: nock Nearby Search. Twilio: mocked in-module for speed (SDK path is
 * still exercised in manual/real account tests). Prisma + gateway: mocked.
 */
import nock from 'nock';
import { Test } from '@nestjs/testing';
import { INestApplication, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');
import { SosController } from '../../src/modules/sos/sos.controller';
import { SosService } from '../../src/modules/sos/sos.service';
import { PrismaService } from '../../src/prisma.service';
import { SosGateway } from '../../src/modules/sos/sos.gateway';
import { GooglePlacesClient } from '../../src/modules/sos/providers/places.client';
import { TwilioSosClient } from '../../src/modules/sos/providers/twilio.client';

@Module({})
class DevAuthStubModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    consumer.apply((req: any, _res: any, next: () => void) => {
      req.userId = 'e2e-clerk-001';
      next();
    }).forRoutes(SosController);
  }
}

describe('POST /sos/trigger', () => {
  const user = { id: 'u-e2e', fullName: 'E2E', clerkId: 'e2e-clerk-001' };
  const contact = {
    id: 'c-e2e',
    name: 'Verified',
    phone: '+911234567890',
    userId: user.id,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockPrisma: any = {
    user: { upsert: async () => user },
    emergencyContact: { findMany: async () => [contact] },
    noticeEvent: { create: jest.fn().mockResolvedValue({ id: 'n1' }) },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const push = jest.fn() as (uid: string, p: any) => void;

  let app: INestApplication;

  beforeAll(() => {
    process.env.TWILIO_ACCOUNT_SID = 'ACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    process.env.TWILIO_AUTH_TOKEN = 'tok';
    process.env.TWILIO_FROM_SMS = '+15550000000';
    process.env.TWILIO_FROM_WHATSAPP = '+14155238886';
    process.env.GOOGLE_PLACES_API_KEY = 'k';
  });

  beforeAll(async () => {
    nock('https://maps.googleapis.com', { encodedQueryParams: true })
      .get('/maps/api/place/nearbysearch/json')
      .query((q) => (q as Record<string, string>).type === 'police')
      .reply(200, {
        status: 'OK',
        results: [
          {
            name: 'Test Police',
            vicinity: 'Delhi',
            geometry: { location: { lat: 28.62, lng: 77.21 } },
          },
        ],
      });
    nock('https://maps.googleapis.com', { encodedQueryParams: true })
      .get('/maps/api/place/nearbysearch/json')
      .query((q) => (q as Record<string, string>).type === 'hospital')
      .reply(200, {
        status: 'OK',
        results: [
          { name: 'Test Hospital', geometry: { location: { lat: 28.63, lng: 77.2 } } },
        ],
      });
  });

  afterAll(() => {
    nock.cleanAll();
  });

  beforeAll(async () => {
    const twOk = { ok: true as const, sid: 'm1' };
    const mod = await Test.createTestingModule({
      imports: [DevAuthStubModule],
      controllers: [SosController],
      providers: [
        SosService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: SosGateway,
          useValue: { pushDeliveryStatus: (uid: string, p: unknown) => push(uid, p) },
        },
        GooglePlacesClient,
        {
          provide: TwilioSosClient,
          useValue: {
            sendSms: () => Promise.resolve(twOk),
            sendWhatsapp: () => Promise.resolve(twOk),
          },
        },
      ],
    }).compile();
    app = mod.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('nocks Google Places, broadcasts with mocked Twilio, and records delivery in gateway', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const server = (app as any).getHttpServer() as { close: (c: (e?: Error) => void) => void };
    const r = await request(server)
      .post('/sos/trigger')
      .send({ lat: 28.6139, lng: 77.209 })
      .expect(201);

    expect(r.body.tel).toBe('tel:112');
    expect(r.body.places.police[0].name).toBe('Test Police');
    expect(r.body.places.hospitals[0].name).toBe('Test Hospital');
    expect(r.body.broadcastedTo).toBe(1);
    expect(mockPrisma.noticeEvent.create).toHaveBeenCalled();
    expect(push).toHaveBeenCalled();
  });
});

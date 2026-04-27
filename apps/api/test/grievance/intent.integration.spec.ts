/**
 * Integration test for POST /grievance/intent
 *
 * Mocks the AI service to return predictable triage, statute, and officer data.
 * Verifies:
 * - 200 response with correct preview card shape
 * - Statute matches "Noise Pollution (Regulation and Control) Rules, 2000"
 * - Officer matches DCP North
 * - Validation rejects malformed bodies (bad PIN, short text)
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');
import { GrievanceController } from '../../src/modules/grievance/grievance.controller';
import { GrievanceService } from '../../src/modules/grievance/grievance.service';
import { AiService } from '../../src/modules/grievance/ai.service';
import { PrismaService } from '../../src/prisma.service';
import { getQueueToken } from '@nestjs/bullmq';

// ─── Mock AI responses ──────────────────────────────────

const mockTriageResult = {
  urgency: 'HIGH' as const,
  category: 'noise',
  confidence: 0.92,
  reasoning: 'The complaint describes loud music at night, which falls under noise pollution.',
};

const mockStatuteResult = {
  statute: 'Noise Pollution (Regulation and Control) Rules, 2000',
  section: 'Rule 5 — Restrictions on the use of loudspeakers',
  citations: [
    {
      source: 'Indian Kanoon',
      snippet: 'Rule 5 prohibits use of loudspeakers between 10pm and 6am.',
      url: 'https://indiankanoon.org/doc/noise-rule-5',
    },
  ],
  confidence: 0.88,
  needs_lawyer_review: false,
  reasoning: 'Noise complaint maps to Noise Pollution Rules 2000, Rule 5.',
};

const mockOfficerResult = {
  officer: {
    id: 'officer_dcp_north_demo',
    name: 'Sh. A.K. Verma, IPS',
    designation: 'DCP North District',
    department: 'Delhi Police',
    jurisdiction_pin: '110001',
    email: 'team@actionablejustice.dev',
  },
  parent: {
    id: 'officer_commissioner_demo',
    name: 'Sh. R.K. Sharma, IPS',
    designation: 'Commissioner of Police',
    department: 'Delhi Police',
    jurisdiction_pin: '110001',
    email: 'team@actionablejustice.dev',
  },
  source: 'pinecone+sql',
};

// ─── Mock Queue ─────────────────────────────────────────

const mockQueue = {
  add: jest.fn().mockResolvedValue({ id: 'job-1' }),
};

// ─── Mock Prisma ────────────────────────────────────────

const mockPrisma = {
  user: { upsert: jest.fn(), findUnique: jest.fn() },
  officer: { findUnique: jest.fn() },
  grievance: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

describe('POST /grievance/intent (Integration)', () => {
  let app: INestApplication;
  let aiService: AiService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [GrievanceController],
      providers: [
        GrievanceService,
        {
          provide: AiService,
          useValue: {
            triage: jest.fn().mockResolvedValue(mockTriageResult),
            mapStatute: jest.fn().mockResolvedValue(mockStatuteResult),
            findOfficer: jest.fn().mockResolvedValue(mockOfficerResult),
          },
        },
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: getQueueToken('notice'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    aiService = moduleRef.get<AiService>(AiService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 200 with a valid preview card for a noise complaint', async () => {
    const response = await request(app.getHttpServer())
      .post('/grievance/intent')
      .send({
        text: 'loud DJ next door at 1am',
        pin: '110001',
      })
      .expect(HttpStatus.OK);

    const body = response.body;

    // Structure checks
    expect(body).toHaveProperty('urgency');
    expect(body).toHaveProperty('category');
    expect(body).toHaveProperty('statute');
    expect(body).toHaveProperty('section');
    expect(body).toHaveProperty('officer');
    expect(body).toHaveProperty('citations');
    expect(body).toHaveProperty('parent_officer');

    // Value checks — acceptance criteria from prompt
    expect(typeof body.sosRecommended).toBe('boolean');
    expect(body.sosRecommended).toBe(false);
    expect(body.urgency).toBe('HIGH');
    expect(body.category).toBe('noise');
    expect(body.statute).toBe('Noise Pollution (Regulation and Control) Rules, 2000');
    expect(body.officer.designation).toContain('DCP North');
    expect(body.officer.name).toContain('Verma');
    expect(body.confidence).toBeGreaterThan(0.5);
    expect(body.needs_lawyer_review).toBe(false);

    // Citations array
    expect(Array.isArray(body.citations)).toBe(true);
    expect(body.citations.length).toBeGreaterThan(0);

    // Parent officer (escalation target)
    expect(body.parent_officer).not.toBeNull();
    expect(body.parent_officer.designation).toContain('Commissioner');
  });

  it('should call AI triage first, then statute + officer in parallel', async () => {
    await request(app.getHttpServer())
      .post('/grievance/intent')
      .send({
        text: 'loud DJ next door at 1am',
        pin: '110001',
      })
      .expect(HttpStatus.OK);

    // Triage must have been called
    expect(aiService.triage).toHaveBeenCalledWith('loud DJ next door at 1am', undefined);

    // Statute and officer called with triage result's category
    expect(aiService.mapStatute).toHaveBeenCalledWith('loud DJ next door at 1am', 'noise');
    expect(aiService.findOfficer).toHaveBeenCalledWith('110001', 'noise');
  });

  it('should return 400 for missing PIN', async () => {
    const response = await request(app.getHttpServer())
      .post('/grievance/intent')
      .send({
        text: 'loud DJ next door at 1am',
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body).toHaveProperty('fieldErrors');
    expect(response.body.fieldErrors).toHaveProperty('pin');
  });

  it('should return 400 for invalid PIN format (not 6 digits)', async () => {
    await request(app.getHttpServer())
      .post('/grievance/intent')
      .send({
        text: 'loud DJ next door at 1am',
        pin: '123', // too short
      })
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('should return 400 for text shorter than 5 characters', async () => {
    await request(app.getHttpServer())
      .post('/grievance/intent')
      .send({
        text: 'hi',
        pin: '110001',
      })
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('should accept optional lang parameter', async () => {
    const response = await request(app.getHttpServer())
      .post('/grievance/intent')
      .send({
        text: 'Mere ghar ke pass bahut shor hai raat ko',
        lang: 'hi',
        pin: '110001',
      })
      .expect(HttpStatus.OK);

    expect(response.body.statute).toBe('Noise Pollution (Regulation and Control) Rules, 2000');
    expect(aiService.triage).toHaveBeenCalledWith(
      'Mere ghar ke pass bahut shor hai raat ko',
      'hi',
    );
  });

  it('should accept optional lat/lng parameters', async () => {
    await request(app.getHttpServer())
      .post('/grievance/intent')
      .send({
        text: 'loud DJ next door at 1am',
        pin: '110001',
        lat: 28.6315,
        lng: 77.2167,
      })
      .expect(HttpStatus.OK);
  });
});

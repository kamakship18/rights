import { z } from 'zod';

// ─── Zod Enums (mirrors Prisma enums) ───────────────────

export const Urgency = z.enum(['CRITICAL', 'HIGH', 'NORMAL']);
export type Urgency = z.infer<typeof Urgency>;

export const GrievanceStatus = z.enum(['PENDING', 'FILED', 'FOLLOWED_UP', 'ESCALATED', 'RESOLVED']);
export type GrievanceStatus = z.infer<typeof GrievanceStatus>;

export const EventKind = z.enum(['FILED', 'FOLLOWUP_7D', 'ESCALATION_14D', 'SOS_BROADCAST', 'USER_UPDATE', 'COMMUNITY_NOTICE']);
export type EventKind = z.infer<typeof EventKind>;

export const EventSource = z.enum(['SYSTEM', 'OFFICER', 'USER']);
export type EventSource = z.infer<typeof EventSource>;

export const Channel = z.enum(['EMAIL', 'SMS', 'WHATSAPP', 'SYSTEM']);
export type Channel = z.infer<typeof Channel>;

// ─── Zod Schemas (for runtime validation at API boundaries) ─────

export const GrievanceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  rawText: z.string(),
  language: z.string(),
  category: z.string(),
  urgency: Urgency,
  statute: z.string(),
  section: z.string(),
  officerId: z.string(),
  status: GrievanceStatus,
  pin: z.string(),
  locality: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  filedAt: z.string().datetime().nullable().optional(),
  resolvedAt: z.string().datetime().nullable().optional(),
  isAnonymous: z.boolean().default(false),
  demoSpeed: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
});

export type GrievanceInput = z.infer<typeof GrievanceSchema>;

export const OfficerSchema = z.object({
  id: z.string(),
  name: z.string(),
  designation: z.string(),
  department: z.string(),
  jurisdictionPin: z.string(),
  email: z.string().email(),
  parentId: z.string().nullable().optional(),
});

export type OfficerInput = z.infer<typeof OfficerSchema>;

export const NoticeEventSchema = z.object({
  id: z.string(),
  grievanceId: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  kind: EventKind,
  channel: Channel,
  source: EventSource.default('SYSTEM'),
  message: z.string().nullable().optional(),
  payload: z.record(z.unknown()),
  sentAt: z.string().datetime(),
});

export type NoticeEventInput = z.infer<typeof NoticeEventSchema>;

// ─── Health Check ───────────────────────────────────────

export const HealthCheckSchema = z.object({
  ok: z.boolean(),
  service: z.string(),
});

export type HealthCheck = z.infer<typeof HealthCheckSchema>;

// ─── Intent DTOs (shared between web + api) ─────────────

export const IntentDtoSchema = z.object({
  text: z.string().min(5, 'Grievance text must be at least 5 characters'),
  lang: z.string().length(2).optional(),
  pin: z.string().regex(/^\d{6}$/, 'PIN must be 6 digits'),
  locality: z.string().max(120).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export type IntentDto = z.infer<typeof IntentDtoSchema>;

export const CreateGrievanceDtoSchema = IntentDtoSchema.extend({
  confirmedStatute: z.string().min(1),
  confirmedSection: z.string().min(1),
  confirmedOfficerId: z.string().min(1),
  confirmedCategory: z.string().min(1),
  confirmedUrgency: Urgency,
  isAnonymous: z.boolean().default(false),
});

export type CreateGrievanceDto = z.infer<typeof CreateGrievanceDtoSchema>;

// ─── Profile DTO ─────────────────────────────────────────

export const UpdateProfileDtoSchema = z.object({
  fullName: z.string().min(1).max(120).optional(),
  phone: z.string().max(20).optional(),
  location: z.string().max(200).optional(),
  primaryPin: z.string().regex(/^\d{6}$/).optional(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileDtoSchema>;

// ─── User Update (user-added timeline note) ──────────────

export const AddGrievanceUpdateDtoSchema = z.object({
  message: z.string().min(1).max(1000),
});

export type AddGrievanceUpdateDto = z.infer<typeof AddGrievanceUpdateDtoSchema>;

// ─── Community Grievance types ───────────────────────────

export interface CommunityGrievance {
  id: string;
  pin: string;
  locality: string | null;
  category: string;
  status: string;
  count: number;
  emailSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Preview Card (returned by POST /grievance/intent) ──

export interface IntentPreview {
  urgency: string;
  category: string;
  confidence: number;
  reasoning: string;
  statute: string;
  section: string;
  citations: Array<{ source: string; snippet: string; url: string }>;
  needs_lawyer_review: boolean;
  officer: {
    id: string;
    name: string;
    designation: string;
    department: string;
    email: string;
  };
  parent_officer: {
    id: string;
    name: string;
    designation: string;
  } | null;
  /** When true, the web client may auto-open the Pulse SOS interface */
  sosRecommended: boolean;
}

// ─── Notice Types (implementation in notice/) ────────────
export * from './notice/notice-data';
export { NoticeBuilder } from './notice/notice.builder';

// ─── Persistence (Bull delayed jobs + cron) ─────────────
export * from './persistence-delays';

// ─── Filing Types ───────────────────────────────────────

export interface SendEmailParams {
  to: string;
  cc?: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
}

export interface SendResult {
  success: boolean;
  error?: string;
  attempts: number;
}

// ─── Re-export Prisma types for convenience ─────────────
// Apps that need the Prisma client + DB types import from @repo/prisma.
// Apps that need zod validation schemas import from @repo/shared.
// This avoids circular deps while keeping types DRY.


/**
 * Typed fetch client for apps/api.
 * Reads NEXT_PUBLIC_API_URL env and attaches Clerk JWT on every request.
 */

import type {
  IntentDto,
  IntentPreview,
  CreateGrievanceDto,
  UpdateProfileDto,
  CommunityGrievance,
} from '@repo/shared';

/* ── Helpers ─────────────────────────────────────────────── */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`API ${status}`);
    this.name = 'ApiError';
  }
}

type GetTokenFn = () => Promise<string | null>;

async function request<T>(
  method: string,
  path: string,
  getToken: GetTokenFn,
  body?: unknown,
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errBody: unknown;
    try {
      errBody = await res.json();
    } catch {
      errBody = await res.text();
    }
    throw new ApiError(res.status, errBody);
  }

  /* 204 or empty */
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

/* ── Public API surface ──────────────────────────────────── */

/** Create a scoped client bound to a getToken function (from Clerk `useAuth()`). */
export function createApiClient(getToken: GetTokenFn) {
  return {
    /* ── Grievance ────────────────────────────────────────── */

    intentPreview(dto: IntentDto) {
      return request<IntentPreview>('POST', '/grievance/intent', getToken, dto);
    },

    createGrievance(dto: CreateGrievanceDto, demoSpeed?: string) {
      const qs = demoSpeed ? `?demoSpeed=${demoSpeed}` : '';
      return request<GrievanceWithEvents>(
        'POST',
        `/grievance${qs}`,
        getToken,
        dto,
      );
    },

    getGrievance(id: string) {
      return request<GrievanceWithEvents>(
        'GET',
        `/grievance/${id}`,
        getToken,
      );
    },

    listGrievances(cursor?: string, take = 20) {
      const params = new URLSearchParams();
      if (cursor) params.set('cursor', cursor);
      params.set('take', String(take));
      const qs = params.toString() ? `?${params}` : '';
      return request<GrievanceListResponse>(
        'GET',
        `/grievance${qs}`,
        getToken,
      );
    },

    /* ── SOS ─────────────────────────────────────────────── */

    sosTrigger(body: { lat: number; lng: number; message?: string }) {
      return request<SosTriggerResponse>(
        'POST',
        '/sos/trigger',
        getToken,
        body,
      );
    },

    listContacts() {
      return request<EmergencyContact[]>('GET', '/sos/contacts', getToken);
    },

    addContact(body: { name: string; phone: string; relation?: string }) {
      return request<EmergencyContact>(
        'POST',
        '/sos/contacts',
        getToken,
        body,
      );
    },

    deleteContact(id: string) {
      return request<void>('DELETE', `/sos/contacts/${id}`, getToken);
    },

    /* ── Grievance update (user timeline note) ───────── */

    addGrievanceUpdate(id: string, message: string) {
      return request<NoticeEvent>('POST', `/grievance/${id}/update`, getToken, { message });
    },

    /* ── Profile ─────────────────────────────────────── */

    getProfile() {
      return request<UserProfile>('GET', '/profile', getToken);
    },

    updateProfile(dto: UpdateProfileDto) {
      return request<UserProfile>('PATCH', '/profile', getToken, dto);
    },

    /* ── Community ───────────────────────────────────── */

    listCommunityIssues() {
      return request<CommunityGrievance[]>('GET', '/community', getToken);
    },

    listCommunityByPin(pin: string) {
      return request<CommunityGrievance[]>('GET', `/community/pin/${pin}`, getToken);
    },
  };
}

/* ── Response types (mirrors API) ────────────────────────── */

export interface NoticeEvent {
  id: string;
  grievanceId: string | null;
  userId?: string | null;
  kind: string;
  channel: string;
  source: 'SYSTEM' | 'OFFICER' | 'USER';
  message: string | null;
  payload: Record<string, unknown>;
  sentAt: string;
}

export interface Officer {
  id: string;
  name: string;
  designation: string;
  department: string;
  email: string;
}

export interface GrievanceWithEvents {
  id: string;
  userId: string;
  rawText: string;
  language: string;
  category: string;
  urgency: string;
  statute: string;
  section: string;
  officerId: string;
  status: string;
  pin: string;
  lat: number | null;
  lng: number | null;
  filedAt: string | null;
  resolvedAt: string | null;
  demoSpeed: string | null;
  createdAt: string;
  officer: Officer;
  events: NoticeEvent[];
  user?: { id: string; fullName: string; clerkId: string };
}

export interface GrievanceListItem {
  id: string;
  rawText: string;
  category: string;
  urgency: string;
  status: string;
  statute: string;
  section: string;
  createdAt: string;
  officer: { id: string; name: string; designation: string };
  _count: { events: number };
}

export interface GrievanceListResponse {
  items: GrievanceListItem[];
  nextCursor?: string;
  hasNext: boolean;
}

export interface NearestPlace {
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance_km: number;
}

export interface SosTriggerResponse {
  tel: 'tel:112';
  broadcastedTo: number;
  places: {
    police: NearestPlace[];
    hospitals: NearestPlace[];
  };
}

export interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  relation: string | null;
}

export interface UserProfile {
  id: string;
  clerkId: string;
  fullName: string;
  phone: string | null;
  location: string | null;
  primaryPin: string | null;
  profileComplete: boolean;
}

export { CommunityGrievance };

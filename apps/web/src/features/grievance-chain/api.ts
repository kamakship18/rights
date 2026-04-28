/**
 * API client for the Chain service (port 4002).
 * Completely separate from the main NestJS API client.
 */

import type {
  CreateGrievancePayload,
  CreateGrievanceResult,
  GrievanceChainRecord,
  ChainStatus,
  ListResponse,
} from './types';

const CHAIN_URL =
  process.env.NEXT_PUBLIC_CHAIN_URL ?? 'http://localhost:4002';

class ChainApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ChainApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({ error: res.statusText }));
  if (!res.ok) {
    throw new ChainApiError(res.status, json?.error ?? `HTTP ${res.status}`);
  }
  return json as T;
}

/* ── Create ──────────────────────────────────────────────── */

export async function createChainGrievance(
  payload: CreateGrievancePayload,
): Promise<CreateGrievanceResult> {
  const form = new FormData();

  form.append('pin',         payload.pin);
  form.append('title',       payload.title);
  form.append('description', payload.description);
  if (payload.fullName) form.append('fullName',  payload.fullName);
  if (payload.location) form.append('location',  payload.location);

  payload.tags.forEach(t => form.append('tags', t));
  payload.rightsRegulations.forEach(r => form.append('rightsRegulations', r));
  (payload.files ?? []).forEach(f => form.append('files', f));

  const res = await fetch(`${CHAIN_URL}/api/grievance-chain`, {
    method: 'POST',
    body:   form,
  });
  return handleResponse<CreateGrievanceResult>(res);
}

/* ── List ────────────────────────────────────────────────── */

export async function listChainGrievances(
  page = 1,
  limit = 20,
): Promise<ListResponse> {
  const res = await fetch(
    `${CHAIN_URL}/api/grievance-chain?page=${page}&limit=${limit}`,
  );
  return handleResponse<ListResponse>(res);
}

/* ── Single ──────────────────────────────────────────────── */

export async function getChainGrievance(
  id: string,
): Promise<{ success: boolean; data: GrievanceChainRecord }> {
  const res = await fetch(`${CHAIN_URL}/api/grievance-chain/${encodeURIComponent(id)}`);
  return handleResponse(res);
}

/* ── Chain status ────────────────────────────────────────── */

export async function getChainStatus(): Promise<{ success: boolean; chain: ChainStatus }> {
  const res = await fetch(`${CHAIN_URL}/api/grievance-chain/chain-status`);
  return handleResponse(res);
}

/* ── Download ────────────────────────────────────────────── */

export function getDownloadUrl(id: string): string {
  return `${CHAIN_URL}/api/grievance-chain/${encodeURIComponent(id)}/download`;
}

export { ChainApiError };

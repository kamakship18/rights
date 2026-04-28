import type { PerformanceReport } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function fetchPerformanceReport(pin?: string): Promise<PerformanceReport> {
  const qs  = pin ? `?pin=${encodeURIComponent(pin)}` : '';
  const res = await fetch(`${API_URL}/performance${qs}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Performance API ${res.status}`);
  return res.json() as Promise<PerformanceReport>;
}

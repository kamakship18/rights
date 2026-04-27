/** Calendar delays (real prod). */
export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * X-Demo-Speed: fast — follow-up 30s after file, then escalation 60s after that (~90s total for all three).
 */
export const DEMO_FOLLOWUP_MS = 30_000;
export const DEMO_ESCALATION_AFTER_FOLLOWUP_MS = 60_000;

export function isDemoFast(d: string | null | undefined): boolean {
  return d === 'fast';
}

/** Time until 7d follow-up job (from file or from followed-up, depending on caller). */
export function getFirstFollowupDelayMs(demoSpeed: string | null | undefined): number {
  return isDemoFast(demoSpeed) ? DEMO_FOLLOWUP_MS : SEVEN_DAYS_MS;
}

/** Time after 7d follow until escalation job. */
export function getEscalationAfterFollowupDelayMs(demoSpeed: string | null | undefined): number {
  return isDemoFast(demoSpeed) ? DEMO_ESCALATION_AFTER_FOLLOWUP_MS : SEVEN_DAYS_MS;
}

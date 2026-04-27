/**
 * E.164 heuristics; Twilio needs +country format.
 * Default IN (+91) for 10-digit mobile numbers.
 */
export function toE164(raw: string): string {
  const t = raw.replace(/[\s-]/g, '');
  if (t.startsWith('+')) {
    return t;
  }
  if (/^91\d{10}$/.test(t)) {
    return `+${t}`;
  }
  if (/^\d{10}$/.test(t)) {
    return `+91${t}`;
  }
  return t.startsWith('+') ? t : `+${t}`;
}

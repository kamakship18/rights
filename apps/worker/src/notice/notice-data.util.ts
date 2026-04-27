import type { NoticeData } from '@repo/shared';
import type { Grievance, Officer, User } from '@repo/prisma';

const ANONYMOUS_SENDER = 'Filed via Citizen Platform (Anonymous)';

export function buildInitialNoticeData(
  g: Grievance & { officer: Officer; user: User },
): NoticeData {
  const isAnon = (g as any).isAnonymous === true;
  return {
    citizenName: isAnon ? ANONYMOUS_SENDER : g.user.fullName,
    statute: g.statute,
    section: g.section,
    factsBrief: isAnon
      ? `[Anonymous complaint] ${g.rawText}`
      : g.rawText,
    dateISO: new Date().toISOString().slice(0, 10),
    officerName: g.officer.name,
    officerDesignation: g.officer.designation,
    grievanceId: g.id,
    urgency: g.urgency,
    category: g.category,
    pin: g.pin,
    variant: 'initial',
  };
}

export function buildFollowupNoticeData(
  g: Grievance & { officer: Officer; user: User },
): NoticeData {
  const filed = g.filedAt ? g.filedAt.toISOString().slice(0, 10) : 'unknown';
  const isAnon = (g as any).isAnonymous === true;
  return {
    citizenName: isAnon ? ANONYMOUS_SENDER : g.user.fullName,
    statute: g.statute,
    section: g.section,
    factsBrief: `This is the automated 7-day follow-up for Grievance #${g.id} (filed ${filed} UTC). Original statement: ${g.rawText}`,
    dateISO: new Date().toISOString().slice(0, 10),
    officerName: g.officer.name,
    officerDesignation: g.officer.designation,
    grievanceId: g.id,
    urgency: g.urgency,
    category: g.category,
    pin: g.pin,
    variant: 'followup',
  };
}

export function buildEscalationNoticeData(
  g: Grievance & { officer: Officer; user: User },
): NoticeData {
  const isAnon = (g as any).isAnonymous === true;
  return {
    citizenName: isAnon ? ANONYMOUS_SENDER : g.user.fullName,
    statute: g.statute,
    section: g.section,
    factsBrief: `This is the 14-day escalation. The matter was previously filed and followed up under your office. Please treat this as a supervisory review. Original facts: ${g.rawText}`,
    dateISO: new Date().toISOString().slice(0, 10),
    officerName: g.officer.name,
    officerDesignation: g.officer.designation,
    grievanceId: g.id,
    urgency: g.urgency,
    category: g.category,
    pin: g.pin,
    variant: 'escalation',
  };
}

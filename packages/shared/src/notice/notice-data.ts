export type NoticeVariant = 'initial' | 'followup' | 'escalation';

export interface NoticeData {
  citizenName: string;
  statute: string;
  section: string;
  factsBrief: string;
  dateISO: string;
  officerName: string;
  officerDesignation: string;
  grievanceId: string;
  urgency: string;
  category: string;
  pin: string;
  /** Default initial (legal notice). */
  variant?: NoticeVariant;
}

export interface BuiltNotice {
  subject: string;
  html: string;
  text: string;
}

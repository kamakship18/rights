/**
 * NoticeBuilder — compiles Handlebars template into subject + html + text.
 * (Plain class — Nest apps can register with useFactory: () => new NoticeBuilder().)
 */
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import * as path from 'path';
import type { BuiltNotice, NoticeData, NoticeVariant } from './notice-data';

function loadTemplate(): string {
  const candidates = [
    path.join(__dirname, 'templates', 'notice.hbs'),
    path.resolve(
      process.cwd(),
      'packages',
      'shared',
      'src',
      'notice',
      'templates',
      'notice.hbs',
    ),
  ];
  for (const p of candidates) {
    try {
      return fs.readFileSync(p, 'utf-8');
    } catch {
      /* try next */
    }
  }
  throw new Error(`notice.hbs not found (candidates: ${candidates.join(', ')})`);
}

export { type BuiltNotice, type NoticeData, type NoticeVariant } from './notice-data';

export class NoticeBuilder {
  private template: Handlebars.TemplateDelegate;
  public readonly logger: { log: (m: string) => void } = {
    log: (m) => {
      if (process.env['NODE_ENV'] !== 'test') {
        // eslint-disable-next-line no-console
        console.log(`[NoticeBuilder] ${m}`);
      }
    },
  };

  constructor() {
    const raw = loadTemplate();
    this.template = Handlebars.compile(raw);
    this.logger.log('Notice template compiled');
  }

  build(data: NoticeData): BuiltNotice {
    const v: NoticeVariant = data.variant || 'initial';
    const urgencyLower = data.urgency.toLowerCase();
    const enrichedData = {
      ...data,
      urgencyLower,
      variant: v,
      isFollowup: v === 'followup',
      isEscalation: v === 'escalation',
    };
    const html = this.template(enrichedData);
    const tag =
      v === 'followup'
        ? 'SEVEN-DAY FOLLOW-UP (Persistence Bot)'
        : v === 'escalation'
          ? '14-DAY ESCALATION (Persistence Bot)'
          : 'LEGAL NOTICE';

    const text = [
      `${tag} — ${data.statute}, ${data.section}`,
      `Date: ${data.dateISO}`,
      `To: ${data.officerName}, ${data.officerDesignation}`,
      `From: ${data.citizenName} (via Actionable Justice OS)`,
      `Grievance ID: ${data.grievanceId}`,
      `Urgency: ${data.urgency}`,
      '',
      `Dear ${data.officerName},`,
      '',
      `I am writing to bring to your notice the following matter under your jurisdiction (PIN: ${data.pin}).`,
      '',
      'Statement of Facts:',
      data.factsBrief,
      '',
      `Applicable Law: ${data.statute} — ${data.section}`,
      '',
      'I request you to take cognizance of the above facts and initiate appropriate action.',
      '',
      `Yours faithfully,`,
      data.citizenName,
      'Sent via Actionable Justice OS',
    ].join('\n');

    const subject = this.buildSubject(v, data);

    return { subject, html, text };
  }

  private buildSubject(v: NoticeVariant, data: NoticeData): string {
    if (v === 'followup') {
      return `7-Day Follow-up: ${data.statute} — ${data.section} [${data.urgency}] (Ref: ${data.grievanceId})`;
    }
    if (v === 'escalation') {
      return `14-Day Escalation: ${data.statute} — ${data.section} [${data.urgency}] (Ref: ${data.grievanceId})`;
    }
    return `Legal Notice: ${data.statute} — ${data.section} [${data.urgency}]`;
  }
}

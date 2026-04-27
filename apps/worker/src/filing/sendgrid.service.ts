/**
 * SendGridService — same behaviour as API (3 internal retries, then return failure)
 * so the Bull job can re-run with its own backoff.
 */
import { Injectable, Logger } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import type { SendEmailParams, SendResult } from '@repo/shared';

@Injectable()
export class SendGridService {
  private readonly logger = new Logger(SendGridService.name);
  private readonly fromEmail: string;
  private readonly configured: boolean;

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY || '';
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@actionablejustice.dev';
    this.configured = !!apiKey;
    if (this.configured) {
      sgMail.setApiKey(apiKey);
    }
  }

  async send(params: SendEmailParams): Promise<SendResult> {
    const maxRetries = 3;
    let lastError = '';
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (!this.configured) {
          this.logger.log(
            `[DEV] email — subject: "${params.subject}", id: ${params.idempotencyKey}`,
          );
          return { success: true, attempts: attempt };
        }
        const msg: sgMail.MailDataRequired = {
          to: params.to,
          from: this.fromEmail,
          subject: params.subject,
          html: params.html,
          text: params.text,
          customArgs: { idempotencyKey: params.idempotencyKey },
        };
        if (params.cc) {
          msg.cc = params.cc;
        }
        await sgMail.send(msg);
        this.logger.log(`email ok — id: ${params.idempotencyKey}, attempt: ${attempt}`);
        return { success: true, attempts: attempt };
      } catch (err: unknown) {
        const e = err as { message?: string; code?: number; response?: { statusCode?: number } };
        lastError = e?.message || 'Unknown';
        const statusCode = e?.code || e?.response?.statusCode;
        if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
          this.logger.error(`permanent email failure ${statusCode} — ${params.idempotencyKey}`);
          return { success: false, error: lastError, attempts: attempt };
        }
        this.logger.warn(`email try ${attempt}/${maxRetries} failed — ${params.idempotencyKey}`);
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }
    this.logger.error(`email failed after ${maxRetries} — ${params.idempotencyKey}`);
    return { success: false, error: lastError, attempts: maxRetries };
  }
}

/**
 * SendGridService — email delivery with retries and idempotency.
 *
 * Retries: 3 attempts with exponential backoff.
 * On permanent failure: logs error (never crashes the request).
 * PII: Never logs email addresses at info level.
 */
import { Injectable, Logger } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import type { SendEmailParams, SendResult } from '@repo/shared';

export type { SendEmailParams, SendResult };

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
      this.logger.log('SendGrid configured');
    } else {
      this.logger.warn('SENDGRID_API_KEY not set — emails will be logged only');
    }
  }

  async send(params: SendEmailParams): Promise<SendResult> {
    const maxRetries = 3;
    let lastError = '';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (!this.configured) {
          // Dev mode: log the email instead of sending
          this.logger.log(
            `[DEV] Email would be sent — subject: "${params.subject}", idempotency: ${params.idempotencyKey}`,
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
        this.logger.log(
          `Email sent — idempotency: ${params.idempotencyKey}, attempt: ${attempt}`,
        );
        return { success: true, attempts: attempt };
      } catch (err: any) {
        lastError = err?.message || 'Unknown error';
        const statusCode = err?.code || err?.response?.statusCode;

        // Don't retry on 4xx (client errors) except 429 (rate limit)
        if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
          this.logger.error(
            `Email permanent failure (${statusCode}) — idempotency: ${params.idempotencyKey}`,
          );
          return { success: false, error: lastError, attempts: attempt };
        }

        this.logger.warn(
          `Email attempt ${attempt}/${maxRetries} failed — idempotency: ${params.idempotencyKey}`,
        );

        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    this.logger.error(
      `Email failed after ${maxRetries} attempts — idempotency: ${params.idempotencyKey}`,
    );
    return { success: false, error: lastError, attempts: maxRetries };
  }
}

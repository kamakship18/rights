/**
 * Twilio SMS + WhatsApp — 1.5s per outbound; logs errors without PII in production-style messages.
 * If credentials missing, no-ops (local dev without Twilio).
 */
import { Injectable, Logger } from '@nestjs/common';
import twilio, { type Twilio } from 'twilio';
import { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message';

const OP_TIMEOUT_MS = 1500;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

@Injectable()
export class TwilioSosClient {
  private readonly logger = new Logger(TwilioSosClient.name);
  private client: Twilio | null;
  private readonly fromSms: string;
  private readonly fromWa: string;

  constructor() {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    this.fromSms = process.env.TWILIO_FROM_SMS || '';
    this.fromWa = process.env.TWILIO_FROM_WHATSAPP || '';
    this.client = sid && token ? twilio(sid, token) : null;
    if (!this.client) {
      this.logger.warn('Twilio not configured (SID/token) — messages will be skipped in dev');
    } else {
      this.logger.log('Twilio client ready (SMS + WhatsApp)');
    }
  }

  async sendSms(
    toE164: string,
    body: string,
  ): Promise<{ ok: true; sid?: string } | { ok: false; error: string }> {
    if (!this.client || !this.fromSms) {
      this.logger.log(`[DEV] skip SMS (Twilio or FROM_SMS not set)`);
      return { ok: true, sid: 'dev' };
    }
    const op = this.client!.messages
      .create({ from: this.fromSms, to: toE164, body })
      .then(
        (m: MessageInstance) => ({ ok: true as const, sid: m.sid }),
        (e: { message: string }) => {
          this.logger.error(`Twilio SMS failed: ${e.message}`);
          return { ok: false as const, error: e.message };
        },
      ) as Promise<{ ok: true; sid?: string } | { ok: false; error: string }>;
    try {
      return await withTimeout(op, OP_TIMEOUT_MS);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown';
      if (msg === 'timeout') {
        this.logger.warn(`Twilio SMS op exceeded ${OP_TIMEOUT_MS}ms`);
        return { ok: false, error: 'timeout' };
      }
      this.logger.error(`Twilio SMS unexpected: ${msg}`);
      return { ok: false, error: msg };
    }
  }

  async sendWhatsapp(
    toE164: string,
    body: string,
  ): Promise<{ ok: true; sid?: string } | { ok: false; error: string }> {
    if (!this.client || !this.fromWa) {
      this.logger.log(`[DEV] skip WA (WhatsApp from number not set)`);
      return { ok: true, sid: 'dev' };
    }
    const op = this.client!.messages
      .create({ from: `whatsapp:${this.fromWa}`, to: `whatsapp:${toE164}`, body })
      .then(
        (m: MessageInstance) => ({ ok: true as const, sid: m.sid }),
        (e: { message: string }) => {
          this.logger.error(`Twilio WA failed: ${e.message}`);
          return { ok: false as const, error: e.message };
        },
      ) as Promise<{ ok: true; sid?: string } | { ok: false; error: string }>;
    try {
      return await withTimeout(op, OP_TIMEOUT_MS);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown';
      if (msg === 'timeout') {
        this.logger.warn(`Twilio WA op exceeded ${OP_TIMEOUT_MS}ms`);
        return { ok: false, error: 'timeout' };
      }
      this.logger.error(`Twilio WA unexpected: ${msg}`);
      return { ok: false, error: msg };
    }
  }
}

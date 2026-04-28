/**
 * AI Service client — wraps HTTP calls to the FastAPI AI service.
 */
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface TriageResult {
  urgency: 'CRITICAL' | 'HIGH' | 'NORMAL';
  category: string;
  confidence: number;
  reasoning: string;
}

export interface Citation {
  source: string;
  snippet: string;
  url: string;
}

export interface StatuteResult {
  statute: string;
  section: string;
  citations: Citation[];
  confidence: number;
  needs_lawyer_review: boolean;
  reasoning: string;
}

export interface OfficerResult {
  officer: {
    id: string;
    name: string;
    designation: string;
    department: string;
    jurisdiction_pin: string;
    email: string;
  };
  parent: {
    id: string;
    name: string;
    designation: string;
    department: string;
    jurisdiction_pin: string;
    email: string;
  } | null;
  source: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: AxiosInstance;

  constructor() {
    const baseURL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    this.client = axios.create({ baseURL, timeout: 60_000 });
    this.logger.log(`AI service configured: ${baseURL}`);
  }

  async triage(text: string, lang?: string): Promise<TriageResult> {
    const { data } = await this.client.post<TriageResult>('/triage', { text, lang });
    return data;
  }

  async mapStatute(text: string, category: string): Promise<StatuteResult> {
    const { data } = await this.client.post<StatuteResult>('/map-statute', { text, category });
    return data;
  }

  async findOfficer(pin: string, category: string): Promise<OfficerResult> {
    const { data } = await this.client.post<OfficerResult>('/find-officer', { pin, category });
    return data;
  }
}

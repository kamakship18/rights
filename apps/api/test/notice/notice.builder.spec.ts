/**
 * Unit tests for NoticeBuilder.build()
 *
 * Verifies:
 * - Correct subject line format
 * - HTML output contains all required placeholders
 * - Plain text fallback is well-formed
 * - Urgency class is applied correctly
 */
import { NoticeBuilder } from '../../src/modules/notice/notice.builder';
import type { NoticeData } from '@repo/shared';

describe('NoticeBuilder', () => {
  let builder: NoticeBuilder;

  const sampleData: NoticeData = {
    citizenName: 'Demo Citizen',
    statute: 'Noise Pollution (Regulation and Control) Rules, 2000',
    section: 'Rule 5 — Restrictions on the use of loudspeakers',
    factsBrief: 'Loud DJ next door at 1am every weekend for the past month.',
    dateISO: '2026-04-26',
    officerName: 'Sh. A.K. Verma, IPS',
    officerDesignation: 'DCP North District',
    grievanceId: 'grievance_test_001',
    urgency: 'HIGH',
    category: 'noise',
    pin: '110001',
  };

  beforeAll(() => {
    builder = new NoticeBuilder();
  });

  describe('build()', () => {
    it('should return an object with subject, html, and text', () => {
      const result = builder.build(sampleData);

      expect(result).toHaveProperty('subject');
      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('text');
    });

    it('should produce a subject line with statute, section, and urgency', () => {
      const result = builder.build(sampleData);

      expect(result.subject).toContain('Noise Pollution');
      expect(result.subject).toContain('Rule 5');
      expect(result.subject).toContain('HIGH');
    });

    it('should produce HTML containing the citizen name', () => {
      const result = builder.build(sampleData);

      expect(result.html).toContain('Demo Citizen');
    });

    it('should produce HTML containing the officer name and designation', () => {
      const result = builder.build(sampleData);

      expect(result.html).toContain('Sh. A.K. Verma, IPS');
      expect(result.html).toContain('DCP North District');
    });

    it('should produce HTML containing the facts brief', () => {
      const result = builder.build(sampleData);

      expect(result.html).toContain('Loud DJ next door at 1am');
    });

    it('should produce HTML containing the statute and section', () => {
      const result = builder.build(sampleData);

      expect(result.html).toContain('Noise Pollution (Regulation and Control) Rules, 2000');
      expect(result.html).toContain('Rule 5');
    });

    it('should produce HTML containing the date and grievance ID', () => {
      const result = builder.build(sampleData);

      expect(result.html).toContain('2026-04-26');
      expect(result.html).toContain('grievance_test_001');
    });

    it('should apply the correct urgency CSS class (high)', () => {
      const result = builder.build(sampleData);

      expect(result.html).toContain('urgency-high');
    });

    it('should apply urgency-critical class for CRITICAL urgency', () => {
      const result = builder.build({ ...sampleData, urgency: 'CRITICAL' });

      expect(result.html).toContain('urgency-critical');
    });

    it('should produce plain text containing all key information', () => {
      const result = builder.build(sampleData);

      expect(result.text).toContain('LEGAL NOTICE');
      expect(result.text).toContain('Demo Citizen');
      expect(result.text).toContain('Sh. A.K. Verma, IPS');
      expect(result.text).toContain('Noise Pollution');
      expect(result.text).toContain('Statement of Facts');
      expect(result.text).toContain('Loud DJ next door at 1am');
      expect(result.text).toContain('110001');
    });

    it('should include the PIN in the body text', () => {
      const result = builder.build(sampleData);

      expect(result.html).toContain('110001');
      expect(result.text).toContain('110001');
    });

    it('should include Actionable Justice OS branding', () => {
      const result = builder.build(sampleData);

      expect(result.html).toContain('Actionable Justice OS');
      expect(result.text).toContain('Actionable Justice OS');
    });
  });
});

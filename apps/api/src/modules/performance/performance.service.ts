/**
 * PerformanceService — aggregates grievance statistics by officer and PIN.
 *
 * All queries run without auth: this is public accountability data.
 *
 * Rating tiers:
 *   90–100% → 5 stars  (Excellent)
 *   75–89%  → 4 stars  (Good)
 *   50–74%  → 3 stars  (Average)
 *   25–49%  → 2 stars  (Below average)
 *   0–24%   → 1 star   (Poor)
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

export interface OfficerPerformance {
  id: string;
  name: string;
  designation: string;
  department: string;
  jurisdictionPin: string;
  totalCases: number;
  resolvedCases: number;
  pendingCases: number;
  activeCases: number;     // filed + followed_up + escalated
  successRate: number;     // 0–100
  rating: number;          // 1–5
  ratingLabel: string;
  tier: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
}

export interface LocalityPerformance {
  pin: string;
  totalCases: number;
  resolvedCases: number;
  pendingCases: number;
  activeCases: number;
  successRate: number;
  rating: number;
  ratingLabel: string;
  tier: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
  officerCount: number;
  topOfficer?: { name: string; designation: string; successRate: number } | null;
}

export interface PerformanceSummary {
  totalOfficers: number;
  totalGrievances: number;
  totalResolved: number;
  totalPending: number;
  overallSuccessRate: number;
}

export interface PerformanceReport {
  summary:          PerformanceSummary;
  officers:         OfficerPerformance[];   // sorted by successRate desc
  localities:       LocalityPerformance[];  // sorted by successRate desc
  topOfficers:      OfficerPerformance[];   // top 5
  bottomOfficers:   OfficerPerformance[];   // bottom 5 (with ≥3 cases)
  topLocalities:    LocalityPerformance[];  // top 5
  bottomLocalities: LocalityPerformance[];  // bottom 5
}

@Injectable()
export class PerformanceService {
  constructor(private readonly prisma: PrismaService) {}

  /* ── Rating helpers ───────────────────────────────────────── */

  private rate(pct: number): { rating: number; ratingLabel: string; tier: OfficerPerformance['tier'] } {
    if (pct >= 90) return { rating: 5, ratingLabel: '⭐⭐⭐⭐⭐', tier: 'excellent' };
    if (pct >= 75) return { rating: 4, ratingLabel: '⭐⭐⭐⭐',   tier: 'good' };
    if (pct >= 50) return { rating: 3, ratingLabel: '⭐⭐⭐',     tier: 'average' };
    if (pct >= 25) return { rating: 2, ratingLabel: '⭐⭐',       tier: 'below_average' };
    return         { rating: 1, ratingLabel: '⭐',         tier: 'poor' };
  }

  /* ── Main report ──────────────────────────────────────────── */

  async getReport(filterPin?: string): Promise<PerformanceReport> {
    const pinWhere = filterPin ? { pin: filterPin } : {};

    // ── Officer base data ────────────────────────────────────
    const officers = await this.prisma.officer.findMany({
      where: filterPin ? { jurisdictionPin: filterPin } : undefined,
      orderBy: { createdAt: 'asc' },
    });

    // ── Grievance counts (two groupBy queries merged in-code) ─
    const [totalByOfficer, resolvedByOfficer, byStatusByOfficer] = await Promise.all([
      this.prisma.grievance.groupBy({
        by: ['officerId'],
        _count: { _all: true },
        where: pinWhere,
      }),
      this.prisma.grievance.groupBy({
        by: ['officerId'],
        _count: { _all: true },
        where: { status: 'RESOLVED', ...pinWhere },
      }),
      this.prisma.grievance.groupBy({
        by: ['officerId', 'status'],
        _count: { _all: true },
        where: pinWhere,
      }),
    ]);

    const totalMap    = new Map(totalByOfficer.map(r => [r.officerId, r._count._all]));
    const resolvedMap = new Map(resolvedByOfficer.map(r => [r.officerId, r._count._all]));

    // Count "active" (filed + followed_up + escalated) per officer
    const activeMap = new Map<string, number>();
    const ACTIVE_STATUSES = new Set(['FILED', 'FOLLOWED_UP', 'ESCALATED']);
    for (const row of byStatusByOfficer) {
      if (ACTIVE_STATUSES.has(row.status)) {
        activeMap.set(row.officerId, (activeMap.get(row.officerId) ?? 0) + row._count._all);
      }
    }

    // Build officer performance array (only officers with at least 1 grievance)
    const officerPerfs: OfficerPerformance[] = officers
      .filter(o => totalMap.has(o.id))
      .map(o => {
        const total    = totalMap.get(o.id)    ?? 0;
        const resolved = resolvedMap.get(o.id) ?? 0;
        const active   = activeMap.get(o.id)   ?? 0;
        const pending  = total - resolved - active;
        const pct      = total > 0 ? Math.round((resolved / total) * 100) : 0;
        return {
          id:              o.id,
          name:            o.name,
          designation:     o.designation,
          department:      o.department,
          jurisdictionPin: o.jurisdictionPin,
          totalCases:      total,
          resolvedCases:   resolved,
          pendingCases:    Math.max(0, pending),
          activeCases:     active,
          successRate:     pct,
          ...this.rate(pct),
        };
      })
      .sort((a, b) => b.successRate - a.successRate || b.totalCases - a.totalCases);

    // ── Locality stats ───────────────────────────────────────
    const [totalByPin, resolvedByPin, activeByPin, officersByPin] = await Promise.all([
      this.prisma.grievance.groupBy({ by: ['pin'], _count: { _all: true } }),
      this.prisma.grievance.groupBy({ by: ['pin'], _count: { _all: true }, where: { status: 'RESOLVED' } }),
      this.prisma.grievance.groupBy({
        by: ['pin'], _count: { _all: true },
        where: { status: { in: ['FILED', 'FOLLOWED_UP', 'ESCALATED'] } },
      }),
      this.prisma.officer.groupBy({ by: ['jurisdictionPin'], _count: { _all: true } }),
    ]);

    const resolvedPinMap = new Map(resolvedByPin.map(r => [r.pin, r._count._all]));
    const activePinMap   = new Map(activeByPin.map(r => [r.pin, r._count._all]));
    const officerPinMap  = new Map(officersByPin.map(r => [r.jurisdictionPin, r._count._all]));

    // Best officer per PIN (from already-sorted officerPerfs)
    const topOfficerByPin = new Map<string, { name: string; designation: string; successRate: number }>();
    for (const p of officerPerfs) {
      if (!topOfficerByPin.has(p.jurisdictionPin)) {
        topOfficerByPin.set(p.jurisdictionPin, {
          name: p.name, designation: p.designation, successRate: p.successRate,
        });
      }
    }

    const localityPerfs: LocalityPerformance[] = totalByPin
      .map(r => {
        const total    = r._count._all;
        const resolved = resolvedPinMap.get(r.pin) ?? 0;
        const active   = activePinMap.get(r.pin)   ?? 0;
        const pending  = Math.max(0, total - resolved - active);
        const pct      = total > 0 ? Math.round((resolved / total) * 100) : 0;
        return {
          pin:          r.pin,
          totalCases:   total,
          resolvedCases: resolved,
          pendingCases:  pending,
          activeCases:   active,
          successRate:   pct,
          ...this.rate(pct),
          officerCount:  officerPinMap.get(r.pin) ?? 0,
          topOfficer:    topOfficerByPin.get(r.pin) ?? null,
        };
      })
      .sort((a, b) => b.successRate - a.successRate || b.totalCases - a.totalCases);

    // ── Summary ──────────────────────────────────────────────
    const totalGrievances = totalByPin.reduce((s, r) => s + r._count._all, 0);
    const totalResolved   = resolvedByPin.reduce((s, r) => s + r._count._all, 0);
    const totalActive     = activeByPin.reduce((s, r) => s + r._count._all, 0);

    const summary: PerformanceSummary = {
      totalOfficers:      officerPerfs.length,
      totalGrievances,
      totalResolved,
      totalPending:       Math.max(0, totalGrievances - totalResolved - totalActive),
      overallSuccessRate: totalGrievances > 0
        ? Math.round((totalResolved / totalGrievances) * 100)
        : 0,
    };

    // Only include officers with ≥3 cases in "bottom" to avoid noise
    const bottomCandidates = officerPerfs.filter(o => o.totalCases >= 3);

    return {
      summary,
      officers:         officerPerfs,
      localities:       localityPerfs,
      topOfficers:      officerPerfs.slice(0, 5),
      bottomOfficers:   [...bottomCandidates].reverse().slice(0, 5),
      topLocalities:    localityPerfs.slice(0, 5),
      bottomLocalities: [...localityPerfs].reverse().slice(0, 5),
    };
  }
}

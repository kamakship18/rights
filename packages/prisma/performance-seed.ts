/**
 * Performance Dashboard Seed
 *
 * Adds 10 nodal officers across 6 Indian cities and ~90 grievances
 * with deliberately varied resolutions to power a meaningful leaderboard.
 *
 * Run: pnpm db:seed:perf
 * Safe to re-run: all records use deterministic IDs + upsert.
 */

import {
  PrismaClient,
  Urgency,
  GrievanceStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

// ─── Config ──────────────────────────────────────────────
const DEMO_EMAIL = process.env.DEMO_OFFICER_EMAIL || 'team@actionablejustice.dev';

// Officer seeding helpers
interface OfficerDef {
  id: string;
  name: string;
  designation: string;
  department: string;
  pin: string;
  email?: string;
}

interface GrievanceDef {
  id: string;
  userId: string;
  officerId: string;
  rawText: string;
  category: string;
  urgency: Urgency;
  statute: string;
  section: string;
  status: GrievanceStatus;
  pin: string;
  filedAt?: Date;
  resolvedAt?: Date;
}

// ─── Officers ─────────────────────────────────────────────

const OFFICERS: OfficerDef[] = [
  // Delhi — 110001 (supplements existing 3 from main seed)
  {
    id: 'perf_officer_delhi_1',
    name: 'Dr. Priya Nair, IPS',
    designation: 'Deputy Commissioner of Police',
    department: 'Delhi Police',
    pin: '110001',
  },

  // Mumbai — 400001 (high performer + low performer)
  {
    id: 'perf_officer_mumbai_1',
    name: 'Smt. Anita Desai, IPS',
    designation: 'Commissioner of Police',
    department: 'Mumbai Police',
    pin: '400001',
  },
  {
    id: 'perf_officer_mumbai_2',
    name: 'Sh. Ravi Patil',
    designation: 'Sub-Inspector',
    department: 'Mumbai Police',
    pin: '400001',
  },

  // Bangalore — 560001 (high performer)
  {
    id: 'perf_officer_blr_1',
    name: 'Dr. Kavitha Reddy, IPS',
    designation: 'Commissioner of Police',
    department: 'Bengaluru City Police',
    pin: '560001',
  },
  {
    id: 'perf_officer_blr_2',
    name: 'Sh. Suresh Gowda',
    designation: 'Assistant Commissioner',
    department: 'Bengaluru City Police',
    pin: '560001',
  },

  // Chennai — 600001 (medium performer)
  {
    id: 'perf_officer_chn_1',
    name: 'Sh. Murugan Pandian, IPS',
    designation: 'Commissioner of Police',
    department: 'Chennai City Police',
    pin: '600001',
  },
  {
    id: 'perf_officer_chn_2',
    name: 'Smt. Lakshmi Devi',
    designation: 'Deputy Commissioner',
    department: 'Chennai City Police',
    pin: '600001',
  },

  // Kolkata — 700001 (high performer)
  {
    id: 'perf_officer_kol_1',
    name: 'Sh. Arnab Bose, IPS',
    designation: 'Commissioner of Police',
    department: 'Kolkata Police',
    pin: '700001',
  },

  // Hyderabad — 500001 (medium performer)
  {
    id: 'perf_officer_hyd_1',
    name: 'Sh. Srinivas Rao, IPS',
    designation: 'Commissioner of Police',
    department: 'Hyderabad City Police',
    pin: '500001',
  },

  // Jaipur — 302001 (low performer)
  {
    id: 'perf_officer_jpr_1',
    name: 'Sh. Mahesh Choudhary',
    designation: 'Deputy Superintendent',
    department: 'Rajasthan Police',
    pin: '302001',
  },
];

// ─── Grievance template factory ───────────────────────────

function griev(
  id: string,
  officerId: string,
  userId: string,
  pin: string,
  status: GrievanceStatus,
  category: string,
  urgency: Urgency,
  daysSinceCreated = 10,
): GrievanceDef {
  const TEXTS: Record<string, string> = {
    noise:       'Loudspeaker used after 10 PM near my house causing disturbance.',
    harassment:  'Facing workplace harassment by a colleague repeatedly.',
    electricity: 'Electricity meter showing incorrect readings for past 2 months.',
    municipal:   'Garbage not collected from my street for over 2 weeks.',
    roads:       'Large pothole on main road causing accidents and vehicle damage.',
    consumer:    'Received defective product; seller refusing refund.',
    water:       'Contaminated water supply from municipal tap for 5 days.',
    stalking:    'Unknown person following me to work every morning.',
    environment: 'Illegal factory dumping waste into nearby river affecting residents.',
    corruption:  'Bribe demanded for basic government service renewal.',
  };

  const STATUTES: Record<string, [string, string]> = {
    noise:       ['Noise Pollution Rules, 2000', 'Rule 5'],
    harassment:  ['Indian Penal Code (BNS)', 'Section 354A'],
    electricity: ['Electricity Act, 2003', 'Section 135'],
    municipal:   ['Solid Waste Management Rules, 2016', 'Rule 15'],
    roads:       ['Motor Vehicles Act, 1988', 'Section 116'],
    consumer:    ['Consumer Protection Act, 2019', 'Section 35'],
    water:       ['Environment Protection Act, 1986', 'Section 5'],
    stalking:    ['Indian Penal Code (BNS)', 'Section 354D'],
    environment: ['Environment Protection Act, 1986', 'Section 7'],
    corruption:  ['Prevention of Corruption Act, 1988', 'Section 7'],
  };

  const created = new Date(Date.now() - daysSinceCreated * 24 * 60 * 60 * 1000);
  const filed   = new Date(created.getTime() + 2 * 60 * 1000);
  const resolved = status === 'RESOLVED'
    ? new Date(created.getTime() + 5 * 24 * 60 * 60 * 1000)
    : undefined;

  const [statute, section] = STATUTES[category] ?? ['General Law', 'Section 1'];

  return {
    id,
    userId,
    officerId,
    rawText: TEXTS[category] ?? 'Grievance filed by citizen.',
    category,
    urgency,
    statute,
    section,
    status,
    pin,
    filedAt:    status !== 'PENDING' ? filed : undefined,
    resolvedAt: resolved,
  };
}

// User IDs for demo (reuse existing demo user + create new ones)
const DEMO_USER_ID = 'user_demo_kamakshi'; // from main seed

// Create a few extra demo users for variety
const PERF_USERS = [
  { id: 'perf_user_1', clerkId: 'perf_clerk_1', fullName: 'Rahul Mehta', pin: '110001' },
  { id: 'perf_user_2', clerkId: 'perf_clerk_2', fullName: 'Sunita Joshi', pin: '400001' },
  { id: 'perf_user_3', clerkId: 'perf_clerk_3', fullName: 'Vikram Bose', pin: '560001' },
  { id: 'perf_user_4', clerkId: 'perf_clerk_4', fullName: 'Meena Rajan', pin: '600001' },
  { id: 'perf_user_5', clerkId: 'perf_clerk_5', fullName: 'Arnab Das', pin: '700001' },
];

async function main() {
  console.log('\n🌱 Performance seed starting…\n');

  // ── Seed extra users ─────────────────────────────────────
  for (const u of PERF_USERS) {
    await prisma.user.upsert({
      where:  { id: u.id },
      update: {},
      create: { id: u.id, clerkId: u.clerkId, fullName: u.fullName, primaryPin: u.pin },
    });
  }
  console.log(`  ✅ ${PERF_USERS.length} demo users ready`);

  // ── Seed officers ─────────────────────────────────────────
  for (const o of OFFICERS) {
    await prisma.officer.upsert({
      where:  { id: o.id },
      update: {},
      create: {
        id:              o.id,
        name:            o.name,
        designation:     o.designation,
        department:      o.department,
        jurisdictionPin: o.pin,
        email:           o.email ?? DEMO_EMAIL,
      },
    });
    console.log(`  ✅ Officer: ${o.name} — ${o.pin}`);
  }

  // ── Grievance batches ──────────────────────────────────────
  // Designed to give each officer a distinct "tier" of performance

  const grievances: GrievanceDef[] = [
    // ── Delhi (110001) — perf_officer_delhi_1
    // 16 total, 14 resolved → 87% → 4 stars
    ...['R','R','R','R','R','R','R','R','R','R','R','R','R','R','F','P'].map((s, i) => {
      const cats = ['noise','roads','electricity','municipal','harassment','consumer','water','stalking'];
      const ugs:  Urgency[] = ['NORMAL','HIGH','CRITICAL','NORMAL','HIGH','NORMAL','HIGH','CRITICAL'];
      return griev(
        `perf_grv_del_${i}`, 'perf_officer_delhi_1', DEMO_USER_ID, '110001',
        (s === 'R' ? 'RESOLVED' : s === 'F' ? 'FILED' : 'PENDING') as GrievanceStatus,
        cats[i % cats.length], ugs[i % ugs.length], 30 - i,
      );
    }),

    // ── Mumbai (400001) — perf_officer_mumbai_1 — HIGH performer
    // 22 total, 20 resolved → 91% → 5 stars
    ...['R','R','R','R','R','R','R','R','R','R','R','R','R','R','R','R','R','R','R','R','P','F'].map((s, i) => {
      const cats = ['municipal','consumer','electricity','roads','noise','water','harassment','environment'];
      const ugs:  Urgency[] = ['HIGH','NORMAL','NORMAL','CRITICAL','NORMAL','HIGH','CRITICAL','NORMAL'];
      return griev(
        `perf_grv_mum1_${i}`, 'perf_officer_mumbai_1', 'perf_user_2', '400001',
        (s === 'R' ? 'RESOLVED' : s === 'F' ? 'FILED' : 'PENDING') as GrievanceStatus,
        cats[i % cats.length], ugs[i % ugs.length], 45 - i,
      );
    }),

    // ── Mumbai (400001) — perf_officer_mumbai_2 — LOW performer
    // 14 total, 3 resolved → 21% → 1 star
    ...['R','R','R','F','F','P','P','P','P','P','P','F','P','ESCALATED'].map((s, i) => {
      const cats = ['noise','harassment','roads','municipal','consumer'];
      return griev(
        `perf_grv_mum2_${i}`, 'perf_officer_mumbai_2', 'perf_user_2', '400001',
        (s === 'R' ? 'RESOLVED' : s === 'ESCALATED' ? 'ESCALATED' : s === 'F' ? 'FILED' : 'PENDING') as GrievanceStatus,
        cats[i % cats.length], 'NORMAL', 20 - i,
      );
    }),

    // ── Bangalore (560001) — perf_officer_blr_1 — TOP performer
    // 20 total, 19 resolved → 95% → 5 stars
    ...Array.from({ length: 20 }, (_, i) => {
      const cats = ['municipal','roads','electricity','consumer','water'];
      return griev(
        `perf_grv_blr1_${i}`, 'perf_officer_blr_1', 'perf_user_3', '560001',
        i < 19 ? 'RESOLVED' : 'FILED' as GrievanceStatus,
        cats[i % cats.length], 'NORMAL', 60 - i,
      );
    }),

    // ── Bangalore (560001) — perf_officer_blr_2 — MEDIUM
    // 15 total, 9 resolved → 60% → 3 stars
    ...Array.from({ length: 15 }, (_, i) => {
      const cats = ['noise','harassment','electricity','roads','municipal'];
      const ugs: Urgency[] = ['HIGH','NORMAL','CRITICAL','NORMAL','HIGH'];
      return griev(
        `perf_grv_blr2_${i}`, 'perf_officer_blr_2', 'perf_user_3', '560001',
        i < 9 ? 'RESOLVED' : 'FOLLOWED_UP' as GrievanceStatus,
        cats[i % cats.length], ugs[i % ugs.length], 40 - i,
      );
    }),

    // ── Chennai (600001) — perf_officer_chn_1 — MEDIUM-LOW
    // 18 total, 7 resolved → 39% → 2 stars
    ...Array.from({ length: 18 }, (_, i) => {
      const cats = ['noise','electricity','roads','municipal','water','consumer'];
      return griev(
        `perf_grv_chn1_${i}`, 'perf_officer_chn_1', 'perf_user_4', '600001',
        i < 7 ? 'RESOLVED' : i < 12 ? 'FILED' : 'ESCALATED' as GrievanceStatus,
        cats[i % cats.length], 'HIGH', 35 - i,
      );
    }),

    // ── Chennai (600001) — perf_officer_chn_2 — MEDIUM
    // 12 total, 7 resolved → 58% → 3 stars
    ...Array.from({ length: 12 }, (_, i) => {
      const cats = ['harassment','consumer','corruption','noise','roads'];
      const ugs: Urgency[] = ['HIGH','NORMAL','CRITICAL'];
      return griev(
        `perf_grv_chn2_${i}`, 'perf_officer_chn_2', 'perf_user_4', '600001',
        i < 7 ? 'RESOLVED' : 'PENDING' as GrievanceStatus,
        cats[i % cats.length], ugs[i % ugs.length], 28 - i,
      );
    }),

    // ── Kolkata (700001) — perf_officer_kol_1 — HIGH performer
    // 10 total, 9 resolved → 90% → 5 stars
    ...Array.from({ length: 10 }, (_, i) => {
      const cats = ['municipal','roads','electricity','noise','consumer'];
      return griev(
        `perf_grv_kol_${i}`, 'perf_officer_kol_1', 'perf_user_5', '700001',
        i < 9 ? 'RESOLVED' : 'PENDING' as GrievanceStatus,
        cats[i % cats.length], 'NORMAL', 50 - i,
      );
    }),

    // ── Hyderabad (500001) — perf_officer_hyd_1 — MEDIUM-HIGH
    // 14 total, 10 resolved → 71% → 3 stars
    ...Array.from({ length: 14 }, (_, i) => {
      const cats = ['noise','electricity','water','roads','consumer','environment'];
      const ugs: Urgency[] = ['NORMAL','HIGH','NORMAL'];
      return griev(
        `perf_grv_hyd_${i}`, 'perf_officer_hyd_1', DEMO_USER_ID, '500001',
        i < 10 ? 'RESOLVED' : 'FILED' as GrievanceStatus,
        cats[i % cats.length], ugs[i % ugs.length], 25 - i,
      );
    }),

    // ── Jaipur (302001) — perf_officer_jpr_1 — LOW performer
    // 12 total, 2 resolved → 17% → 1 star
    ...Array.from({ length: 12 }, (_, i) => {
      const cats = ['roads','municipal','water','corruption','electricity'];
      return griev(
        `perf_grv_jpr_${i}`, 'perf_officer_jpr_1', DEMO_USER_ID, '302001',
        i < 2 ? 'RESOLVED' : i < 5 ? 'ESCALATED' : 'FILED' as GrievanceStatus,
        cats[i % cats.length], 'NORMAL', 15 - i,
      );
    }),
  ];

  // ── Upsert all grievances ─────────────────────────────────
  let n = 0;
  for (const g of grievances) {
    await prisma.grievance.upsert({
      where:  { id: g.id },
      update: {},
      create: {
        id:         g.id,
        userId:     g.userId,
        officerId:  g.officerId,
        rawText:    g.rawText,
        language:   'en',
        category:   g.category,
        urgency:    g.urgency,
        statute:    g.statute,
        section:    g.section,
        status:     g.status,
        pin:        g.pin,
        filedAt:    g.filedAt ?? null,
        resolvedAt: g.resolvedAt ?? null,
      },
    });
    n++;
  }
  console.log(`\n  ✅ ${n} performance grievances upserted`);

  // ── Summary ────────────────────────────────────────────────
  const totals = {
    officers:   await prisma.officer.count(),
    grievances: await prisma.grievance.count(),
    resolved:   await prisma.grievance.count({ where: { status: 'RESOLVED' } }),
  };

  console.log('\n📊 DB after performance seed:');
  console.log(`   Officers:   ${totals.officers}`);
  console.log(`   Grievances: ${totals.grievances}`);
  console.log(`   Resolved:   ${totals.resolved}`);
  const rate = Math.round((totals.resolved / totals.grievances) * 100);
  console.log(`   Overall resolution rate: ${rate}%`);
  console.log('\n✅ Performance seed complete.\n');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());

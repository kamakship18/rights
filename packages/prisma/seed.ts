/**
 * Actionable Justice OS — Database Seed
 *
 * Inserts deterministic demo data for the hackathon.
 * Safe to re-run: uses upsert throughout.
 *
 * Demo Officer hierarchy:
 *   ASI Local → DCP North → Commissioner
 *
 * Demo Grievances:
 *   1. Harassment (CRITICAL) — linked to Commissioner
 *   2. Noise complaint (HIGH) — linked to DCP North
 *   3. Electricity issue (NORMAL) — linked to ASI Local
 */

import {
  PrismaClient,
  Urgency,
  GrievanceStatus,
  EventKind,
  Channel,
} from '@prisma/client';

const prisma = new PrismaClient();

// ─── Constants ──────────────────────────────────────────

const DEMO_PIN = '110001'; // New Delhi

// Use the team's own email so demo emails are visible
const DEMO_EMAIL = process.env.DEMO_OFFICER_EMAIL || 'team@actionablejustice.dev';

// Stable IDs for upsert idempotency
const IDS = {
  commissioner: 'officer_commissioner_demo',
  dcpNorth: 'officer_dcp_north_demo',
  asiLocal: 'officer_asi_local_demo',
  user: 'user_demo_kamakshi',
  contact1: 'contact_demo_chirag',
  contact2: 'contact_demo_emergency',
  grievanceHarassment: 'grievance_demo_harassment',
  grievanceNoise: 'grievance_demo_noise',
  grievanceElectricity: 'grievance_demo_electricity',
  eventFiled1: 'event_demo_filed_harassment',
  eventFiled2: 'event_demo_filed_noise',
  eventFollowup: 'event_demo_followup_noise',
  eventEscalation: 'event_demo_escalation_noise',
} as const;

async function main() {
  console.log('🌱 Seeding database...\n');

  // ── Officers (bottom-up so parents exist first) ──────

  const commissioner = await prisma.officer.upsert({
    where: { id: IDS.commissioner },
    update: {},
    create: {
      id: IDS.commissioner,
      name: 'Sh. R.K. Sharma, IPS',
      designation: 'Commissioner of Police',
      department: 'Delhi Police',
      jurisdictionPin: DEMO_PIN,
      email: DEMO_EMAIL,
      parentId: null,
    },
  });
  console.log(`  ✅ Officer: ${commissioner.name} (${commissioner.designation})`);

  const dcpNorth = await prisma.officer.upsert({
    where: { id: IDS.dcpNorth },
    update: {},
    create: {
      id: IDS.dcpNorth,
      name: 'Sh. A.K. Verma, IPS',
      designation: 'DCP North District',
      department: 'Delhi Police',
      jurisdictionPin: DEMO_PIN,
      email: DEMO_EMAIL,
      parentId: commissioner.id,
    },
  });
  console.log(`  ✅ Officer: ${dcpNorth.name} (${dcpNorth.designation})`);

  const asiLocal = await prisma.officer.upsert({
    where: { id: IDS.asiLocal },
    update: {},
    create: {
      id: IDS.asiLocal,
      name: 'Sh. Pradeep Kumar',
      designation: 'ASI',
      department: 'Delhi Police',
      jurisdictionPin: DEMO_PIN,
      email: DEMO_EMAIL,
      parentId: dcpNorth.id,
    },
  });
  console.log(`  ✅ Officer: ${asiLocal.name} (${asiLocal.designation})\n`);

  // ── Demo User ────────────────────────────────────────

  const demoUser = await prisma.user.upsert({
    where: { id: IDS.user },
    update: {},
    create: {
      id: IDS.user,
      clerkId: 'user_2abc123demo456',
      fullName: 'Demo Citizen',
      primaryPin: DEMO_PIN,
    },
  });
  console.log(`  ✅ User: ${demoUser.fullName} (PIN: ${demoUser.primaryPin})`);

  // ── Emergency Contacts ───────────────────────────────
  // Uses env vars for real Twilio-verified phone numbers

  const phone1 = process.env.DEMO_PHONE_1 || '+919999999991';
  const phone2 = process.env.DEMO_PHONE_2 || '+919999999992';

  await prisma.emergencyContact.upsert({
    where: { id: IDS.contact1 },
    update: {},
    create: {
      id: IDS.contact1,
      userId: demoUser.id,
      name: 'Chirag (Teammate)',
      phone: phone1,
      relation: 'friend',
    },
  });

  await prisma.emergencyContact.upsert({
    where: { id: IDS.contact2 },
    update: {},
    create: {
      id: IDS.contact2,
      userId: demoUser.id,
      name: 'Family Emergency',
      phone: phone2,
      relation: 'family',
    },
  });
  console.log(`  ✅ Emergency contacts: 2 contacts created\n`);

  // ── Grievance 1: Harassment (CRITICAL) ───────────────

  await prisma.grievance.upsert({
    where: { id: IDS.grievanceHarassment },
    update: {},
    create: {
      id: IDS.grievanceHarassment,
      userId: demoUser.id,
      rawText: 'I am being followed by an unknown person near Connaught Place every evening for the past 3 days.',
      language: 'en',
      category: 'harassment',
      urgency: Urgency.CRITICAL,
      statute: 'Indian Penal Code (BNS)',
      section: 'Section 354D — Stalking',
      officerId: commissioner.id,
      status: GrievanceStatus.FILED,
      pin: DEMO_PIN,
      lat: 28.6315,
      lng: 77.2167,
      filedAt: new Date('2026-04-20T10:00:00Z'),
    },
  });
  console.log(`  ✅ Grievance: Harassment (CRITICAL → Commissioner)`);

  await prisma.noticeEvent.upsert({
    where: { id: IDS.eventFiled1 },
    update: {},
    create: {
      id: IDS.eventFiled1,
      grievanceId: IDS.grievanceHarassment,
      kind: EventKind.FILED,
      channel: Channel.EMAIL,
      payload: {
        to: DEMO_EMAIL,
        subject: 'Grievance Filed: Stalking Report — Connaught Place',
        templateVersion: '1.0',
      },
      sentAt: new Date('2026-04-20T10:01:00Z'),
    },
  });

  // ── Grievance 2: Noise Complaint (HIGH) ──────────────

  await prisma.grievance.upsert({
    where: { id: IDS.grievanceNoise },
    update: {},
    create: {
      id: IDS.grievanceNoise,
      userId: demoUser.id,
      rawText: 'Mere ghar ke pass bahut shor hai raat ko. DJ 1 baje tak bajta hai har weekend.',
      language: 'hi',
      category: 'noise',
      urgency: Urgency.HIGH,
      statute: 'Noise Pollution (Regulation and Control) Rules, 2000',
      section: 'Rule 5 — Restrictions on the use of loudspeakers',
      officerId: dcpNorth.id,
      status: GrievanceStatus.ESCALATED,
      pin: DEMO_PIN,
      lat: 28.6448,
      lng: 77.2167,
      filedAt: new Date('2026-04-10T18:00:00Z'),
    },
  });
  console.log(`  ✅ Grievance: Noise (HIGH → DCP North, escalated)`);

  // Full Chain-of-Action for the noise grievance (demo timeline)
  await prisma.noticeEvent.upsert({
    where: { id: IDS.eventFiled2 },
    update: {},
    create: {
      id: IDS.eventFiled2,
      grievanceId: IDS.grievanceNoise,
      kind: EventKind.FILED,
      channel: Channel.EMAIL,
      payload: {
        to: DEMO_EMAIL,
        subject: 'Grievance Filed: Noise Complaint — Chandni Chowk',
        templateVersion: '1.0',
      },
      sentAt: new Date('2026-04-10T18:01:00Z'),
    },
  });

  await prisma.noticeEvent.upsert({
    where: { id: IDS.eventFollowup },
    update: {},
    create: {
      id: IDS.eventFollowup,
      grievanceId: IDS.grievanceNoise,
      kind: EventKind.FOLLOWUP_7D,
      channel: Channel.EMAIL,
      payload: {
        to: DEMO_EMAIL,
        subject: 'REMINDER: Noise Complaint Unresolved (7 days)',
        followupNumber: 1,
      },
      sentAt: new Date('2026-04-17T09:00:00Z'),
    },
  });

  await prisma.noticeEvent.upsert({
    where: { id: IDS.eventEscalation },
    update: {},
    create: {
      id: IDS.eventEscalation,
      grievanceId: IDS.grievanceNoise,
      kind: EventKind.ESCALATION_14D,
      channel: Channel.EMAIL,
      payload: {
        to: DEMO_EMAIL,
        ccParent: DEMO_EMAIL,
        subject: 'ESCALATION: Noise Complaint Unresolved (14 days) — CC Commissioner',
        escalatedTo: 'Commissioner of Police',
      },
      sentAt: new Date('2026-04-24T09:00:00Z'),
    },
  });

  // ── Grievance 3: Electricity (NORMAL) ────────────────

  await prisma.grievance.upsert({
    where: { id: IDS.grievanceElectricity },
    update: {},
    create: {
      id: IDS.grievanceElectricity,
      userId: demoUser.id,
      rawText: 'My electricity bill for March shows 3x the usual consumption despite no change in usage. Meter may be faulty.',
      language: 'en',
      category: 'electricity',
      urgency: Urgency.NORMAL,
      statute: 'Electricity (Rights of Consumers) Rules, 2020',
      section: 'Rule 5 — Metering',
      officerId: asiLocal.id,
      status: GrievanceStatus.PENDING,
      pin: DEMO_PIN,
      lat: 28.6353,
      lng: 77.2250,
    },
  });
  console.log(`  ✅ Grievance: Electricity (NORMAL → ASI Local, pending)\n`);

  // ── Summary ──────────────────────────────────────────

  const counts = {
    officers: await prisma.officer.count(),
    users: await prisma.user.count(),
    contacts: await prisma.emergencyContact.count(),
    grievances: await prisma.grievance.count(),
    events: await prisma.noticeEvent.count(),
  };

  console.log('📊 Database summary:');
  console.log(`   Officers:           ${counts.officers}`);
  console.log(`   Users:              ${counts.users}`);
  console.log(`   Emergency Contacts: ${counts.contacts}`);
  console.log(`   Grievances:         ${counts.grievances}`);
  console.log(`   Notice Events:      ${counts.events}`);
  console.log('\n✅ Seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

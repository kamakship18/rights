/**
 * Exercises the demo-fast path: notice -> followup -> escalation (Bull add mocked).
 */
import { NoticeProcessor } from '../src/queues/notice.processor';
import { FollowupProcessor } from '../src/queues/followup.processor';
import { EscalationProcessor } from '../src/queues/escalation.processor';
import { SendGridService } from '../src/filing/sendgrid.service';
import type { Job } from 'bullmq';

const gid = 'griev-ut-1';
const userId = 'user-1';

const officer = {
  id: 'off-1',
  name: 'Officer One',
  designation: 'DCP',
  department: 'Police',
  email: 'off1@test.dev',
  jurisdictionPin: '110001',
  parentId: 'off-parent',
};

const parentOff = {
  id: 'off-parent',
  name: 'Parent O',
  designation: 'JCP',
  department: 'Police',
  email: 'parent@test.dev',
  jurisdictionPin: '110001',
  parentId: null as null,
};

const user = {
  id: userId,
  clerkId: 'cl-1',
  fullName: 'Test Citizen',
  primaryPin: '110001',
  createdAt: new Date(),
  updatedAt: new Date(),
};

type GStatus = 'PENDING' | 'FILED' | 'FOLLOWED_UP' | 'ESCALATED' | 'RESOLVED';
type EvKind = 'FILED' | 'FOLLOWUP_7D' | 'ESCALATION_14D';
const events: { kind: EvKind; sentAt: Date; grievanceId: string; payload: unknown }[] = [];

const baseG = {
  id: gid,
  userId,
  rawText: 'Noise at night',
  language: 'en',
  category: 'noise',
  urgency: 'NORMAL' as const,
  statute: 'Test Act',
  section: 'Sec 1',
  officerId: officer.id,
  pin: '110001',
  lat: null,
  lng: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  filedAt: null as Date | null,
  resolvedAt: null,
  demoSpeed: 'fast' as string | null,
};

const state: { g: typeof baseG & { status: GStatus } } = {
  g: { ...baseG, status: 'PENDING' },
};

function makeJob<T>(name: string, data: T): Job<T> {
  return { name, data, id: 'j', queueName: 'n', opts: { attempts: 3 }, attemptsMade: 0 } as Job<T>;
}

describe('persistence (demo fast)', () => {
  it('yields 3 NoticeEvents and ESCALATED', async () => {
    jest.spyOn(SendGridService.prototype, 'send').mockResolvedValue({ success: true, attempts: 1 });

    const followupQ = { add: jest.fn(), getJob: jest.fn().mockResolvedValue(null) };
    const escQ = { add: jest.fn(), getJob: jest.fn().mockResolvedValue(null) };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prisma: any = {
      $transaction: (arg: unknown) => {
        if (Array.isArray(arg)) {
          return Promise.all(
            (arg as Promise<unknown>[]).map((p) => (typeof p?.then === 'function' ? p : Promise.resolve())),
          );
        }
        if (typeof arg === 'function') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (arg as any)({
            noticeEvent: {
              create: async ({ data: d }: { data: { kind: EvKind; grievanceId: string; payload: unknown } }) => {
                const sentAt = new Date();
                events.push({ kind: d.kind, sentAt, grievanceId: d.grievanceId, payload: d.payload });
                return { id: 'e', kind: d.kind, sentAt, grievanceId: d.grievanceId, payload: d.payload };
              },
            },
            grievance: { update: async ({ data: d }: { data: object }) => Object.assign(state.g, d) },
          });
        }
        return Promise.resolve();
      },
      noticeEvent: {
        create: async ({
          data: d,
        }: {
          data: { kind: EvKind; grievanceId: string; payload: unknown; channel: string };
        }) => {
          const sentAt = new Date();
          events.push({ kind: d.kind, sentAt, grievanceId: d.grievanceId, payload: d.payload });
          return { id: 'e2', kind: d.kind, sentAt, grievanceId: d.grievanceId, payload: d.payload };
        },
      },
      grievance: {
        findUnique: jest.fn().mockImplementation(() =>
          state.g
            ? {
                ...state.g,
                officer,
                user,
                events: events.map((e) => ({ ...e, channel: 'EMAIL' })),
              }
            : null,
        ),
        update: async ({ data: d }: { data: object }) => Object.assign(state.g, d),
      },
      officer: {
        findUnique: jest.fn().mockImplementation(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (args: any) => {
            const id = args?.where?.id;
            if (id === parentOff.id) {
              return parentOff;
            }
            if (id === officer.id) {
              return officer;
            }
            return null;
          },
        ),
      },
    };

    const np = new NoticeProcessor(prisma, new SendGridService(), followupQ as never);
    np.onModuleInit();
    await np.process(
      makeJob('send-notice', { grievanceId: gid, userId }) as Job<{ grievanceId: string; userId: string }>,
    );
    expect(state.g.status).toBe('FILED');
    expect(events.map((e) => e.kind)).toEqual(['FILED']);
    expect(followupQ.add).toHaveBeenCalled();
    const [, , fuOpts] = (followupQ.add as ReturnType<typeof jest.fn>).mock.calls[0];
    expect(fuOpts.delay).toBe(30_000);

    const fp = new FollowupProcessor(prisma, new SendGridService(), escQ as never);
    fp.onModuleInit();
    await fp.process(makeJob('run-followup', { grievanceId: gid }) as Job<{ grievanceId: string }>);

    expect(state.g.status).toBe('FOLLOWED_UP');
    expect(events.map((e) => e.kind)).toEqual(['FILED', 'FOLLOWUP_7D']);
    const [, , escOpts] = (escQ.add as ReturnType<typeof jest.fn>).mock.calls[0];
    expect(escOpts.delay).toBe(60_000);

    const ep = new EscalationProcessor(prisma, new SendGridService());
    ep.onModuleInit();
    await ep.process(
      makeJob('run-escalation', { grievanceId: gid }) as Job<{ grievanceId: string }>,
    );

    expect(state.g.status).toBe('ESCALATED');
    expect(events.map((e) => e.kind)).toEqual(['FILED', 'FOLLOWUP_7D', 'ESCALATION_14D']);
    const pl = (events[2] as { payload: { ccOfficerId: string } }).payload;
    expect(pl.ccOfficerId).toBe('off-parent');
  });
});

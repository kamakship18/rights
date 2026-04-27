/**
 * CommunityService — smart clustering of similar complaints.
 *
 * After a new grievance is created, `checkAndCluster` runs. When at least N
 * un-clustered grievances share the same (pin, category) in 72h, a
 * `CommunityGrievance` row is created/updated, members linked, and an
 * officer email may be sent. Category matching is case-insensitive.
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { SendGridService } from '../filing/sendgrid.service';

const CLUSTER_WINDOW_HOURS = 72;
const CLUSTER_THRESHOLD = Math.max(
  2,
  parseInt(process.env.COMMUNITY_CLUSTER_THRESHOLD || '2', 10) || 2,
);

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sendgrid: SendGridService,
  ) {
    this.logger.log(
      `Clustering enabled — window=${CLUSTER_WINDOW_HOURS}h threshold=${CLUSTER_THRESHOLD} complaints`,
    );
  }

  async checkAndCluster(grievanceId: string): Promise<void> {
    try {
      await this._cluster(grievanceId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Community clustering failed (non-fatal): ${msg}`);
    }
  }

  private async _cluster(grievanceId: string): Promise<void> {
    const g = await this.prisma.grievance.findUnique({
      where: { id: grievanceId },
      include: { officer: true },
    });
    if (!g) {
      this.logger.warn(`_cluster: grievance not found: ${grievanceId}`);
      return;
    }

    const since = new Date(Date.now() - CLUSTER_WINDOW_HOURS * 3_600_000);
    const catKey = (g.category || 'general').toLowerCase().trim() || 'general';

    this.logger.log(
      `_cluster start — grievanceId: ${g.id} pin: ${g.pin} category: "${g.category}" → key:"${catKey}"`,
    );

    const siblingWhere = {
      pin: g.pin,
      createdAt: { gte: since },
      communityMemberships: { none: {} } as const,
      category: { equals: catKey, mode: 'insensitive' as const },
    };

    const siblings = await this.prisma.grievance.findMany({
      where: siblingWhere,
      select: { id: true },
    });

    this.logger.log(
      `_cluster: ${siblings.length} un-clustered sibling(s) in window (need ≥${CLUSTER_THRESHOLD})`,
    );

    if (siblings.length < CLUSTER_THRESHOLD) {
      this.logger.log('_cluster: below threshold — no community record');
      return;
    }

    let community = await this.prisma.communityGrievance.findFirst({
      where: {
        pin: g.pin,
        status: { not: 'RESOLVED' },
        createdAt: { gte: since },
        category: { equals: catKey, mode: 'insensitive' },
      },
    });

    if (!community) {
      community = await this.prisma.communityGrievance.create({
        data: {
          pin: g.pin,
          locality: g.locality ?? null,
          category: catKey,
          officerId: g.officerId,
          count: 0,
        },
      });
      this.logger.log(
        `New CommunityGrievance id=${community.id} pin=${g.pin} category=${catKey}`,
      );
    }

    const prevCount = community.count;

    for (const s of siblings) {
      await this.prisma.communityGrievanceMember.upsert({
        where: {
          communityGrievanceId_grievanceId: {
            communityGrievanceId: community.id,
            grievanceId: s.id,
          },
        },
        update: {},
        create: {
          communityGrievanceId: community.id,
          grievanceId: s.id,
        },
      });
    }

    const totalMembers = await this.prisma.communityGrievanceMember.count({
      where: { communityGrievanceId: community.id },
    });

    await this.prisma.communityGrievance.update({
      where: { id: community.id },
      data: { count: totalMembers },
    });

    this.logger.log(
      `_cluster: community ${community.id} member count=${totalMembers} (prev stored=${prevCount})`,
    );

    if (prevCount < CLUSTER_THRESHOLD && totalMembers >= CLUSTER_THRESHOLD) {
      await this._sendCommunityNotice(
        community.id,
        g.officer.email,
        g.pin,
        catKey,
        totalMembers,
        siblings.map((s) => s.id),
      );
    }
  }

  private async _sendCommunityNotice(
    communityId: string,
    officerEmail: string,
    pin: string,
    category: string,
    count: number,
    grievanceIds: string[],
  ): Promise<void> {
    const subject = `[Community Alert] ${count} similar ${category} complaints in PIN ${pin}`;
    const idList = grievanceIds
      .slice(0, 10)
      .map((id) => `• ${id}`)
      .join('\n');

    const html = `
<p>Dear Officer,</p>
<p>Our platform has detected <strong>${count} similar complaints</strong> related to <strong>${category}</strong> in PIN code area <strong>${pin}</strong> within the last ${CLUSTER_WINDOW_HOURS} hours.</p>
<p>This consolidated notice is being sent automatically to bring this locality-wide issue to your attention.</p>
<h3>Grievance IDs included in this cluster:</h3>
<pre>${idList}${count > 10 ? `\n… and ${count - 10} more` : ''}</pre>
<p>We request you to review this as a community-level concern requiring priority action.</p>
<p><em>— Actionable Justice OS | Automated Community Alert</em></p>
    `.trim();

    const text = `Community Alert: ${count} similar ${category} complaints in PIN ${pin}.\n\nGrievance IDs:\n${idList}\n\nPlease review as a community-level concern.`;

    const result = await this.sendgrid.send({
      to: officerEmail,
      subject,
      html,
      text,
      idempotencyKey: `community-${communityId}-v1`,
    });

    if (result.success) {
      await this.prisma.communityGrievance.update({
        where: { id: communityId },
        data: { emailSentAt: new Date() },
      });
      this.logger.log(`Community email sent for communityId=${communityId}`);
    } else {
      this.logger.warn(`Community email not sent (SendGrid) for communityId=${communityId}`);
    }
  }

  async listByPin(pin: string): Promise<unknown[]> {
    return this.prisma.communityGrievance.findMany({
      where: { pin, status: { not: 'RESOLVED' } },
      orderBy: { count: 'desc' },
      include: { _count: { select: { members: true } } },
    });
  }

  /**
   * Lists community clusters visible to this user: any row whose PIN matches
   * the profile PIN and/or a PIN the user has used on their own grievances
   * (so clusters show up even if they never set Profile but filed complaints).
   */
  async listForUser(clerkId: string): Promise<unknown[]> {
    this.logger.log(`listForUser — clerkId: ${clerkId}`);

    const user = await this.prisma.user.findUnique({
      where: { clerkId },
    });
    if (!user) {
      this.logger.log('listForUser: no user row');
      return [];
    }

    const pins = new Set<string>();
    if (user.primaryPin) {
      pins.add(user.primaryPin);
    }

    const fromGrievances = await this.prisma.grievance.findMany({
      where: { userId: user.id },
      select: { pin: true },
      distinct: ['pin'],
    });
    for (const row of fromGrievances) {
      if (row.pin) {
        pins.add(row.pin);
      }
    }

    this.logger.log(
      `listForUser — user ${user.id} PINs for lookup: [${[...pins].join(', ')}]`,
    );

    if (pins.size === 0) {
      this.logger.log('listForUser: no PIN on profile and no filed grievances — empty');
      return [];
    }

    const pinList = [...pins];
    const rows = await this.prisma.communityGrievance.findMany({
      where: { pin: { in: pinList }, status: { not: 'RESOLVED' } },
      orderBy: { count: 'desc' },
      include: { _count: { select: { members: true } } },
    });

    const byId = new Map<string, (typeof rows)[0]>();
    for (const r of rows) {
      if (!byId.has(r.id)) {
        byId.set(r.id, r);
      }
    }

    const out = [...byId.values()];
    this.logger.log(`listForUser — returning ${out.length} community row(s)`);
    return out;
  }
}

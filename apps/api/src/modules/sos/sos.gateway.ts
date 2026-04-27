import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../prisma.service';
import { verifyToken } from '@clerk/backend';

export type SosDeliveryStatusPayload = {
  contactId: string;
  delivery: {
    sms: { ok: boolean; error?: string };
    whatsapp: { ok: boolean; error?: string };
  };
};

@WebSocketGateway({
  namespace: '/sos',
  cors: {
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
export class SosGateway implements OnGatewayInit {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(SosGateway.name);
  private readonly isProd = process.env.NODE_ENV === 'production';

  constructor(private readonly prisma: PrismaService) {}

  afterInit() {
    this.logger.log('SOS /sos WebSocket (namespace /sos, rooms user:{id})');
  }

  private async resolveClerkIdFromHandshake(
    client: Socket,
  ): Promise<{ ok: true; clerkId: string } | { ok: false; reason: string }> {
    if (!process.env.CLERK_SECRET_KEY) {
      const auth = client.handshake.auth as { clerkId?: string; token?: string } | undefined;
      const c = (auth?.clerkId as string) || (client.handshake.query.clerkId as string) || 'dev-user-001';
      this.logger.log(`SOS dev bypass — room for clerkId=${c}`);
      return { ok: true, clerkId: c };
    }

    const token =
      (client.handshake.auth as { token?: string } | undefined)?.['token'] ||
      (client.handshake.headers['authorization'] as string | undefined)
        ?.replace(/^Bearer\s+/i, '')
        ?.trim();

    if (!token) {
      return { ok: false, reason: 'no token' };
    }

    try {
      const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY! });
      return { ok: true, clerkId: payload.sub };
    } catch {
      return { ok: false, reason: 'invalid token' };
    }
  }

  async handleConnection(client: Socket) {
    const res = await this.resolveClerkIdFromHandshake(client);
    if (!res.ok) {
      this.logger.warn(`SOS ws rejected: ${res.reason}`);
      client.emit('sos:error', { code: 'UNAUTHORIZED' });
      client.disconnect(true);
      return;
    }

    const user = await this.prisma.user.upsert({
      where: { clerkId: res.clerkId },
      create: { clerkId: res.clerkId, fullName: 'Citizen' },
      update: {},
    });

    const room = `user:${user.id}`;
    void client.join(room);
    (client as Socket & { data: { userId: string; clerkId: string } }).data = {
      userId: user.id,
      clerkId: res.clerkId,
    };
    this.logger.log(`SOS client ${client.id} → room ${room}`);

    if (!this.isProd) {
      client.emit('sos:ready', { room, userId: user.id });
    }
  }

  /**
   * Push delivery line items to the user's room (HTTP trigger uses same internal userId).
   */
  pushDeliveryStatus(userId: string, payload: SosDeliveryStatusPayload) {
    this.server.to(`user:${userId}`).emit('sos:status', payload);
  }
}

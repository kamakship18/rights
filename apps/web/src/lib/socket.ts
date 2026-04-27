/**
 * Socket.io client factory for real-time SOS delivery stream.
 * Connects to the /sos namespace with Clerk auth.
 */
import { io, Socket } from 'socket.io-client';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

export interface SosDeliveryPayload {
  contactId: string;
  delivery: {
    sms: { ok: boolean; error?: string };
    whatsapp: { ok: boolean; error?: string };
  };
}

export interface SosReadyPayload {
  room: string;
  userId: string;
}

type SosEventMap = {
  'sos:status': (payload: SosDeliveryPayload) => void;
  'sos:ready': (payload: SosReadyPayload) => void;
  'sos:error': (payload: { code: string }) => void;
};

let socketInstance: Socket | null = null;

/**
 * Create (or reuse) a Socket.io connection to the /sos namespace.
 * Pass the Clerk session token for auth.
 */
export function createSosSocket(token: string | null): Socket {
  if (socketInstance?.connected) {
    return socketInstance;
  }

  /* Disconnect stale socket */
  if (socketInstance) {
    socketInstance.disconnect();
  }

  socketInstance = io(`${SOCKET_URL}/sos`, {
    auth: { token: token ?? undefined },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socketInstance;
}

/**
 * Disconnect the SOS socket.
 */
export function disconnectSosSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

/**
 * Type-safe event listener helper.
 */
export function onSosEvent<K extends keyof SosEventMap>(
  socket: Socket,
  event: K,
  handler: SosEventMap[K],
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  socket.on(event as string, handler as any);
  return () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.off(event as string, handler as any);
  };
}

'use client';

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3000';

let gpsSocket: Socket | null = null;

/** Read-only GPS socket - the web dashboard only listens for bus:location, it never publishes. */
export function getGpsSocket(): Socket {
  if (!gpsSocket) {
    gpsSocket = io(`${SOCKET_URL}/gps`, { transports: ['websocket'], autoConnect: true });
  }
  return gpsSocket;
}

let notificationsSocket: Socket | null = null;

export function getNotificationsSocket(userId?: string): Socket {
  if (!notificationsSocket) {
    notificationsSocket = io(`${SOCKET_URL}/notifications`, { transports: ['websocket'], autoConnect: true });
    if (userId) {
      notificationsSocket.on('connect', () => {
        notificationsSocket?.emit('identify', { userId, role: 'ADMIN' });
      });
    }
  }
  return notificationsSocket;
}

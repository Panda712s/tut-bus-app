import { Injectable, Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/**
 * Tracks which socket belongs to which user so targeted notifications
 * (e.g. "notify this one student") can be pushed in real time.
 * Clients join their own room right after connecting:
 *   socket.emit('identify', { userId, role })
 */
@Injectable()
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/notifications' })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger('NotificationsGateway');

  handleConnection(client: Socket) {
    client.on('identify', ({ userId, role }: { userId: string; role: string }) => {
      if (userId) {
        client.join(`user:${userId}`);
      }
      if (role) {
        client.join(`role:${role}`);
      }
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  notifyUser(userId: string, event: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  notifyRole(role: string, event: string, payload: unknown) {
    this.server.to(`role:${role}`).emit(event, payload);
  }

  broadcast(event: string, payload: unknown) {
    this.server.emit(event, payload);
  }
}

import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GpsService } from './gps.service';
import { GpsUpdateDto, GpsBatchDto } from './dto/gps-update.dto';

/**
 * Real-time GPS channel.
 *
 * - Driver apps connect with `auth: { token: <driver JWT> }` and emit
 *   `gps:update` every few seconds while a trip is in progress.
 * - Student / web-dashboard clients connect without a token (read-only) and
 *   listen for `bus:location` (broadcast) - optionally after joining a
 *   route room with `gps:subscribe-route` to only receive that route's buses.
 */
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/gps' })
export class GpsGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger('GpsGateway');

  constructor(
    private gpsService: GpsService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token as string | undefined;
    if (token) {
      try {
        const payload = this.jwt.verify(token, { secret: this.config.get<string>('JWT_SECRET') });
        if (payload.role === 'DRIVER') {
          client.data.driverId = payload.sub;
        }
      } catch {
        this.logger.debug(`GPS socket ${client.id} connected with an invalid token (read-only mode)`);
      }
    }
  }

  @SubscribeMessage('gps:subscribe-route')
  subscribeRoute(@ConnectedSocket() client: Socket, @MessageBody() routeId: string) {
    client.join(`route:${routeId}`);
  }

  @SubscribeMessage('gps:update')
  async handleGpsUpdate(@ConnectedSocket() client: Socket, @MessageBody() body: GpsUpdateDto) {
    if (!client.data.driverId) {
      client.emit('gps:error', { message: 'Unauthorized: driver token required to publish GPS updates' });
      return;
    }
    const bus = await this.gpsService.recordPing(body);

    const payload = {
      busId: bus.id,
      busNumber: bus.busNumber,
      lat: bus.currentLat,
      lng: bus.currentLng,
      speedKmh: bus.speedKmh,
      heading: bus.heading,
      capacityState: bus.capacityState,
      passengerCount: bus.passengerCount,
      routeId: bus.currentRouteId,
      timestamp: bus.lastLocationAt,
    };

    // Broadcast to everyone, and to anyone subscribed to this bus's route room.
    this.server.emit('bus:location', payload);
    if (bus.currentRouteId) {
      this.server.to(`route:${bus.currentRouteId}`).emit('bus:location', payload);
    }
  }

  /**
   * Driver app reconnected after being offline and is flushing the pings it
   * buffered locally. Each ping carries its own `recordedAt`.
   */
  @SubscribeMessage('gps:flush')
  async handleGpsFlush(@ConnectedSocket() client: Socket, @MessageBody() body: GpsBatchDto) {
    if (!client.data.driverId) {
      client.emit('gps:error', { message: 'Unauthorized: driver token required to publish GPS updates' });
      return;
    }
    const result = await this.gpsService.recordPingBatch(body.pings ?? []);
    client.emit('gps:flush-ack', result);
  }
}

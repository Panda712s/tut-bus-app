import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Thin wrapper around Firebase Cloud Messaging.
 *
 * To go live: `npm install firebase-admin`, set FCM_SERVICE_ACCOUNT_JSON in
 * .env, and replace the body of send() with a real
 * admin.messaging().send(...) call. Kept as a stub (console.log) so the
 * rest of the app (notification records, sockets, in-app inbox) works
 * end-to-end without requiring real Firebase credentials during development.
 */
@Injectable()
export class FcmService {
  private readonly logger = new Logger('FcmService');
  private readonly enabled: boolean;

  constructor(private config: ConfigService) {
    this.enabled = Boolean(this.config.get<string>('FCM_SERVICE_ACCOUNT_JSON'));
  }

  async send(deviceTokens: string[], title: string, body: string, data: Record<string, string> = {}) {
    if (!this.enabled) {
      this.logger.debug(`[FCM stub] Would push "${title}" to ${deviceTokens.length} device(s): ${body}`);
      return { success: true, stub: true };
    }
    this.logger.warn('FCM_SERVICE_ACCOUNT_JSON is set but firebase-admin integration is not wired up yet.');
    return { success: false };
  }
}

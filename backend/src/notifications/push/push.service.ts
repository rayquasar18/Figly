import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as webpush from 'web-push';

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private enabled = false;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    const publicKey = this.configService.get<string>('vapid.publicKey') || '';
    const privateKey = this.configService.get<string>('vapid.privateKey') || '';
    const subject = this.configService.get<string>('vapid.subject') || 'mailto:admin@figly.app';

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.enabled = true;
      this.logger.log('Push notifications enabled');
    } else {
      this.logger.warn('VAPID keys not configured, push notifications disabled');
    }
  }

  async saveSubscription(userId: string, dto: { endpoint: string; p256dh: string; auth: string }) {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      update: { userId, p256dh: dto.p256dh, auth: dto.auth },
      create: {
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.p256dh,
        auth: dto.auth,
      },
    });
  }

  async removeSubscription(userId: string, endpoint: string) {
    try {
      await this.prisma.pushSubscription.deleteMany({
        where: { endpoint, userId },
      });
    } catch (error: any) {
      this.logger.warn(`Failed to remove push subscription: ${error.message}`);
    }
  }

  async sendToUser(userId: string, payload: { title: string; body: string; url?: string }) {
    if (!this.enabled) return;

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        );
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Subscription expired, clean up
          await this.prisma.pushSubscription.delete({
            where: { id: sub.id },
          }).catch(() => {});
        } else {
          this.logger.warn(`Push notification failed for ${sub.endpoint}: ${error.message}`);
        }
      }
    }
  }

  getVapidPublicKey(): string {
    return this.configService.get<string>('vapid.publicKey') || '';
  }
}

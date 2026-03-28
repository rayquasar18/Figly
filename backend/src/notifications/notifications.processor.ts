import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { PushService } from './push/push.service';
import { ModerationService } from '../moderation/moderation.service';
import { NotificationJobData } from './dto/notification-response.dto';

@Processor('notification')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private gateway: NotificationsGateway,
    private pushService: PushService,
    private moderationService: ModerationService,
  ) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    const { type, actorId, recipientId, targetId, targetType } = job.data;
    this.logger.log(`Processing notification job: ${type} from ${actorId} to ${recipientId}`);

    // Guard: skip self-notifications
    if (actorId === recipientId) {
      this.logger.log('Skipping self-notification');
      return;
    }

    // Guard: skip notifications if actor is blocked by recipient
    const isBlocked = await this.moderationService.isBlocked(actorId, recipientId);
    if (isBlocked) {
      this.logger.log('Skipping notification: actor is blocked by recipient');
      return;
    }

    // Check for groupable existing notification
    const existing = await this.notificationsService.findGroupableNotification(
      type,
      targetId,
      recipientId,
    );

    if (existing) {
      await this.notificationsService.addActorToGroup(existing.id, actorId);
    } else {
      await this.notificationsService.createNotification(job.data);
    }

    // Send push notification
    try {
      const actor = await this.prisma.user.findUnique({
        where: { id: actorId },
        select: { name: true, username: true },
      });

      const actorName = actor?.name || actor?.username || 'Ai do';
      let body: string;
      let url: string | undefined;

      switch (type) {
        case 'like':
          body = `${actorName} da thich bai viet cua ban`;
          url = targetId ? `/post/${targetId}` : undefined;
          break;
        case 'comment':
          body = `${actorName} da binh luan ve bai viet cua ban`;
          url = targetId ? `/post/${targetId}` : undefined;
          break;
        case 'reply':
          body = `${actorName} da tra loi binh luan cua ban`;
          url = targetId ? `/post/${targetId}` : undefined;
          break;
        case 'follow':
          body = `${actorName} da theo doi ban`;
          url = actor?.username ? `/${actor.username}` : undefined;
          break;
        case 'mention':
          body = `${actorName} da nhac den ban trong mot binh luan`;
          url = targetId ? `/post/${targetId}` : undefined;
          break;
        default:
          body = `${actorName} da tuong tac voi ban`;
      }

      await this.pushService.sendToUser(recipientId, {
        title: 'Figly',
        body,
        url,
      });
    } catch (error: any) {
      this.logger.warn(`Push notification failed: ${error.message}`);
    }

    this.logger.log(`Notification job completed: ${type}`);
  }
}

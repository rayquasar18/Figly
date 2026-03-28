import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationsGateway } from './notifications.gateway';
import { PushService } from './push/push.service';
import { MediaModule } from '../media/media.module';
import { ModerationModule } from '../moderation/moderation.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'notification' }),
    MediaModule,
    ModerationModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsProcessor,
    NotificationsGateway,
    PushService,
  ],
  exports: [
    NotificationsService,
    BullModule,
  ],
})
export class NotificationsModule {}

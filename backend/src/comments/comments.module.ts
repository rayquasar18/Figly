import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { MediaModule } from '../media/media.module';
import { AuthModule } from '../auth/auth.module';
import { ModerationModule } from '../moderation/moderation.module';

@Module({
  imports: [
    MediaModule,
    AuthModule,
    ModerationModule,
    BullModule.registerQueue({ name: 'notification' }),
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}

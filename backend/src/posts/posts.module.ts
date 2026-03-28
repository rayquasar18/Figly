import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PostsController } from './posts.controller';
import { HashtagsController } from './hashtags.controller';
import { PostsService } from './posts.service';
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
  controllers: [PostsController, HashtagsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}

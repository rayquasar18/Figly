import { Module } from '@nestjs/common';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { MediaModule } from '../media/media.module';
import { AuthModule } from '../auth/auth.module';
import { ModerationModule } from '../moderation/moderation.module';

@Module({
  imports: [MediaModule, AuthModule, ModerationModule],
  controllers: [FeedController],
  providers: [FeedService],
  exports: [FeedService],
})
export class FeedModule {}

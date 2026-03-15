import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { HashtagsController } from './hashtags.controller';
import { PostsService } from './posts.service';
import { MediaModule } from '../media/media.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MediaModule, AuthModule],
  controllers: [PostsController, HashtagsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}

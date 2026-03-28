import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { ProfilesModule } from '../profiles/profiles.module';
import { PostsModule } from '../posts/posts.module';
import { CollectionModule } from '../collection/collection.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ProfilesModule, PostsModule, CollectionModule, AuthModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}

import { Injectable } from '@nestjs/common';
import { ProfilesService } from '../profiles/profiles.service';
import { PostsService } from '../posts/posts.service';
import { CollectionService } from '../collection/collection.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(
    private profilesService: ProfilesService,
    private postsService: PostsService,
    private collectionService: CollectionService,
    private prisma: PrismaService,
  ) {}

  async searchUsers(query: string, limit = 10) {
    if (!query) return [];
    return this.profilesService.searchProfiles(query, limit);
  }

  async searchHashtags(query: string, limit = 10) {
    if (!query) return [];
    const hashtags = await this.prisma.hashtag.findMany({
      where: { name: { startsWith: query.toLowerCase(), mode: 'insensitive' } },
      include: { _count: { select: { posts: true } } },
      take: limit,
    });
    return hashtags.map((h: any) => ({
      id: h.id,
      name: h.name,
      postCount: h._count.posts,
    }));
  }

  async searchItems(query: string, cursor?: string, viewerId?: string) {
    if (!query) return { items: [], nextCursor: null, hasMore: false };
    return this.collectionService.searchItems(query, { cursor }, viewerId);
  }
}

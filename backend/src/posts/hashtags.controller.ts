import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('hashtags')
@UseGuards(JwtAuthGuard)
export class HashtagsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('search')
  async searchHashtags(@Query('q') query: string) {
    if (!query) return [];
    return this.postsService.searchHashtags(query);
  }
}

import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { SearchService } from './search.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('users')
  @UseGuards(OptionalJwtAuthGuard)
  async searchUsers(
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ) {
    if (!q) return [];
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.searchService.searchUsers(q, parsedLimit);
  }

  @Get('hashtags')
  @UseGuards(OptionalJwtAuthGuard)
  async searchHashtags(
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ) {
    if (!q) return [];
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.searchService.searchHashtags(q, parsedLimit);
  }

  @Get('items')
  @UseGuards(OptionalJwtAuthGuard)
  async searchItems(
    @Req() req: Request,
    @Query('q') q?: string,
    @Query('cursor') cursor?: string,
  ) {
    if (!q) return { items: [], nextCursor: null, hasMore: false };
    const viewerId = (req.user as any)?.userId || null;
    return this.searchService.searchItems(q, cursor, viewerId);
  }
}

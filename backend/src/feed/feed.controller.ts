import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { FeedService } from './feed.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  // Static route MUST be before parameterized routes
  @Get('public')
  async getPublicFeed(@Query('cursor') cursor?: string) {
    return this.feedService.getPublicFeed(cursor);
  }

  @Get()
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async getFeed(
    @Req() req: Request,
    @Query('cursor') cursor?: string,
  ) {
    const { userId } = req.user as any;
    return this.feedService.getFeed(userId, cursor);
  }
}

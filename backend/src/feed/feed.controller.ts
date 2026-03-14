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
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  async getFeed(
    @Req() req: Request,
    @Query('cursor') cursor?: string,
  ) {
    const { userId } = req.user as any;
    return this.feedService.getFeed(userId, cursor);
  }
}

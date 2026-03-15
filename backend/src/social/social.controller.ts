import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { SocialService } from './social.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post('follow/:userId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async follow(
    @Param('userId') targetUserId: string,
    @Req() req: Request,
  ) {
    const { userId } = req.user as any;
    return this.socialService.follow(userId, targetUserId);
  }

  @Delete('follow/:userId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async unfollow(
    @Param('userId') targetUserId: string,
    @Req() req: Request,
  ) {
    const { userId } = req.user as any;
    return this.socialService.unfollow(userId, targetUserId);
  }

  @Get(':username/followers')
  @UseGuards(OptionalJwtAuthGuard)
  async getFollowers(
    @Param('username') username: string,
    @Query('cursor') cursor?: string,
    @Query('search') search?: string,
    @Req() req?: Request,
  ) {
    const viewerId = (req?.user as any)?.userId || null;
    return this.socialService.getFollowers(username, viewerId, { cursor, search });
  }

  @Get(':username/following')
  @UseGuards(OptionalJwtAuthGuard)
  async getFollowing(
    @Param('username') username: string,
    @Query('cursor') cursor?: string,
    @Query('search') search?: string,
    @Req() req?: Request,
  ) {
    const viewerId = (req?.user as any)?.userId || null;
    return this.socialService.getFollowing(username, viewerId, { cursor, search });
  }

  @Delete('followers/:userId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async removeFollower(
    @Param('userId') followerUserId: string,
    @Req() req: Request,
  ) {
    const { userId } = req.user as any;
    return this.socialService.removeFollower(userId, followerUserId);
  }
}

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';

@Controller('stories')
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createStory(@Body() dto: CreateStoryDto, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.storiesService.createStory(userId, dto);
  }

  @Get('feed')
  async getStoryFeed(@Req() req: Request) {
    const { userId } = req.user as any;
    return this.storiesService.getStoryFeed(userId);
  }

  @Post(':id/view')
  @HttpCode(HttpStatus.OK)
  async markViewed(@Param('id') id: string, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.storiesService.markViewed(id, userId);
  }

  @Get(':id/viewers')
  async getStoryViewers(@Param('id') id: string, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.storiesService.getStoryViewers(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteStory(@Param('id') id: string, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.storiesService.deleteStory(id, userId);
  }
}

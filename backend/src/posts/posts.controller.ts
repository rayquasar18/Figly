import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async createPost(@Body() dto: CreatePostDto, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.postsService.createPost(userId, dto);
  }

  // Static routes MUST be before :id param routes
  @Get('saved')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async getSavedPosts(
    @Req() req: Request,
    @Query('cursor') cursor?: string,
  ) {
    const { userId } = req.user as any;
    return this.postsService.getSavedPosts(userId, cursor);
  }

  @Get('user/:username')
  @UseGuards(OptionalJwtAuthGuard)
  async getUserPosts(
    @Param('username') username: string,
    @Req() req: Request,
    @Query('cursor') cursor?: string,
  ) {
    const viewerId = (req.user as any)?.userId || null;
    return this.postsService.getUserPosts(username, viewerId, cursor);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async getPost(@Param('id') postId: string, @Req() req: Request) {
    const viewerId = (req.user as any)?.userId || null;
    return this.postsService.getPost(postId, viewerId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async updateCaption(
    @Param('id') postId: string,
    @Body() dto: UpdatePostDto,
    @Req() req: Request,
  ) {
    const { userId } = req.user as any;
    return this.postsService.updateCaption(postId, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async deletePost(@Param('id') postId: string, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.postsService.deletePost(postId, userId);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async likePost(@Param('id') postId: string, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.postsService.toggleLike(userId, postId, true);
  }

  @Delete(':id/like')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async unlikePost(@Param('id') postId: string, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.postsService.toggleLike(userId, postId, false);
  }

  @Post(':id/bookmark')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async bookmarkPost(@Param('id') postId: string, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.postsService.toggleBookmark(userId, postId, true);
  }

  @Delete(':id/bookmark')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async unbookmarkPost(@Param('id') postId: string, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.postsService.toggleBookmark(userId, postId, false);
  }
}

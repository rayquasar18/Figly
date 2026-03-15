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

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(EmailVerifiedGuard)
  async createPost(@Body() dto: CreatePostDto, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.postsService.createPost(userId, dto);
  }

  // Static routes MUST be before :id param routes
  @Get('saved')
  @UseGuards(EmailVerifiedGuard)
  async getSavedPosts(
    @Req() req: Request,
    @Query('cursor') cursor?: string,
  ) {
    const { userId } = req.user as any;
    return this.postsService.getSavedPosts(userId, cursor);
  }

  @Get('user/:username')
  @UseGuards(EmailVerifiedGuard)
  async getUserPosts(
    @Param('username') username: string,
    @Req() req: Request,
    @Query('cursor') cursor?: string,
  ) {
    const { userId } = req.user as any;
    return this.postsService.getUserPosts(username, userId, cursor);
  }

  @Get(':id')
  @UseGuards(EmailVerifiedGuard)
  async getPost(@Param('id') postId: string, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.postsService.getPost(postId, userId);
  }

  @Patch(':id')
  @UseGuards(EmailVerifiedGuard)
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
  @UseGuards(EmailVerifiedGuard)
  async deletePost(@Param('id') postId: string, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.postsService.deletePost(postId, userId);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  @UseGuards(EmailVerifiedGuard)
  async likePost(@Param('id') postId: string, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.postsService.toggleLike(userId, postId, true);
  }

  @Delete(':id/like')
  @HttpCode(HttpStatus.OK)
  @UseGuards(EmailVerifiedGuard)
  async unlikePost(@Param('id') postId: string, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.postsService.toggleLike(userId, postId, false);
  }

  @Post(':id/bookmark')
  @HttpCode(HttpStatus.OK)
  @UseGuards(EmailVerifiedGuard)
  async bookmarkPost(@Param('id') postId: string, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.postsService.toggleBookmark(userId, postId, true);
  }

  @Delete(':id/bookmark')
  @HttpCode(HttpStatus.OK)
  @UseGuards(EmailVerifiedGuard)
  async unbookmarkPost(@Param('id') postId: string, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.postsService.toggleBookmark(userId, postId, false);
  }
}

import {
  Controller,
  Get,
  Post,
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
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('posts/:postId/comments')
  @UseGuards(OptionalJwtAuthGuard)
  async getComments(
    @Param('postId') postId: string,
    @Query('cursor') cursor?: string,
    @Query('take') take?: string,
  ) {
    return this.commentsService.getComments(
      postId,
      cursor,
      take ? parseInt(take, 10) : undefined,
    );
  }

  @Post('posts/:postId/comments')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async createComment(
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
    @Req() req: Request,
  ) {
    const { userId } = req.user as any;
    return this.commentsService.createComment(userId, postId, dto);
  }

  @Delete('comments/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async deleteComment(@Param('id') commentId: string, @Req() req: Request) {
    const { userId } = req.user as any;
    return this.commentsService.deleteComment(commentId, userId);
  }
}

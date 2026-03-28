import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { CreateReportDto } from './dto/create-report.dto';

@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
@Controller('moderation')
export class ModerationController {
  constructor(private moderationService: ModerationService) {}

  @Post('report')
  async createReport(@Req() req: any, @Body() dto: CreateReportDto) {
    const report = await this.moderationService.createReport(req.user.userId, dto);
    return { success: true, report };
  }

  @Post('block/:userId')
  async blockUser(@Req() req: any, @Param('userId') userId: string) {
    await this.moderationService.blockUser(req.user.userId, userId);
    return { success: true };
  }

  @Delete('block/:userId')
  async unblockUser(@Req() req: any, @Param('userId') userId: string) {
    await this.moderationService.unblockUser(req.user.userId, userId);
    return { success: true };
  }

  @Post('mute/:userId')
  async muteUser(@Req() req: any, @Param('userId') userId: string) {
    await this.moderationService.muteUser(req.user.userId, userId);
    return { success: true };
  }

  @Delete('mute/:userId')
  async unmuteUser(@Req() req: any, @Param('userId') userId: string) {
    await this.moderationService.unmuteUser(req.user.userId, userId);
    return { success: true };
  }

  @Get('blocked')
  async getBlockedUsers(@Req() req: any, @Query('cursor') cursor?: string) {
    return this.moderationService.getBlockedUsers(req.user.userId, cursor);
  }

  @Get('muted')
  async getMutedUsers(@Req() req: any, @Query('cursor') cursor?: string) {
    return this.moderationService.getMutedUsers(req.user.userId, cursor);
  }

  @Get('block-status/:userId')
  async getBlockStatus(@Req() req: any, @Param('userId') userId: string) {
    const isBlocked = await this.moderationService.isBlocked(req.user.userId, userId);
    return { isBlocked };
  }

  @Get('mute-status/:userId')
  async getMuteStatus(@Req() req: any, @Param('userId') userId: string) {
    const isMuted = await this.moderationService.isMuted(req.user.userId, userId);
    return { isMuted };
  }
}

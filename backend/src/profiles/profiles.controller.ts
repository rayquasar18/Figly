import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ProfilesService } from './profiles.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('check/:username')
  async checkUsername(@Param('username') username: string) {
    const available = await this.profilesService.isUsernameAvailable(username);
    return { available };
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  async searchProfiles(@Query('q') query: string) {
    if (!query) return [];
    return this.profilesService.searchProfiles(query);
  }

  @Get(':username')
  @UseGuards(OptionalJwtAuthGuard)
  async getProfile(
    @Param('username') username: string,
    @Req() req: Request,
  ) {
    const viewerId = (req.user as any)?.userId || null;
    return this.profilesService.getProfile(username, viewerId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @Req() req: Request,
  ) {
    const { userId } = req.user as any;
    return this.profilesService.updateProfile(userId, dto);
  }
}

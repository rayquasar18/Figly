import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { AdminGuard } from './guards/admin.guard';

@UseGuards(JwtAuthGuard, EmailVerifiedGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('reports')
  async getReportQueue(
    @Query('cursor') cursor?: string,
    @Query('sort') sort: 'newest' | 'most_reported' = 'newest',
  ) {
    return this.adminService.getReportQueue({ sort, cursor });
  }

  @Post('reports/:id/dismiss')
  async dismissReport(@Param('id') id: string, @Req() req: any) {
    return this.adminService.dismissReport(id, req.user.userId);
  }

  @Post('reports/:id/remove-content')
  async removeContent(@Param('id') id: string, @Req() req: any) {
    return this.adminService.removeContent(id, req.user.userId);
  }

  @Post('users/:id/warn')
  async warnUser(@Param('id') id: string, @Req() req: any) {
    return this.adminService.warnUser(id, req.user.userId);
  }

  @Post('users/:id/ban')
  async banUser(@Param('id') id: string, @Req() req: any) {
    return this.adminService.banUser(id, req.user.userId);
  }
}

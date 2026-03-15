import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { PushService } from './push/push.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private gateway: NotificationsGateway,
    private pushService: PushService,
  ) {}

  @Sse('stream')
  @UseGuards(JwtAuthGuard)
  stream(@Req() req: any) {
    const userId = req.user.sub;
    return this.gateway.subscribe(userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getNotifications(
    @Req() req: any,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.sub;
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    return this.notificationsService.getNotifications(userId, cursor, parsedLimit);
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  async getUnreadCount(@Req() req: any) {
    const userId = req.user.sub;
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.sub;
    await this.notificationsService.markAsRead(userId, id);
    return { success: true };
  }

  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  async markAllAsRead(@Req() req: any) {
    const userId = req.user.sub;
    await this.notificationsService.markAllAsRead(userId);
    return { success: true };
  }

  @Post('push-subscription')
  @UseGuards(JwtAuthGuard)
  async savePushSubscription(
    @Req() req: any,
    @Body() body: { endpoint: string; p256dh: string; auth: string },
  ) {
    const userId = req.user.sub;
    await this.pushService.saveSubscription(userId, body);
    return { success: true };
  }

  @Delete('push-subscription')
  @UseGuards(JwtAuthGuard)
  async removePushSubscription(
    @Req() req: any,
    @Body() body: { endpoint: string },
  ) {
    const userId = req.user.sub;
    await this.pushService.removeSubscription(userId, body.endpoint);
    return { success: true };
  }
}

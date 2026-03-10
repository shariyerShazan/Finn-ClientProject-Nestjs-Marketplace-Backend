/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/notification/notification.controller.ts

import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user notifications' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async getNotifications(@Req() req: any, @Query('lang') lang: string = 'en') {
    return await this.notificationService.getMyNotifications(req.user.id, lang);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get total unread notifications count' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async getUnreadCount(@Req() req: any, @Query('lang') lang: string = 'en') {
    return await this.notificationService.getUnreadCount(req.user.id, lang);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async markAllRead(@Req() req: any, @Query('lang') lang: string = 'en') {
    return await this.notificationService.markAllAsRead(req.user.id, lang);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'no', 'se', 'dk', 'is'],
  })
  async markRead(
    @Param('id') id: string,
    @Req() req: any,
    @Query('lang') lang: string = 'en',
  ) {
    return await this.notificationService.markAsRead(id, req.user.id, lang);
  }
}

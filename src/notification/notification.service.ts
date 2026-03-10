/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { TranslationService } from 'src/translation/translation.service';
import { CreateNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
    private readonly translationService: TranslationService,
  ) {}

  /**
   * Create and emit notification with translation support
   */
  async createNotification(dto: CreateNotificationDto) {
    const {
      userId,
      title,
      message,
      type,
      adId,
      conversationId,
      lang = 'en',
    } = dto;

    try {
      const [translatedTitle, translatedMsg] = await Promise.all([
        this.translationService.translate(title, lang),
        this.translationService.translate(message, lang),
      ]);

      const notification = await this.prisma.notification.create({
        data: {
          userId,
          title: translatedTitle,
          message: translatedMsg,
          type,
          adId,
          conversationId,
        },
        include: {
          ad: {
            select: {
              title: true,
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      });

      // Emit to user's private room
      this.chatGateway.server.to(userId).emit('notification', notification);

      return notification;
    } catch (error) {
      throw new InternalServerErrorException(
        await this.translationService.translate(
          'Failed to create notification',
          lang,
        ),
      );
    }
  }

  /**
   * Fetch notifications with success message translation
   */
  async getMyNotifications(userId: string, lang: string = 'en') {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: { userId },
        include: {
          ad: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return {
        success: true,
        message: await this.translationService.translate(
          'Notifications fetched successfully',
          lang,
        ),
        data: notifications,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        await this.translationService.translate(
          'Failed to fetch notifications',
          lang,
        ),
      );
    }
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(
    notificationId: string,
    userId: string,
    lang: string = 'en',
  ) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException(
        await this.translationService.translate('Notification not found', lang),
      );
    }

    try {
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      return {
        success: true,
        message: await this.translationService.translate(
          'Marked as read',
          lang,
        ),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        await this.translationService.translate(
          'Failed to update notification',
          lang,
        ),
      );
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string, lang: string = 'en') {
    try {
      await this.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      return {
        success: true,
        message: await this.translationService.translate(
          'All notifications marked as read',
          lang,
        ),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        await this.translationService.translate(
          'Failed to update notifications',
          lang,
        ),
      );
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string, lang: string = 'en') {
    try {
      const count = await this.prisma.notification.count({
        where: { userId, isRead: false },
      });

      return {
        success: true,
        message: await this.translationService.translate(
          'Unread count fetched',
          lang,
        ),
        data: { count },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        await this.translationService.translate('Failed to fetch count', lang),
      );
    }
  }
}

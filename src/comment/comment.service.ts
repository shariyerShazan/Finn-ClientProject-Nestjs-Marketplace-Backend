/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { TranslationService } from 'src/translation/translation.service';
import { NotificationType } from 'prisma/generated/prisma/enums';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class CommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
    private readonly translationService: TranslationService,
    private readonly notificationService: NotificationService,
  ) {}

  async createComment(
    userId: string,
    dto: CreateCommentDto,
    lang: string = 'en',
  ) {
    try {
      const ad = await this.prisma.ad.findUnique({ where: { id: dto.adId } });
      if (!ad) {
        throw new NotFoundException(
          await this.translationService.translate('Ad not found', lang),
        );
      }

      const comment = await this.prisma.comment.create({
        data: {
          message: dto.message,
          userId,
          adId: dto.adId,
          parentId: dto.parentId || null,
        },
        include: {
          user: {
            select: { firstName: true, lastName: true, profilePicture: true },
          },
        },
      });

      // --- NEW NOTIFICATION LOGIC ---
      if (!dto.parentId) {
        // নতুন কমেন্ট হলে সেলারকে জানাবে
        if (ad.sellerId !== userId) {
          await this.notificationService.createNotification({
            userId: ad.sellerId,
            title: 'New Comment',
            message: `Someone commented on your ad: ${ad.title}`,
            type: NotificationType.NEW_COMMENT,
            adId: ad.id,
            lang,
          });
        }
      } else {
        const parentComment = await this.prisma.comment.findUnique({
          where: { id: dto.parentId },
          select: { userId: true },
        });

        if (parentComment && parentComment.userId !== userId) {
          await this.notificationService.createNotification({
            userId: parentComment.userId,
            title: 'New Reply',
            message: `Someone replied to your comment on: ${ad.title}`,
            type: NotificationType.NEW_REPLY,
            adId: ad.id,
            lang,
          });
        }
      }

      return {
        success: true,
        message: await this.translationService.translate(
          'Comment posted successfully',
          lang,
        ),
        data: comment,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error(error);
      throw new InternalServerErrorException(
        await this.translationService.translate(
          'Failed to create comment',
          lang,
        ),
      );
    }
  }

  async getCommentsByAd(adId: string) {
    try {
      const comments = await this.prisma.comment.findMany({
        where: { adId, parentId: null },
        include: {
          user: {
            select: { firstName: true, lastName: true, profilePicture: true },
          },
          replies: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  profilePicture: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return { success: true, data: comments };
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch comments');
    }
  }

  async updateComment(
    userId: string,
    commentId: string,
    dto: UpdateCommentDto,
    lang: string = 'en',
  ) {
    try {
      const comment = await this.prisma.comment.findUnique({
        where: { id: commentId },
      });

      if (!comment) {
        throw new NotFoundException(
          await this.translationService.translate('Comment not found', lang),
        );
      }

      if (comment.userId !== userId) {
        throw new ForbiddenException(
          await this.translationService.translate(
            'You can only edit your own comments',
            lang,
          ),
        );
      }

      const updatedComment = await this.prisma.comment.update({
        where: { id: commentId },
        data: { message: dto.message },
      });

      return {
        success: true,
        message: await this.translationService.translate(
          'Comment updated',
          lang,
        ),
        data: updatedComment,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        await this.translationService.translate('Update failed', lang),
      );
    }
  }

  async deleteComment(userId: string, commentId: string, lang: string = 'en') {
    try {
      const comment = await this.prisma.comment.findUnique({
        where: { id: commentId },
      });

      if (!comment) {
        throw new NotFoundException(
          await this.translationService.translate('Comment not found', lang),
        );
      }

      if (comment.userId !== userId) {
        throw new ForbiddenException(
          await this.translationService.translate('Access denied', lang),
        );
      }

      await this.prisma.comment.delete({ where: { id: commentId } });

      return {
        success: true,
        message: await this.translationService.translate(
          'Comment deleted successfully',
          lang,
        ),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        await this.translationService.translate('Deletion failed', lang),
      );
    }
  }
}

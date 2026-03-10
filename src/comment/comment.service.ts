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

@Injectable()
export class CommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
    private readonly translationService: TranslationService,
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

      // --- REAL-TIME NOTIFICATION LOGIC ---
      if (!dto.parentId) {
        // নতুন কমেন্ট হলে সেলারকে জানাবে
        if (ad.sellerId !== userId) {
          const msg = await this.translationService.translate(
            'Someone commented on your ad',
            lang,
          );
          this.chatGateway.server.to(ad.sellerId).emit('notification', {
            type: 'NEW_COMMENT',
            message: `${msg}: ${ad.title}`,
            adId: ad.id,
          });
        }
      } else {
        // রিপ্লাই হলে প্যারেন্ট কমেন্টারকে জানাবে
        const parentComment = await this.prisma.comment.findUnique({
          where: { id: dto.parentId },
          select: { userId: true },
        });

        if (parentComment && parentComment.userId !== userId) {
          const msg = await this.translationService.translate(
            'Someone replied to your comment on',
            lang,
          );
          this.chatGateway.server
            .to(parentComment.userId)
            .emit('notification', {
              type: 'NEW_REPLY',
              message: `${msg}: ${ad.title}`,
              adId: ad.id,
              commentId: comment.id,
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

import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';

@Injectable()
export class CommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async createComment(userId: string, dto: CreateCommentDto) {
    try {
      const ad = await this.prisma.ad.findUnique({ where: { id: dto.adId } });
      if (!ad) throw new NotFoundException('Ad not found');

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

      if (!dto.parentId) {
        if (ad.sellerId !== userId) {
          this.chatGateway.server.to(ad.sellerId).emit('notification', {
            type: 'NEW_COMMENT',
            message: `Someone commented on your ad: ${ad.title}`,
            adId: ad.id,
          });
        }
      } else {
        const parentComment = await this.prisma.comment.findUnique({
          where: { id: dto.parentId },
          select: { userId: true },
        });

        if (parentComment && parentComment.userId !== userId) {
          this.chatGateway.server
            .to(parentComment.userId)
            .emit('notification', {
              type: 'NEW_REPLY',
              message: `Someone replied to your comment on: ${ad.title}`,
              adId: ad.id,
              commentId: comment.id,
            });
        }
      }

      return {
        success: true,
        message: 'Comment posted successfully',
        data: comment,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to create comment');
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
    } catch (error: any) {
      console.log(error);
      throw new InternalServerErrorException('Failed to fetch comments');
    }
  }

  async updateComment(
    userId: string,
    commentId: string,
    dto: UpdateCommentDto,
  ) {
    try {
      const comment = await this.prisma.comment.findUnique({
        where: { id: commentId },
      });

      if (!comment) throw new NotFoundException('Comment not found');
      if (comment.userId !== userId)
        throw new ForbiddenException('You can only edit your own comments');

      const updatedComment = await this.prisma.comment.update({
        where: { id: commentId },
        data: { message: dto.message },
      });

      return {
        success: true,
        message: 'Comment updated',
        data: updatedComment,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      throw new InternalServerErrorException('Update failed');
    }
  }

  async deleteComment(userId: string, commentId: string) {
    try {
      const comment = await this.prisma.comment.findUnique({
        where: { id: commentId },
      });

      if (!comment) throw new NotFoundException('Comment not found');

      if (comment.userId !== userId)
        throw new ForbiddenException('Access denied');

      await this.prisma.comment.delete({ where: { id: commentId } });

      return { success: true, message: 'Comment deleted successfully' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      throw new InternalServerErrorException('Deletion failed');
    }
  }
}

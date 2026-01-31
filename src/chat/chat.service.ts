/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Create or Get Conversation
  async getOrCreateConversation(currentUserId: string, targetUserId: string) {
    try {
      if (currentUserId === targetUserId) {
        throw new ForbiddenException('You cannot chat with yourself');
      }

      const users = await this.prisma.auth.findMany({
        where: { id: { in: [currentUserId, targetUserId] } },
        select: { id: true, role: true },
      });

      if (users.length < 2) throw new NotFoundException('User not found');

      const canChat = users.some(
        (u) => u.role === 'SELLER' || u.role === 'ADMIN',
      );
      if (!canChat) {
        throw new ForbiddenException(
          'User-to-User chat is restricted. One participant must be a Seller.',
        );
      }

      let conversation = await this.prisma.conversation.findFirst({
        where: {
          AND: [
            { participants: { some: { userId: currentUserId } } },
            { participants: { some: { userId: targetUserId } } },
          ],
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  profilePicture: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: {
            participants: {
              create: [{ userId: currentUserId }, { userId: targetUserId }],
            },
          },
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    profilePicture: true,
                    role: true,
                  },
                },
              },
            },
          },
        });
      }

      return { success: true, conversation };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('getOrCreateConversation Error:', error);
      throw new InternalServerErrorException('Error initializing conversation');
    }
  }

  // 2. Send Message (Text and/or Cloudinary Image)
  async sendMessage(senderId: string, dto: SendMessageDto) {
    const { conversationId, text, fileUrl, fileType } = dto;
    try {
      const message = await this.prisma.message.create({
        data: {
          conversationId,
          senderId,
          text,
          fileUrl,
          fileType,
        },
        include: {
          sender: {
            select: { firstName: true, lastName: true, profilePicture: true },
          },
        },
      });

      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return { success: true, message };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('sendMessage Error:', error);
      throw new InternalServerErrorException('Failed to send message');
    }
  }

  async getMyConversations(userId: string) {
    try {
      const conversations = await this.prisma.conversation.findMany({
        where: { participants: { some: { userId } } },
        include: {
          participants: {
            where: { userId: { not: userId } },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  profilePicture: true,
                  role: true,
                },
              },
            },
          },
          messages: { take: 1, orderBy: { createdAt: 'desc' } },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return { success: true, conversations };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('getMyConversations Error:', error);
      throw new InternalServerErrorException('Could not fetch conversations');
    }
  }

  async getMessages(conversationId: string, userId: string) {
    try {
      await this.prisma.message.updateMany({
        where: { conversationId, senderId: { not: userId }, isRead: false },
        data: { isRead: true },
      });

      const messages = await this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        include: {
          sender: {
            select: { firstName: true, lastName: true, profilePicture: true },
          },
        },
      });

      return { success: true, messages };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('getMessages Error:', error);
      throw new InternalServerErrorException('Could not fetch messages');
    }
  }

  async blockConversation(conversationId: string, userId: string) {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { participants: true },
      });

      if (!conversation) throw new NotFoundException('Conversation not found');

      // Check membership
      const isParticipant = conversation.participants.some(
        (p) => p.userId === userId,
      );
      if (!isParticipant)
        throw new ForbiddenException('This is not your conversession!');

      return await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          isBlocked: true,
          blockedById: userId,
        },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('blockConversation Error:', error);
      throw new InternalServerErrorException('Eorror In blocking');
    }
  }

  // 2. Unblock Conversation
  async unblockConversation(conversationId: string, userId: string) {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) throw new NotFoundException('Conversation Not found');

      // Only the person who blocked can unblock
      if (conversation.blockedById !== userId) {
        throw new ForbiddenException('No Blocking in your side!');
      }

      return await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { isBlocked: false, blockedById: null },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Unblock failed');
    }
  }

  // 3. Delete Entire Conversation (Cascade delete)
  async deleteConversation(conversationId: string, userId: string) {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { participants: true },
      });

      if (!conversation)
        throw new NotFoundException(
          'Conversation already deleted or not found!',
        );

      // Check membership
      const isParticipant = conversation.participants.some(
        (p) => p.userId === userId,
      );
      if (!isParticipant)
        throw new ForbiddenException("You can't delete this conversation!");

      // Delete conversation (Messages & Participants delete hobe automatically)
      await this.prisma.conversation.delete({
        where: { id: conversationId },
      });

      return {
        success: true,
        message: 'Conversation Deleted successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('deleteConversation Error:', error);
      throw new InternalServerErrorException('Delete Coversation failed!');
    }
  }
}

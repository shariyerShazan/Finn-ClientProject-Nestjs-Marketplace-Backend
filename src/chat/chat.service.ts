/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/chat.dto';
import { TranslationService } from 'src/translation/translation.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly translationService: TranslationService,
  ) {}

  // 1. Create or Get Conversation
  async getOrCreateConversation(
    currentUserId: string,
    targetUserId: string,
    lang: string = 'en',
  ) {
    try {
      if (currentUserId === targetUserId) {
        throw new ForbiddenException(
          await this.translationService.translate(
            'You cannot chat with yourself',
            lang,
          ),
        );
      }

      const users = await this.prisma.auth.findMany({
        where: { id: { in: [currentUserId, targetUserId] } },
        select: { id: true, role: true },
      });

      if (users.length < 2) {
        throw new NotFoundException(
          await this.translationService.translate('User not found', lang),
        );
      }

      const canChat = users.some(
        (u) => u.role === 'SELLER' || u.role === 'ADMIN',
      );
      if (!canChat) {
        throw new ForbiddenException(
          await this.translationService.translate(
            'User-to-User chat is restricted. One participant must be a Seller.',
            lang,
          ),
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
      throw new InternalServerErrorException(
        await this.translationService.translate(
          'Error initializing conversation',
          lang,
        ),
      );
    }
  }

  // 2. Send Message
  async sendMessage(
    senderId: string,
    dto: SendMessageDto,
    lang: string = 'en',
  ) {
    const { conversationId, text, fileUrl, fileType } = dto;
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { isBlocked: true, blockedById: true },
    });

    if (!conversation) {
      throw new NotFoundException(
        await this.translationService.translate('Conversation not found', lang),
      );
    }

    if (conversation.isBlocked) {
      if (conversation.blockedById === senderId) {
        throw new ForbiddenException(
          await this.translationService.translate(
            'You have blocked this conversation. Please unblock to send messages.',
            lang,
          ),
        );
      }
      const blockerMsg = await this.translationService.translate(
        'This conversation is blocked',
        lang,
      );
      throw new ForbiddenException(blockerMsg);
    }

    try {
      const message = await this.prisma.message.create({
        data: { conversationId, senderId, text, fileUrl, fileType },
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
      throw new InternalServerErrorException(
        await this.translationService.translate('Failed to send message', lang),
      );
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
      throw new InternalServerErrorException('Could not fetch messages');
    }
  }

  async blockConversation(
    conversationId: string,
    userId: string,
    lang: string = 'en',
  ) {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { participants: true },
      });

      if (!conversation)
        throw new NotFoundException(
          await this.translationService.translate(
            'Conversation not found',
            lang,
          ),
        );

      const isParticipant = conversation.participants.some(
        (p) => p.userId === userId,
      );
      if (!isParticipant)
        throw new ForbiddenException(
          await this.translationService.translate('Access denied', lang),
        );

      return await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { isBlocked: true, blockedById: userId },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        await this.translationService.translate('Error In blocking', lang),
      );
    }
  }

  async unblockConversation(
    conversationId: string,
    userId: string,
    lang: string = 'en',
  ) {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation)
        throw new NotFoundException(
          await this.translationService.translate(
            'Conversation not found',
            lang,
          ),
        );

      if (conversation.blockedById !== userId) {
        throw new ForbiddenException(
          await this.translationService.translate(
            'No Blocking in your side!',
            lang,
          ),
        );
      }

      return await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { isBlocked: false, blockedById: null },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        await this.translationService.translate('Unblock failed', lang),
      );
    }
  }

  async deleteConversation(
    conversationId: string,
    userId: string,
    lang: string = 'en',
  ) {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { participants: true },
      });

      if (!conversation)
        throw new NotFoundException(
          await this.translationService.translate(
            'Conversation not found',
            lang,
          ),
        );

      const isParticipant = conversation.participants.some(
        (p) => p.userId === userId,
      );
      if (!isParticipant)
        throw new ForbiddenException(
          await this.translationService.translate(
            "You can't delete this conversation!",
            lang,
          ),
        );

      await this.prisma.conversation.delete({ where: { id: conversationId } });

      return {
        success: true,
        message: await this.translationService.translate(
          'Conversation Deleted successfully',
          lang,
        ),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        await this.translationService.translate(
          'Delete Coversation failed!',
          lang,
        ),
      );
    }
  }
}

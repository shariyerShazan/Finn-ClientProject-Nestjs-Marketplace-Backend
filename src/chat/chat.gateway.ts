/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  public static activeUsers: Map<string, string> = new Map<string, string>();

  handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId as string | undefined;

    if (!userId) {
      client.disconnect();
      return;
    }

    ChatGateway.activeUsers.set(userId, client.id);

    console.log('Client Connected:', {
      socketId: client.id,
      userId,
    });

    this.broadcastOnlineUsers();
  }

  handleDisconnect(client: Socket) {
    const entries = Array.from(ChatGateway.activeUsers.entries());
    for (const [userId, socketId] of entries) {
      if (socketId === client.id) {
        ChatGateway.activeUsers.delete(userId);
        break;
      }
    }

    console.log(`Client Disconnected: ${client.id}`);
    this.broadcastOnlineUsers();
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody('conversationId') conversationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(conversationId);
    console.log(`User joined room: ${conversationId}`);
  }

  private broadcastOnlineUsers() {
    const onlineUserIds: string[] = Array.from(ChatGateway.activeUsers.keys());
    this.server.emit('onlineUsers.list', onlineUserIds);
  }

  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers(): string[] | string {
    const onlineUserIds = Array.from(ChatGateway.activeUsers.keys());
    return onlineUserIds;
  }

  sendToRoom(conversationId: string, event: string, payload: any) {
    this.server.to(conversationId).emit(event, payload);
  }
}

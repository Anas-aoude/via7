import type { Server, Socket } from "socket.io";

export const registerConversationSocket = (_io: Server, socket: Socket) => {
  socket.on("conversation:join", (conversationId: string) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  socket.on("conversation:leave", (conversationId: string) => {
    socket.leave(conversationId);
    console.log(`Socket ${socket.id} left conversation ${conversationId}`);
  });
};
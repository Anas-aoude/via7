import type { Server, Socket } from "socket.io";

export const registerTypingSocket = (_io: Server, socket: Socket) => {
  socket.on("typing:start", (data) => {
    socket.to(data.conversationId).emit("typing:start", data);
  });

  socket.on("typing:stop", (data) => {
    socket.to(data.conversationId).emit("typing:stop", data);
  });
};
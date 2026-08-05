import type { Server, Socket } from "socket.io";

export const registerMessageSocket = (io: Server, socket: Socket) => {
  socket.on("message:send", (data) => {
    io.to(data.conversationId).emit("message:new", data.message);

    if (data.receiverId) {
      io.to(`user:${data.receiverId}`).emit("notification:unread-increment", {
        userId: data.receiverId,
      });
    }
  });

  socket.on("message:seen", (data) => {
    io.to(data.conversationId).emit("message:seen:update", data);
  });
};
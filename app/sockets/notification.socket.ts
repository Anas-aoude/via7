import type { Server, Socket } from "socket.io";

export const registerNotificationSocket = (io: Server, socket: Socket) => {
  socket.on("notification:unread-reset", (data) => {
    if (!data.userId) return;

    io.to(`user:${data.userId}`).emit("notification:unread-reset", {
      userId: data.userId,
    });
  });
};
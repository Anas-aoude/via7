import type { Server, Socket } from "socket.io";

import { OnlineService } from "@/app/libs/redis/online";

export const registerOnlineSocket = (io: Server, socket: Socket) => {
  socket.on("user:online", async (userId: string) => {
    if (!userId) return;

    socket.data.userId = userId;
    socket.join(`user:${userId}`);

    await OnlineService.setOnline(userId, socket.id);

    io.emit("user:status", {
      userId,
      isOnline: true,
    });

    console.log(`User ${userId} is online`);
  });

  socket.on("user:status:check", async (userId: string) => {
    if (!userId) return;

    const isOnline = await OnlineService.isOnline(userId);

    socket.emit("user:status", {
      userId,
      isOnline,
    });
  });

  socket.on("disconnect", async () => {
    const userId = socket.data.userId as string | undefined;

    if (userId) {
      const becameOffline = await OnlineService.setOffline(userId, socket.id);

      if (becameOffline) {
        io.emit("user:status", {
          userId,
          isOnline: false,
        });

        console.log(`User ${userId} is offline`);
      }
    }

    console.log("Socket disconnected:", socket.id);
  });
};
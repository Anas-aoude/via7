import type { Server } from "socket.io";

import { registerConversationSocket } from "./conversation.socket";
import { registerMessageSocket } from "./message.socket";
import { registerNotificationSocket } from "./notification.socket";
import { registerOnlineSocket } from "./online.socket";
import { registerTypingSocket } from "./typing.socket";

export const registerSockets = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    registerOnlineSocket(io, socket);
    registerConversationSocket(io, socket);
    registerMessageSocket(io, socket);
    registerNotificationSocket(io, socket);
    registerTypingSocket(io, socket);
  });
};
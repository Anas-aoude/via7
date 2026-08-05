"use client";

import { useEffect, useState } from "react";

import { socket } from "@/app/libs/socket";

interface UserOnlineStatusProps {
  userId: string;
}

const UserOnlineStatus: React.FC<UserOnlineStatusProps> = ({ userId }) => {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!userId) return;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("user:status:check", userId);

    const handleUserStatus = (data: {
      userId: string;
      isOnline: boolean;
    }) => {
      if (data.userId === userId) {
        setIsOnline(data.isOnline);
      }
    };

    socket.on("user:status", handleUserStatus);

    return () => {
      socket.off("user:status", handleUserStatus);
    };
  }, [userId]);

  return (
    <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
      <span
        className={`h-2 w-2 rounded-full ${
          isOnline ? "bg-green-500" : "bg-neutral-400"
          }`}
      />
      <span>{isOnline ? "Online" : "Offline"}</span>
    </div>
  );
};

export default UserOnlineStatus;
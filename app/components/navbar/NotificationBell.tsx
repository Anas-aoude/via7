"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { IoNotificationsOutline } from "react-icons/io5";
import { useRouter } from "next/navigation";

import { socket } from "@/app/libs/socket";
import useTranslation from "@/app/hooks/useTranslation";

interface NotificationBellProps {
  currentUserId?: string | null;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  currentUserId,
}) => {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const { language } = useTranslation();

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await axios.get("/api/conversations/unread-count");
      setCount(response.data.count || 0);
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    fetchUnreadCount();

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("user:online", currentUserId);

    const handleUnreadIncrement = (data: { userId: string }) => {
      if (data.userId !== currentUserId) return;

      setCount((current) => current + 1);
    };

    const handleUnreadReset = (data: { userId: string }) => {
      if (data.userId !== currentUserId) return;

      fetchUnreadCount();
    };

    socket.on("notification:unread-increment", handleUnreadIncrement);
    socket.on("notification:unread-reset", handleUnreadReset);

    return () => {
      socket.off("notification:unread-increment", handleUnreadIncrement);
      socket.off("notification:unread-reset", handleUnreadReset);
    };
  }, [currentUserId, fetchUnreadCount]);

  return (
    <div
      onClick={() => router.push(`/${language}/conversations`)}
      className="relative cursor-pointer p-3 rounded-full hover:bg-neutral-100 transition"
    >
      <IoNotificationsOutline size={22} />

      {count > 0 && (
        <div className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
          {count}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
"use client";

import axios from "axios";
import { useEffect, useState } from "react";

import { socket } from "@/app/libs/socket";

interface InboxMenuItemProps {
  onClick: () => void;
  currentUserId?: string | null;
}

const InboxMenuItem: React.FC<InboxMenuItemProps> = ({
  onClick,
  currentUserId,
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchInitialUnreadCount = async () => {
      try {
        const response = await axios.get("/api/conversations/unread-count");

        if (isMounted) {
          setCount(response.data.count || 0);
        }
      } catch {
        if (isMounted) {
          setCount(0);
        }
      }
    };

    fetchInitialUnreadCount();

    if (!socket.connected) {
      socket.connect();
    }

    if (currentUserId) {
      socket.emit("user:online", currentUserId);
    }

    const handleUnreadIncrement = (data: { userId: string }) => {
      if (!currentUserId || data.userId !== currentUserId) {
        return;
      }

      setCount((current) => current + 1);
    };

    const handleUnreadReset = (data: { userId: string }) => {
      if (!currentUserId || data.userId !== currentUserId) {
        return;
      }

      setCount(0);
    };

    socket.on("notification:unread-increment", handleUnreadIncrement);
    socket.on("notification:unread-reset", handleUnreadReset);

    return () => {
      isMounted = false;
      socket.off("notification:unread-increment", handleUnreadIncrement);
      socket.off("notification:unread-reset", handleUnreadReset);
    };
  }, [currentUserId]);

  return (
    <div
      onClick={onClick}
      className="
        px-4
        py-3
        hover:bg-neutral-100
        transition
        font-semibold
        flex
        items-center
        justify-between
        cursor-pointer
      "
    >
      <span>Inbox</span>

      {count > 0 && (
        <span className="bg-rose-500 text-white text-xs rounded-full px-2 py-1">
          {count}
        </span>
      )}
    </div>
  );
};

export default InboxMenuItem;
"use client";

import axios from "axios";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FaCheckDouble, FaFileAlt, FaUserCircle } from "react-icons/fa";

import { socket } from "@/app/libs/socket";
import useTranslation from "@/app/hooks/useTranslation";

interface Message {
  id: string;
  body: string | null;
  conversationId: string;
  senderId: string;
  createdAt: string | Date;
  isRead?: boolean;
  seenIds?: string[];
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  attachmentName?: string | null;
  sender: {
    id: string;
    name: string | null;
    avatarUrl?: string | null;
  };
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  conversationId: string;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  conversationId,
}) => {
  const { t, language } = useTranslation();

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const hasMarkedSeenRef = useRef(false);

  const [items, setItems] = useState<Message[]>(messages);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(messages.length >= 30);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setItems(messages);
  }, [messages]);

  const loadOlderMessages = async () => {
    if (isLoadingOlder || !hasMoreMessages || items.length === 0) {
      return;
    }

    try {
      setIsLoadingOlder(true);

      const firstMessageId = items[0].id;

      const response = await axios.get(
        `/api/conversations/${conversationId}/messages`,
        {
          params: {
            beforeMessageId: firstMessageId,
            limit: 30,
          },
        }
      );

      const olderMessages = response.data.messages || [];

      setItems((current) => [...olderMessages, ...current]);
      setHasMoreMessages(Boolean(response.data.hasMore));
    } catch (error) {
      console.log("[LOAD_OLDER_MESSAGES]", error);
    } finally {
      setIsLoadingOlder(false);
    }
  };
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("user:online", currentUserId);
    socket.emit("conversation:join", conversationId);

    const handleNewMessage = (message: Message) => {
      if (message.conversationId !== conversationId) {
        return;
      }

      setItems((current) => {
        const exists = current.some((item) => item.id === message.id);

        if (exists) {
          return current;
        }

        return [...current, message];
      });

      if (message.senderId !== currentUserId) {
        axios
          .post("/api/messages/seen", {
            conversationId,
          })
          .then(() => {
            socket.emit("message:seen", {
              conversationId,
              userId: currentUserId,
            });

            socket.emit("notification:unread-reset", {
              userId: currentUserId,
            });
          })
          .catch(() => { });
      }
    };

    const handleTypingStart = (data: { conversationId: string }) => {
      if (data.conversationId === conversationId) {
        setIsTyping(true);
      }
    };

    const handleTypingStop = (data: { conversationId: string }) => {
      if (data.conversationId === conversationId) {
        setIsTyping(false);
      }
    };

    const handleSeenUpdate = (data: {
      conversationId: string;
      userId: string;
    }) => {
      if (data.conversationId !== conversationId) {
        return;
      }

      setItems((current) =>
        current.map((message) => {
          if (message.senderId !== currentUserId) {
            return message;
          }

          const currentSeenIds = message.seenIds || [];

          if (currentSeenIds.includes(data.userId)) {
            return message;
          }

          return {
            ...message,
            isRead: true,
            seenIds: [...currentSeenIds, data.userId],
          };
        })
      );
    };

    socket.on("message:new", handleNewMessage);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("message:seen:update", handleSeenUpdate);

    return () => {
      socket.emit("conversation:leave", conversationId);

      socket.off("message:new", handleNewMessage);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("message:seen:update", handleSeenUpdate);
    };
  }, [conversationId, currentUserId]);

  useEffect(() => {
    const hasUnseenMessages = messages.some(
      (message) =>
        message.senderId !== currentUserId &&
        !(message.seenIds || []).includes(currentUserId)
    );

    if (!hasUnseenMessages || hasMarkedSeenRef.current) {
      return;
    }

    hasMarkedSeenRef.current = true;

    axios
      .post("/api/messages/seen", {
        conversationId,
      })
      .then(() => {
        socket.emit("message:seen", {
          conversationId,
          userId: currentUserId,
        });

        socket.emit("notification:unread-reset", {
          userId: currentUserId,
        });
      })
      .catch(() => {
        hasMarkedSeenRef.current = false;
      });
  }, [messages, conversationId, currentUserId]);

  useEffect(() => {
    if (isLoadingOlder) {
      return;
    }

    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [items, isTyping, isLoadingOlder]);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex flex-col gap-5">
        {hasMoreMessages && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={loadOlderMessages}
              disabled={isLoadingOlder}
              className="rounded-full border bg-white px-4 py-2 text-xs font-semibold text-neutral-600 shadow-sm transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingOlder
                ? t("conversations.loading")
                : t("conversations.loadOlderMessages")}
            </button>
          </div>
        )}
        {items.map((message) => {
          const isOwn = message.senderId === currentUserId;
          const senderName =
            message.sender.name ||
            t("conversations.user");

          const isSeenByOtherUser =
            isOwn &&
            (message.isRead ||
              (message.seenIds || []).some((id) => id !== currentUserId));

          return (
            <div
              key={message.id}
              className={`flex gap-3 ${
                isOwn ? "justify-end" : "justify-start"
                }`}
            >
              {!isOwn && (
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-neutral-100 flex items-center justify-center">
                  {message.sender.avatarUrl ? (
                    <Image
                      src={message.sender.avatarUrl}
                      alt={senderName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                      <FaUserCircle size={24} className="text-neutral-500" />
                    )}
                </div>
              )}

              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  isOwn
                    ? "bg-rose-500 text-white"
                    : "bg-neutral-100 text-neutral-900"
                  }`}
              >
                {!isOwn && (
                  <div className="mb-1 text-xs font-semibold opacity-70">
                    {senderName}
                  </div>
                )}

                {message.body && (
                  <div className="whitespace-pre-wrap text-sm">
                    {message.body}
                  </div>
                )}

                {message.attachmentUrl && (
                  <div className="mt-3">
                    {message.attachmentType?.startsWith("image/") ? (
                      <a
                        href={message.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden rounded-xl border bg-white"
                      >
                        <Image
                          src={message.attachmentUrl}
                          alt={
                            message.attachmentName ||
                            t("conversations.attachment")
                          }
                          width={320}
                          height={220}
                          className="h-auto w-full object-cover"
                        />
                      </a>
                    ) : (
                        <a
                          href={message.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                            isOwn
                              ? "border-white/30 bg-white/10 text-white"
                              : "bg-white text-neutral-800"
                            }`}
                        >
                          <FaFileAlt />
                          <span className="line-clamp-1">
                            {message.attachmentName ||
                              t("conversations.attachment")}
                          </span>
                        </a>
                      )}
                  </div>
                )}

                <div
                  className={`mt-2 flex items-center justify-end gap-1 text-[10px] ${
                    isOwn ? "text-white/70" : "text-neutral-500"
                    }`}
                >
                  <span>
                    {new Date(message.createdAt).toLocaleTimeString(
                      language === "de"
                        ? "de-DE"
                        : language === "ar"
                          ? "ar"
                          : "en-US",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </span>

                  {isOwn && (
                    <FaCheckDouble
                      size={12}
                      className={
                        isSeenByOtherUser ? "text-blue-200" : "text-white/50"
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-neutral-100 px-4 py-3 text-sm text-neutral-500">
              {t("conversations.typing")}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default MessageList;
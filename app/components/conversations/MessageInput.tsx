"use client";

import axios from "axios";
import { useCallback, useRef, useState } from "react";
import { FaPaperclip, FaPaperPlane, FaTimes } from "react-icons/fa";
import { toast } from "react-hot-toast";

import { socket } from "@/app/libs/socket";
import useTranslation from "@/app/hooks/useTranslation";

interface MessageInputProps {
  conversationId: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ conversationId }) => {
  const { t } = useTranslation();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSelectFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];

      if (!selectedFile) {
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error(t("conversations.fileTooLarge"));
        return;
      }

      setFile(selectedFile);
    },
    [t]
  );

  const uploadFile = useCallback(async () => {
    if (!file) {
      return null;
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post("/api/chat-attachments", formData);

    return response.data;
  }, [file]);

  const handleTyping = useCallback(
    (value: string) => {
      setMessage(value);

      socket.emit("typing:start", {
        conversationId,
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing:stop", {
          conversationId,
        });
      }, 1200);
    },
    [conversationId]
  );

  const onSubmit = useCallback(async () => {
    try {
      if (!message.trim() && !file) {
        return;
      }

      setIsLoading(true);

      const uploadedFile = await uploadFile();

      const response = await axios.post("/api/messages", {
        conversationId,
        body: message.trim(),
        attachmentUrl: uploadedFile?.url,
        attachmentType: uploadedFile?.type,
        attachmentName: uploadedFile?.name,
      });

      if (!socket.connected) {
        socket.connect();
      }

      socket.emit("message:send", {
        conversationId,
        message: response.data,
        receiverId: response.data.receiverId,
      });

      socket.emit("typing:stop", {
        conversationId,
      });

      setMessage("");
      setFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch {
      toast.error(t("conversations.somethingWentWrong"));
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, file, message, uploadFile, t]);

  return (
    <div className="border-t bg-white p-4">
      {file && (
        <div className="mb-3 flex items-center justify-between rounded-xl border bg-neutral-50 px-4 py-3 text-sm">
          <div className="line-clamp-1">📎 {file.name}</div>

          <button
            type="button"
            onClick={() => setFile(null)}
            className="text-neutral-500 hover:text-black"
          >
            <FaTimes />
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          hidden
          onChange={onSelectFile}
        />

        <button
          type="button"
          disabled={isLoading}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-full border p-3 hover:bg-neutral-100 disabled:opacity-50"
        >
          <FaPaperclip />
        </button>

        <input
          value={message}
          disabled={isLoading}
          onChange={(event) => handleTyping(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
          placeholder={t("conversations.writeMessage")}
          className="flex-1 rounded-full border px-5 py-3 outline-none focus:border-black disabled:opacity-50"
        />

        <button
          type="button"
          disabled={isLoading}
          onClick={onSubmit}
          className="rounded-full bg-rose-500 p-4 text-white hover:bg-rose-600 disabled:opacity-50"
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
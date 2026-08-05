"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";

import useTranslation from "@/app/hooks/useTranslation";

interface DeleteConversationButtonProps {
  conversationId: string;
}

const DeleteConversationButton: React.FC<DeleteConversationButtonProps> = ({
  conversationId,
}) => {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      t("conversations.deleteConversationConfirm")
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsLoading(true);

      await axios.delete(`/api/conversations/${conversationId}`);

      toast.success(t("conversations.conversationDeleted"));

      router.push(`/${language}/conversations`);
      router.refresh();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error ||
        t("conversations.somethingWentWrong")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isLoading}
      className="
        text-sm
        text-rose-500
        font-semibold
        hover:underline
        disabled:opacity-50
        disabled:cursor-not-allowed
      "
    >
      {isLoading
        ? t("conversations.deleting")
        : t("conversations.delete")}
    </button>
  );
};

export default DeleteConversationButton;
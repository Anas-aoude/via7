"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";

import useTranslation from "@/app/hooks/useTranslation";

interface BlockUserButtonProps {
  targetUserId: string;
  isBlocked: boolean;
}

const BlockUserButton: React.FC<BlockUserButtonProps> = ({
  targetUserId,
  isBlocked,
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);

      if (isBlocked) {
        await axios.post("/api/users/unblock", {
          userId: targetUserId,
        });

        toast.success(t("conversations.userUnblocked"));
      } else {
        await axios.post("/api/users/block", {
          userId: targetUserId,
        });

        toast.success(t("conversations.userBlocked"));
      }

      router.refresh();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error ||
        t("conversations.somethingWentWrong")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="
        text-sm
        font-semibold
        text-neutral-600
        hover:text-rose-500
        disabled:opacity-50
        disabled:cursor-not-allowed
      "
    >
      {loading
        ? t("conversations.loading")
        : isBlocked
          ? t("conversations.unblockUser")
          : t("conversations.blockUser")}
    </button>
  );
};

export default BlockUserButton;
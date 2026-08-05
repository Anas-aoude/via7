"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";

import useTranslation from "@/app/hooks/useTranslation";

interface AccountListingActionsProps {
  listingId: string;
  isActive: boolean;
}

const AccountListingActions: React.FC<AccountListingActionsProps> = ({
  listingId,
  isActive,
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleToggleActive = async () => {
    try {
      setLoading(true);

      await axios.patch(`/api/account/listings/${listingId}`);

      toast.success(
        isActive
          ? t("account.listingDeactivated")
          : t("account.listingActivated")
      );

      router.refresh();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error || t("account.somethingWentWrong")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(t("account.deleteListingConfirm"));

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      await axios.delete(`/api/account/listings/${listingId}`);

      toast.success(t("account.listingDeleted"));
      router.refresh();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error || t("account.somethingWentWrong")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/listings/${listingId}`}
        className="text-sm font-semibold hover:underline"
      >
        {t("account.view")}
      </Link>

      <Link
        href={`/listings/${listingId}/edit`}
        className="text-sm font-semibold text-blue-600 hover:underline"
      >
        {t("account.edit")}
      </Link>

      <button
        onClick={handleToggleActive}
        disabled={loading}
        className="
          text-sm
          font-semibold
          text-neutral-700
          hover:underline
          disabled:opacity-50
        "
      >
        {isActive ? t("account.deactivate") : t("account.activate")}
      </button>

      <button
        onClick={handleDelete}
        disabled={loading}
        className="
          text-sm
          font-semibold
          text-rose-500
          hover:underline
          disabled:opacity-50
        "
      >
        {t("account.delete")}
      </button>
    </div>
  );
};

export default AccountListingActions;
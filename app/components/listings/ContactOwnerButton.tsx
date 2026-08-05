"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";

import useTranslation from "@/app/hooks/useTranslation";

interface ContactOwnerButtonProps {
  listingId: string;
  ownerId: string;
  currentUserId: string;
}

const ContactOwnerButton: React.FC<ContactOwnerButtonProps> = ({
  listingId,
  ownerId,
  currentUserId,
}) => {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const disabled = ownerId === currentUserId || isLoading;

  const handleContactOwner = async () => {
    try {
      setIsLoading(true);

      const response = await axios.post("/api/conversations", {
        listingId,
      });

      const conversationId =
        response.data?.conversation?.id;

      if (!conversationId) {
        throw new Error("Conversation ID missing");
      }

      router.push(
        `/${language}/conversations/${conversationId}`
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error ||
        t("listingDetails.somethingWentWrong")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleContactOwner}
      disabled={disabled}
      className="
        w-full 
        bg-primary
        hover:bg-primary-hover
        text-white 
        py-3 
        rounded-xl 
        font-semibold 
        transition
        disabled:opacity-50
        disabled:cursor-not-allowed
      "
    >
      {ownerId === currentUserId
        ? t("listingDetails.thisIsYourListing")
        : isLoading
          ? t("listingDetails.openingChat")
          : t("listingDetails.contactOwnerButton")}
    </button>
  );
};

export default ContactOwnerButton;
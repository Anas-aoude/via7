"use client";

import { toast } from "react-hot-toast";
import { FiShare } from "react-icons/fi";

import HeartButton from "@/app/components/HeartButton";

interface ListingActionsProps {
  listingId: string;
  currentUser?: any;
}

const ListingActions: React.FC<ListingActionsProps> = ({
  listingId,
  currentUser,
}) => {
  const onShare = async () => {
    const url = `${window.location.origin}/listings/${listingId}`;

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <div className="flex items-center gap-4 text-sm font-semibold">
      <button
        type="button"
        onClick={onShare}
        className="flex items-center gap-2 underline hover:text-neutral-600"
      >
        <FiShare size={18} />
        Share
      </button>

      <div className="flex items-center gap-2 underline hover:text-neutral-600">
        <HeartButton listingId={listingId} currentUser={currentUser} />
        <span>Save</span>
      </div>
    </div>
  );
};

export default ListingActions;
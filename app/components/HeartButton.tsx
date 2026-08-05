"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { toast } from "react-hot-toast";

import useLoginModal from "@/app/hooks/useLoginModal";

interface HeartButtonProps {
  listingId: string;
  currentUser?: {
    favoriteIds?: string[];
  } | null;
}

const HeartButton: React.FC<HeartButtonProps> = ({
  listingId,
  currentUser,
}) => {
  const router = useRouter();
  const loginModal = useLoginModal();

  const hasFavorited = currentUser?.favoriteIds?.includes(listingId);

  const toggleFavorite = async (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();

    if (!currentUser) {
      loginModal.onOpen();
      return;
    }

    try {
      if (hasFavorited) {
        await axios.delete(`/api/favorites/${listingId}`);
        toast.success("Removed from favorites");
      } else {
        await axios.post(`/api/favorites/${listingId}`);
        toast.success("Added to favorites");
      }

      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <div
      onClick={toggleFavorite}
      className="relative hover:opacity-80 transition cursor-pointer"
    >
      <AiOutlineHeart
        size={28}
        className="fill-white absolute -top-[2px] -right-[2px]"
      />

      <AiFillHeart
        size={24}
        className={hasFavorited ? "fill-rose-500" : "fill-neutral-500/70"}
      />
    </div>
  );
};

export default HeartButton;
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Listing, UserRole } from "@prisma/client";
import type getCurrentUser from "@/app/actions/users/getCurrentUser";

import HeartButton from "../HeartButton";
import Price from "@/app/components/common/Price";
import useTranslation from "../../hooks/useTranslation";
import useDictionary from "../../hooks/useDictionary";
import { getListingDisplayItems } from "@/app/libs/listingDisplay";

type ListingCardData = Listing & {
  user?: {
    role?: UserRole | null;
  } | null;
};
type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>;
interface ListingCardProps {
  data: ListingCardData;
  currentUser?: CurrentUser;
}

const getPriceLabel = (listing: Listing, t: (key: string) => string) => {
  if (listing.purpose !== "rent") return t("listings.total");

  switch (listing.rentPeriod) {
    case "DAILY":
      return t("listings.day");
    case "WEEKLY":
      return t("listings.week");
    case "YEARLY":
      return t("listings.year");
    default:
      return t("listings.month");
  }
};

const getListingBadge = (listing: ListingCardData) => {
  const role = listing.user?.role;

  if (role === "AGENCY") {
    return {
      label: "Agency",
      icon: "🏢",
      className: "bg-white/95 text-neutral-900",
    };
  }

  if (role === "VIP_HOST") {
    return {
      label: "VIP Host",
      icon: "⭐",
      className: "bg-white/95 text-neutral-900",
    };
  }

  if (listing.favoriteCount >= 1000) {
    return {
      label: "Guest favorite",
      icon: "🏆",
      className: "bg-white/95 text-neutral-900",
    };
  }

  if (listing.favoriteCount >= 500) {
    return {
      label: "Popular",
      icon: "🔥",
      className: "bg-white/95 text-neutral-900",
    };
  }

  return null;
};

const ListingCard: React.FC<ListingCardProps> = ({ data, currentUser }) => {
  const router = useRouter();
  const { t, language } = useTranslation();
  const dictionary = useDictionary();

  const displayItems = getListingDisplayItems(data, t);
  const badge = getListingBadge(data);

  return (
    <div
      onClick={() => router.push(`/${language}/listings/${data.id}`)}
      className="cursor-pointer group"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-xl">
        <Image
          fill
          src={data.imageUrl || "/images/placeholder.jpg"}
          alt={data.title}
          className="h-full w-full object-cover transition group-hover:scale-110"
        />

        {badge && (
          <div
            className={`absolute top-3 left-3 z-[1] flex items-center gap-1.5 rounded-full px-4 py-2 text-sm md:text-base font-bold shadow-md backdrop-blur ${badge.className}`}
          >
            <span>{badge.icon}</span>
            <span>{badge.label}</span>
          </div>
        )}

        <div className="absolute top-3 right-3 z-[1]">
          <HeartButton listingId={data.id} currentUser={currentUser} />
        </div>
      </div>

      <div className="mt-2 text-lg font-semibold">
        {dictionary.governorate(data.governorate)}
        {data.city ? `, ${data.city}` : ""}
      </div>

      <div className="font-light text-neutral-500">
        {dictionary.category(data.category)} · {dictionary.purpose(data.purpose)}
      </div>

      {displayItems.length > 0 && (
        <div className="font-light text-neutral-500">
          {displayItems.join(" · ")}
        </div>
      )}

      <div className="mt-1 flex items-center gap-1">
        <Price amount={data.price} className="font-semibold" />

        <div className="font-light text-neutral-500">
          {getPriceLabel(data, t)}
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
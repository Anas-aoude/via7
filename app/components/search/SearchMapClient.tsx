"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { divIcon, LeafletMouseEvent } from "leaflet";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AiFillStar, AiOutlineClose } from "react-icons/ai";

import HeartButton from "@/app/components/HeartButton";
import Price from "@/app/components/common/Price";
import usePrice from "@/app/hooks/usePrice";
import useTranslation from "@/app/hooks/useTranslation";
import useDictionary from "@/app/hooks/useDictionary";

interface SearchMapProps {
  listings: any[];
  selectedListingId: string | null;
  onSelectListing: (id: string) => void;
  currentUser?: any;
}

const defaultCenter: [number, number] = [34.8021, 38.9968];

const getPriceLabel = (listing: any, t: (key: string) => string) => {
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

const MapBounds = ({ listings }: { listings: any[] }) => {
  const map = useMap();

  useEffect(() => {
    if (listings.length === 0) {
      map.setView(defaultCenter, 6);
      return;
    }

    if (listings.length === 1) {
      map.setView([listings[0].latitude, listings[0].longitude], 13);
      return;
    }

    const bounds = listings.map((listing) => [
      listing.latitude,
      listing.longitude,
    ]) as [number, number][];

    map.fitBounds(bounds, { padding: [40, 40] });
  }, [listings, map]);

  return null;
};

const getListingBadge = (listing: any) => {
  const role = listing.user?.role;

  if (role === "AGENCY") {
    return { label: "Agency", icon: "🏢" };
  }

  if (role === "VIP_HOST") {
    return { label: "VIP Host", icon: "⭐" };
  }

  if (listing.favoriteCount >= 1000) {
    return { label: "Guest favorite", icon: "🏆" };
  }

  if (listing.favoriteCount >= 500) {
    return { label: "Popular", icon: "🔥" };
  }

  return null;
};

const MapPopupCard = ({
  listing,
  currentUser,
}: {
  listing: any;
  currentUser?: any;
}) => {
  const map = useMap();
  const router = useRouter();
  const { t, language } = useTranslation();
  const dictionary = useDictionary();
  const badge = getListingBadge(listing);

  const image =
    listing.imageUrl || listing.imageUrls?.[0] || "/images/placeholder.jpg";

  const goToListing = () => {
    router.push(`/${language}/listings/${listing.id}`);
  };

  return (
    <div className="relative w-[300px] overflow-hidden rounded-3xl bg-white">
      <div className="relative h-[190px] w-full overflow-hidden">
        <img
          src={image}
          alt={listing.title || "Listing image"}
          className="h-full w-full object-cover transition duration-300 hover:scale-105"
        />

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            map.closePopup();
          }}
          className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-lg shadow-md transition hover:scale-105"
        >
          <AiOutlineClose />
        </button>

        <div
          onClick={(event) => event.stopPropagation()}
          className="absolute left-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md"
        >
          <HeartButton listingId={listing.id} currentUser={currentUser} />
        </div>

        {badge && (
          <div className="absolute left-3 top-14 z-30 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-neutral-900 shadow-md">
            <span>{badge.icon}</span>
            <span>{badge.label}</span>
          </div>
        )}

        <div className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-neutral-900 shadow">
          {dictionary.purpose(listing.purpose)}
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-base font-bold text-neutral-900">
              {listing.title}
            </h3>

            <p className="mt-1 line-clamp-1 text-sm text-neutral-500">
              {dictionary.category(listing.category)}
              {listing.city
                ? ` · ${listing.city}`
                : listing.governorate
                  ? ` · ${dictionary.governorate(listing.governorate)}`
                  : ""}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1 text-sm font-semibold text-neutral-900">
            <AiFillStar />
            <span>4.9</span>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-base">
              <Price
                amount={listing.price}
                className="font-bold text-neutral-900"
              />
              <span className="text-sm text-neutral-500">
                {getPriceLabel(listing, t)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={goToListing}
            className="shrink-0 rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-rose-600"
          >
            {t("common.viewDetails") || "View Details"}
          </button>
        </div>
      </div>
    </div>
  );
};

const MapPriceMarker = ({
  listing,
  isSelected,
  onSelectListing,
  currentUser,
}: {
  listing: any;
  isSelected: boolean;
  onSelectListing: (id: string) => void;
  currentUser?: any;
}) => {
  const { formatted: markerPrice, loading } = usePrice(listing.price);

  const displayPrice = loading ? "..." : markerPrice;

  const icon = useMemo(() => {
    return divIcon({
      html: `
        <div style="
          background: ${isSelected ? "#000" : "#fff"};
          color: ${isSelected ? "#fff" : "#000"};
          border: 2px solid #000;
          border-radius: 9999px;
          padding: 6px 12px;
          font-size: 14px;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(0,0,0,0.18);
          white-space: nowrap;
          direction: ltr;
        ">
          ${displayPrice}
        </div>
      `,
      className: "",
      iconSize: [130, 36],
      iconAnchor: [65, 18],
    });
  }, [isSelected, displayPrice]);

  return (
    <Marker
      position={[listing.latitude, listing.longitude]}
      icon={icon}
      eventHandlers={{
        click: (event: LeafletMouseEvent) => {
          onSelectListing(listing.id);
          event.target.openPopup();
        },
      }}
    >
      <Popup closeButton={false} className="airbnb-map-popup">
        <MapPopupCard listing={listing} currentUser={currentUser} />
      </Popup>
    </Marker>
  );
};

const SearchMap: React.FC<SearchMapProps> = ({
  listings,
  selectedListingId,
  onSelectListing,
  currentUser,
}) => {
  const validListings = useMemo(() => {
    return listings.filter(
      (listing) =>
        typeof listing.latitude === "number" &&
        typeof listing.longitude === "number"
    );
  }, [listings]);

  return (
    <MapContainer
      center={defaultCenter}
      zoom={6}
      scrollWheelZoom
      className="h-full w-full rounded-l-3xl z-0"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapBounds listings={validListings} />

      {validListings.map((listing) => (
        <MapPriceMarker
          key={listing.id}
          listing={listing}
          isSelected={selectedListingId === listing.id}
          onSelectListing={onSelectListing}
          currentUser={currentUser}
        />
      ))}
    </MapContainer>
  );
};

export default SearchMap;
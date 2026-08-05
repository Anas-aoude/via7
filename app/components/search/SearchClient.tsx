"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import ListingCard from "@/app/components/listings/ListingCard";
import useTranslation from "@/app/hooks/useTranslation";

interface SearchClientProps {
  listings: any[];
  currentUser?: any;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}

const SearchClient: React.FC<SearchClientProps> = ({
  listings,
  currentUser,
  totalCount,
  currentPage,
  totalPages,
  searchParams,
}) => {
  const { t, language } = useTranslation();

  const [selectedListingId, setSelectedListingId] = useState<string | null>(
    null
  );
  const [showMap, setShowMap] = useState(true);

  useEffect(() => {
    const savedValue = localStorage.getItem("search-show-map");

    if (savedValue !== null) {
      setShowMap(savedValue === "true");
    }
  }, []);

  const toggleMap = () => {
    setShowMap((current) => {
      const nextValue = !current;
      localStorage.setItem("search-show-map", String(nextValue));
      return nextValue;
    });
  };

  const SearchMap = useMemo(
    () =>
      dynamic(() => import("./SearchMap"), {
        ssr: false,
      }),
    []
  );

  const createPageUrl = (page: number) => {
    const query = new URLSearchParams();

    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== "page") {
        query.set(key, value);
      }
    });

    query.set("page", page.toString());

    return `/${language}/search?${query.toString()}`;
  };

  return (
    <div className="pt-72 md:pt-60 pb-20">
      <div className="px-8 mb-8 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">
          {totalCount} {t("search.propertiesFound")}
        </h1>

        <button
          type="button"
          onClick={toggleMap}
          className="hidden lg:flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold hover:shadow-md transition bg-white"
        >
          <span>{showMap ? "✕" : "🗺️"}</span>
          {showMap ? t("search.hideMap") : t("search.showMap")}
        </button>
      </div>

      <div
        className={
          showMap
            ? "grid grid-cols-1 lg:grid-cols-[50%_50%] gap-0"
            : "grid grid-cols-1 gap-0"
        }
      >
        <div className="px-8">
          <div
            className={
              showMap
                ? "grid grid-cols-1 md:grid-cols-2 gap-8"
                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            }
          >
            {listings.map((listing) => (
              <div
                key={listing.id}
                onMouseEnter={() => setSelectedListingId(listing.id)}
                onClick={() => setSelectedListingId(listing.id)}
                className={`rounded-2xl transition ${
                  selectedListingId === listing.id
                    ? "ring-2 ring-black ring-offset-4"
                    : ""
                  }`}
              >
                <ListingCard data={listing} currentUser={currentUser} />
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-16 flex-wrap">
              {currentPage > 1 && (
                <Link
                  href={createPageUrl(currentPage - 1)}
                  className="px-4 py-2 border rounded-xl hover:bg-neutral-100"
                >
                  {t("common.previous")}
                </Link>
              )}

              {Array.from({ length: Math.min(totalPages, 7) }, (_, index) => {
                let pageNumber = index + 1;

                if (currentPage > 4 && totalPages > 7) {
                  pageNumber = currentPage - 3 + index;

                  if (pageNumber > totalPages) return null;
                }

                return (
                  <Link
                    key={pageNumber}
                    href={createPageUrl(pageNumber)}
                    className={`px-4 py-2 border rounded-xl ${
                      currentPage === pageNumber
                        ? "bg-black text-white"
                        : "hover:bg-neutral-100"
                      }`}
                  >
                    {pageNumber}
                  </Link>
                );
              })}

              {currentPage < totalPages && (
                <Link
                  href={createPageUrl(currentPage + 1)}
                  className="px-4 py-2 border rounded-xl hover:bg-neutral-100"
                >
                  {t("common.next")}
                </Link>
              )}
            </div>
          )}
        </div>

        {showMap && (
          <div className="hidden lg:block h-[calc(90vh-170px)] sticky top-[200px] pr-8">
            <SearchMap
              listings={listings}
              selectedListingId={selectedListingId}
              onSelectListing={setSelectedListingId}
              currentUser={currentUser}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchClient;
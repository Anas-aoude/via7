"use client";

import Link from "next/link";
import { useRef } from "react";
import type getCurrentUser from "@/app/actions/users/getCurrentUser";

import ListingCard from "./ListingCard";
import useTranslation from "../../hooks/useTranslation";
import useDictionary from "../../hooks/useDictionary";

type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>;

interface ListingRowProps {
  title: string;
  listings: any[];
  currentUser?: CurrentUser;
  seeAllHref: string;
  totalCount?: number;
}

const ListingRow: React.FC<ListingRowProps> = ({
  title,
  listings,
  currentUser,
  seeAllHref,
  totalCount,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const { t, language } = useTranslation();
  const dictionary = useDictionary();

  const isArabic = language === "ar";

  const getTranslatedTitle = () => {
    if (title === "Featured properties") {
      return t("home.featuredProperties");
    }

    if (title.startsWith("Popular homes in ")) {
      const governorate = title.replace("Popular homes in ", "");
      const translatedGovernorate =
        dictionary.governorate(governorate);

      return `${t("home.popularHomesIn")} ${translatedGovernorate}`;
    }

    return title;
  };

  const translatedTitle = getTranslatedTitle();

  const scroll = (direction: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left:
        direction === "right"
          ? window.innerWidth * 0.9
          : -window.innerWidth * 0.9,
      behavior: "smooth",
    });
  };

  const visibleListings =
    language === "ar"
      ? [...listings.slice(0, 7)].reverse()
      : listings.slice(0, 7);

  return (
    <section>
      <div
        className={`
          flex
          items-center
          justify-between
          mb-5
          ${isArabic ? "flex-row-reverse" : ""}
        `}
      >
        <h2 className="text-xl sm:text-2xl font-bold">
          {translatedTitle}
        </h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="
              w-9
              h-9
              rounded-full
              bg-neutral-100
              hover:bg-neutral-200
              transition
              flex
              items-center
              justify-center
              text-xl
            "
          >
            ‹
          </button>

          <button
            type="button"
            onClick={() => scroll("right")}
            className="
              w-9
              h-9
              rounded-full
              bg-neutral-100
              hover:bg-neutral-200
              transition
              flex
              items-center
              justify-center
              text-xl
            "
          >
            ›
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className={`
          flex
          gap-5
          overflow-x-auto
          scroll-smooth
          no-scrollbar
          ${isArabic ? "flex-row-reverse" : ""}
        `}
      >
        {visibleListings.map((listing) => (
          <div
            key={listing.id}
            className="
              shrink-0
              w-full
              sm:w-[45%]
              md:w-[31%]
              lg:w-[22%]
              xl:w-[calc((100%_-_120px)/7)]
            "
          >
            <ListingCard
              data={listing}
              currentUser={currentUser}
            />
          </div>
        ))}

        <Link
          href={seeAllHref}
          className="
            shrink-0
            w-full
            sm:w-[45%]
            md:w-[31%]
            lg:w-[22%]
            xl:w-[calc((100%_-_120px)/7)]
            border
            rounded-3xl
            bg-white
            hover:shadow-md
            transition
            flex
            flex-col
            items-center
            justify-center
            min-h-[300px]
            text-center
          "
        >
          <div className="text-5xl mb-4">
            →
          </div>

          <div className="font-bold text-xl">
            {t("home.seeAll")}
          </div>

          <div className="text-sm text-neutral-500 mt-2">
            {totalCount ?? listings.length}{" "}
            {t("home.properties")}
          </div>
        </Link>
      </div>
    </section>
  );
};

export default ListingRow;
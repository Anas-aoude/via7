"use client";


import { BiSearch } from "react-icons/bi";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { Range } from "react-date-range";

import useTranslation from "../../hooks/useTranslation";
import useDictionary from "../../hooks/useDictionary";
import useCurrency from "@/app/hooks/useCurrency";
const SearchModal = dynamic(() => import("./SearchModal"), {
  ssr: false,
});
export type SearchStep = "where" | "when" | "filters";

const getNumberFromParams = (
  searchParams: URLSearchParams | null,
  key: string
) => {
  const value = Number(searchParams?.get(key));

  if (Number.isNaN(value) || value < 0) {
    return 0;
  }

  return value;
};

const getAmenitiesFromParams = (searchParams: URLSearchParams | null) => {
  const amenities = searchParams?.get("amenities");

  if (!amenities) {
    return [];
  }

  return amenities.split(",").filter(Boolean);
};
const formatDateParam = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};
const Search = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useTranslation();
  const dictionary = useDictionary();
  const { currency } = useCurrency();

  const [isOpen, setIsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<SearchStep>("where");
  const [hasSelectedDates, setHasSelectedDates] = useState(false);

  const [location, setLocation] = useState(
    searchParams?.get("governorate") || "Anywhere"
  );

  const [guestCount, setGuestCount] = useState(
    getNumberFromParams(searchParams, "guestCount")
  );
  const [bedroomCount, setBedroomCount] = useState(
    getNumberFromParams(searchParams, "bedroomCount")
  );
  const [bathroomCount, setBathroomCount] = useState(
    getNumberFromParams(searchParams, "bathroomCount")
  );

  const [purpose, setPurpose] = useState(searchParams?.get("purpose") || "");
  const [rentPeriod, setRentPeriod] = useState(
    searchParams?.get("rentPeriod") || ""
  );

  const [minPrice, setMinPrice] = useState(
    searchParams?.get("minPrice") || ""
  );
  const [maxPrice, setMaxPrice] = useState(
    searchParams?.get("maxPrice") || ""
  );

  const [minArea, setMinArea] = useState(
    searchParams?.get("minArea") || ""
  );
  const [maxArea, setMaxArea] = useState(
    searchParams?.get("maxArea") || ""
  );

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    getAmenitiesFromParams(searchParams)
  );

  const [sortBy, setSortBy] = useState(
    searchParams?.get("sortBy") || "newest"
  );

  const locationLabel =
    location === "Anywhere"
      ? t("search.anywhere")
      : dictionary.governorate(location);

  const [dateRange, setDateRange] = useState<Range>({
    startDate: new Date(),
    endDate: new Date(),
    key: "selection",
  });

  useEffect(() => {
    const nextPurpose = searchParams?.get("purpose") || "";

    setLocation(searchParams?.get("governorate") || "Anywhere");
    setGuestCount(getNumberFromParams(searchParams, "guestCount"));
    setBedroomCount(getNumberFromParams(searchParams, "bedroomCount"));
    setBathroomCount(getNumberFromParams(searchParams, "bathroomCount"));

    setPurpose(nextPurpose);
    setRentPeriod(
      nextPurpose === "rent" ? searchParams?.get("rentPeriod") || "" : ""
    );

    setMinPrice(searchParams?.get("minPrice") || "");
    setMaxPrice(searchParams?.get("maxPrice") || "");

    setMinArea(searchParams?.get("minArea") || "");
    setMaxArea(searchParams?.get("maxArea") || "");

    setSelectedAmenities(getAmenitiesFromParams(searchParams));
    setSortBy(searchParams?.get("sortBy") || "newest");
  }, [searchParams]);

  const openStep = (step: SearchStep) => {
    setActiveStep(step);
    setIsOpen(true);
  };

  const buildSearchUrl = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");

    if (value && value !== "Anywhere") {
      params.set("governorate", value);
    } else {
      params.delete("governorate");
    }

    if (guestCount > 0) {
      params.set("guestCount", String(guestCount));
    } else {
      params.delete("guestCount");
    }

    if (bedroomCount > 0) {
      params.set("bedroomCount", String(bedroomCount));
    } else {
      params.delete("bedroomCount");
    }

    if (bathroomCount > 0) {
      params.set("bathroomCount", String(bathroomCount));
    } else {
      params.delete("bathroomCount");
    }

    if (purpose) {
      params.set("purpose", purpose);
    } else {
      params.delete("purpose");
    }

    if (purpose === "rent" && rentPeriod) {
      params.set("rentPeriod", rentPeriod);
    } else {
      params.delete("rentPeriod");
    }

    if (minPrice) {
      params.set("minPrice", minPrice);
    } else {
      params.delete("minPrice");
    }

    if (maxPrice) {
      params.set("maxPrice", maxPrice);
    } else {
      params.delete("maxPrice");
    }

    if (minArea) {
      params.set("minArea", minArea);
    } else {
      params.delete("minArea");
    }

    if (maxArea) {
      params.set("maxArea", maxArea);
    } else {
      params.delete("maxArea");
    }

    if (selectedAmenities.length > 0) {
      params.set("amenities", selectedAmenities.join(","));
    } else {
      params.delete("amenities");
    }

    if (sortBy && sortBy !== "newest") {
      params.set("sortBy", sortBy);
    } else {
      params.delete("sortBy");
    }
    if (minPrice || maxPrice) {
      params.set("priceCurrency", currency);
    } else {
      params.delete("priceCurrency");
    }
    if (hasSelectedDates && dateRange.startDate && dateRange.endDate) {
      params.set("startDate", formatDateParam(dateRange.startDate));
      params.set("endDate", formatDateParam(dateRange.endDate));
    } else {
      params.delete("startDate");
      params.delete("endDate");
    }
    params.delete("page");

    const queryString = params.toString();

    return queryString
      ? `/${language}/search?${queryString}`
      : `/${language}/search`;
  };

  const handleLocationSelect = (value: string) => {
    setLocation(value);
    setActiveStep("when");
  };

  const handleSearch = () => {
    router.push(buildSearchUrl(location));
    setIsOpen(false);
  };

  return (
    <>
      <SearchModal
        isOpen={isOpen}
        onApplyFilters={handleSearch}
        activeStep={activeStep}
        onClose={() => setIsOpen(false)}
        onSelect={handleLocationSelect}
        dateRange={dateRange}
        setDateRange={setDateRange}
        guestCount={guestCount}
        bedroomCount={bedroomCount}
        bathroomCount={bathroomCount}
        purpose={purpose}
        rentPeriod={rentPeriod}
        minPrice={minPrice}
        maxPrice={maxPrice}
        minArea={minArea}
        maxArea={maxArea}
        selectedAmenities={selectedAmenities}
        sortBy={sortBy}
        setGuestCount={setGuestCount}
        setBedroomCount={setBedroomCount}
        setBathroomCount={setBathroomCount}
        setPurpose={setPurpose}
        setRentPeriod={setRentPeriod}
        setMinPrice={setMinPrice}
        setMaxPrice={setMaxPrice}
        setMinArea={setMinArea}
        setMaxArea={setMaxArea}
        setActiveStep={setActiveStep}
        setSelectedAmenities={setSelectedAmenities}
        setSortBy={setSortBy}
        hasSelectedDates={hasSelectedDates}
        setHasSelectedDates={setHasSelectedDates}
      />

      {/* Mobile */}
      <button
        type="button"
        onClick={() => openStep("where")}
        className="
    md:hidden
    w-full
    h-14
    px-5
    rounded-full
    border
    border-neutral-200
    bg-white
    shadow-sm
    hover:shadow-md
    transition
    flex
    items-center
    justify-center
    gap-3
    text-black
    font-semibold
  "
      >
        <BiSearch size={20} />

        <span>
          {t("search.startYourSearch")}
        </span>
      </button>

      {/* Desktop */}
      <div className="hidden md:block">
        <div className="border-[1px] w-auto py-2 rounded-full shadow-sm hover:shadow-md transition cursor-pointer">
          <div className="flex flex-row items-center justify-between">
            <div
              onClick={() => openStep("where")}
              className="text-sm font-semibold px-6"
            >
              {locationLabel}
            </div>

            <div
              onClick={() => openStep("when")}
              className="text-sm font-semibold px-6 border-x-[1px] flex-1 text-center"
            >
              {hasSelectedDates && dateRange.startDate && dateRange.endDate
                ? `${dateRange.startDate.toLocaleDateString(
                  "en-GB"
                )} - ${dateRange.endDate.toLocaleDateString("en-GB")}`
                : t("search.anyWeek")}
            </div>

            <div
              onClick={() => openStep("filters")}
              className="text-sm pl-6 pr-2 text-gray-600 flex flex-row items-center gap-3"
            >
              <div>{t("search.filters")}</div>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleSearch();
                }}
                className="p-2 bg-primary rounded-full text-white"
              >
                <BiSearch size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Search;
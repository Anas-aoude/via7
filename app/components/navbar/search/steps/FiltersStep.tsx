"use client";

import Counter from "../components/Counter";
import PriceRange from "../components/PriceRange";
import AreaRange from "../components/AreaRange";
import PurposeSelector from "../components/PurposeSelector";
import RentPeriodSelector from "../components/RentPeriodSelector";
import AmenitiesSelector from "../components/AmenitiesSelector";
import SortSelector from "../components/SortSelector";
import useTranslation from "@/app/hooks/useTranslation";

interface FiltersStepProps {
  guestCount: number;
  bedroomCount: number;
  bathroomCount: number;

  purpose: string;
  rentPeriod: string;

  minPrice: string;
  maxPrice: string;

  minArea: string;
  maxArea: string;

  selectedAmenities: string[];
  sortBy: string;

  setGuestCount: (value: number) => void;
  setBedroomCount: (value: number) => void;
  setBathroomCount: (value: number) => void;

  setPurpose: (value: string) => void;
  setRentPeriod: (value: string) => void;

  setMinPrice: (value: string) => void;
  setMaxPrice: (value: string) => void;

  setMinArea: (value: string) => void;
  setMaxArea: (value: string) => void;

  setSelectedAmenities: (value: string[]) => void;
  setSortBy: (value: string) => void;
}

const FiltersStep: React.FC<FiltersStepProps> = ({
  guestCount,
  bedroomCount,
  bathroomCount,

  purpose,
  rentPeriod,

  minPrice,
  maxPrice,

  minArea,
  maxArea,

  selectedAmenities,
  sortBy,

  setGuestCount,
  setBedroomCount,
  setBathroomCount,

  setPurpose,
  setRentPeriod,

  setMinPrice,
  setMaxPrice,

  setMinArea,
  setMaxArea,

  setSelectedAmenities,
  setSortBy,
}) => {
  const { t } = useTranslation();

  const handlePurposeChange = (value: string) => {
    setPurpose(value);

    if (value !== "rent") {
      setRentPeriod("");
    }
  };

  return (
    <div className="max-h-[60vh] overflow-y-auto pr-2">
      <Counter
        title={t("search.guests")}
        value={guestCount}
        onChange={setGuestCount}
      />

      <Counter
        title={t("search.bedrooms")}
        value={bedroomCount}
        onChange={setBedroomCount}
      />

      <Counter
        title={t("search.bathrooms")}
        value={bathroomCount}
        onChange={setBathroomCount}
      />

      <PurposeSelector value={purpose} onChange={handlePurposeChange} />

      {purpose === "rent" && (
        <RentPeriodSelector value={rentPeriod} onChange={setRentPeriod} />
      )}

      <PriceRange
        minPrice={minPrice}
        maxPrice={maxPrice}
        setMinPrice={setMinPrice}
        setMaxPrice={setMaxPrice}
      />

      <AreaRange
        minArea={minArea}
        maxArea={maxArea}
        setMinArea={setMinArea}
        setMaxArea={setMaxArea}
      />

      <AmenitiesSelector
        selectedAmenities={selectedAmenities}
        onChange={setSelectedAmenities}
      />

      <SortSelector value={sortBy} onChange={setSortBy} />
    </div>
  );
};

export default FiltersStep;
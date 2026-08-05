"use client";

import { IoMdClose } from "react-icons/io";
import { DateRange, Range } from "react-date-range";

import type { SearchStep } from "./Search";
import useTranslation from "../../hooks/useTranslation";
import useDictionary from "../../hooks/useDictionary";
import FiltersStep from "./search/steps/FiltersStep";

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const governorates = [
  "Damascus",
  "Rif Dimashq",
  "Aleppo",
  "Homs",
  "Hama",
  "Latakia",
  "Tartus",
  "Idlib",
  "Daraa",
  "As-Suwayda",
  "Quneitra",
  "Deir ez-Zor",
  "Raqqa",
  "Al-Hasakah",
];

interface SearchModalProps {
  isOpen: boolean;
  activeStep: SearchStep;
  onClose: () => void;
  onSelect: (value: string) => void;
  dateRange: Range;
  setDateRange: (value: Range) => void;
  hasSelectedDates: boolean;
  setHasSelectedDates: (value: boolean) => void;
  setActiveStep: (value: SearchStep) => void;
  onApplyFilters: () => void;

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

const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  activeStep,
  onClose,
  onSelect,
  dateRange,
  setDateRange,
  onApplyFilters,

  guestCount,
  bedroomCount,
  bathroomCount,
  hasSelectedDates,
  setHasSelectedDates,
  purpose,
  rentPeriod,

  minPrice,
  maxPrice,
  setActiveStep,
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
  const dictionary = useDictionary();

  if (!isOpen) return null;

  const title =
    activeStep === "where"
      ? t("search.whereInSyria")
      : activeStep === "when"
        ? t("search.when")
        : t("search.filters");

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-24 left-1/2 -translate-x-1/2 w-[800px]
        max-w-[96vw] bg-white rounded-3xl shadow-xl p-8 z-50"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 transition"
          >
            <IoMdClose size={20} />
          </button>
        </div>

        {activeStep === "where" && (
          <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto">
            {governorates.map((item) => (
              <div
                key={item}
                onClick={() => {
                  onSelect(item);
                }}
                className="p-4 rounded-xl hover:bg-neutral-100 cursor-pointer transition"
              >
                {dictionary.governorate(item)}
              </div>
            ))}
          </div>
        )}

        {activeStep === "when" && (
          <div className="flex flex-col gap-5 max-h-[70vh] overflow-y-auto pr-2">
            <div className="rounded-2xl border bg-neutral-50 p-4">
              <div className="text-sm text-neutral-500">
                {t("search.selectedDates")}
              </div>

              <div className="mt-1 font-semibold text-black">
                {dateRange.startDate?.toLocaleDateString("en-GB")} →{" "}
                {dateRange.endDate?.toLocaleDateString("en-GB")}
              </div>
            </div>

            <div className="rounded-2xl border p-6">
              <div className="search-date-range">
                <DateRange
                  ranges={[dateRange]}
                  onChange={(item) => {
                    setDateRange(item.selection);
                    setHasSelectedDates(true);
                  }}
                  minDate={new Date()}
                  months={2}
                  direction="horizontal"
                  showDateDisplay={false}
                  rangeColors={["#111827"]}
                  calendarFocus="forwards"
                  moveRangeOnFirstSelection={false}
                  editableDateInputs
                />
              </div>
            </div>

            <div className="flex flex-row items-center justify-between">
              <button
                onClick={() => {
                  setDateRange({
                    startDate: new Date(),
                    endDate: new Date(),
                    key: "selection",
                  });
                  setHasSelectedDates(false);
                }}
                className="font-semibold underline"
              >
                {t("search.clear")}
              </button>

              <button
                onClick={() => setActiveStep("filters")}
                className="rounded-xl bg-black px-8 py-3 font-semibold text-white transition hover:bg-neutral-800"
              >
                {t("search.done")}
              </button>
            </div>
          </div>
        )}

        {activeStep === "filters" && (
          <div className="flex flex-col gap-5">
            <FiltersStep
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
              setSelectedAmenities={setSelectedAmenities}
              setSortBy={setSortBy}
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onApplyFilters}
                className="rounded-xl bg-black px-8 py-3 font-semibold text-white transition hover:bg-neutral-800"
              >
                {t("search.done")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchModal;
"use client";

import useTranslation from "@/app/hooks/useTranslation";

interface SortSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const options = [
  {
    value: "newest",
    label: "search.newest",
  },
  {
    value: "oldest",
    label: "search.oldest",
  },
  {
    value: "priceLow",
    label: "search.priceLow",
  },
  {
    value: "priceHigh",
    label: "search.priceHigh",
  },
  {
    value: "views",
    label: "search.mostViewed",
  },
  {
    value: "favorites",
    label: "search.mostFavorited",
  },
];

const SortSelector: React.FC<SortSelectorProps> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="mt-6">
      <div className="font-semibold mb-3">
        {t("search.sortBy")}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`border rounded-xl p-3 text-left transition ${
              value === option.value
                ? "border-black bg-black text-white"
                : "hover:border-black"
              }`}
          >
            {t(option.label)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SortSelector;
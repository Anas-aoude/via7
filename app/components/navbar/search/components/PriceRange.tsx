"use client";

import useTranslation from "@/app/hooks/useTranslation";

interface PriceRangeProps {
  minPrice: string;
  maxPrice: string;
  setMinPrice: (value: string) => void;
  setMaxPrice: (value: string) => void;
}

const PriceRange: React.FC<PriceRangeProps> = ({
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice,
}) => {
  const { t } = useTranslation();

  return (
    <div className="py-5 border-b">
      <div className="font-semibold mb-4">
        {t("search.price")}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <input
          type="number"
          min={0}
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          placeholder={t("search.minPrice")}
          className="
            border
            rounded-xl
            px-4
            py-3
            outline-none
            focus:border-black
          "
        />

        <input
          type="number"
          min={0}
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder={t("search.maxPrice")}
          className="
            border
            rounded-xl
            px-4
            py-3
            outline-none
            focus:border-black
          "
        />
      </div>
    </div>
  );
};

export default PriceRange;
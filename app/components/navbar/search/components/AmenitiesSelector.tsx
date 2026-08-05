"use client";

import useDictionary from "@/app/hooks/useDictionary";
import useTranslation from "@/app/hooks/useTranslation";
import { filterAmenities } from "../data/amenities";

interface AmenitiesSelectorProps {
  selectedAmenities: string[];
  onChange: (amenities: string[]) => void;
}

const AmenitiesSelector: React.FC<AmenitiesSelectorProps> = ({
  selectedAmenities,
  onChange,
}) => {
  const { t } = useTranslation();
  const dictionary = useDictionary();

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      onChange(selectedAmenities.filter((item) => item !== amenity));
      return;
    }

    onChange([...selectedAmenities, amenity]);
  };

  return (
    <div className="py-5">
      <div className="font-semibold mb-4">{t("search.amenities")}</div>

      <div className="grid grid-cols-2 gap-3">
        {filterAmenities.map((amenity) => {
          const isSelected = selectedAmenities.includes(amenity);

          return (
            <button
              key={amenity}
              type="button"
              onClick={() => toggleAmenity(amenity)}
              className={`
                border
                rounded-xl
                px-4
                py-3
                text-sm
                font-semibold
                transition
                text-start
                ${
                isSelected
                  ? "border-black bg-black text-white"
                  : "hover:border-black"
                }
              `}
            >
              {dictionary.amenity(amenity)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AmenitiesSelector;
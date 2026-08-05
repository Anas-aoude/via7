"use client";

import { IconType } from "react-icons";

import useDictionary from "../../hooks/useDictionary";

interface AmenityInputProps {
  label: string;
  icon: IconType;
  selected?: boolean;
  onClick: (value: string) => void;
}

const AmenityInput: React.FC<AmenityInputProps> = ({
  label,
  icon: Icon,
  selected,
  onClick,
}) => {
  const dictionary = useDictionary();

  return (
    <div
      onClick={() => onClick(label)}
      className={`
        rounded-xl
        border-2
        p-4
        flex
        flex-col
        gap-3
        cursor-pointer
        hover:border-black
        transition
        ${selected ? "border-black bg-neutral-50" : "border-neutral-200"}
      `}
    >
      <Icon size={26} />

      <div className="font-semibold text-sm">
        {dictionary.amenity(label)}
      </div>
    </div>
  );
};

export default AmenityInput;
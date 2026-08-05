"use client";

import useDictionary from "../../hooks/useDictionary";

interface CategoryInputProps {
  label: string;
  icon: string;
  selected?: boolean;
  onClick: (value: string) => void;
}

const CategoryInput: React.FC<CategoryInputProps> = ({
  label,
  icon,
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
      <div className="text-3xl">{icon}</div>

      <div className="font-semibold text-sm">
        {dictionary.category(label)}
      </div>
    </div>
  );
};

export default CategoryInput;
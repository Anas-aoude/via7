"use client";

import useTranslation from "@/app/hooks/useTranslation";

interface PurposeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const PurposeSelector: React.FC<PurposeSelectorProps> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();

  const options = [
    { value: "", label: t("search.anyPurpose") },
    { value: "rent", label: t("listings.rent") },
    { value: "sale", label: t("listings.sale") },
  ];

  return (
    <div className="py-5 border-b">
      <div className="font-semibold mb-4">{t("search.purpose")}</div>

      <div className="grid grid-cols-3 gap-3">
        {options.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={`
              border
              rounded-xl
              px-4
              py-3
              text-sm
              font-semibold
              transition
              ${
              value === item.value
                ? "border-black bg-black text-white"
                : "hover:border-black"
              }
            `}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PurposeSelector;
"use client";

import useTranslation from "@/app/hooks/useTranslation";

interface RentPeriodSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const RentPeriodSelector: React.FC<RentPeriodSelectorProps> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();

  const options = [
    { value: "", label: t("search.anyRentPeriod") },
    { value: "DAILY", label: t("listings.day") },
    { value: "WEEKLY", label: t("listings.week") },
    { value: "MONTHLY", label: t("listings.month") },
    { value: "YEARLY", label: t("listings.year") },
  ];

  return (
    <div className="py-5 border-b">
      <div className="font-semibold mb-4">{t("search.rentPeriod")}</div>

      <div className="grid grid-cols-2 gap-3">
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

export default RentPeriodSelector;
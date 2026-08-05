"use client";

import useTranslation from "@/app/hooks/useTranslation";

interface AreaRangeProps {
  minArea: string;
  maxArea: string;
  setMinArea: (value: string) => void;
  setMaxArea: (value: string) => void;
}

const AreaRange: React.FC<AreaRangeProps> = ({
  minArea,
  maxArea,
  setMinArea,
  setMaxArea,
}) => {
  const { t } = useTranslation();

  return (
    <div className="border-t pt-6 mt-6">
      <h3 className="font-semibold mb-4">{t("search.area")}</h3>

      <div className="grid grid-cols-2 gap-4">
        <input
          type="number"
          placeholder={t("search.minArea")}
          value={minArea}
          onChange={(event) => setMinArea(event.target.value)}
          className="border rounded-xl p-4"
        />

        <input
          type="number"
          placeholder={t("search.maxArea")}
          value={maxArea}
          onChange={(event) => setMaxArea(event.target.value)}
          className="border rounded-xl p-4"
        />
      </div>
    </div>
  );
};

export default AreaRange;
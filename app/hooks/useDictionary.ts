"use client";

import { dictionary } from "../libs/dictionary";
import useTranslation from "./useTranslation";

export default function useDictionary() {
  const { t } = useTranslation();

  const translate = (
    group: keyof typeof dictionary,
    value: string | null | undefined
  ) => {
    if (!value) return "";

    const key = (dictionary[group] as Record<string, string>)[value];

    if (!key) {
      return value;
    }

    return t(key);
  };

  return {
    category: (value?: string | null) =>
      translate("category", value),

    purpose: (value?: string | null) =>
      translate("purpose", value),

    rentPeriod: (value?: string | null) =>
      translate("rentPeriod", value),

    governorate: (value?: string | null) =>
      translate("governorate", value),

    amenity: (value?: string | null) =>
      translate("amenity", value),
  };
}
"use client";

import useLanguage from "./useLanguage";
import { translate } from "../libs/translations";

export default function useTranslation() {
  const { language } = useLanguage();

  const t = (key: string) => {
    return translate(language, key);
  };

  return {
    t,
    language,
  };
}
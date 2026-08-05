import { headers } from "next/headers";
import { translate } from "./translations";
import type { Language } from "../context/LanguageContext";

const supportedLanguages: Language[] = ["ar", "en", "de"];

export async function getServerTranslation() {
  const headerStore = await headers();

  const headerLanguage = headerStore.get("x-locale");

  const language: Language =
    headerLanguage && supportedLanguages.includes(headerLanguage as Language)
      ? (headerLanguage as Language)
      : "ar";

  const t = (key: string) => translate(language, key);

  return {
    t,
    language,
  };
}
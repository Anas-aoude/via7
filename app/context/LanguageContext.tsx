"use client";

import { createContext } from "react";

export type Language = "ar" | "en" | "de";

export const languages: Language[] = ["ar", "en", "de"];

export const languageLabels: Record<Language, string> = {
  ar: "العربية",
  en: "English",
  de: "Deutsch",
};

export type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
};

export const LanguageContext = createContext<LanguageContextType | null>(null);
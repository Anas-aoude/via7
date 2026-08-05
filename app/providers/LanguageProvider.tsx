"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Language, LanguageContext } from "../context/LanguageContext";

interface LanguageProviderProps {
  children: React.ReactNode;
  initialLanguage: Language;
}

export default function LanguageProvider({
  children,
  initialLanguage,
}: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const router = useRouter();

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);

    document.cookie = `VIA7-language=${newLanguage}; path=/; max-age=31536000`;
    document.documentElement.lang = newLanguage;
    document.documentElement.dir = newLanguage === "ar" ? "ltr" : "ltr";

    router.refresh();
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
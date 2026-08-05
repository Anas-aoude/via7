import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ar", "en", "de"],
  defaultLocale: "ar",
  localePrefix: "always",
});
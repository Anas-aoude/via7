import { navbar } from "./navbar";
import { search } from "./search";
import { categories } from "./categories";
import { listings } from "./listings";
import { home } from "./home";
import { common } from "./common";
import { auth } from "./auth";
import { rentModal } from "./rentModal";
import { governorates } from "./governorates";
import { amenities } from "./amenities";
import { listingDetails } from "./listingDetails";
import { reviews } from "./reviews";
import { favorites } from "./favorites";
import { conversations } from "./conversations";
import { account } from "./account";
import userProfile from "./userProfile";
import { errors } from "./errors";
import { footer } from "./footer";
import { editListing } from "./editListing";
import { staticPages } from "./staticPages";

export const translations = {
  ar: {
    navbar: navbar.ar,
    search: search.ar,
    categories: categories.ar,
    listings: listings.ar,
    home: home.ar,
    common: common.ar,
    auth: auth.ar,
    rentModal: rentModal.ar,
    governorates: governorates.ar,
    amenities: amenities.ar,
    listingDetails: listingDetails.ar,
    reviews: reviews.ar,
    favorites: favorites.ar,
    conversations: conversations.ar,
    account: account.ar,
    userProfile: userProfile.ar,
    errors: errors.ar,
    footer: footer.ar,
    editListing: editListing.ar,
    staticPages: staticPages.ar,

  },

  en: {
    navbar: navbar.en,
    search: search.en,
    categories: categories.en,
    listings: listings.en,
    home: home.en,
    common: common.en,
    auth: auth.en,
    rentModal: rentModal.en,
    governorates: governorates.en,
    amenities: amenities.en,
    listingDetails: listingDetails.en,
    reviews: reviews.en,
    favorites: favorites.en,
    conversations: conversations.en,
    account: account.en,
    userProfile: userProfile.en,
    errors: errors.en,
    footer: footer.en,
    editListing: editListing.en,
    staticPages: staticPages.en,
  },

  de: {
    navbar: navbar.de,
    search: search.de,
    categories: categories.de,
    listings: listings.de,
    home: home.de,
    common: common.de,
    auth: auth.de,
    rentModal: rentModal.de,
    governorates: governorates.de,
    amenities: amenities.de,
    listingDetails: listingDetails.de,
    reviews: reviews.de,
    favorites: favorites.de,
    conversations: conversations.de,
    account: account.de,
    userProfile: userProfile.de,
    errors: errors.de,
    footer: footer.de,
    editListing: editListing.de,
    staticPages: staticPages.de,
  },
} as const;

type NestedKeys<T> = {
  [K in keyof T & string]: T[K] extends Record<string, any>
  ? `${K}.${NestedKeys<T[K]>}`
    : K;
}[keyof T & string];

export type TranslationLanguage = keyof typeof translations;

export type TranslationKey = NestedKeys<typeof translations.en>;

export function translate(
  language: keyof typeof translations,
  key: string
) {
  const keys = key.split(".");

  let value: any = translations[language];
  let fallback: any = translations.en;

  for (const currentKey of keys) {
    value = value?.[currentKey];
    fallback = fallback?.[currentKey];
  }

  return value ?? fallback ?? key;
}
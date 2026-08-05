import { Listing } from "@prisma/client";

const areaFirstCategories = [
  "Land",
  "Office",
  "Shop",
  "Warehouse",
  "Factory",
  "Restaurant",
];

export const getListingDisplayItems = (
  listing: Listing,
  t: (key: string) => string
) => {
  const items: string[] = [];

  const areaItem =
    listing.area && listing.area > 0 ? `${listing.area} m²` : null;

  const guestItem =
    listing.guestCount && listing.guestCount > 0
      ? `${listing.guestCount} ${t("listings.guests")}`
      : null;

  const bedroomItem =
    listing.bedroomCount && listing.bedroomCount > 0
      ? `${listing.bedroomCount} ${t("listings.bedrooms")}`
      : null;

  if (areaFirstCategories.includes(listing.category)) {
    if (areaItem) items.push(areaItem);
    if (guestItem) items.push(guestItem);
    if (bedroomItem) items.push(bedroomItem);
  } else {
    if (guestItem) items.push(guestItem);
    if (bedroomItem) items.push(bedroomItem);
    if (areaItem) items.push(areaItem);
  }

  return items;
};
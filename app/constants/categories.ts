export const PROPERTY_CATEGORIES = [
  "Apartment",
  "House",
  "Villa",
  "Cabin",
  "Hotel",
  "Tourism",
  "Land",
  "Farm",
  "Office",
  "Shop",
  "Restaurant",
  "Warehouse",
  "Factory",
] as const;

export type PropertyCategory = (typeof PROPERTY_CATEGORIES)[number];

export const categories = [
  { label: "Apartment", icon: "🏢" },
  { label: "House", icon: "🏠" },
  { label: "Villa", icon: "🏡" },
  { label: "Cabin", icon: "🛖" },
  { label: "Hotel", icon: "🏨" },
  { label: "Tourism", icon: "🏕️" },
  { label: "Land", icon: "🏗️" },
  { label: "Farm", icon: "🌾" },
  { label: "Office", icon: "🏢" },
  { label: "Shop", icon: "🏬" },
  { label: "Restaurant", icon: "🍽️" },
  { label: "Warehouse", icon: "📦" },
  { label: "Factory", icon: "🏭" },
] as const;
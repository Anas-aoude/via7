export const LISTING_PURPOSES = ["rent", "sale"] as const;

export type ListingPurpose = (typeof LISTING_PURPOSES)[number];
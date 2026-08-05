import { UserRole } from "@prisma/client";
import { PLANS } from "@/app/config/plans";

export const getListingLimitByRole = (role: UserRole) => {
  return PLANS[role].listingLimit;
};

export const hasReachedListingLimit = (
  role: UserRole,
  currentListingsCount: number
) => {
  const limit = getListingLimitByRole(role);

  if (limit === null) {
    return false;
  }

  return currentListingsCount >= limit;
};
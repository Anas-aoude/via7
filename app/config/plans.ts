import { UserRole } from "@prisma/client";

export const PLANS = {
  USER: {
    name: "User",
    listingLimit: 1,
    creditsDiscount: 0,
    canBuyCredits: false,
    badge: false,
    analytics: false,
  },

  HOST: {
    name: "Host",
    listingLimit: 20,
    creditsDiscount: 0,
    canBuyCredits: true,
    badge: false,
    analytics: true,
  },

  VIP_HOST: {
    name: "VIP Host",
    listingLimit: 40,
    creditsDiscount: 20,
    canBuyCredits: true,
    badge: true,
    analytics: true,
  },

  AGENCY: {
    name: "Agency",
    listingLimit: null,
    creditsDiscount: 30,
    canBuyCredits: true,
    badge: true,
    analytics: true,
  },

  MANAGER: {
    name: "Manager",
    listingLimit: null,
    creditsDiscount: 0,
    canBuyCredits: false,
    badge: false,
    analytics: true,
  },

  ADMIN: {
    name: "Admin",
    listingLimit: null,
    creditsDiscount: 0,
    canBuyCredits: false,
    badge: false,
    analytics: true,
  },
} satisfies Record<
  UserRole,
  {
    name: string;
    listingLimit: number | null;
    creditsDiscount: number;
    canBuyCredits: boolean;
    badge: boolean;
    analytics: boolean;
  }
  >;

export const getPlanByRole = (role: UserRole) => {
  return PLANS[role];
};
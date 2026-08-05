import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/users/getCurrentUser";
import ManagerDashboardClient from "./ManagerDashboardClient";

export default async function ManagerPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "MANAGER") {
    redirect("/");
  }

  const manageableUserRoles: UserRole[] = [
    "USER",
    "HOST",
    "VIP_HOST",
    "AGENCY",
  ];

  const [
    usersCount,
    listingsCount,
    featuredCount,
    activeListingsCount,
    reviewsCount,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        role: {
          in: manageableUserRoles,
        },
      },
    }),
    prisma.listing.count(),
    prisma.listing.count({ where: { featured: true } }),
    prisma.listing.count({ where: { isActive: true } }),
    prisma.review.count(),
  ]);

  const [
    users,
    listings,
    analyticsUsers,
    analyticsListings,
    topViewedListings,
    topFavoritedListings,
  ] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: {
          in: manageableUserRoles,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    }),

    prisma.listing.findMany({
      select: {
        id: true,
        title: true,
        governorate: true,
        category: true,
        purpose: true,
        isActive: true,
        featured: true,
        createdAt: true,
        userId: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    }),

    prisma.user.findMany({
      where: {
        role: {
          in: manageableUserRoles,
        },
      },
      select: {
        id: true,
        role: true,
        createdAt: true,
      },
    }),

    prisma.listing.findMany({
      select: {
        id: true,
        governorate: true,
        category: true,
        purpose: true,
        isActive: true,
        featured: true,
        createdAt: true,
        userId: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),

    prisma.listing.findMany({
      orderBy: {
        viewCount: "desc",
      },
      take: 10,
      select: {
        id: true,
        title: true,
        governorate: true,
        city: true,
        viewCount: true,
        imageUrl: true,
        imageUrls: true,
      },
    }),

    prisma.listing.findMany({
      orderBy: {
        favoriteCount: "desc",
      },
      take: 10,
      select: {
        id: true,
        title: true,
        governorate: true,
        city: true,
        favoriteCount: true,
        imageUrl: true,
        imageUrls: true,
      },
    }),
  ]);

  return (
    <div className="pt-72 md:pt-60 max-w-screen-xl mx-auto px-6 pb-20">
      <ManagerDashboardClient
        usersCount={usersCount}
        listingsCount={listingsCount}
        featuredCount={featuredCount}
        activeListingsCount={activeListingsCount}
        reviewsCount={reviewsCount}
        users={users.map((user) => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
        }))}
        listings={listings.map((listing) => ({
          ...listing,
          createdAt: listing.createdAt.toISOString(),
        }))}
        analyticsUsers={analyticsUsers.map((user) => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
        }))}
        analyticsListings={analyticsListings.map((listing) => ({
          ...listing,
          createdAt: listing.createdAt.toISOString(),
        }))}
        topViewedListings={topViewedListings}
        topFavoritedListings={topFavoritedListings}
      />
    </div>
  );
}
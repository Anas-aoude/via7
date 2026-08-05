import Link from "next/link";
import { redirect } from "next/navigation";

import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/users/getCurrentUser";
import UserListingsClient from "./UserListingsClient";
interface IParams {
  userId: string;
}

interface ISearchParams {
  page?: string;
  query?: string;
}

const ITEMS_PER_PAGE = 10;

export default async function AdminUserListingsPage({
  params,
  searchParams,
}: {
  params: Promise<IParams>;
  searchParams: Promise<ISearchParams>;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    redirect("/");
  }

  const { userId } = await params;
  const resolvedSearchParams = await searchParams;

  const page = Math.max(Number(resolvedSearchParams.page) || 1, 1);
  const query = resolvedSearchParams.query?.trim() || "";

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (!user) {
    redirect("/admin/users");
  }

  const where = {
    userId,
    ...(query
      ? {
        OR: [
          {
            title: {
              contains: query,
            },
          },
          {
            governorate: {
              contains: query,
            },
          },
          {
            city: {
              contains: query,
            },
          },
          {
            category: {
              contains: query,
            },
          },
          {
            type: {
              contains: query,
            },
          },
          {
            purpose: {
              contains: query,
            },
          },
        ],
      }
      : {}),
  };

  const [listings, totalCount] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
      select: {
        id: true,
        title: true,
        price: true,
        governorate: true,
        city: true,
        category: true,
        type: true,
        purpose: true,
        imageUrl: true,
        imageUrls: true,
        isActive: true,
        featured: true,
        viewCount: true,
        favoriteCount: true,
        createdAt: true,
      },
    }),
    prisma.listing.count({
      where,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const buildPageUrl = (targetPage: number) => {
    const params = new URLSearchParams();

    params.set("page", String(targetPage));

    if (query) {
      params.set("query", query);
    }

    return `/admin/users/${userId}/listings?${params.toString()}`;
  };

  return (
    <div className="pt-56 max-w-screen-xl mx-auto px-8 pb-20">
      <div className="mb-8">
        <Link
          href="/admin/users"
          className="text-sm text-rose-500 font-semibold hover:underline"
        >
          ← Back to users
        </Link>

        <h1 className="text-4xl font-bold mt-4">User Listings</h1>

        <p className="text-neutral-500 mt-2">
          {user.name || "No name"} — {user.email || "No email"}
        </p>
      </div>

      <form className="mb-6">
        <input
          name="query"
          defaultValue={query}
          autoComplete="off"
          placeholder="Search listings by title, city, category..."
          className="w-full border rounded-xl p-4"
        />
      </form>

      <UserListingsClient
        listings={listings.map((listing) => ({
          ...listing,
          createdAt: listing.createdAt.toISOString(),
        }))}
      />

      <div className="flex items-center justify-between mt-6">
        {page > 1 ? (
          <Link
            href={buildPageUrl(page - 1)}
            className="px-4 py-2 border rounded-lg"
          >
            Previous
          </Link>
        ) : (
            <button disabled className="px-4 py-2 border rounded-lg opacity-40">
              Previous
            </button>
          )}

        <div>
          Page {page} / {totalPages || 1}
        </div>

        {page < totalPages ? (
          <Link
            href={buildPageUrl(page + 1)}
            className="px-4 py-2 border rounded-lg"
          >
            Next
          </Link>
        ) : (
            <button disabled className="px-4 py-2 border rounded-lg opacity-40">
              Next
            </button>
          )}
      </div>
    </div>
  );
}
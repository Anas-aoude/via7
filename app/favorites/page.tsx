import { redirect } from "next/navigation";

import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/users/getCurrentUser";
import ListingCard from "@/app/components/listings/ListingCard";
import { getServerTranslation } from "@/app/libs/serverTranslation";

interface ISearchParams {
  page?: string;
}

const ITEMS_PER_PAGE = 12;

export default async function FavoritesPage({
  searchParams,
}: {
  searchParams: Promise<ISearchParams>;
}) {
  const currentUser = await getCurrentUser();
  const { t, language } = await getServerTranslation();

  if (!currentUser) {
    redirect("/");
  }

  const resolvedSearchParams = await searchParams;
  const page = Math.max(Number(resolvedSearchParams.page) || 1, 1);

  const favoriteIds = currentUser.favoriteIds || [];

  const [listings, totalCount] = await Promise.all([
    prisma.listing.findMany({
      where: {
        id: {
          in: favoriteIds,
        },
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),

    prisma.listing.count({
      where: {
        id: {
          in: favoriteIds,
        },
        isActive: true,
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const buildUrl = (targetPage: number) => {
    return `/${language}/favorites?page=${targetPage}`;
  };

  return (
    <div className="pt-72 md:pt-56 max-w-screen-xl mx-auto px-8 pb-20">
      <h1 className="text-4xl font-bold mb-3">
        {t("favorites.title")}
      </h1>

      <p className="text-neutral-500 mb-10">
        {t("favorites.subtitle")}
      </p>

      {listings.length === 0 ? (
        <div className="text-neutral-500 border rounded-2xl p-10 text-center">
          {t("favorites.empty")}
        </div>
      ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  data={listing}
                  currentUser={currentUser}
                />
              ))}
            </div>

            <div className="flex items-center justify-between mt-10">
              {page > 1 ? (
                <a
                  href={buildUrl(page - 1)}
                  className="px-4 py-2 border rounded-lg"
                >
                  {t("favorites.previous")}
                </a>
              ) : (
                  <button
                    disabled
                    className="px-4 py-2 border rounded-lg opacity-40"
                  >
                    {t("favorites.previous")}
                  </button>
                )}

              <div>
                {t("favorites.page")} {page} / {totalPages || 1}
              </div>

              {page < totalPages ? (
                <a
                  href={buildUrl(page + 1)}
                  className="px-4 py-2 border rounded-lg"
                >
                  {t("favorites.next")}
                </a>
              ) : (
                  <button
                    disabled
                    className="px-4 py-2 border rounded-lg opacity-40"
                  >
                    {t("favorites.next")}
                  </button>
                )}
            </div>
          </>
        )}
    </div>
  );
}
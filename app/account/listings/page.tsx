import Link from "next/link";
import { redirect } from "next/navigation";

import getCurrentUser from "@/app/actions/users/getCurrentUser";
import getAccountListings from "@/app/actions/account/getAccountListings";
import AccountListingActions from "@/app/components/account/AccountListingActions";
import { getServerTranslation } from "@/app/libs/serverTranslation";
import { dictionary } from "@/app/libs/dictionary";

interface AccountListingsPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

const getDictionaryValue = (
  group: keyof typeof dictionary,
  value: string | null | undefined,
  t: (key: string) => string
) => {
  if (!value) return "";

  const key = (dictionary[group] as Record<string, string>)[value];

  if (!key) {
    return value;
  }

  return t(key);
};

export default async function AccountListingsPage({
  searchParams,
}: AccountListingsPageProps) {
  const currentUser = await getCurrentUser();
  const { t } = await getServerTranslation();

  if (!currentUser) {
    redirect("/");
  }

  if (currentUser.isBanned) {
    redirect("/");
  }

  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;

  const { listings, totalPages, currentPage } = await getAccountListings({
    page,
    limit: 10,
  });

  return (
    <div className="pt-72 md:pt-60 max-w-screen-xl mx-auto px-6 pb-20">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            {t("account.myListings")}
          </h1>

          <div className="text-neutral-500 mt-2">
            {t("account.manageOwnProperties")}
          </div>
        </div>

        <Link
          href="/"
          className="
            bg-rose-500
            text-white
            px-5
            py-3
            rounded-xl
            font-semibold
            hover:bg-rose-600
            transition
          "
        >
          {t("account.createListing")}
        </Link>
      </div>

      {listings.length === 0 && (
        <div className="border rounded-xl p-8 text-center text-neutral-500 bg-white">
          {t("account.noOwnListings")}
        </div>
      )}

      <div className="space-y-4">
        {listings.map((listing) => {
          const governorateLabel = getDictionaryValue(
            "governorate",
            listing.governorate,
            t
          );

          return (
            <div
              key={listing.id}
              className="
                border
                rounded-xl
                p-5
                bg-white
                flex
                flex-col
                md:flex-row
                md:items-center
                md:justify-between
                gap-4
              "
            >
              <div>
                <div className="font-bold text-lg">
                  {listing.title}
                </div>

                <div className="text-sm text-neutral-500 mt-1">
                  {governorateLabel}
                  {listing.city ? `, ${listing.city}` : ""}
                </div>

                <div className="text-sm text-neutral-500 mt-2">
                  {t("account.views")}: {listing.viewCount} ·{" "}
                  {t("account.favorites")}: {listing.favoriteCount}
                </div>

                <div className="text-sm mt-2">
                  {t("account.status")}:{" "}
                  <span
                    className={
                      listing.isActive
                        ? "text-green-600 font-semibold"
                        : "text-neutral-500 font-semibold"
                    }
                  >
                    {listing.isActive
                      ? t("account.activeStatus")
                      : t("account.inactiveStatus")}
                  </span>
                </div>
              </div>

              <AccountListingActions
                listingId={listing.id}
                isActive={listing.isActive}
              />
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (pageNumber) => (
              <Link
                key={pageNumber}
                href={`/account/listings?page=${pageNumber}`}
                className={`
                  px-4
                  py-2
                  rounded-lg
                  border
                  transition
                  ${
                  pageNumber === currentPage
                    ? "bg-black text-white border-black"
                    : "bg-white hover:bg-neutral-100"
                  }
                `}
              >
                {pageNumber}
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}
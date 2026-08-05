import Image from "next/image";
import Link from "next/link";
import {
  FaCalendarAlt,
  FaCrown,
  FaEye,
  FaHeart,
  FaHome,
  FaRegStar,
  FaShieldAlt,
  FaStar,
} from "react-icons/fa";

import getCurrentUser from "@/app/actions/users/getCurrentUser";
import getUserProfileById from "@/app/actions/users/getUserProfileById";
import ListingCard from "@/app/components/listings/ListingCard";
import { getServerTranslation } from "@/app/libs/serverTranslation";

interface IParams {
  userId?: string;
}

interface UserProfilePageProps {
  params: Promise<IParams>;
  searchParams: Promise<{
    page?: string;
  }>;
}

const formatText = (
  text: string,
  values: Record<string, string | number>
) => {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replaceAll(`{${key}}`, String(value));
  }, text);
};

const getDateLocale = (language: string) => {
  if (language === "ar") return "ar-SY";
  if (language === "de") return "de-DE";

  return "en-US";
};

const getMemberDurationText = (
  createdAt: Date,
  t: (key: string) => string
) => {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const years = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));

  if (years <= 0) {
    return t("userProfile.memberForNew");
  }

  if (years === 1) {
    return t("userProfile.memberForOneYear");
  }

  return formatText(t("userProfile.memberForYears"), { count: years });
};

const createPageUrl = (
  language: string,
  userId: string,
  page: number
) => {
  return `/${language}/users/${userId}?page=${page}`;
};

export default async function UserProfilePage({
  params,
  searchParams,
}: UserProfilePageProps) {
  const resolvedParams = await params;

  if (!resolvedParams.userId) {
    return null;
  }

  const resolvedSearchParams = await searchParams;
  const currentPage = Number(resolvedSearchParams.page) || 1;

  const { t, language } = await getServerTranslation();

  const user = await getUserProfileById(resolvedParams, {
    page: currentPage,
    limit: 12,
  });

  const currentUser = await getCurrentUser();

  if (!user) {
    return <div className="pt-60 px-8">{t("userProfile.userNotFound")}</div>;
  }

  const userId = resolvedParams.userId;

  const badge =
    user.role === "AGENCY"
      ? {
        label: t("userProfile.agency"),
        icon: FaShieldAlt,
        className: "bg-purple-100 text-purple-800",
      }
      : user.role === "VIP_HOST"
        ? {
          label: t("userProfile.vipHost"),
          icon: FaCrown,
          className: "bg-yellow-100 text-yellow-800",
        }
        : user.role === "HOST"
          ? {
            label: t("userProfile.verifiedHost"),
            icon: FaShieldAlt,
            className: "bg-green-100 text-green-800",
          }
          : user.role === "ADMIN"
            ? {
              label: t("userProfile.admin"),
              icon: FaShieldAlt,
              className: "bg-blue-100 text-blue-800",
            }
            : {
              label: t("userProfile.member"),
              icon: FaHome,
              className: "bg-neutral-100 text-neutral-800",
            };

  const BadgeIcon = badge.icon;

  const ratingText =
    user.averageRating > 0
      ? formatText(t("userProfile.ratingWithReviews"), {
        rating: user.averageRating,
        count: user.totalReviews,
      })
      : t("userProfile.noReviewsYet");

  const totalPages = user.listingsTotalPages;
  const safeCurrentPage = user.listingsCurrentPage;

  return (
    <div className="pt-72 md:pt-60 max-w-screen-xl mx-auto px-6 pb-20">
      <div className="border rounded-3xl p-8 bg-white shadow-sm mb-12">
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          <div className="relative w-40 h-40 rounded-full overflow-hidden bg-neutral-100 shrink-0">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.name || t("userProfile.user")}
                fill
                className="object-cover"
              />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">
                  👤
                </div>
              )}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-bold">
                {user.name || t("userProfile.user")}
              </h1>

              <div
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${badge.className}`}
              >
                <BadgeIcon size={14} />
                {badge.label}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-neutral-600 mt-3">
              <div className="flex items-center gap-2">
                <FaCalendarAlt />
                {t("userProfile.joined")}{" "}
                {new Date(user.createdAt).toLocaleDateString(
                  getDateLocale(language),
                  {
                    month: "long",
                    year: "numeric",
                  }
                )}
              </div>

              <div className="flex items-center gap-2">
                {user.averageRating > 0 ? <FaStar /> : <FaRegStar />}
                {ratingText}
              </div>

              <div className="flex items-center gap-2">
                <FaHome />
                {getMemberDurationText(user.createdAt, t)}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-8">
              <div className="border rounded-2xl p-5">
                <FaHome size={20} className="mb-3" />
                <div className="text-2xl font-bold">
                  {user.listingsTotalCount}
                </div>
                <div className="text-sm text-neutral-500">
                  {t("userProfile.listings")}
                </div>
              </div>

              <div className="border rounded-2xl p-5">
                <FaEye size={20} className="mb-3" />
                <div className="text-2xl font-bold">{user.totalViews}</div>
                <div className="text-sm text-neutral-500">
                  {t("userProfile.views")}
                </div>
              </div>

              <div className="border rounded-2xl p-5">
                <FaHeart size={20} className="mb-3" />
                <div className="text-2xl font-bold">
                  {user.totalFavorites}
                </div>
                <div className="text-sm text-neutral-500">
                  {t("userProfile.favorites")}
                </div>
              </div>

              <div className="border rounded-2xl p-5">
                <FaStar size={20} className="mb-3" />
                <div className="text-2xl font-bold">
                  {user.averageRating > 0 ? user.averageRating : "-"}
                </div>
                <div className="text-sm text-neutral-500">
                  {t("userProfile.rating")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border rounded-3xl p-8 bg-white shadow-sm mb-12">
        <h2 className="text-2xl font-bold mb-4">
          {t("userProfile.aboutHost")}
        </h2>

        {user.bio ? (
          <p className="max-w-3xl leading-8 text-neutral-700">{user.bio}</p>
        ) : (
            <p className="text-neutral-500">{t("userProfile.noBio")}</p>
          )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">
            {t("userProfile.activeListings")}
          </h2>

          <div className="text-sm text-neutral-500 mt-2">
            {user.listingsTotalCount} {t("userProfile.listings")}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="text-sm text-neutral-500">
            {safeCurrentPage} / {totalPages}
          </div>
        )}
      </div>

      {user.listings.length === 0 ? (
        <div className="border rounded-2xl p-10 text-center text-neutral-500">
          {t("userProfile.noActiveListings")}
        </div>
      ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {user.listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  data={listing}
                  currentUser={currentUser}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-16 flex-wrap">
                {safeCurrentPage > 1 && (
                  <Link
                    href={createPageUrl(
                      language,
                      userId,
                      safeCurrentPage - 1
                    )}
                    className="px-4 py-2 border rounded-xl hover:bg-neutral-100"
                  >
                    {t("common.previous")}
                  </Link>
                )}

                {Array.from(
                  { length: Math.min(totalPages, 7) },
                  (_, index) => {
                    let pageNumber = index + 1;

                    if (safeCurrentPage > 4 && totalPages > 7) {
                      pageNumber = safeCurrentPage - 3 + index;

                      if (pageNumber > totalPages) {
                        return null;
                      }
                    }

                    return (
                      <Link
                        key={pageNumber}
                        href={createPageUrl(language, userId, pageNumber)}
                        className={`px-4 py-2 border rounded-xl ${
                          safeCurrentPage === pageNumber
                            ? "bg-black text-white"
                            : "hover:bg-neutral-100"
                          }`}
                      >
                        {pageNumber}
                      </Link>
                    );
                  }
                )}

                {safeCurrentPage < totalPages && (
                  <Link
                    href={createPageUrl(
                      language,
                      userId,
                      safeCurrentPage + 1
                    )}
                    className="px-4 py-2 border rounded-xl hover:bg-neutral-100"
                  >
                    {t("common.next")}
                  </Link>
                )}
              </div>
            )}
          </>
        )}
    </div>
  );
}
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import {
  FaChartLine,
  FaComments,
  FaDollarSign,
  FaEye,
  FaHeart,
  FaHome,
  FaMapMarkerAlt,
  FaRegStar,
  FaStar,
  FaTrophy,
  FaUser,
} from "react-icons/fa";

import AccountAnalyticsCharts from "@/app/components/account/AccountAnalyticsCharts";
import getAccountStats from "@/app/actions/account/getAccountStats";
import getCurrentUser from "@/app/actions/users/getCurrentUser";
import { getServerTranslation } from "@/app/libs/serverTranslation";
import { getPlanByRole } from "@/app/config/plans";
import Price from "@/app/components/common/Price";

const getPriceLabel = (
  purpose: string | null | undefined,
  rentPeriod: string | null | undefined,
  t: (key: string) => string
) => {
  if (purpose !== "rent") {
    return ` ${t("account.total")}`;
  }

  if (rentPeriod === "DAILY") return ` ${t("account.day")}`;
  if (rentPeriod === "WEEKLY") return ` ${t("account.week")}`;
  if (rentPeriod === "YEARLY") return ` ${t("account.year")}`;

  return ` ${t("account.month")}`;
};

const getListingImage = (listing?: {
  imageUrl?: string | null;
  imageUrls?: string[] | null;
}) => {
  return (
    listing?.imageUrl || listing?.imageUrls?.[0] || "/images/placeholder.jpg"
  );
};

const getPlanName = (
  role: UserRole,
  t: (key: string) => string
) => {
  if (role === "USER") return t("account.planUser");
  if (role === "HOST") return t("account.planHost");
  if (role === "VIP_HOST") return t("account.planVipHost");
  if (role === "AGENCY") return t("account.planAgency");
  if (role === "MANAGER") return t("account.planManager");
  if (role === "ADMIN") return t("account.planAdmin");

  return t("account.planUser");
};

export default async function AccountPage() {
  const currentUser = await getCurrentUser();
  const { t } = await getServerTranslation();

  if (!currentUser) {
    redirect("/");
  }

  if (currentUser.isBanned) {
    redirect("/");
  }

  const stats = await getAccountStats();

  const plan = getPlanByRole(currentUser.role);
  const planName = getPlanName(currentUser.role, t);

  const listingUsageLabel =
    plan.listingLimit === null
      ? `${stats?.listingsCount || 0} / ${t("account.unlimited")}`
      : `${stats?.listingsCount || 0} / ${plan.listingLimit}`;

  const listingLimitLabel =
    plan.listingLimit === null ? t("account.unlimited") : plan.listingLimit;

  const canViewAdvancedAnalytics =
    currentUser.role === "VIP_HOST" || currentUser.role === "AGENCY" || currentUser.role === "ADMIN";

  return (
    <div className="pt-72 md:pt-60 max-w-screen-xl mx-auto px-6 pb-20">
      <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            {t("account.ownerDashboard")}
          </h1>

          <div className="text-neutral-500">
            {t("account.welcomeBack")}, {currentUser.name || t("account.user")}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-2xl p-5">
          <div className="text-neutral-500 text-sm">
            {t("account.currentPlan")}
          </div>
          <div className="text-2xl font-bold mt-1">{planName}</div>
          <div className="text-xs text-neutral-500 mt-2">
            {t("account.planBadge")}:{" "}
            {plan.badge ? t("account.included") : t("account.notIncluded")}
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <div className="text-neutral-500 text-sm">
            {t("account.listingLimit")}
          </div>
          <div className="text-2xl font-bold mt-1">{listingUsageLabel}</div>
          <div className="text-xs text-neutral-500 mt-2">
            {t("account.allowedListings")}: {listingLimitLabel}
          </div>
        </div>

        <div className="bg-neutral-900 text-white rounded-2xl p-5">
          <div className="text-white/70 text-sm">
            {t("account.creditsBalance")}
          </div>
          <div className="text-2xl font-bold mt-1">
            {currentUser.credits || 0}
          </div>
          <div className="text-xs text-white/50 mt-2">
            {t("account.creditsDiscount")}: {plan.creditsDiscount}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <div className="bg-white border rounded-2xl p-5">
          <FaHome size={22} className="mb-4" />
          <div className="text-neutral-500 text-sm">
            {t("account.listings")}
          </div>
          <div className="text-3xl font-bold mt-1">
            {stats?.listingsCount || 0}
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <FaChartLine size={22} className="mb-4" />
          <div className="text-neutral-500 text-sm">
            {t("account.active")}
          </div>
          <div className="text-3xl font-bold mt-1">
            {stats?.activeListingsCount || 0}
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <FaEye size={22} className="mb-4" />
          <div className="text-neutral-500 text-sm">{t("account.views")}</div>
          <div className="text-3xl font-bold mt-1">
            {stats?.totalViews || 0}
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <FaHeart size={22} className="mb-4" />
          <div className="text-neutral-500 text-sm">
            {t("account.savedByUsers")}
          </div>
          <div className="text-3xl font-bold mt-1">
            {stats?.totalFavorites || 0}
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <FaComments size={22} className="mb-4" />
          <div className="text-neutral-500 text-sm">
            {t("account.messages")}
          </div>
          <div className="text-3xl font-bold mt-1">
            {stats?.conversationsCount || 0}
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <FaStar size={22} className="mb-4" />
          <div className="text-neutral-500 text-sm">{t("account.rating")}</div>
          <div className="text-3xl font-bold mt-1">
            {stats?.averageRating ? stats.averageRating : "-"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        <div className="bg-neutral-900 text-white rounded-2xl p-5">
          <FaDollarSign size={22} className="mb-4" />
          <div className="text-white/70 text-sm">
            {t("account.estimatedRevenue")}
          </div>
          <div className="text-3xl font-bold mt-1">
            <Price amount={stats?.revenue.estimated || 0} />
          </div>
          <div className="text-xs text-white/50 mt-2">
            {t("account.futureBookingMetric")}
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <FaTrophy size={22} className="mb-4" />
          <div className="text-neutral-500 text-sm">
            {t("account.bestPerformingListing")}
          </div>
          <div className="font-bold mt-1 line-clamp-1">
            {stats?.bestPerformingListing?.title || "-"}
          </div>
          <div className="text-xs text-neutral-500 mt-2">
            {t("account.basedOnStats")}
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <FaMapMarkerAlt size={22} className="mb-4" />
          <div className="text-neutral-500 text-sm">
            {t("account.mostViewedCity")}
          </div>
          <div className="font-bold mt-1">
            {stats?.mostViewedCity?.name || "-"}
          </div>
          <div className="text-xs text-neutral-500 mt-2">
            {stats?.mostViewedCity?.views || 0} {t("account.views")}
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <FaChartLine size={22} className="mb-4" />
          <div className="text-neutral-500 text-sm">
            {t("account.averagePerformance")}
          </div>
          <div className="font-bold mt-1">
            {stats?.averageViewsPerListing || 0} {t("account.views")} /{" "}
            {t("account.listing")}
          </div>
          <div className="text-xs text-neutral-500 mt-2">
            {stats?.averageFavoritesPerListing || 0}{" "}
            {t("account.savedListings")} / {t("account.listing")}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
        <Link
          href="/account/listings"
          className="border rounded-2xl p-6 hover:shadow-md transition bg-white"
        >
          <div className="text-2xl mb-3">🏠</div>
          <div className="font-bold text-lg">{t("account.myListings")}</div>
          <div className="text-sm text-neutral-500 mt-2">
            {t("account.manageProperties")}
          </div>
        </Link>

        <Link
          href="/conversations"
          className="border rounded-2xl p-6 hover:shadow-md transition bg-white"
        >
          <div className="text-2xl mb-3">💬</div>
          <div className="font-bold text-lg">{t("account.myMessages")}</div>
          <div className="text-sm text-neutral-500 mt-2">
            {t("account.chatWithUsers")}
          </div>
        </Link>

        <Link
          href="/favorites"
          className="border rounded-2xl p-6 hover:shadow-md transition bg-white"
        >
          <div className="text-2xl mb-3">❤️</div>
          <div className="font-bold text-lg">{t("account.myFavorites")}</div>
          <div className="text-sm text-neutral-500 mt-2">
            {t("account.savedListings")}
          </div>
        </Link>

        <Link
          href="/account/profile"
          className="border rounded-2xl p-6 hover:shadow-md transition bg-white"
        >
          <div className="text-2xl mb-3">👤</div>
          <div className="font-bold text-lg">{t("account.profile")}</div>
          <div className="text-sm text-neutral-500 mt-2">
            {t("account.manageAccount")}
          </div>
        </Link>
      </div>

      {stats && canViewAdvancedAnalytics && (
        <AccountAnalyticsCharts
          viewsChart={stats.viewsChart}
          reviewsChart={stats.reviewsChart}
          listingsChart={stats.listingsChart}
          topListingsChart={stats.topListingsChart}
        />
      )}

      {stats && !canViewAdvancedAnalytics && (
        <div className="border rounded-3xl p-8 bg-white mb-12 text-center">
          <div className="text-3xl mb-3">📊</div>
          <h2 className="text-2xl font-bold mb-2">
            {t("account.advancedAnalytics")}
          </h2>
          <p className="text-neutral-500">
            {t("account.advancedAnalyticsUpgrade")}
          </p>
        </div>
      )}
      {canViewAdvancedAnalytics && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12 mb-8">
            <section className="border rounded-3xl p-6 bg-white">
              <h2 className="text-xl font-bold mb-5">
                {t("account.bestRatedListing")}
              </h2>

              {stats?.bestRatedListing ? (
                <Link
                  href={`/listings/${stats.bestRatedListing.id}`}
                  className="flex items-center gap-4 rounded-2xl border p-3 hover:bg-neutral-50 transition"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                    <Image
                      src={getListingImage(stats.bestRatedListing)}
                      alt={stats.bestRatedListing.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold line-clamp-1">
                      {stats.bestRatedListing.title}
                    </div>
                    <div className="text-sm text-neutral-500">
                      {stats.bestRatedListing.city ||
                        stats.bestRatedListing.governorate}
                    </div>
                    <div className="mt-2 flex items-center gap-2 font-bold">
                      <FaStar size={14} />
                      {stats.bestRatedListing.rating}
                      <span className="text-xs font-normal text-neutral-500">
                        ({stats.bestRatedListing.ratingCount}{" "}
                        {t("account.reviews")})
                  </span>
                    </div>
                  </div>
                </Link>
              ) : (
                  <div className="text-neutral-500">
                    {t("account.noRatedListings")}
                  </div>
                )}
            </section>

            <section className="border rounded-3xl p-6 bg-white">
              <h2 className="text-xl font-bold mb-5">
                {t("account.revenueOverview")}
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-neutral-500">
                    {t("account.completed")}
                  </span>
                  <span className="font-bold">
                    <Price amount={stats?.revenue.completed || 0} />
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-500">{t("account.pending")}</span>
                  <span className="font-bold"><Price amount={stats?.revenue.pending || 0} /></span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-500">
                    {t("account.estimated")}
                  </span>
                  <span className="font-bold">
                    <Price amount={stats?.revenue.estimated || 0} />
                  </span>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-neutral-100 p-4 text-sm text-neutral-600">
                {t("account.reservationNote")}
              </div>
            </section>

            <section className="border rounded-3xl p-6 bg-white">
              <h2 className="text-xl font-bold mb-5">
                {t("account.ownerHealth")}
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-neutral-500">
                    {t("account.activeRate")}
                  </span>
                  <span className="font-bold">
                    {stats?.listingsCount
                      ? Math.round(
                        (stats.activeListingsCount / stats.listingsCount) * 100
                      )
                      : 0}
                %
              </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-500">{t("account.reviews")}</span>
                  <span className="font-bold">{stats?.reviewsCount || 0}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-500">
                    {t("account.averageRating")}
                  </span>
                  <span className="font-bold">
                    {stats?.averageRating ? stats.averageRating : "-"}
                  </span>
                </div>
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="border rounded-3xl p-6 bg-white">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {t("account.latestListings")}
                </h2>
                <Link
                  href="/account/listings"
                  className="text-sm font-semibold underline"
                >
                  {t("account.viewAll")}
                </Link>
              </div>

              {stats?.latestListings?.length ? (
                <div className="flex flex-col gap-4">
                  {stats.latestListings.map((listing) => (
                    <Link
                      key={listing.id}
                      href={`/listings/${listing.id}`}
                      className="flex items-center gap-4 rounded-2xl border p-3 hover:bg-neutral-50 transition"
                    >
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                        <Image
                          src={getListingImage(listing)}
                          alt={listing.title}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1">
                        <div className="font-semibold line-clamp-1">
                          {listing.title}
                        </div>
                        <div className="text-sm text-neutral-500">
                          {listing.city || listing.governorate}
                        </div>
                        <div className="mt-1 font-semibold">
                          <Price amount={listing.price} />
                          <span className="text-sm font-normal text-neutral-500">
                            {getPriceLabel(listing.purpose, listing.rentPeriod, t)}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          listing.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-neutral-100 text-neutral-600"
                          }`}
                      >
                        {listing.isActive
                          ? t("account.activeStatus")
                          : t("account.inactiveStatus")}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                  <div className="text-neutral-500">{t("account.noListings")}</div>
                )}
            </section>

            <section className="border rounded-3xl p-6 bg-white">
              <h2 className="text-2xl font-bold mb-6">
                {t("account.mostViewedListings")}
              </h2>

              {stats?.mostViewedListings?.length ? (
                <div className="flex flex-col gap-4">
                  {stats.mostViewedListings.map((listing) => (
                    <Link
                      key={listing.id}
                      href={`/listings/${listing.id}`}
                      className="flex items-center gap-4 rounded-2xl border p-3 hover:bg-neutral-50 transition"
                    >
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                        <Image
                          src={getListingImage(listing)}
                          alt={listing.title}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1">
                        <div className="font-semibold line-clamp-1">
                          {listing.title}
                        </div>
                        <div className="text-sm text-neutral-500">
                          {listing.city || listing.governorate}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 font-bold">
                        <FaEye />
                        {listing.viewCount}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                  <div className="text-neutral-500">{t("account.noViews")}</div>
                )}
            </section>

            <section className="border rounded-3xl p-6 bg-white">
              <h2 className="text-2xl font-bold mb-6">
                {t("account.latestReviews")}
              </h2>

              {stats?.latestReviews?.length ? (
                <div className="flex flex-col gap-5">
                  {stats.latestReviews.map((review) => {
                    const authorName =
                      review.author.name ||
                      t("account.user");

                    return (
                      <div key={review.id} className="border rounded-2xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="relative h-11 w-11 overflow-hidden rounded-full bg-neutral-100 flex items-center justify-center">
                            {review.author.avatarUrl ? (
                              <Image
                                src={review.author.avatarUrl}
                                alt={authorName}
                                fill
                                className="object-cover"
                              />
                            ) : (
                                <FaUser />
                              )}
                          </div>

                          <div>
                            <div className="font-semibold">{authorName}</div>
                            <div className="text-xs text-neutral-500">
                              {review.listing?.title || t("account.listing")}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 mb-2">
                          {Array.from({ length: 5 }, (_, index) =>
                            index < review.rating ? (
                              <FaStar key={index} size={13} />
                            ) : (
                                <FaRegStar key={index} size={13} />
                              )
                          )}
                        </div>

                        {review.comment && (
                          <p className="text-sm text-neutral-700 line-clamp-3">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                  <div className="text-neutral-500">{t("account.noReviews")}</div>
                )}
            </section>

            <section className="border rounded-3xl p-6 bg-white">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {t("account.latestMessages")}
                </h2>
                <Link
                  href="/conversations"
                  className="text-sm font-semibold underline"
                >
                  {t("account.viewAll")}
                </Link>
              </div>

              {stats?.latestConversations?.length ? (
                <div className="flex flex-col gap-4">
                  {stats.latestConversations.map((conversation) => {
                    const lastMessage = conversation.messages?.[0];
                    const listing = conversation.listing;

                    return (
                      <Link
                        key={conversation.id}
                        href={`/conversations/${conversation.id}`}
                        className="flex items-center gap-4 rounded-2xl border p-3 hover:bg-neutral-50 transition"
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                          <Image
                            src={getListingImage(listing)}
                            alt={listing?.title || t("account.conversation")}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-semibold line-clamp-1">
                            {listing?.title || t("account.conversation")}
                          </div>

                          <div className="text-sm text-neutral-500 line-clamp-1">
                            {lastMessage?.body || t("account.noMessages")}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                  <div className="text-neutral-500">{t("account.noMessages")}</div>
                )}
            </section>
          </div>
        </>
      )}
    </div>


  );
}
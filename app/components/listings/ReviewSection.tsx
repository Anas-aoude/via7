"use client";

import axios from "axios";
import Image from "next/image";
import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import type getCurrentUser from "@/app/actions/users/getCurrentUser";
import { FaStar } from "react-icons/fa";

import useLoginModal from "@/app/hooks/useLoginModal";
import useTranslation from "@/app/hooks/useTranslation";

type ReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    email: string | null;
    avatarUrl?: string | null;
  };
};
type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>;
interface ReviewSectionProps {
  listingId: string;
  ownerId: string;
  currentUser?: CurrentUser;
  initialReviews: ReviewItem[];
}

const formatTranslation = (text: string, values: Record<string, string | number>) => {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, String(value)),
    text
  );
};

const getRelativeDate = (date: string, t: (key: string) => string) => {
  const now = new Date();
  const created = new Date(date);
  const diffMs = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return t("reviews.today");
  if (diffDays === 1) return t("reviews.yesterday");
  if (diffDays < 7) {
    return formatTranslation(t("reviews.daysAgo"), { count: diffDays });
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return t("reviews.weekAgo");
  if (diffWeeks < 5) {
    return formatTranslation(t("reviews.weeksAgo"), { count: diffWeeks });
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return t("reviews.monthAgo");
  if (diffMonths < 12) {
    return formatTranslation(t("reviews.monthsAgo"), { count: diffMonths });
  }

  const diffYears = Math.floor(diffDays / 365);
  if (diffYears === 1) return t("reviews.yearAgo");

  return formatTranslation(t("reviews.yearsAgo"), { count: diffYears });
};

const ReviewStars = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => (
        <FaStar
          key={index}
          size={13}
          className={index < rating ? "text-black" : "text-neutral-300"}
        />
      ))}
    </div>
  );
};

const ReviewComment = ({
  comment,
  t,
}: {
  comment: string;
  t: (key: string) => string;
}) => {
  const [expanded, setExpanded] = useState(false);

  const isLong = comment.length > 180;
  const visibleText =
    !expanded && isLong ? `${comment.slice(0, 180).trim()}...` : comment;

  return (
    <div className="mt-4">
      <p className="text-neutral-800 leading-7 whitespace-pre-line">
        {visibleText}
      </p>

      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-2 font-semibold underline"
        >
          {expanded ? t("reviews.showLess") : t("reviews.showMore")}
        </button>
      )}
    </div>
  );
};

const ReviewSection: React.FC<ReviewSectionProps> = ({
  listingId,
  ownerId,
  currentUser,
  initialReviews,
}) => {
  const loginModal = useLoginModal();
  const { t } = useTranslation();

  const [reviews, setReviews] = useState(initialReviews);
  const [visibleCount, setVisibleCount] = useState(5);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;

    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Number((total / reviews.length).toFixed(1));
  }, [reviews]);

  const ratingStats = useMemo(() => {
    return [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter((review) => review.rating === star).length;
      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;

      return {
        star,
        count,
        percentage,
      };
    });
  }, [reviews]);

  const visibleReviews = useMemo(() => {
    return reviews.slice(0, visibleCount);
  }, [reviews, visibleCount]);

  const hasReviewed = useMemo(() => {
    if (!currentUser) return false;

    return reviews.some((review) => review.author.id === currentUser.id);
  }, [reviews, currentUser]);

  const isOwner = currentUser?.id === ownerId;

  const onSubmit = async () => {
    if (!currentUser) {
      loginModal.onOpen();
      return;
    }

    if (isOwner) {
      toast.error(t("reviews.cannotReviewOwnListing"));
      return;
    }

    if (hasReviewed) {
      toast.error(t("reviews.alreadyReviewed"));
      return;
    }

    setIsLoading(true);

    axios
      .post("/api/reviews", {
        listingId,
        rating,
        comment,
      })
      .then((response) => {
        toast.success(t("reviews.reviewAdded"));
        setReviews((current) => [
          {
            ...response.data,
            createdAt: new Date(response.data.createdAt).toISOString(),
          },
          ...current,
        ]);
        setRating(5);
        setComment("");
        setVisibleCount((current) => Math.max(current, 5));
      })
      .catch((error) => {
        toast.error(error?.response?.data?.error || t("reviews.somethingWentWrong"));
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="mt-12">
      <hr className="mb-8" />

      <div className="mb-8">
        {reviews.length > 0 ? (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <FaStar size={24} />
              <h2 className="text-2xl font-bold">
                {averageRating} · {reviews.length} {t("reviews.reviews")}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
              {ratingStats.map((item) => (
                <div key={item.star} className="flex items-center gap-3">
                  <div className="w-8 text-sm font-medium">{item.star}</div>

                  <div className="h-1.5 flex-1 rounded-full bg-neutral-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-black"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>

                  <div className="w-8 text-sm text-neutral-500">
                    {item.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
            <div>
              <h2 className="text-2xl font-bold mb-2">{t("reviews.reviews")}</h2>
              <div className="text-neutral-500">{t("reviews.noReviewsYet")}</div>
            </div>
          )}
      </div>

      {!currentUser && (
        <button
          onClick={loginModal.onOpen}
          className="mb-8 px-5 py-3 rounded-xl bg-black text-white font-semibold hover:opacity-80"
        >
          {t("reviews.loginToWriteReview")}
        </button>
      )}

      {currentUser && !isOwner && !hasReviewed && (
        <div className="border rounded-3xl p-6 mb-10 bg-white">
          <h3 className="text-xl font-semibold mb-4">
            {t("reviews.writeReview")}
          </h3>

          <div className="flex flex-col gap-4">
            <div>
              <label className="font-medium">{t("reviews.rating")}</label>

              <select
                disabled={isLoading}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="mt-2 border rounded-lg p-3 w-full"
              >
                <option value={5}>5 - {t("reviews.excellent")}</option>
                <option value={4}>4 - {t("reviews.veryGood")}</option>
                <option value={3}>3 - {t("reviews.good")}</option>
                <option value={2}>2 - {t("reviews.poor")}</option>
                <option value={1}>1 - {t("reviews.bad")}</option>
              </select>
            </div>

            <div>
              <label className="font-medium">{t("reviews.comment")}</label>

              <textarea
                disabled={isLoading}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("reviews.commentPlaceholder")}
                className="mt-2 border rounded-lg p-3 w-full min-h-[120px]"
              />
            </div>

            <button
              disabled={isLoading}
              onClick={onSubmit}
              className="bg-black text-white py-3 rounded-xl font-semibold hover:opacity-80 transition disabled:opacity-50"
            >
              {t("reviews.submitReview")}
            </button>
          </div>
        </div>
      )}

      {isOwner && (
        <div className="mb-8 text-sm text-neutral-500">
          {t("reviews.cannotReviewOwnListing")}
        </div>
      )}

      {hasReviewed && (
        <div className="mb-8 text-sm text-green-600 font-semibold">
          {t("reviews.alreadyReviewed")}
        </div>
      )}

      {reviews.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {visibleReviews.map((review) => {
              const authorName =
                review.author.name || review.author.email || "User";

              return (
                <div key={review.id}>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-neutral-100 flex items-center justify-center shrink-0">
                      {review.author.avatarUrl ? (
                        <Image
                          src={review.author.avatarUrl}
                          alt={authorName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                          <span className="text-xl">👤</span>
                        )}
                    </div>

                    <div>
                      <div className="font-semibold">{authorName}</div>
                      <div className="text-sm text-neutral-500">
                        {getRelativeDate(review.createdAt, t)}
                      </div>
                    </div>
                  </div>

                  <ReviewStars rating={review.rating} />

                  {review.comment && (
                    <ReviewComment comment={review.comment} t={t} />
                  )}
                </div>
              );
            })}
          </div>

          {visibleCount < reviews.length && (
            <button
              type="button"
              onClick={() => setVisibleCount((current) => current + 5)}
              className="mt-10 rounded-xl border border-black px-6 py-3 font-semibold hover:bg-neutral-100 transition"
            >
              {t("reviews.loadMoreReviews")}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default ReviewSection;
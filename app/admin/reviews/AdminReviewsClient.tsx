"use client";

import axios from "axios";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

type AdminReview = {
  id: string;
  rating: number;
  comment: string | null;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string | null;
    email: string | null;
  };
  target: {
    id: string;
    name: string | null;
    email: string | null;
  };
  listing: {
    id: string;
    title: string;
  } | null;
};

interface AdminReviewsClientProps {
  reviews: AdminReview[];
}

const AdminReviewsClient: React.FC<AdminReviewsClientProps> = ({ reviews }) => {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filteredReviews = useMemo(() => {
    const q = query.toLowerCase().trim();

    return reviews.filter((review) => {
      const matchesSearch =
        !q ||
        review.id.toLowerCase().includes(q) ||
        review.comment?.toLowerCase().includes(q) ||
        review.author.name?.toLowerCase().includes(q) ||
        review.author.email?.toLowerCase().includes(q) ||
        review.target.name?.toLowerCase().includes(q) ||
        review.target.email?.toLowerCase().includes(q) ||
        review.listing?.title.toLowerCase().includes(q);

      const matchesRating =
        !ratingFilter || review.rating === Number(ratingFilter);

      return matchesSearch && matchesRating;
    });
  }, [reviews, query, ratingFilter]);

  const patchReview = async (reviewId: string, isHidden: boolean) => {
    setLoadingId(reviewId);

    axios
      .patch(`/api/admin/reviews/${reviewId}`, { isHidden })
      .then(() => {
        toast.success(isHidden ? "Review hidden" : "Review visible");
        router.refresh();
      })
      .catch((error) => {
        toast.error(error?.response?.data?.error || "Something went wrong");
      })
      .finally(() => {
        setLoadingId(null);
      });
  };

  const deleteReview = async (reviewId: string) => {
    const confirmed = confirm("Delete this review permanently?");
    if (!confirmed) return;

    setLoadingId(reviewId);

    axios
      .delete(`/api/admin/reviews/${reviewId}`)
      .then(() => {
        toast.success("Review deleted");
        router.refresh();
      })
      .catch((error) => {
        toast.error(error?.response?.data?.error || "Something went wrong");
      })
      .finally(() => {
        setLoadingId(null);
      });
  };

  const perPage = 10;
  const totalPages = Math.ceil(filteredReviews.length / perPage);

  const paginatedReviews = filteredReviews.slice(
    (page - 1) * perPage,
    page * perPage
  );

  return (
    <>
      <div className="mb-8">
        <Link
          href="/admin"
          className="text-sm text-rose-500 font-semibold hover:underline"
        >
          ← Back to dashboard
        </Link>

        <h1 className="text-4xl font-bold mt-4">Admin Reviews</h1>

        <p className="text-neutral-500 mt-2">
          Moderate property and host reviews.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search review, user, listing or id..."
          className="md:col-span-2 border rounded-xl p-4"
        />

        <select
          value={ratingFilter}
          onChange={(e) => {
            setRatingFilter(e.target.value);
            setPage(1);
          }}
          className="border rounded-xl p-4"
        >
          <option value="">All ratings</option>
          <option value="5">5 stars</option>
          <option value="4">4 stars</option>
          <option value="3">3 stars</option>
          <option value="2">2 stars</option>
          <option value="1">1 star</option>
        </select>
      </div>

      <div className="border rounded-2xl overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 text-left">
            <tr>
              <th className="p-4">Rating</th>
              <th className="p-4">Comment</th>
              <th className="p-4">Listing</th>
              <th className="p-4">Author</th>
              <th className="p-4">Target</th>
              <th className="p-4">Status</th>
              <th className="p-4">Created</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedReviews.map((review) => {
              const isLoading = loadingId === review.id;

              return (
                <tr key={review.id} className="border-t hover:bg-neutral-50">
                  <td className="p-4 font-bold">⭐ {review.rating}</td>

                  <td className="p-4 max-w-[320px]">
                    <div className="line-clamp-3">
                      {review.comment || "No comment"}
                    </div>
                    <div className="text-xs text-neutral-400 font-mono mt-1">
                      {review.id}
                    </div>
                  </td>

                  <td className="p-4">
                    {review.listing ? (
                      <Link
                        href={`/listings/${review.listing.id}`}
                        className="font-semibold hover:underline"
                      >
                        {review.listing.title}
                      </Link>
                    ) : (
                        <span className="text-neutral-500">No listing</span>
                      )}
                  </td>

                  <td className="p-4">
                    <div className="font-semibold">
                      {review.author.name || "No name"}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {review.author.email || "No email"}
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="font-semibold">
                      {review.target.name || "No name"}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {review.target.email || "No email"}
                    </div>
                  </td>

                  <td className="p-4">
                    {review.isHidden ? (
                      <span className="text-red-600 font-semibold">Hidden</span>
                    ) : (
                        <span className="text-green-600 font-semibold">
                          Visible
                        </span>
                      )}
                  </td>

                  <td className="p-4 text-neutral-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </td>

                  <td className="p-4">
                    <div className="flex flex-col gap-2 min-w-[110px]">
                      <button
                        disabled={isLoading}
                        onClick={() =>
                          patchReview(review.id, !review.isHidden)
                        }
                        className="text-left text-blue-600 font-semibold hover:underline disabled:opacity-40"
                      >
                        {review.isHidden ? "Unhide" : "Hide"}
                      </button>

                      <button
                        disabled={isLoading}
                        onClick={() => deleteReview(review.id)}
                        className="text-left text-red-600 font-semibold hover:underline disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {paginatedReviews.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-neutral-500">
                  No reviews found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-6">
        <button
          disabled={page === 1}
          onClick={() => setPage((value) => value - 1)}
          className="px-4 py-2 border rounded-lg disabled:opacity-40"
        >
          Previous
        </button>

        <div>
          Page {page} / {totalPages || 1}
        </div>

        <button
          disabled={page === totalPages || totalPages === 0}
          onClick={() => setPage((value) => value + 1)}
          className="px-4 py-2 border rounded-lg disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </>
  );
};

export default AdminReviewsClient;
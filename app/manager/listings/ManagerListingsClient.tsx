"use client";

import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import Price from "@/app/components/common/Price";
import { categories } from "@/app/libs/categories";

type ManagerListing = {
  id: string;
  title: string;
  price: number;
  governorate: string;
  city: string | null;
  category: string;
  type: string;
  purpose: string;
  imageUrl: string | null;
  imageUrls: string[];
  isActive: boolean;
  featured: boolean;
  viewCount: number;
  favoriteCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
};


const ManagerListingsClient = () => {
  const [listings, setListings] = useState<ManagerListing[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [featured, setFeatured] = useState("");
  const [type, setType] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const fetchListings = async () => {
    setIsFetching(true);

    axios
      .get("/api/manager/listings", {
        params: {
          page,
          query,
          status,
          featured,
          type,
        },
      })
      .then((response) => {
        setListings(response.data.listings);
        setTotalPages(response.data.totalPages || 1);
      })
      .catch((error) => {
        toast.error(error?.response?.data?.error || "Failed to load listings");
      })
      .finally(() => {
        setIsFetching(false);
      });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchListings();
    }, 350);

    return () => clearTimeout(timer);
  }, [page, query, status, featured, type]);

  const patchListing = async (
    listingId: string,
    data: {
      isActive?: boolean;
      featured?: boolean;
    }
  ) => {
    setLoadingId(listingId);

    axios
      .patch(`/api/manager/listings/${listingId}`, data)
      .then(() => {
        toast.success("Listing updated");
        fetchListings();
      })
      .catch((error) => {
        toast.error(error?.response?.data?.error || "Something went wrong");
      })
      .finally(() => {
        setLoadingId(null);
      });
  };

  return (
    <>
      <div className="mb-8">
        <Link
          href="/manager"
          className="text-sm text-rose-500 font-semibold hover:underline"
        >
          ← Back to dashboard
        </Link>

        <h1 className="text-4xl font-bold mt-4">Manager Listings</h1>

        <p className="text-neutral-500 mt-2">
          Manage property listings with limited manager permissions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          autoComplete="off"
          placeholder="Search title, owner, city or ID..."
          className="md:col-span-2 border rounded-xl p-4"
        />

        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          className="border rounded-xl p-4"
        >
          <option value="">All types</option>
          {categories.map((item) => (
            <option key={item.label} value={item.label}>
              {item.label}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="border rounded-xl p-4"
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          value={featured}
          onChange={(e) => {
            setFeatured(e.target.value);
            setPage(1);
          }}
          className="border rounded-xl p-4"
        >
          <option value="">All featured</option>
          <option value="true">Featured</option>
          <option value="false">Normal</option>
        </select>
      </div>

      {isFetching && (
        <div className="mb-4 text-sm text-neutral-500">Loading listings...</div>
      )}

      <div className="border rounded-2xl overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100 text-left">
            <tr>
              <th className="p-4">Image</th>
              <th className="p-4">Title</th>
              <th className="p-4">Owner</th>
              <th className="p-4">Location</th>
              <th className="p-4">Type</th>
              <th className="p-4">Price</th>
              <th className="p-4">Status</th>
              <th className="p-4">Featured</th>
              <th className="p-4">Views</th>
              <th className="p-4">Created</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {listings.map((listing) => {
              const image =
                listing.imageUrl ||
                listing.imageUrls?.[0] ||
                "/images/placeholder.jpg";

              const isLoading = loadingId === listing.id;

              return (
                <tr key={listing.id} className="border-t hover:bg-neutral-50">
                  <td className="p-4">
                    <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-neutral-100">
                      <Image
                        src={image}
                        alt={listing.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </td>

                  <td className="p-4">
                    <Link
                      href={`/listings/${listing.id}`}
                      className="font-semibold hover:underline"
                    >
                      {listing.title}
                    </Link>

                    <div className="text-xs text-neutral-500 font-mono">
                      {listing.id}
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="font-semibold">
                      {listing.user.name || "No name"}
                    </div>

                    <div className="text-xs text-neutral-500">
                      {listing.user.email || "No email"}
                    </div>
                  </td>

                  <td className="p-4">
                    {listing.governorate}
                    {listing.city ? `, ${listing.city}` : ""}
                  </td>

                  <td className="p-4">
                    {listing.type || listing.category || "Unknown"}
                  </td>

                  <td className="p-4 font-semibold">
                    <Price amount={listing.price} />
                  </td>

                  <td className="p-4">
                    {listing.isActive ? (
                      <span className="text-green-600 font-semibold">
                        Active
                      </span>
                    ) : (
                        <span className="text-red-600 font-semibold">
                          Inactive
                        </span>
                      )}
                  </td>

                  <td className="p-4">
                    {listing.featured ? (
                      <span className="text-rose-500 font-semibold">Yes</span>
                    ) : (
                        <span className="text-neutral-500">No</span>
                      )}
                  </td>

                  <td className="p-4">{listing.viewCount}</td>

                  <td className="p-4 text-neutral-500">
                    {new Date(listing.createdAt).toLocaleDateString()}
                  </td>

                  <td className="p-4">
                    <div className="flex flex-col gap-2 min-w-[130px]">
                      <Link
                        href={`/manager/listings/${listing.id}/edit`}
                        className="text-blue-600 font-semibold hover:underline"
                      >
                        Edit
                      </Link>

                      <button
                        disabled={isLoading}
                        onClick={() =>
                          patchListing(listing.id, {
                            isActive: !listing.isActive,
                          })
                        }
                        className="text-left text-sm text-green-700 font-semibold hover:underline disabled:opacity-40"
                      >
                        {listing.isActive ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        disabled={isLoading}
                        onClick={() =>
                          patchListing(listing.id, {
                            featured: !listing.featured,
                          })
                        }
                        className="text-left text-sm text-rose-600 font-semibold hover:underline disabled:opacity-40"
                      >
                        {listing.featured ? "Unfeature" : "Feature"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {listings.length === 0 && !isFetching && (
              <tr>
                <td colSpan={11} className="p-8 text-center text-neutral-500">
                  No listings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-6">
        <button
          disabled={page === 1 || isFetching}
          onClick={() => setPage((value) => value - 1)}
          className="px-4 py-2 border rounded-lg disabled:opacity-40"
        >
          Previous
        </button>

        <div>
          Page {page} / {totalPages || 1}
        </div>

        <button
          disabled={page === totalPages || totalPages === 0 || isFetching}
          onClick={() => setPage((value) => value + 1)}
          className="px-4 py-2 border rounded-lg disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </>
  );
};

export default ManagerListingsClient;
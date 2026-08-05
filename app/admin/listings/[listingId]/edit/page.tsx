import Link from "next/link";
import { redirect } from "next/navigation";

import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/users/getCurrentUser";
import EditListingClient from "./EditListingClient";

interface IParams {
  listingId?: string;
}

export default async function AdminEditListingPage({
  params,
}: {
  params: Promise<IParams>;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    redirect("/");
  }

  const { listingId } = await params;

  if (!listingId) {
    redirect("/admin/listings");
  }

  const listing = await prisma.listing.findUnique({
    where: {
      id: listingId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          role: true,
        },
      },
    },
  });

  if (!listing) {
    redirect("/admin/listings");
  }

  return (
    <div className="pt-56 max-w-screen-lg mx-auto px-8 pb-20">
      <Link
        href="/admin/listings"
        className="text-sm text-rose-500 font-semibold hover:underline"
      >
        ← Back to listings
      </Link>

      <h1 className="text-4xl font-bold mt-4 mb-2">Edit Listing</h1>

      <p className="text-neutral-500 mb-8">
        Owner: {listing.user.name || "No name"} —{" "}
        {listing.user.email || "No email"}
      </p>

      <EditListingClient
        listing={{
          ...listing,
          createdAt: listing.createdAt.toISOString(),
          updatedAt: listing.updatedAt.toISOString(),
        }}
      />
    </div>
  );
}
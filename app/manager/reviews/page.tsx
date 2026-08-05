import { redirect } from "next/navigation";

import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/users/getCurrentUser";
import ManagerReviewsClient from "./ManagerReviewsClient";

export default async function ManagerReviewsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "MANAGER") {
    redirect("/");
  }

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true, email: true } },
      target: { select: { id: true, name: true, email: true } },
      listing: { select: { id: true, title: true } },
    },
  });

  return (
    <div className="pt-56 max-w-screen-xl mx-auto px-8 pb-20">
      <ManagerReviewsClient
        reviews={reviews.map((review) => ({
          ...review,
          createdAt: review.createdAt.toISOString(),
          updatedAt: review.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
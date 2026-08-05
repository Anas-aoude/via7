import { redirect } from "next/navigation";

import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/users/getCurrentUser";
import AdminUsersClient from "./AdminUsersClient";

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isBanned: true,
      createdAt: true,
      _count: {
        select: {
          listings: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="pt-56 max-w-screen-xl mx-auto px-8 pb-20">
      <h1 className="text-4xl font-bold mb-8">Users</h1>

      <AdminUsersClient users={users} />
    </div>
  );
}
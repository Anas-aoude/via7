import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/users/getCurrentUser";
import ManagerUsersClient from "./ManagerUsersClient";

export default async function ManagerUsersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "MANAGER") {
    redirect("/");
  }

  const manageableUserRoles: UserRole[] = [
    "USER",
    "HOST",
    "VIP_HOST",
    "AGENCY",
  ];

  const users = await prisma.user.findMany({
    where: {
      role: {
        in: manageableUserRoles,
      },
    },
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

      <ManagerUsersClient users={users} />
    </div>
  );
}
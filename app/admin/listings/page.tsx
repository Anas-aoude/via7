import { redirect } from "next/navigation";

import getCurrentUser from "@/app/actions/users/getCurrentUser";
import AdminListingsClient from "./AdminListingsClient";

export default async function AdminListingsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="pt-56 max-w-screen-xl mx-auto px-8 pb-20">
      <AdminListingsClient />
    </div>
  );
}
import { redirect } from "next/navigation";

import getCurrentUser from "@/app/actions/users/getCurrentUser";
import ManagerListingsClient from "./ManagerListingsClient";

export default async function ManagerListingsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "MANAGER") {
    redirect("/");
  }

  return (
    <div className="pt-56 max-w-screen-xl mx-auto px-8 pb-20">
      <ManagerListingsClient />
    </div>
  );
}
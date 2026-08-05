import { redirect } from "next/navigation";

import getCurrentUser from "@/app/actions/users/getCurrentUser";
import AuditLogsClient from "./AuditLogsClient";

export default async function AdminAuditLogsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN" || currentUser.isBanned) {
    redirect("/");
  }

  return <AuditLogsClient />;
}
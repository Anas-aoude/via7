"use client";

import dynamic from "next/dynamic";

const ManagerDashboardClient = dynamic(
  () => import("./ManagerDashboardClientInner"),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-8">
        <div className="h-12 w-72 animate-pulse rounded-xl bg-neutral-100" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="h-[140px] animate-pulse rounded-2xl border bg-neutral-100"
            />
          ))}
        </div>
        <div className="h-[380px] animate-pulse rounded-2xl border bg-neutral-100" />
      </div>
    ),
  }
);

export default ManagerDashboardClient;
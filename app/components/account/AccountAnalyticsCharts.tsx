"use client";

import dynamic from "next/dynamic";

const AccountAnalyticsCharts = dynamic(
  () => import("./AccountAnalyticsChartsClient"),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-[340px] animate-pulse rounded-3xl border bg-neutral-100"
          />
        ))}
      </div>
    ),
  }
);

export default AccountAnalyticsCharts;
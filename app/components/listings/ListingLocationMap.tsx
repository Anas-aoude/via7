"use client";

import dynamic from "next/dynamic";

const ListingLocationMap = dynamic(() => import("./ListingLocationMapClient"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full animate-pulse rounded-2xl border bg-neutral-100" />
  ),
});

export default ListingLocationMap;
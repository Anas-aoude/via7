"use client";

import dynamic from "next/dynamic";

const SearchMap = dynamic(() => import("./SearchMapClient"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-l-3xl bg-neutral-100" />
  ),
});

export default SearchMap;
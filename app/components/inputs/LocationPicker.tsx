"use client";

import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("./LocationPickerClient"), {
  ssr: false,
  loading: () => (
    <div className="h-[280px] w-full animate-pulse rounded-xl border bg-neutral-100" />
  ),
});

export default LocationPicker;
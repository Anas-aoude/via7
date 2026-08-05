"use client";

import dynamic from "next/dynamic";

interface ListingLocationMapWrapperProps {
  latitude: number;
  longitude: number;
}

const ListingLocationMap = dynamic(() => import("./ListingLocationMap"), {
  ssr: false,
});

const ListingLocationMapWrapper: React.FC<ListingLocationMapWrapperProps> = ({
  latitude,
  longitude,
}) => {
  return <ListingLocationMap latitude={latitude} longitude={longitude} />;
};

export default ListingLocationMapWrapper;
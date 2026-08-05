"use client";

import { Icon } from "leaflet";
import { FaDirections, FaMapMarkedAlt } from "react-icons/fa";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

interface ListingLocationMapProps {
  latitude: number;
  longitude: number;
}

const markerIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [32, 52],
  iconAnchor: [16, 52],
  popupAnchor: [0, -48],
});

const ListingLocationMap: React.FC<ListingLocationMapProps> = ({
  latitude,
  longitude,
}) => {
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  return (
    <div className="relative isolate z-0 h-[420px] w-full overflow-hidden rounded-2xl border">
      <div className="absolute right-4 top-4 z-[500] flex flex-col gap-2">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold shadow-md hover:shadow-lg transition"
        >
          <FaMapMarkedAlt />
          Open in Maps
        </a>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold shadow-md hover:shadow-lg transition"
        >
          <FaDirections />
          Directions
        </a>
      </div>

      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={false}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[latitude, longitude]} icon={markerIcon}>
          <Popup>
            <div className="text-sm">
              <div className="font-bold">Property location</div>
              <div className="text-neutral-500">
                Exact location provided by owner
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default ListingLocationMap;
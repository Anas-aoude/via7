"use client";

import { Icon } from "leaflet";
import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (value: { latitude: number; longitude: number }) => void;
}

const defaultCenter: [number, number] = [34.8021, 38.9968];

const markerIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const ChangeMapView = ({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) => {
  const map = useMap();

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      map.setView([latitude, longitude], 14);
    }
  }, [latitude, longitude, map]);

  return null;
};

const ClickHandler = ({
  onChange,
}: {
  onChange: (value: { latitude: number; longitude: number }) => void;
}) => {
  useMapEvents({
    click(event) {
      onChange({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  onChange,
}) => {
  const hasLocation = latitude !== null && longitude !== null;

  return (
    <div className="h-[280px] w-full overflow-hidden rounded-xl border">
      <MapContainer
        center={hasLocation ? [latitude, longitude] : defaultCenter}
        zoom={hasLocation ? 14 : 6}
        scrollWheelZoom
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickHandler onChange={onChange} />
        <ChangeMapView latitude={latitude} longitude={longitude} />

        {hasLocation && (
          <Marker
            position={[latitude, longitude]}
            icon={markerIcon}
            draggable
            eventHandlers={{
              dragend(event) {
                const marker = event.target;
                const position = marker.getLatLng();

                onChange({
                  latitude: position.lat,
                  longitude: position.lng,
                });
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default LocationPicker;
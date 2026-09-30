"use client";
import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  lat: number;
  lng: number;
  label?: string;
  locationLabel?: string | null;
  lastUpdatedAt?: string | null;
}

// Default Leaflet marker images break under bundlers; a styled div avoids
// shipping/resolving any image assets.
const truckIcon = L.divIcon({
  className: "",
  html: `<div class="relative w-[18px] h-[18px]">
    <span class="absolute inset-0 rounded-full bg-[#538e53] opacity-40 animate-ping"></span>
    <span class="absolute inset-[3px] rounded-full bg-[#538e53] border-2 border-[#fefefe] shadow-md"></span>
  </div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/** Keeps the map centered on the marker as new GPS points arrive. */
const RecenterOnMove: React.FC<{ lat: number; lng: number }> = ({
  lat,
  lng,
}) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [map, lat, lng]);
  return null;
};

const formatUpdated = (iso?: string | null): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function LiveTrackingMap({
  lat,
  lng,
  label,
  locationLabel,
  lastUpdatedAt,
}: Props) {
  const updated = formatUpdated(lastUpdatedAt);
  const badge = [locationLabel, updated ? `updated ${updated}` : null]
    .filter(Boolean)
    .join(" — ");

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[lat, lng]}
        zoom={13}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={truckIcon}>
          <Popup>
            <span className="font-montserrat text-[12px]">
              {label ?? "Your order"}
              {updated ? ` — updated ${updated}` : ""}
            </span>
          </Popup>
        </Marker>
        <RecenterOnMove lat={lat} lng={lng} />
      </MapContainer>
      {badge && (
        <span className="absolute bottom-2 left-2 z-[400] bg-[#fefefe]/90 rounded-[6px] px-2 py-1 font-montserrat text-[10px] text-[#2b2b2b] shadow">
          {badge}
        </span>
      )}
    </div>
  );
}

"use client";

import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";

import { tileAttribution, tileUrl } from "@/ui/components/map/geoapifyTiles";

export type MapPin = { name: string; lat: number; lng: number };

const pinIcon = L.divIcon({
  html: `<div style="
    width: 14px; height: 14px;
    background: var(--primary);
    border: 2px solid var(--background);
    border-radius: 50%;
    box-shadow: 0 0 4px rgba(0,0,0,0.4);
  "></div>`,
  className: "",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function FitToPins({ pins }: { pins: MapPin[] }) {
  const map = useMap();

  useEffect(() => {
    if (pins.length === 0) return;
    map.fitBounds(L.latLngBounds(pins.map((p) => [p.lat, p.lng] as [number, number])), {
      padding: [48, 48],
      maxZoom: 6,
    });
  }, [pins, map]);

  return null;
}

export function DestinationsMap({ pins }: { pins: MapPin[] }) {
  const center: [number, number] = pins.length ? [pins[0].lat, pins[0].lng] : [20, 0];

  return (
    <MapContainer
      center={center}
      zoom={pins.length ? 4 : 2}
      worldCopyJump
      scrollWheelZoom
      style={{ width: "100%", height: "100%" }}>
      <FitToPins pins={pins} />
      <TileLayer url={tileUrl} attribution={tileAttribution} maxZoom={20} />
      {pins.map((pin) => (
        <Marker key={pin.name} position={[pin.lat, pin.lng]} icon={pinIcon} title={pin.name}>
          <Tooltip direction="top">{pin.name}</Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default DestinationsMap;

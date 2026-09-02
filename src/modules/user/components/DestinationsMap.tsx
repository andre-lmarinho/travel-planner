"use client";

import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { GeoJSON, MapContainer, Popup, TileLayer, useMap, ZoomControl } from "react-leaflet";

import { dashboardTileUrl, tileAttribution } from "@/ui/components/map/config";

export type TravelCountry = {
  code: string;
  tripCount: number;
  locationCount: number;
  trips: { id: string; title: string }[];
};

type CountryFeature = { properties: Record<string, unknown> | null };
type CountryCollection = { features: CountryFeature[] };
type SelectedCountry = TravelCountry & { name: string; position: [number, number] };

const countriesUrl = "/data/countries.geojson";

function countryKey(feature: CountryFeature): string {
  const value = feature.properties?.["ISO3166-1-Alpha-2"] ?? feature.properties?.name;
  return typeof value === "string" ? value.trim().toLocaleLowerCase() : "";
}

function countryName(feature: CountryFeature): string {
  return typeof feature.properties?.name === "string" ? feature.properties.name : "Visited country";
}

function CountryLayer({ countries }: { countries: TravelCountry[] }) {
  const map = useMap();
  const [boundaries, setBoundaries] = useState<CountryCollection | null>(null);
  const [selected, setSelected] = useState<SelectedCountry | null>(null);

  const countriesByKey = useMemo(
    () => new Map(countries.map((country) => [country.code.trim().toLocaleLowerCase(), country])),
    [countries]
  );

  const matchedFeatures = useMemo(() => {
    if (!boundaries) return [];
    return boundaries.features.flatMap((feature) => {
      const country = countriesByKey.get(countryKey(feature));
      return country ? [{ feature, country }] : [];
    });
  }, [boundaries, countriesByKey]);

  useEffect(() => {
    let cancelled = false;

    fetch(countriesUrl, { cache: "force-cache" })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load country boundaries");
        return response.json() as Promise<CountryCollection>;
      })
      .then((data) => {
        if (!cancelled) setBoundaries(data);
      })
      .catch(() => {
        if (!cancelled) setBoundaries(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (matchedFeatures.length === 0) return;

    const bounds = L.geoJSON(matchedFeatures.map(({ feature }) => feature) as never).getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [32, 32], maxZoom: 5 });
  }, [map, matchedFeatures]);

  return (
    <>
      {matchedFeatures.map(({ feature, country }) => (
        <GeoJSON
          key={countryKey(feature) || countryName(feature)}
          data={feature as never}
          style={() => ({
            color: selected?.code === country.code ? "var(--primary)" : "var(--border)",
            weight: selected?.code === country.code ? 2 : 1,
            fillColor: "var(--primary)",
            fillOpacity: selected?.code === country.code ? 0.3 : 0.16,
          })}
          onEachFeature={(rawFeature, layer) => {
            const typedFeature = rawFeature as CountryFeature;
            const center = L.geoJSON(typedFeature as never)
              .getBounds()
              .getCenter();
            const selectCountry = (position: [number, number]) =>
              setSelected({ ...country, name: countryName(typedFeature), position });

            layer.on({
              mouseover: (event) => {
                event.target.setStyle({ weight: 2, fillOpacity: 0.3 });
                selectCountry([center.lat, center.lng]);
              },
              mouseout: (event) => {
                event.target.setStyle({ weight: 1, fillOpacity: 0.16 });
                setSelected(null);
              },
              click: (event) => selectCountry([event.latlng.lat, event.latlng.lng]),
            });
          }}
        />
      ))}
      {selected ? (
        <Popup
          position={selected.position}
          closeButton
          autoPan={false}
          eventHandlers={{ remove: () => setSelected(null) }}>
          <div className="min-w-44 space-y-2">
            <p className="font-semibold">{selected.name}</p>
            <div className="text-muted-foreground flex gap-3 text-xs">
              <span>
                <strong className="text-foreground">{selected.tripCount}</strong>{" "}
                {selected.tripCount === 1 ? "trip" : "trips"}
              </span>
              <span>
                <strong className="text-foreground">{selected.locationCount}</strong>{" "}
                {selected.locationCount === 1 ? "location" : "locations"}
              </span>
            </div>
            <ul className="border-border space-y-1 border-t pt-2 text-xs">
              {selected.trips.map((trip) => (
                <li key={trip.id} className="truncate">
                  {trip.title}
                </li>
              ))}
            </ul>
          </div>
        </Popup>
      ) : null}
    </>
  );
}

export function DestinationsMap({ countries }: { countries: TravelCountry[] }) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      zoomControl={false}
      zoomDelta={0.25}
      zoomSnap={0.25}
      wheelDebounceTime={100}
      wheelPxPerZoomLevel={240}
      worldCopyJump
      scrollWheelZoom
      style={{ width: "100%", height: "100%" }}>
      <CountryLayer countries={countries} />
      <ZoomControl position="bottomright" />
      <TileLayer url={dashboardTileUrl} attribution={tileAttribution} maxZoom={20} />
    </MapContainer>
  );
}

export default DestinationsMap;

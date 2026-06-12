"use client";

import { useState } from "react";

export type Spot = { lat: number; lng: number; label: string };

export const JOHANNESBURG: Spot = { lat: -26.2041, lng: 28.0473, label: "Johannesburg area" };

// Browser geolocation with a sensible fallback. Coords are rounded to ~10 m so
// we never store or display a pinpoint-precise position.
export function useSpot(initial: Spot) {
  const [spot, setSpot] = useState<Spot>(initial);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  function locateMe() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Location isn't supported on this device.");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSpot({
          lat: +pos.coords.latitude.toFixed(4),
          lng: +pos.coords.longitude.toFixed(4),
          label: "Your location",
        });
        setLocating(false);
      },
      () => {
        setGeoError("Couldn't get your location — check your browser's location permission.");
        setLocating(false);
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }

  return { spot, setSpot, locateMe, locating, geoError };
}

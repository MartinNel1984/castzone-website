"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import Link from "next/link";
import { VENUE_WATER_LEVELS } from "@/data/waterConditions";
import { DEPTH_MAP_SLUGS } from "@/data/depthMaps";

export type Venue = {
  id: string;
  name: string;
  slug: string;
  province: string;
  type: string;
  species: string[];
  lat: number;
  lng: number;
  permit_required: boolean;
  permit_info: string | null;
  facilities: string[];
};

const TYPE_COLOUR: Record<string, string> = {
  dam:       "#2d6a4f",
  river:     "#2a6e6e",
  estuary:   "#6b4226",
  saltwater: "#1d3557",
};

function waterLevelColor(pct: number): string {
  if (pct > 100) return "#a855f7"; // purple — overflow
  if (pct >= 80)  return "#22c55e"; // green — full
  if (pct >= 60)  return "#f59e0b"; // amber — moderate
  if (pct >= 30)  return "#f97316"; // orange — low
  return "#ef4444";                  // red — critical
}

function levelLabel(pct: number): string {
  if (pct > 100) return "Overflow";
  if (pct >= 80)  return "Full";
  if (pct >= 60)  return "Moderate";
  if (pct >= 30)  return "Low";
  return "Critical";
}

function typeColour(type: string) {
  return TYPE_COLOUR[type] ?? "#f26522";
}

export default function VenueMap({ venues }: { venues: Venue[] }) {
  return (
    <MapContainer
      center={[-29, 25]}
      zoom={6}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {venues.map((venue) => {
        const waterData = VENUE_WATER_LEVELS[venue.slug];
        const fillColor = waterData
          ? waterLevelColor(waterData.pct)
          : typeColour(venue.type);
        const radius = waterData ? 10 : 8;

        return (
          <CircleMarker
            key={venue.id}
            center={[venue.lat, venue.lng]}
            radius={radius}
            pathOptions={{
              color: "#fff",
              weight: waterData ? 2 : 1.5,
              fillColor,
              fillOpacity: 0.92,
            }}
          >
            <Popup>
              <div style={{ minWidth: 180 }}>
                <strong style={{ display: "block", marginBottom: 4, fontSize: 14 }}>
                  {venue.name}
                </strong>
                <span style={{ fontSize: 12, color: "#555", textTransform: "capitalize" }}>
                  {venue.type} · {venue.province}
                </span>
                {DEPTH_MAP_SLUGS.has(venue.slug) && (
                  <span style={{ display: "block", fontSize: 11, color: "#2a6e6e", fontWeight: 600, marginTop: 2 }}>
                    🗺 Depth map available
                  </span>
                )}

                {/* Water level badge */}
                {waterData && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      background: "#1a3a3a", border: "1px solid #2a6e6e",
                      borderRadius: 4, padding: "4px 8px",
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        backgroundColor: waterLevelColor(waterData.pct),
                        flexShrink: 0,
                      }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: waterLevelColor(waterData.pct) }}>
                        {waterData.pct}% — {levelLabel(waterData.pct)}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#7a8fa8", marginTop: 4 }}>
                      vs last year: {waterData.lastYear}%
                      {waterData.pct > waterData.lastYear
                        ? <span style={{ color: "#22c55e" }}> ▲ {(waterData.pct - waterData.lastYear).toFixed(1)}%</span>
                        : <span style={{ color: "#f97316" }}> ▼ {(waterData.lastYear - waterData.pct).toFixed(1)}%</span>
                      }
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 6, fontSize: 12, color: "#333" }}>
                  {venue.species.slice(0, 3).join(", ")}
                  {venue.species.length > 3 ? ` +${venue.species.length - 3} more` : ""}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <Link
                    href={`/venues/${venue.slug}`}
                    style={{ fontSize: 12, color: "#f26522", fontWeight: 600 }}
                  >
                    View venue →
                  </Link>
                  {waterData && (
                    <Link
                      href="/conditions"
                      style={{ fontSize: 12, color: "#2a6e6e", fontWeight: 600 }}
                    >
                      All dam levels →
                    </Link>
                  )}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}

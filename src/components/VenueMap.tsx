"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import Link from "next/link";

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
      {venues.map((venue) => (
        <CircleMarker
          key={venue.id}
          center={[venue.lat, venue.lng]}
          radius={8}
          pathOptions={{
            color: "#fff",
            weight: 1.5,
            fillColor: typeColour(venue.type),
            fillOpacity: 0.9,
          }}
        >
          <Popup>
            <div style={{ minWidth: 160 }}>
              <strong style={{ display: "block", marginBottom: 4, fontSize: 14 }}>{venue.name}</strong>
              <span style={{ fontSize: 12, color: "#555", textTransform: "capitalize" }}>{venue.type} · {venue.province}</span>
              <div style={{ marginTop: 6, fontSize: 12, color: "#333" }}>
                {venue.species.slice(0, 3).join(", ")}
                {venue.species.length > 3 ? ` +${venue.species.length - 3} more` : ""}
              </div>
              <Link
                href={`/venues/${venue.slug}`}
                style={{ display: "inline-block", marginTop: 8, fontSize: 12, color: "#f26522", fontWeight: 600 }}
              >
                View details →
              </Link>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

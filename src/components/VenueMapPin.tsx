"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";

const TYPE_COLOUR: Record<string, string> = {
  dam:       "#2d6a4f",
  river:     "#2a6e6e",
  estuary:   "#6b4226",
  saltwater: "#1d3557",
};

export default function VenueMapPin({
  name,
  type,
  lat,
  lng,
}: {
  name: string;
  type: string;
  lat: number;
  lng: number;
}) {
  const colour = TYPE_COLOUR[type] ?? "#f26522";

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={11}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={false}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <CircleMarker
        center={[lat, lng]}
        radius={10}
        pathOptions={{ color: "#fff", weight: 2, fillColor: colour, fillOpacity: 0.9 }}
      >
        <Popup>{name}</Popup>
      </CircleMarker>
    </MapContainer>
  );
}

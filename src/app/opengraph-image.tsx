import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export const alt = "CastZone — Where South Africa Fishes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          backgroundColor: "#1a3a3a",
          backgroundImage:
            "radial-gradient(circle at 75% 50%, rgba(242,101,34,0.25) 0%, transparent 55%)",
          padding: "80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
          <span style={{ color: "#f26522", fontSize: "84px", fontWeight: 700 }}>C</span>
          <span
            style={{
              color: "#f9f7f4",
              fontSize: "60px",
              fontWeight: 700,
              letterSpacing: "0.18em",
            }}
          >
            ASTZONE
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            color: "#f9f7f4",
            fontSize: "88px",
            fontWeight: 700,
            lineHeight: 1.05,
            textTransform: "uppercase",
          }}
        >
          <span>Where South</span>
          <span>Africa Fishes</span>
        </div>
        <div style={{ color: "#a8c5c5", fontSize: "34px", marginTop: "28px" }}>
          Bass · Saltwater · Specimen — the modern SA fishing community
        </div>
      </div>
    ),
    { ...size }
  );
}

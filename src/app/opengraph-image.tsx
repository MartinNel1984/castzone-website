import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export const alt = "CastZone — Where South Africa Fishes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Clean, centred, logo-focused share card.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a3a3a",
          backgroundImage:
            "radial-gradient(circle at 50% 38%, rgba(242,101,34,0.22) 0%, transparent 60%)",
        }}
      >
        {/* Logo wordmark */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ color: "#f26522", fontSize: 200, fontWeight: 700, lineHeight: 1 }}>C</span>
          <span
            style={{
              color: "#f9f7f4",
              fontSize: 140,
              fontWeight: 700,
              letterSpacing: "0.14em",
              lineHeight: 1,
            }}
          >
            ASTZONE
          </span>
        </div>

        {/* Divider */}
        <div style={{ display: "flex", width: 360, height: 4, backgroundColor: "#f26522", marginTop: 48, marginBottom: 40 }} />

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            color: "#a8c5c5",
            fontSize: 46,
            fontWeight: 600,
            letterSpacing: "0.34em",
            textTransform: "uppercase",
          }}
        >
          Where South Africa Fishes
        </div>
      </div>
    ),
    { ...size }
  );
}

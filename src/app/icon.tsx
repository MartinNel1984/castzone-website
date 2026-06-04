import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export const size = { width: 256, height: 256 };
export const contentType = "image/png";

// Branded CastZone favicon: orange "C" on deep-water, matching the logo.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a3a3a",
          color: "#f26522",
          fontSize: 200,
          fontWeight: 700,
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        C
      </div>
    ),
    { ...size }
  );
}

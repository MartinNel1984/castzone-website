import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 132,
          fontWeight: 700,
        }}
      >
        C
      </div>
    ),
    { ...size }
  );
}

import { ImageResponse } from "next/og";
import { site } from "@/content/site";
import { paletteById, DEFAULT_THEME } from "@/lib/theme";

const P = paletteById(DEFAULT_THEME);

export const alt = `${site.name} — ${site.roleLong}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social preview: the site's mark, the statement and the positioning line. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: P.bg,
          color: P.ink,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ display: "flex", width: 34, height: 34, border: `3px solid ${P.ink}`, alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 14, height: 14, background: P.accent }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 22, letterSpacing: 4, textTransform: "uppercase" }}>{site.name}</span>
              <span style={{ fontSize: 16, letterSpacing: 3, textTransform: "uppercase", color: P.ink2, marginTop: 4 }}>{site.role}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 16, letterSpacing: 3, textTransform: "uppercase", color: P.ink2 }}>
            <div style={{ width: 10, height: 10, borderRadius: 10, background: P.accent }} />
            {site.availability}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", fontSize: 96, fontWeight: 700, lineHeight: 0.96, letterSpacing: -3, textTransform: "uppercase" }}>
          <span>{site.statement[0]}</span>
          <span>
            Between <span style={{ color: P.accent, marginLeft: 22 }}>digital</span>
          </span>
          <span>{site.statement[2]}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: `1px solid ${P.ink}2e`, paddingTop: 22 }}>
          <span style={{ fontSize: 18, letterSpacing: 3, textTransform: "uppercase", color: P.ink2 }}>Spatial computing · Real-time 3D · AR/VR · Products</span>
          <span style={{ fontSize: 18, letterSpacing: 3, textTransform: "uppercase", color: P.ink2 }}>
            {site.location.city}, {site.location.country}
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}

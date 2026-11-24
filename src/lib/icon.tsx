import { ImageResponse } from "next/og";
import { LOGO_CUTS, LOGO_RECORD } from "@/components/ui/logo-data";

// The browser-tab and home-screen icon: the `small` logo cut (it reads at small
// sizes) centred on a white rounded tile. Colours are literal because the image
// is drawn outside the page, where the CSS tokens do not reach.
const INK = "#0f1720";
const ACCENT = "#1e5a8c";

export function logoIcon(px: number, { rounded }: { rounded: boolean }) {
  const c = LOGO_CUTS.small;
  const width = Math.round(px * 0.88);
  const height = Math.round((width * c.viewBox[3]) / c.viewBox[2]);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          borderRadius: rounded ? px * 0.2 : 0,
        }}
      >
        <svg width={width} height={height} viewBox={c.viewBox.join(" ")}>
          <path d={c.arabic} fill={ACCENT} fillOpacity={c.opacity} />
          <path d={LOGO_RECORD} fill={INK} />
        </svg>
      </div>
    ),
    { width: px, height: px },
  );
}

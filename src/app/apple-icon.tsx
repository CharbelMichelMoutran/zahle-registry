import { logoIcon } from "@/lib/icon";

// iOS rounds the corners itself.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return logoIcon(size.width, { rounded: false });
}

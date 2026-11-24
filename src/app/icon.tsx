import { logoIcon } from "@/lib/icon";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return logoIcon(size.width, { rounded: true });
}

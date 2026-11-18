/**
 * Button looks (DESIGN.md sections 5 and 15), shared by <Button> and <LinkButton>.
 *
 * Crisp: 8px corners, a 40px visual height, IBM Plex Sans medium. The hit area
 * reaches 44px through an invisible ::after, so the button looks tight but is
 * still easy to tap on site. Secondary buttons carry a fine border. The press
 * (scale 0.97, spring back) is added by the components.
 */
export type ButtonVariant = "primary" | "secondary" | "ghost";

const BASE =
  "relative inline-flex h-10 shrink-0 touch-manipulation items-center justify-center gap-2 rounded-control px-4 " +
  "text-body font-medium whitespace-nowrap select-none " +
  "after:absolute after:inset-x-0 after:-inset-y-0.5 after:content-[''] " +
  "transition-[background-color,border-color,color,box-shadow] duration-150 ease-out " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
  "disabled:cursor-not-allowed";

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "border border-accent-strong/40 bg-accent text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(23_74_112/0.18)] " +
    "hover:bg-accent-strong active:bg-accent-strong " +
    "disabled:border-line disabled:bg-surface-soft disabled:text-muted disabled:shadow-none",
  secondary:
    "border border-line-strong bg-surface text-ink shadow-[0_1px_2px_rgb(31_42_55/0.05)] " +
    "hover:border-[#bcc3cb] hover:bg-surface-soft active:bg-surface-soft " +
    "disabled:text-muted disabled:shadow-none",
  ghost: "border border-transparent text-muted hover:bg-surface-soft hover:text-ink active:bg-surface-soft",
};

export const buttonClass = (variant: ButtonVariant = "primary", className = "") =>
  `${BASE} ${VARIANT[variant]} ${className}`;

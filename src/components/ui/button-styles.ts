/**
 * Button looks, shared by <Button> and <LinkButton>: the landing page's pills
 * (owner, 23 Nov 2026). The look is `.zr-btn` in globals.css; the variant is
 * read from `data-variant`, so pass `buttonProps()` to a plain <button> or link.
 * The press (scale 0.97, spring back) is added by the components.
 */
export type ButtonVariant = "primary" | "secondary" | "ghost";

export const buttonProps = (variant: ButtonVariant = "primary", className = "") => ({
  className: `zr-btn ${className}`,
  "data-variant": variant,
});

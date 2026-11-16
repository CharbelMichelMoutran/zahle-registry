/** Small building blocks shared by the form and the read-only report. */

export function Section({
  label,
  htmlFor,
  help,
  children,
}: {
  label: string;
  htmlFor?: string;
  help?: React.ReactNode;
  children: React.ReactNode;
}) {
  const Label = htmlFor ? "label" : "h3";
  return (
    <section>
      <Label htmlFor={htmlFor} className="block text-body font-semibold text-ink">
        {label}
      </Label>
      {help && <p className="mt-0.5 mb-2 text-micro text-muted">{help}</p>}
      <div className={help ? "" : "mt-1.5"}>{children}</div>
    </section>
  );
}

/** A group of fields inside the tray: micro-label above, dashed hairline between groups. */
export function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5 border-t border-dashed border-line pt-5 first:border-t-0 first:pt-0">
      <p className="micro-label">{label}</p>
      {children}
    </div>
  );
}

export function DraftBanner({ text }: { text: string }) {
  return <p className="rounded-control bg-surface-soft px-3 py-2 text-micro text-muted">{text}</p>;
}

/** Field messages say what to do, never that the engineer did something wrong. */
export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-micro text-attention">
      {message}
    </p>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  help,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  help?: string;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2 text-body text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 rounded-[6px] accent-accent"
      />
      <span>
        {label}
        {help && <span className="block text-micro text-muted">{help}</span>}
      </span>
    </label>
  );
}

/** Inputs are 17px so iOS does not zoom in on focus. */
export const inputClass =
  "min-h-11 w-full rounded-control border border-line bg-surface px-3 py-2 text-lead text-ink placeholder:text-muted/70 " +
  "transition-[border-color,box-shadow] focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-soft " +
  "disabled:bg-surface-soft disabled:text-muted aria-[invalid=true]:border-attention";

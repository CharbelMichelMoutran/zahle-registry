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
      <Label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-900">
        {label}
      </Label>
      {help && <p className="mt-0.5 mb-2 text-[13px] leading-snug text-slate-500">{help}</p>}
      <div className={help ? "" : "mt-1.5"}>{children}</div>
    </section>
  );
}

export function DraftBanner({ text }: { text: string }) {
  return (
    <p className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-[13px] text-slate-600">
      {text}
    </p>
  );
}

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-[13px] text-red-700">
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
    <label className="flex cursor-pointer items-start gap-2.5 py-1 text-sm text-slate-800">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-slate-900"
      />
      <span>
        {label}
        {help && <span className="block text-[13px] text-slate-500">{help}</span>}
      </span>
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 " +
  "focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-100 disabled:text-slate-400 " +
  "aria-[invalid=true]:border-red-600";

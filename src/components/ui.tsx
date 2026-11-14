import clsx from "clsx";
import type { ReactNode } from "react";

export function Card({
  className,
  children,
  ...rest
}: {
  className?: string;
  children: ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("card", className)} {...rest}>
      {children}
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="h1">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-5 py-8 text-center">
      <p className="font-semibold text-parchment">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted">{text}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className="h-2.5 w-full overflow-hidden rounded-full bg-steel"
    >
      <div className="progress-bar h-full rounded-full bg-bronze" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max = 999,
  suffix,
  id
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  id: string;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v * 100) / 100));
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {suffix && <span className="text-muted"> ({suffix})</span>}
      </label>
      <div className="flex items-stretch overflow-hidden rounded-xl border border-line bg-iron focus-within:border-bronze">
        <button
          type="button"
          aria-label={`Diminuir ${label.toLowerCase()}`}
          className="w-11 shrink-0 text-xl text-sand hover:bg-steel"
          onClick={() => onChange(clamp(value - step))}
        >
          −
        </button>
        <div className="flex min-w-0 flex-1 items-center justify-center">
          <input
            id={id}
            type="number"
            inputMode="decimal"
            className="h-12 w-full min-w-0 bg-transparent text-center text-lg font-semibold tabular-nums outline-none"
            value={Number.isFinite(value) ? value : 0}
            step={step}
            min={min}
            max={max}
            onChange={(e) => onChange(clamp(parseFloat(e.target.value.replace(",", ".")) || 0))}
          />
        </div>
        <button
          type="button"
          aria-label={`Aumentar ${label.toLowerCase()}`}
          className="w-11 shrink-0 text-xl text-sand hover:bg-steel"
          onClick={() => onChange(clamp(value + step))}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  id
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  id: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx("relative h-8 w-14 shrink-0 rounded-full border transition-colors", checked ? "border-bronze bg-bronze" : "border-line bg-steel")}
      >
        <span className={clsx("absolute top-1 h-5 w-5 rounded-full bg-parchment transition-all", checked ? "left-8" : "left-1")} />
      </button>
    </div>
  );
}

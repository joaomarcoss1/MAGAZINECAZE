import type { ComponentProps } from "react";
import { cn } from "@/lib/format";

export const inputClass =
  "h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 text-sm text-ink-900 placeholder:text-ink-400 transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100";

export function Field({
  label,
  hint,
  error,
  className,
  ...props
}: ComponentProps<"input"> & { label: string; hint?: string; error?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>
      <input className={cn(inputClass, error && "border-coral-500 focus:ring-coral-50")} {...props} />
      {error ? (
        <span className="mt-1 block text-xs text-coral-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-ink-400">{hint}</span>
      ) : null}
    </label>
  );
}

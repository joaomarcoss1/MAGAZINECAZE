import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/format";

type Variant = "buy" | "primary" | "outline" | "ghost" | "pix";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  buy: "bg-sol-500 text-white hover:bg-sol-600 shadow-[0_6px_16px_-6px_rgb(246_101_16/0.6)]",
  primary: "bg-brand-700 text-white hover:bg-brand-800",
  outline: "border border-brand-200 bg-white text-brand-800 hover:border-brand-400 hover:bg-brand-50",
  ghost: "text-brand-800 hover:bg-brand-50",
  pix: "bg-mandacaru-500 text-white hover:bg-mandacaru-600",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150",
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    extra,
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

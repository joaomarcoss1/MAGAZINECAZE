import Link from "next/link";
import { cn } from "@/lib/format";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect width="40" height="40" rx="11" fill="#f66510" />
      <circle cx="20" cy="19" r="8" fill="#ffc93c" />
      <g stroke="#ffc93c" strokeWidth="2" strokeLinecap="round">
        <path d="M20 5.5v3M8.5 10.5l2 2M31.5 10.5l-2 2M5.5 19h3M31.5 19h3" />
      </g>
      <path d="M4 27c4-3 8-3 12 0s8 3 12 0 8-3 8 0v9H4z" fill="#0f4772" />
      <path d="M4 31c4-3 8-3 12 0s8 3 12 0 8-3 8 0" fill="none" stroke="#7bb6dc" strokeWidth="1.5" />
    </svg>
  );
}

export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label="Magazine Cazé — início">
      <LogoMark className="size-10 shrink-0" />
      <span className="leading-none">
        <span className={cn("block text-[11px] font-semibold uppercase tracking-[0.2em]", light ? "text-brand-200" : "text-brand-500")}>
          Magazine
        </span>
        <span className={cn("block font-display text-2xl font-extrabold tracking-tight", light ? "text-white" : "text-brand-800")}>
          Cazé
        </span>
      </span>
    </Link>
  );
}

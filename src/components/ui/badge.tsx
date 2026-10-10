import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "accent" | "demo" | "success" | "danger" | "info";

const tones: Record<BadgeTone, string> = {
  neutral: "border-border-strong bg-surface-raised text-muted",
  accent: "border-accent/40 bg-accent/10 text-accent-strong",
  demo: "border-demo/50 bg-demo-bg text-demo",
  success: "border-success/40 bg-success-bg text-success",
  danger: "border-danger/40 bg-danger-bg text-danger",
  info: "border-info/40 bg-info-bg text-info",
};

export function Badge({ className, tone = "neutral", ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

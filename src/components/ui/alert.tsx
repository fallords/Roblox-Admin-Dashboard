import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "info" | "demo" | "danger" | "success";

const tones: Record<Tone, string> = {
  info: "border-info/40 bg-info-bg/60 text-fg",
  demo: "border-demo/50 bg-demo-bg/70 text-fg",
  danger: "border-danger/40 bg-danger-bg/70 text-fg",
  success: "border-success/40 bg-success-bg/70 text-fg",
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
  ...props
}: Omit<HTMLAttributes<HTMLDivElement>, "title"> & { tone?: Tone; title?: ReactNode }) {
  return (
    <div className={cn("rounded-md border px-4 py-3 text-sm", tones[tone], className)} {...props}>
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={cn("text-muted", title && "mt-1")}>{children}</div> : null}
    </div>
  );
}

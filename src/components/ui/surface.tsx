import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("panel", className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-1.5 p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg leading-snug", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm leading-relaxed text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-3 p-6 pt-0", className)} {...props} />;
}

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.1em]",
  {
    variants: {
      tone: {
        neutral: "border-border bg-secondary text-secondary-foreground",
        outline: "border-border bg-transparent text-muted-foreground",
        ok: "border-ok/25 bg-ok/10 text-ok",
        warn: "border-warn/30 bg-warn/10 text-warn",
        danger: "border-danger/25 bg-danger/10 text-danger",
        accent: "border-accent/25 bg-accent/10 text-accent",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export function Progress({
  value,
  label,
  className,
}: {
  value: number;
  label?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-label={label ?? "Interview progress"}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-secondary", className)}
    >
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function Alert({
  tone = "neutral",
  title,
  children,
  className,
}: {
  tone?: "neutral" | "warn" | "danger" | "ok";
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const tones = {
    neutral: "border-border bg-secondary/60",
    warn: "border-warn/25 bg-warn/[0.06]",
    danger: "border-danger/25 bg-danger/[0.05]",
    ok: "border-ok/25 bg-ok/[0.05]",
  } as const;

  return (
    <div className={cn("rounded-md border px-4 py-3", tones[tone], className)}>
      {title ? <p className="text-sm font-semibold text-foreground">{title}</p> : null}
      {children ? (
        <div className={cn("text-sm leading-relaxed text-muted-foreground", title && "mt-1")}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function Checkbox({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn(
        "mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-input text-primary accent-primary",
        className,
      )}
      {...props}
    />
  );
}

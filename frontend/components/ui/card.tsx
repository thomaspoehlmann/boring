import { cn } from "@/lib/utils";

type CardProps = React.ComponentProps<"div">;

/** Dark glass surface for The Void. */
export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[20px] border p-4 shadow-sm backdrop-blur-2xl",
        className,
      )}
      style={{
        background: "var(--glass)",
        borderColor: "var(--glass-border)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.08), 0 0 60px rgba(167,139,250,0.05)",
      }}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: CardProps) {
  return <div className={cn("mb-2 flex flex-col gap-1", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn("text-lg font-light tracking-widest uppercase text-foreground", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn("text-foreground", className)} {...props} />;
}

import Link from "next/link";
import { cn } from "@/lib/utils";

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none disabled:cursor-not-allowed";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "text-white hover:brightness-110 active:scale-95",
  secondary:
    "text-foreground border hover:brightness-125",
  ghost:
    "text-muted hover:text-foreground",
  danger:
    "text-red-400 hover:text-red-300 hover:bg-red-900/20",
};

const variantInlineStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
    boxShadow: "0 0 0 0 var(--accent-glow)",
  },
  secondary: {
    background: "var(--glass)",
    borderColor: "var(--glass-border)",
  },
  ghost: {},
  danger: {},
};

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: ButtonVariant;
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(baseStyles, variantStyles[variant], className)}
      style={{ ...variantInlineStyles[variant], ...style }}
      {...props}
    />
  );
}

type ButtonLinkProps = React.ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
};

export function ButtonLink({
  className,
  variant = "primary",
  style,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(baseStyles, variantStyles[variant], className)}
      style={{ ...variantInlineStyles[variant], ...style }}
      {...props}
    />
  );
}

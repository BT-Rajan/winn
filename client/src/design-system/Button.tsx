import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const base: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--font-size-sm)",
  fontWeight: 600,
  borderRadius: "var(--radius-sm)",
  padding: "10px 18px",
  cursor: "pointer",
  transition: "background-color var(--transition-fast), opacity var(--transition-fast)",
  border: "1px solid transparent",
};

const variants: Record<Variant, React.CSSProperties> = {
  primary: {
    backgroundColor: "var(--color-accent)",
    color: "var(--color-accent-contrast)",
  },
  secondary: {
    backgroundColor: "var(--color-surface)",
    color: "var(--color-ink-900)",
    borderColor: "var(--color-border-strong)",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--color-ink-700)",
  },
};

export function Button({ variant = "primary", fullWidth, style, disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        ...base,
        ...variants[variant],
        width: fullWidth ? "100%" : undefined,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
    />
  );
}

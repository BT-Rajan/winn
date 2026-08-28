import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, style, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
      <label
        htmlFor={inputId}
        style={{ fontSize: "var(--font-size-sm)", color: "var(--color-ink-700)", fontWeight: 500 }}
      >
        {label}
      </label>
      <input
        id={inputId}
        {...props}
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--font-size-md)",
          padding: "10px 12px",
          borderRadius: "var(--radius-sm)",
          border: `1px solid ${error ? "var(--color-danger)" : "var(--color-border-strong)"}`,
          backgroundColor: "var(--color-surface)",
          color: "var(--color-ink-900)",
          outline: "none",
          ...style,
        }}
      />
      {error && (
        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-danger)" }}>{error}</span>
      )}
    </div>
  );
}

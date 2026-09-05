import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function Textarea({ label, error, id, style, ...props }: TextareaProps) {
  const areaId = id ?? props.name;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
      <label
        htmlFor={areaId}
        style={{ fontSize: "var(--font-size-sm)", color: "var(--color-ink-700)", fontWeight: 500 }}
      >
        {label}
      </label>
      <textarea
        id={areaId}
        rows={4}
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
          resize: "vertical",
          ...style,
        }}
      />
      {error && (
        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-danger)" }}>{error}</span>
      )}
    </div>
  );
}

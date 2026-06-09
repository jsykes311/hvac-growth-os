import type { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary";
  disabled?: boolean;
};

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
}: ButtonProps) {
  const styles =
    variant === "primary"
      ? "bg-flame text-white hover:bg-[#d8442f]"
      : "border border-ink/15 bg-white text-ink hover:bg-frost";

  return (
    <button
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold shadow-sm transition ${styles} disabled:cursor-not-allowed disabled:opacity-60`}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-ink/10 bg-white/88 p-6 shadow-soft backdrop-blur ${className}`}
    >
      {children}
    </section>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="text-sm font-semibold text-graphite">{children}</label>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-copper">
      {children}
    </p>
  );
}

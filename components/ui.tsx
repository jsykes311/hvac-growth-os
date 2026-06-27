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
      ? "bg-flame text-white shadow-[0_12px_30px_rgba(138,36,50,0.18)] hover:bg-[#761f2b]"
      : "border border-ink/15 bg-white text-ink hover:border-flame/40 hover:bg-[#fbf7f8]";

  return (
    <button
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold transition ${styles} disabled:cursor-not-allowed disabled:opacity-60`}
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
      className={`rounded-xl border border-ink/10 bg-white p-6 shadow-soft ${className}`}
    >
      {children}
    </section>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="text-sm font-bold text-graphite">{children}</label>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-copper">
      {children}
    </p>
  );
}

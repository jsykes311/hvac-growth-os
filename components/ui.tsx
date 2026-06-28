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
      ? "bg-gradient-to-br from-ink to-flame text-white shadow-[0_18px_42px_rgba(25,184,181,0.24)] hover:shadow-[0_18px_44px_rgba(6,57,68,0.18)]"
      : "border border-ink/15 bg-white/90 text-ink hover:border-flame/40 hover:bg-white";

  return (
    <button
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-extrabold transition hover:-translate-y-0.5 ${styles} disabled:cursor-not-allowed disabled:opacity-60`}
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
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      className={`rounded-[22px] border border-ink/10 bg-white/85 p-6 shadow-soft backdrop-blur-md ${className}`}
      id={id}
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

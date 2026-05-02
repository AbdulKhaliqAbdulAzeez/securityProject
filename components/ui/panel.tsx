import type { ReactNode } from "react";

type PanelProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
};

export function Panel({
  eyebrow,
  title,
  description,
  className,
  children,
}: PanelProps) {
  const classes = ["surface-panel", className].filter(Boolean).join(" ");

  return (
    <section className={classes}>
      <header className="surface-panel__header">
        {eyebrow ? <p className="section-label">{eyebrow}</p> : null}
        <h2 className="surface-panel__title">{title}</h2>
        {description ? <p className="surface-panel__description">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}
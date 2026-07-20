import type { ReactNode } from "react";

export function SafePanel({
  title,
  children,
  emptyMessage = "No data available."
}: {
  title: string;
  children?: ReactNode;
  emptyMessage?: string;
}) {
  return (
    <section className="safe-panel">
      <div className="safe-panel-head">
        <h2>{title}</h2>
      </div>
      <div className="safe-panel-body">
        {children ?? <p className="muted">{emptyMessage}</p>}
      </div>
    </section>
  );
}

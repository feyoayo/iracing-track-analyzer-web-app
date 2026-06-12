import type { ReactNode } from "react";

export function AppShell({
  seasonName,
  controls,
  analysis,
  trackLookup,
}: {
  seasonName: string;
  controls: ReactNode;
  analysis: ReactNode;
  trackLookup: ReactNode;
}) {
  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">iRacing Schedule Analyzer</p>
          <h1 className="topbar-title">Current-season track analysis</h1>
        </div>
        <div className="season-badge">
          <span>Active season</span>
          <strong>{seasonName}</strong>
        </div>
      </header>

      <section className="dashboard-grid">
        <aside className="panel controls-panel">{controls}</aside>
        <section className="panel analysis-panel">{analysis}</section>
        <aside className="panel track-panel">{trackLookup}</aside>
      </section>
    </main>
  );
}

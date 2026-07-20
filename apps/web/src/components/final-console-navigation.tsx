import Link from "next/link";
import {
  consoleNavigation,
  consoleNavigationGroups
} from "@/lib/navigation";

export function FinalConsoleNavigation() {
  return (
    <nav className="final-navigation" aria-label="Sentinel Mesh console">
      <Link className="final-brand" href="/command-center">
        <span className="final-brand-mark">SM</span>
        <span>
          <strong>Sentinel Mesh</strong>
          <small>Security Control Plane</small>
        </span>
      </Link>

      <div className="final-navigation-scroll">
        {consoleNavigationGroups.map(group => {
          const items = consoleNavigation.filter(
            item => item.group === group.id
          );

          return (
            <section className="final-nav-group" key={group.id}>
              <p>{group.label}</p>
              {items.map(item => (
                <Link key={item.href} href={item.href}>
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </Link>
              ))}
            </section>
          );
        })}
      </div>

      <div className="final-version">
        <span className="final-live-dot" />
        <div>
          <strong>Version 10.0.0</strong>
          <small>Local-first production</small>
        </div>
      </div>
    </nav>
  );
}

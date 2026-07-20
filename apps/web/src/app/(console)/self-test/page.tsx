import { SafePanel } from "@/components/safe-panel";

export const dynamic = "force-dynamic";

async function getSelfTest() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const response = await fetch(
      `${base}/api/diagnostics/self-test`,
      { cache: "no-store" }
    );

    return await response.json();
  } catch {
    return {
      ready: false,
      checks: [],
      failed: ["self-test-api"]
    };
  }
}

export default async function SelfTestPage() {
  const result = await getSelfTest();

  return (
    <main className="page-stack">
      <section className="hero-card">
        <div>
          <p className="eyebrow">PHASE 75 · BUG FIX SPRINT</p>
          <h1>Repository self-test</h1>
          <p className="muted">
            Runtime-safe verification of the final Sentinel Mesh layout.
          </p>
        </div>
        <div className={`metric ${result.ready ? "ok" : "danger"}`}>
          <strong>{result.ready ? "PASS" : "FAIL"}</strong>
          <span>repository status</span>
        </div>
      </section>

      <SafePanel title="Required artifacts">
        <div className="self-test-list">
          {result.checks.map((check: {
            id: string;
            file: string;
            present: boolean;
          }) => (
            <div className="self-test-row" key={check.id}>
              <span className={check.present ? "status ok" : "status danger"}>
                {check.present ? "present" : "missing"}
              </span>
              <div>
                <strong>{check.id}</strong>
                <p>{check.file}</p>
              </div>
            </div>
          ))}
        </div>
      </SafePanel>
    </main>
  );
}

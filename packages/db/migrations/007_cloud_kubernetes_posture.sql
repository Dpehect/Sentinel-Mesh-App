CREATE TABLE IF NOT EXISTS posture_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  project_id uuid NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('repository','upload','local')),
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posture_assets (
  id text PRIMARY KEY,
  posture_scan_id uuid NOT NULL REFERENCES posture_scans(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  project_id uuid NOT NULL,
  provider text NOT NULL,
  kind text NOT NULL,
  name text NOT NULL,
  source text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS posture_findings (
  id text PRIMARY KEY,
  posture_scan_id uuid NOT NULL REFERENCES posture_scans(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  project_id uuid NOT NULL,
  asset_id text NOT NULL REFERENCES posture_assets(id) ON DELETE CASCADE,
  rule_id text NOT NULL,
  title text NOT NULL,
  severity text NOT NULL,
  confidence numeric(4,3) NOT NULL,
  source text NOT NULL,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  remediation text NOT NULL,
  standards jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS posture_scans_tenant_idx ON posture_scans(organization_id, project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS posture_findings_tenant_idx ON posture_findings(organization_id, project_id, severity);

CREATE TABLE IF NOT EXISTS posture_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  project_id uuid NOT NULL,
  scan_id uuid,
  provider text NOT NULL,
  asset_kind text NOT NULL,
  external_id text NOT NULL,
  name text NOT NULL,
  namespace text,
  source_path text,
  internet_exposed boolean NOT NULL DEFAULT false,
  privileged boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, project_id, provider, external_id)
);
CREATE INDEX IF NOT EXISTS posture_assets_scope_idx ON posture_assets(organization_id, project_id, provider);
CREATE TABLE IF NOT EXISTS posture_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL, project_id uuid NOT NULL, scan_id uuid,
  asset_id uuid REFERENCES posture_assets(id) ON DELETE CASCADE, rule_id text NOT NULL, title text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('critical','high','medium','low')), evidence text NOT NULL,
  remediation text NOT NULL, confidence numeric(4,3) NOT NULL, risk_score integer NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  frameworks jsonb NOT NULL DEFAULT '[]'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS posture_findings_scope_idx ON posture_findings(organization_id, project_id, severity);
CREATE TABLE IF NOT EXISTS posture_attack_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL, project_id uuid NOT NULL, scan_id uuid,
  title text NOT NULL, score integer NOT NULL CHECK (score BETWEEN 0 AND 100), nodes jsonb NOT NULL,
  explanation text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS posture_paths_scope_idx ON posture_attack_paths(organization_id, project_id, score DESC);

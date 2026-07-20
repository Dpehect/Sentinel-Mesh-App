CREATE TABLE IF NOT EXISTS security_graph_nodes (
  id text NOT NULL,
  posture_scan_id uuid NOT NULL REFERENCES posture_scans(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  project_id uuid NOT NULL,
  kind text NOT NULL,
  provider text NOT NULL,
  label text NOT NULL,
  risk integer NOT NULL CHECK (risk BETWEEN 0 AND 100),
  severity text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (posture_scan_id, id)
);

CREATE TABLE IF NOT EXISTS security_graph_edges (
  id text NOT NULL,
  posture_scan_id uuid NOT NULL REFERENCES posture_scans(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  project_id uuid NOT NULL,
  source_id text NOT NULL,
  target_id text NOT NULL,
  relation text NOT NULL,
  confidence numeric(4,3) NOT NULL,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  PRIMARY KEY (posture_scan_id, id),
  FOREIGN KEY (posture_scan_id, source_id)
    REFERENCES security_graph_nodes(posture_scan_id, id) ON DELETE CASCADE,
  FOREIGN KEY (posture_scan_id, target_id)
    REFERENCES security_graph_nodes(posture_scan_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS posture_attack_paths (
  id text NOT NULL,
  posture_scan_id uuid NOT NULL REFERENCES posture_scans(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  project_id uuid NOT NULL,
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  title text NOT NULL,
  node_ids jsonb NOT NULL,
  edge_ids jsonb NOT NULL,
  explanation jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (posture_scan_id, id)
);

CREATE INDEX IF NOT EXISTS security_graph_nodes_tenant_idx
  ON security_graph_nodes(organization_id, project_id, risk DESC);

CREATE INDEX IF NOT EXISTS posture_attack_paths_tenant_idx
  ON posture_attack_paths(organization_id, project_id, score DESC);

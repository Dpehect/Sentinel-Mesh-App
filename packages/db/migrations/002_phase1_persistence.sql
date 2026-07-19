alter table projects add column if not exists updated_at timestamptz not null default now();
alter table scans add column if not exists updated_at timestamptz not null default now();
alter table findings add column if not exists updated_at timestamptz not null default now();
create index if not exists projects_org_idx on projects(organization_id);
create index if not exists scans_project_started_idx on scans(project_id,started_at desc);
create index if not exists findings_status_severity_idx on findings(status,severity);
create index if not exists assets_scan_external_idx on assets(scan_id,external_id);
create index if not exists relations_scan_idx on relations(scan_id);
create index if not exists attack_paths_scan_score_idx on attack_paths(scan_id,score desc);

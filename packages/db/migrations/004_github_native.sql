create table if not exists github_installations(
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations on delete cascade,
  installation_id bigint unique not null,
  account_login text not null,
  account_type text not null,
  permissions jsonb not null default '{}'::jsonb,
  repository_selection text,
  suspended_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists github_repositories(
  id uuid primary key default gen_random_uuid(),
  installation_id uuid references github_installations on delete cascade,
  project_id uuid references projects on delete set null,
  github_repository_id bigint unique not null,
  owner text not null,
  name text not null,
  full_name text not null,
  default_branch text default 'main',
  private boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists webhook_deliveries(
  id uuid primary key default gen_random_uuid(),
  delivery_id text unique not null,
  event text not null,
  action text,
  installation_id bigint,
  repository_full_name text,
  payload jsonb not null,
  status text not null default 'received',
  error text,
  received_at timestamptz default now(),
  processed_at timestamptz
);
create table if not exists security_diffs(
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade,
  base_scan_id uuid references scans on delete set null,
  head_scan_id uuid references scans on delete cascade,
  base_sha text,
  head_sha text,
  new_findings int not null default 0,
  resolved_findings int not null default 0,
  score_before int,
  score_after int,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);
create index if not exists webhook_delivery_event_idx on webhook_deliveries(event,received_at desc);
create index if not exists github_repo_project_idx on github_repositories(project_id);
create index if not exists security_diff_project_idx on security_diffs(project_id,created_at desc);

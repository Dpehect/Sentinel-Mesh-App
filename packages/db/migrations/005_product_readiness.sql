create table if not exists user_credentials(user_id uuid primary key references users(id) on delete cascade,password_hash text not null,updated_at timestamptz not null default now());
alter table organizations add column if not exists updated_at timestamptz not null default now();
alter table projects add column if not exists updated_at timestamptz not null default now();
alter table scans add column if not exists error_code text;alter table scans add column if not exists duration_ms integer;
create table if not exists security_events(id uuid primary key default gen_random_uuid(),organization_id uuid references organizations(id) on delete cascade,actor_id uuid references users(id) on delete set null,event_type text not null,severity text not null default 'info',ip_hash text,user_agent text,resource_type text,resource_id text,metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now());
create index if not exists security_events_org_created_idx on security_events(organization_id,created_at desc);
create index if not exists scans_project_status_idx on scans(project_id,status,started_at desc);

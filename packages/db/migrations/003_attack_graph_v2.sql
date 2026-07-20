alter table relations add column if not exists payload jsonb not null default '{}'::jsonb;
create index if not exists relations_scan_source_idx on relations(scan_id,source_external_id);
create index if not exists relations_scan_target_idx on relations(scan_id,target_external_id);
create index if not exists attack_paths_scan_score_idx on attack_paths(scan_id,score desc);

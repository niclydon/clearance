-- Clearance core controlled vocabularies.
-- These tables are FK targets for work items, surfaces, and project track links,
-- so they are created first. Reserved values are seeded in 0007_seed.sql.

CREATE TABLE governance_tags (
  tag         text PRIMARY KEY,
  description text NOT NULL DEFAULT '',
  is_reserved boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE work_types (
  work_type   text PRIMARY KEY,
  description text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE surfaces (
  surface     text PRIMARY KEY,
  description text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE link_relationships (
  relationship text PRIMARY KEY,
  description  text NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now()
);

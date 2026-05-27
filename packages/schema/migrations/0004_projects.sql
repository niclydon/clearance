-- Higher-level grouping of work into durable tracks, plus proposed tracks
-- awaiting review and the links from a track to its work/evidence.

CREATE TABLE project_tracks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_key     text NOT NULL UNIQUE,
  title         text NOT NULL,
  summary       text NOT NULL DEFAULT '',
  status        text NOT NULL DEFAULT 'active',
  track_kind    text NOT NULL DEFAULT 'major_project',
  priority      integer NOT NULL DEFAULT 3,
  owner         text,
  current_state text,
  next_action   text,
  stale_risk    text,
  confidence    numeric NOT NULL DEFAULT 0.8,
  source        text NOT NULL DEFAULT 'manual',
  display_seq   integer,
  metadata      jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_tracks_status_check
    CHECK (status IN ('active', 'blocked', 'waiting_decision', 'observation_gate', 'deferred', 'closed', 'closed_operating_program')),
  CONSTRAINT project_tracks_kind_check
    CHECK (track_kind IN ('major_project', 'operating_program', 'repo_project', 'workstream')),
  CONSTRAINT project_tracks_priority_check
    CHECK (priority BETWEEN 1 AND 5),
  CONSTRAINT project_tracks_confidence_check
    CHECK (confidence BETWEEN 0 AND 1)
);

CREATE TABLE project_candidates (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_key        text NOT NULL UNIQUE,
  status               text NOT NULL DEFAULT 'pending',
  title                text NOT NULL,
  summary              text NOT NULL DEFAULT '',
  proposed_status      text,
  proposed_next_action text,
  confidence           numeric NOT NULL DEFAULT 0,
  tags                 text[] NOT NULL DEFAULT '{}',
  evidence             jsonb NOT NULL DEFAULT '{}',
  metadata             jsonb NOT NULL DEFAULT '{}',
  created_track_id     uuid REFERENCES project_tracks (id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_candidates_status_check
    CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT project_candidates_confidence_check
    CHECK (confidence BETWEEN 0 AND 1)
);

CREATE TABLE project_track_links (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id                    uuid REFERENCES project_tracks (id) ON DELETE CASCADE,
  link_kind                   text NOT NULL,
  target_ref                  text NOT NULL DEFAULT '',
  relationship                text NOT NULL DEFAULT 'related' REFERENCES link_relationships (relationship),
  target_work_item_id         bigint REFERENCES work_items (id) ON DELETE SET NULL,
  target_project_candidate_id uuid REFERENCES project_candidates (id) ON DELETE SET NULL,
  source_work_item_id         bigint REFERENCES work_items (id) ON DELETE SET NULL,
  title                       text,
  summary                     text,
  metadata                    jsonb NOT NULL DEFAULT '{}',
  created_at                  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_track_links_link_kind_check
    CHECK (link_kind IN ('work_item', 'project_candidate', 'repo', 'doc', 'chat_thread', 'external', 'note')),
  CONSTRAINT project_track_links_one_source_check
    CHECK (track_id IS NOT NULL OR source_work_item_id IS NOT NULL),
  CONSTRAINT project_track_links_unique
    UNIQUE (track_id, link_kind, target_ref, relationship)
);

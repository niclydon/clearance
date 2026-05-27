-- Run packs: scoped, ordered execution lists. A run pack is a scoping
-- instruction, never a safety grant — eligibility is still per-item.

CREATE TABLE run_packs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_pack_key  text NOT NULL UNIQUE,
  intent        text NOT NULL DEFAULT '',
  launch_text   text NOT NULL DEFAULT '',
  work_item_ids bigint[] NOT NULL DEFAULT '{}',
  status        text NOT NULL DEFAULT 'proposed',
  issued_by     text NOT NULL DEFAULT '',
  approved_by   text,
  approval_text text,
  approved_at   timestamptz,
  runner_id     text,
  started_at    timestamptz,
  finished_at   timestamptz,
  summary       text NOT NULL DEFAULT '',
  outcome       jsonb NOT NULL DEFAULT '{}',
  metadata      jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT run_packs_status_check
    CHECK (status IN ('proposed', 'approved', 'launched', 'completed', 'cancelled'))
);

CREATE TABLE run_pack_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_pack_id         uuid NOT NULL REFERENCES run_packs (id) ON DELETE CASCADE,
  work_item_id        bigint NOT NULL REFERENCES work_items (id) ON DELETE CASCADE,
  position            integer NOT NULL DEFAULT 0,
  result              text NOT NULL DEFAULT 'pending',
  result_reason       text,
  pr_number           integer,
  merge_commit        text,
  child_work_item_ids bigint[] NOT NULL DEFAULT '{}',
  claim_id            uuid REFERENCES claims (id) ON DELETE SET NULL,
  evidence            jsonb NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT run_pack_items_result_check
    CHECK (result IN ('pending', 'shipped', 'blocked', 'skipped_not_eligible', 'failed')),
  CONSTRAINT run_pack_items_unique UNIQUE (run_pack_id, work_item_id)
);

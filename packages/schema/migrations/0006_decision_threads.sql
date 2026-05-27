-- Optional: tracks a decision ask sent to a human and its resolution. Used by
-- the review-surface layer; core MCP/CLI workflows do not require it.

CREATE TABLE decision_threads (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id     bigint NOT NULL REFERENCES work_items (id) ON DELETE CASCADE,
  question_text    text NOT NULL,
  captured_replies jsonb NOT NULL DEFAULT '[]',
  decided_summary  text,
  rationale_text   text,
  answered_at      timestamptz,
  answered_by      text,
  status           text NOT NULL DEFAULT 'open',
  chat_thread_ref  text,
  metadata         jsonb NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT decision_threads_status_check
    CHECK (status IN ('open', 'awaiting_decision', 'decided', 'expired'))
);

CREATE INDEX decision_threads_work_item_idx ON decision_threads (work_item_id);

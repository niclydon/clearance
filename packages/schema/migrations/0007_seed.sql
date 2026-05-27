-- Reserved vocabulary seed. Idempotent: re-running is a no-op.

INSERT INTO governance_tags (tag, description, is_reserved) VALUES
  ('autonomous_safe',        'Approved for execution without another human decision. Human grant only — agents may never self-apply.', true),
  ('requires_decision',      'A human must choose between real options.', true),
  ('requires_clickops',      'A human must perform a manual console or UI action.', true),
  ('requires_investigation', 'Premise needs diagnosis before execution.', true),
  ('requires_secret',        'Blocked on a credential or token the agent cannot provision.', true),
  ('blocked_on_dependency',  'Waiting on upstream work or a condition to complete.', true),
  ('observation_gate',       'Waiting for a time-based event or future evidence.', true),
  ('deferred',               'Deliberately parked for later.', true)
ON CONFLICT (tag) DO NOTHING;

INSERT INTO work_types (work_type, description) VALUES
  ('feature',       'New user-facing capability.'),
  ('fix',           'Bug fix or behavior correction.'),
  ('schema',        'Database or data-model change.'),
  ('integration',   'External service or API wiring.'),
  ('automation',    'Recurring or autonomous job/handler.'),
  ('reliability',   'Resilience, retry, fallback, capacity.'),
  ('monitoring',    'Observability, metrics, alerts.'),
  ('security',      'Auth, permissions, secrets, hardening.'),
  ('validation',    'Tests, smoke checks, fixtures.'),
  ('investigation', 'Diagnosis, audit, evidence gathering.'),
  ('reporting',     'Digests, summaries, dashboards, narratives.'),
  ('curation',      'Cleanup, dedup, normalization, taxonomy work.'),
  ('docs',          'Documentation, narrative, runbook.'),
  ('deploy',        'Release, rollout, deployment plumbing.')
ON CONFLICT (work_type) DO NOTHING;

-- Minimal portable surface seed. Deployments extend this with their own surfaces.
INSERT INTO surfaces (surface, description) VALUES
  ('schema', 'Database schema and migrations.'),
  ('mcp',    'MCP server / tool surface.'),
  ('cli',    'Command-line tooling.'),
  ('api',    'HTTP / REST surface.'),
  ('docs',   'Documentation.'),
  ('ci',     'Continuous integration / checks.'),
  ('deploy', 'Deployment and release plumbing.'),
  ('worker', 'Background worker / job execution.')
ON CONFLICT (surface) DO NOTHING;

INSERT INTO link_relationships (relationship, description) VALUES
  ('anchor',      'This item is the program/track anchor.'),
  ('advances',    'This item advances the linked track.'),
  ('blocks',      'This item must clear before the linked target can move.'),
  ('owns',        'Ownership/accountability for the linked target.'),
  ('evidence',    'Evidence/artifact supporting the linked target.'),
  ('followup',    'Follow-up work after the linked target ships.'),
  ('related',     'Loose/context-only association.'),
  ('supersedes',  'Replaces or makes the linked target obsolete.'),
  ('child_of',    'Strict child/subtask of the linked target.'),
  ('splits_into', 'The linked target was split off from this one.'),
  ('absorbs',     'This item absorbs the linked target.')
ON CONFLICT (relationship) DO NOTHING;

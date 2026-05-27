# Extraction Map: Nexus PMO → Clearance

This page is the table-by-table and tool-by-tool plan for extracting the generic Clearance PMO substrate from its source system (the PMO subsystem inside Nexus). It is the Phase-0 deliverable that lets the schema and MCP implementation work proceed without rediscovering the extraction boundary.

It distinguishes three things: **source truth** (what the live Nexus tables actually look like), **planned generic names** (what Clearance will call them), and **open questions** (decisions deferred to implementation).

## How this was produced

The source schema was captured by live schema inspection of the Nexus Postgres database on 2026-05-27 (structure only — column names, types, nullability, defaults, and PK/UNIQUE/FK/CHECK constraints; no row data). The generic target model follows the [design doc](clearance-governance-framework-design-doc.md), [table groups](table-groups.md), [governance tags](governance-tags.md), and [schema architecture](../architecture/schema.md). Where the design doc and the live schema disagreed, the live schema is treated as source truth and the divergence is noted.

## Legend

- **KEEP** — carries over unchanged (name and meaning).
- **RENAME** — same data, new generic name.
- **GENERICIZE** — same concept, but a Nexus-flavored name/value set is replaced with a portable one.
- **DROP** — Nexus-specific; not extracted (push to `metadata` JSONB if a user ever needs an analogue).

## 1. Table lineage matrix

The governance substrate is 15 core tables plus an optional decision-thread table and the controlled-vocabulary tables. None depend on Nexus biographical intelligence, the PIE pipeline, Forge/LLM integration, or the Discord gateway.

| Group | Nexus source table | Clearance table | Action |
|---|---|---|---|
| Work intake | `operator_backlog_items` | `work_items` | RENAME + column genericize |
| Work intake | `operator_backlog_candidates` | `work_item_candidates` | RENAME + column genericize |
| Governance tags | `allowed_ob_tags` | `governance_tags` | RENAME |
| Governance tags | `ob_tag_map` | `work_item_tags` | RENAME |
| Claims | `operator_backlog_claims` | `claims` | RENAME + value genericize |
| Relationships | `operator_backlog_item_links` | `work_item_links` | RENAME |
| Preconditions | `operator_backlog_items.metadata.preconditions` (JSONB) | `preconditions` (first-class) | PROMOTE (open question) |
| Projects | `project_tracks` | `project_tracks` | KEEP + column genericize |
| Projects | `project_track_links` | `project_track_links` | KEEP + value genericize |
| Projects | `project_tracking_candidates` | `project_candidates` | RENAME + heavy genericize |
| Run packs | `pmo_run_packs` | `run_packs` | RENAME |
| Run packs | `pmo_run_pack_items` | `run_pack_items` | RENAME |
| Taxonomy | `ob_work_types` | `work_types` | RENAME |
| Taxonomy | `ob_surfaces` | `surfaces` | RENAME + seed genericize |
| Taxonomy | `ob_surface_map` | `work_item_surfaces` | RENAME |
| Decisions (optional) | `pm_decision_threads` | `decision_threads` | RENAME + column genericize |
| Taxonomy (vocab) | `link_relationships` | `link_relationships` | KEEP (vocab table for `project_track_links.relationship`) |

Nexus tables that are **NOT** extracted (they are domain- or platform-specific, not PMO substrate): `pmo_reply_proposals`, `project_track_updates`, `project_track_update_candidates`, `project_tracking_candidate_notes`, `project_track_surface_map`, and everything under `agent_*`, `aurora_*`, `knowledge_*`, `memory_v2_*`, `*_decision*` other than `pm_decision_threads`. These can become later Clearance features but are out of the v1 substrate.

## 2. Per-table column maps

### `work_items` ← `operator_backlog_items`

| Source column | Type | Action | Clearance column / note |
|---|---|---|---|
| `id` | bigint identity | KEEP | `id` |
| `status` | text | KEEP | `status` — CHECK `(new, triaged, blocked, done, ignored)` |
| `priority` | integer | KEEP | `priority` |
| `source` | text | KEEP | `source` (free text — provenance of intake) |
| `category` | text | KEEP | `category` (open set: project/phase/program) |
| `title` | text | KEEP | `title` |
| `body` | text | KEEP | `body` |
| `operator_note` | text | KEEP | `operator_note` |
| `metadata` | jsonb | KEEP | `metadata` (also holds `preconditions` unless promoted — see §6) |
| `tags` | text[] | KEEP | `tags` (governance-only; mirrored to `work_item_tags`) |
| `work_type` | text → FK `ob_work_types` | KEEP | `work_type` → FK `work_types` |
| `created_at` / `updated_at` | timestamptz | KEEP | same |
| `original_delivery_message_id` | uuid → FK `discord_delivery_messages` | DROP | Discord delivery linkage |
| `discord_channel_id` | text | GENERICIZE | `chat_channel_id` (nullable, optional) |
| `discord_message_id` | text | GENERICIZE | `chat_message_id` (nullable, optional) |
| `discord_thread_id` | text | GENERICIZE | `chat_thread_id` (nullable, optional) |
| `reply_to_message_id` | text | GENERICIZE | `chat_reply_to_id` (nullable, optional) |
| `reply_context` | jsonb | DROP | Discord reply context; fold into `metadata` if needed |
| `suggested_agent` | text | DROP | Nexus agent-roster reference |

The four `chat_*` columns stay optional and nullable so a review-surface adapter can correlate a work item with the chat message it came from, without making chat a dependency. A pure-MCP/CLI install never sets them.

### `work_item_candidates` ← `operator_backlog_candidates`

| Source column | Type | Action | Clearance column / note |
|---|---|---|---|
| `id` | bigint identity | KEEP | `id` |
| `status` | text | KEEP | CHECK `(pending, approved, rejected, edited)` |
| `filter_reason` | text | KEEP | why the agent thought this was worth proposing |
| `proposed_title` / `proposed_body` / `proposed_category` / `proposed_priority` | text/int | KEEP | the proposed work item |
| `raw_content` | text | RENAME | `source_content` (original captured text) |
| `metadata` | jsonb | KEEP | `metadata` |
| `captured_at` / `reviewed_at` | timestamptz | KEEP | same |
| `created_ob_id` | bigint → FK items | RENAME | `created_work_item_id` → FK `work_items` |
| `discord_channel_id` / `discord_channel_name` / `discord_thread_id` / `reply_to_message_id` | text | DROP/GENERICIZE | optional `chat_channel_id` / `chat_thread_id`; drop `channel_name` |
| `discord_message_id` (UNIQUE) | text | GENERICIZE | replace the dedup key — see note |
| `jump_url` | text | DROP | Discord deep link |

**Dedup key note:** the source uses `UNIQUE(discord_message_id)` to avoid filing the same Discord message twice. Generic Clearance replaces this with `UNIQUE(source, external_ref)` where `external_ref` is a nullable opaque string the intake path supplies (a chat message id, a webhook event id, etc.). When `external_ref` is null, no uniqueness is enforced (manual candidates).

### `claims` ← `operator_backlog_claims`

All columns KEEP (this is pure worker-coordination): `id` (uuid), `work_item_id` (RENAME from `ob_id`, FK `work_items`), `claim_status` (CHECK `active, released, completed, blocked, expired, abandoned, failed`), `runner_id`, `runner_kind`, `session_ref`, `repo_path`, `branch_name`, `worktree_path`, `claimed_at`, `heartbeat_at`, `lease_expires_at` (default `now() + 2h`), `released_at`, `outcome`, `metadata` jsonb, `evidence` jsonb.

GENERICIZE `runner_kind`: source CHECK is `(manual, codex, claude_code, agent, worker, other)`. The tool-specific `codex`/`claude_code` values are replaced by a portable set: `(manual, agent, worker, automation, other)`. Which specific tool ran is recorded in `runner_id` (free text), not the enum.

### `work_item_links` ← `operator_backlog_item_links`

KEEP all: `id` uuid, `parent_work_item_id`/`child_work_item_id` (RENAME from `parent_ob_id`/`child_ob_id`, FK `work_items`), `link_kind`, `created_by` (genericize default from `'autonomous_safe_runner'` → `'system'`), `metadata`, `created_at`. UNIQUE `(parent, child, link_kind)`.

`link_kind` GENERICIZE: source CHECK is `(blocked_by, followup, related, supersedes, decision_for)`. Keep these (battle-tested) as the generic baseline. The design doc also floated `child_of`, `splits_into`, `absorbs` — those already exist as `project_track_links.relationship` values (see §3); for `work_item_links` v1, ship the proven five and leave room to extend.

### `governance_tags` ← `allowed_ob_tags`

KEEP: `tag` (PK), `description`, `created_at`. Seeded with the reserved tags (§3). FK target for `work_item_tags.tag`.

### `work_item_tags` ← `ob_tag_map`

KEEP: `work_item_id` (RENAME from `ob_id`), `tag` (FK `governance_tags`), `applied_by`, `applied_at`, `source`, `note`. PK `(work_item_id, tag)`.

### `work_types` ← `ob_work_types`, `surfaces` ← `ob_surfaces`, `work_item_surfaces` ← `ob_surface_map`

Vocab tables: `(work_type|surface, description, created_at)`; mapping table `work_item_surfaces(work_item_id, surface, created_at)` PK `(work_item_id, surface)`, FK both sides. See §3 for seed values.

### `project_tracks` ← `project_tracks`

KEEP most: `id` uuid, `track_key` (UNIQUE), `title`, `summary`, `status` (CHECK `active, blocked, waiting_decision, observation_gate, deferred, closed, closed_operating_program`), `track_kind` (CHECK `major_project, operating_program, repo_project, workstream`), `priority` (1–5), `current_state`, `next_action`, `stale_risk`, `confidence` numeric (0–1), `source`, `metadata`, `created_at`, `updated_at`, `display_seq`. GENERICIZE `owner_agent` → `owner` (drop the `'project-manager'` default → nullable).

### `project_track_links` ← `project_track_links`

KEEP: `id`, `track_id` (FK tracks, CASCADE), `link_kind`, `target_ref`, `relationship`, `target_work_item_id` (RENAME from `target_ob_id`), `target_project_candidate_id`, `source_work_item_id` (RENAME from `source_ob_id`), `title`, `summary`, `metadata`, `created_at`. GENERICIZE `link_kind` CHECK `(ob, project_candidate, repo, doc, discord_thread, external, note)` → `(work_item, project_candidate, repo, doc, chat_thread, external, note)`. `relationship` vocab is generic already (§3).

### `project_candidates` ← `project_tracking_candidates`

Heavy genericize — the source is a Nexus repo-scan discovery table. KEEP the candidate-review shape: `id` uuid, `candidate_key`, `status` (genericize `'pending_review'` default → `(pending, approved, rejected)`), `title`, `summary`, `proposed_status`/`proposed_next_action` (the proposed track), `confidence`, `tags`, `evidence` jsonb, `created_at`/`updated_at`, plus a `created_track_id` FK once promoted. DROP the repo-scan + delivery machinery: `discovery_source`, `repo_name`, `repo_path`, `repo_remote_url`, `repo_default_branch`, `latest_commit_sha`, `latest_commit_at`, `search_terms`, `signals`, `first_seen_at`/`last_seen_at`/`last_enriched_at`, `notification_sent_at`, `notification_delivery`, `discord_channel_id`, `discord_message_id`. (Anything a specific deployment still wants can live in `metadata`.)

### `run_packs` ← `pmo_run_packs`, `run_pack_items` ← `pmo_run_pack_items`

KEEP all — fully generic. `run_packs`: `id`, `run_pack_key` (UNIQUE), `intent`, `launch_text`, `work_item_ids` bigint[] (RENAME from `ob_ids`), `status` (CHECK `proposed, approved, launched, completed, cancelled`), `issued_by` (genericize default), `approved_by`, `approval_text`, `approved_at`, `runner_id`, `started_at`, `finished_at`, `summary`, `outcome` jsonb, `metadata`, timestamps. `run_pack_items`: `id`, `run_pack_id` (FK CASCADE), `work_item_id` (RENAME), `position`, `result` (CHECK `pending, shipped, blocked, skipped_not_eligible, failed`), `result_reason`, `pr_number`, `merge_commit`, `child_work_item_ids` bigint[], `claim_id` (FK claims), `evidence` jsonb, timestamps. UNIQUE `(run_pack_id, work_item_id)`.

### `decision_threads` ← `pm_decision_threads` (optional / review-surface)

KEEP the generic core: `id` uuid, `work_item_id` (RENAME from `ob_id`, FK CASCADE), `question_text`, `captured_replies` jsonb, `decided_summary`, `rationale_text`, `answered_at`, `answered_by`, `status`, `metadata`, timestamps. GENERICIZE `status` CHECK `(awaiting_reply, distilling, awaiting_lock_in, decided, expired)` → `(open, awaiting_decision, decided, expired)` (the `distilling`/`awaiting_lock_in` states are Nexus decision-distill internals). DROP Nexus/chat-delivery columns: `generator_model` (LLM-specific), `discord_channel_id`, `discord_thread_id`, `prompt_message_id`, `lock_in_message_id` → fold any chat linkage into an optional `chat_thread_ref` / `metadata`.

## 3. Controlled vocabularies

### Governance tags (`governance_tags` seed) — reserved, 8 values

`autonomous_safe`, `requires_decision`, `requires_clickops`, `requires_investigation`, `requires_secret`, `blocked_on_dependency`, `observation_gate`, `deferred`. See [governance tags](governance-tags.md) for meanings.

DROP `autonomous_after_decision` — the ninth tag in Nexus is a decision-loop auto-arm flag specific to the Nexus decision-distill pipeline; not part of the generic substrate.

### Work types (`work_types` seed) — 14 values

`fix`, `feature`, `schema`, `security`, `investigation`, `deploy`, `docs`, `validation`, `automation`, `curation`, `integration`, `monitoring`, `reliability`, `reporting`. (Carries over unchanged — already generic.)

### Surfaces (`surfaces` seed) — genericize

The Nexus surface vocabulary (31 values: `nexus`, `forge`, `aria`, `broadside`, `gmail`, `strava`, …) is entirely Nexus-specific and is **not** seeded into Clearance. Ship a minimal portable seed and let each deployment extend it: `schema`, `mcp`, `cli`, `api`, `docs`, `ci`, `deploy`, `worker`. Surfaces are explicitly extensible per deployment.

### `work_item_links.link_kind` — 5 values

`blocked_by`, `followup`, `related`, `supersedes`, `decision_for`.

### `project_track_links.relationship` (`link_relationships` vocab) — 11 values

`anchor`, `advances`, `blocks`, `owns`, `evidence`, `followup`, `related`, `supersedes`, `child_of`, `splits_into`, `absorbs`.

### Other status enums (preserve as CHECKs)

- `work_items.status`: `new, triaged, blocked, done, ignored`
- `work_item_candidates.status`: `pending, approved, rejected, edited`
- `project_candidates.status`: `pending, approved, rejected`
- `claims.claim_status`: `active, released, completed, blocked, expired, abandoned, failed`
- `claims.runner_kind`: `manual, agent, worker, automation, other` (genericized)
- `project_tracks.status`: `active, blocked, waiting_decision, observation_gate, deferred, closed, closed_operating_program`
- `project_tracks.track_kind`: `major_project, operating_program, repo_project, workstream`
- `run_packs.status`: `proposed, approved, launched, completed, cancelled`
- `run_pack_items.result`: `pending, shipped, blocked, skipped_not_eligible, failed`
- `decision_threads.status`: `open, awaiting_decision, decided, expired` (genericized)

## 4. Governance invariants to preserve

Two CHECK constraints on the source `operator_backlog_items` encode the heart of the governance model and **must** carry over to `work_items`:

1. `status <> 'blocked' OR NOT (tags @> ARRAY['autonomous_safe'])` — a blocked item cannot also be `autonomous_safe`. (Demotion on block.)
2. `status NOT IN ('new','triaged') OR NOT (tags @> ARRAY['blocked_on_dependency'])` — a dependency-blocked item cannot sit in an open lifecycle status; it must be `blocked`.

Plus the application-enforced invariant from the design doc (not a DB CHECK, but a write-path rule the MCP server must enforce): **an agent cannot add `autonomous_safe` to its own work** — that tag is a human grant. Agents may remove it (demote on block) but never apply it.

## 5. Nexus-specific behavior NOT extracted / to revalidate

- **Job-routing trigger.** Nexus has a `BEFORE INSERT` routing trigger (`route_nexus_jobs`) on its job tables — this is Nexus worker-queue routing, not PMO substrate. Not extracted.
- **`pg_notify` event hooks.** The design doc references event-driven re-elicit (decision threads) and precondition auto-arm via notifications. Clearance v1 can implement precondition auto-arm as a polling/`precondition_check` tool; `pg_notify` is an optimization to revalidate, not a v1 requirement.
- **Candidate dedup.** Source dedups on `discord_message_id`. Revalidated as `UNIQUE(source, external_ref)` (see §2).
- **Discord delivery tables.** `discord_delivery_messages`, `pmo_reply_proposals`, and the `notification_*` columns are review-surface delivery state — they belong (optionally) in `@clearance/bot-discord`, not the core schema.
- **Decision-distill states.** `distilling` / `awaiting_lock_in` are Nexus decision-pipeline internals; the generic `decision_threads.status` collapses them.

## 6. Open questions

Resolved by the [founding decisions](../architecture/decision-records.md): license (Apache 2.0), monorepo (npm workspaces), package scope (`@clearance/*`), storage (Postgres-only v1), tag extensibility (reserved 8 + documented custom namespace), interface (MCP-first).

Remaining for the schema implementation (OB-884):

1. **Preconditions: first-class table or JSONB?** Nexus stores them in `work_items.metadata.preconditions`. Recommendation: promote to a first-class `preconditions` table (`id`, `work_item_id`, `kind ∈ {db_object, migration, file}`, `target`, `satisfied_at`, `metadata`) so they are machine-checkable by `precondition_check` without JSONB digging. Confirm at implementation.
2. **`work_items.id`: bigint identity vs UUID?** Source uses bigint identity (human-friendly `OB-884`-style ids). Recommendation: keep bigint identity for work items (legible references); UUIDs for the satellite tables (claims, links, run packs) as the source does.
3. **Custom-tag namespace mechanics.** The reserved 8 are FK-enforced via `governance_tags`. Decide how custom tags are admitted (e.g. a `is_reserved` boolean + a documented `x-` prefix convention) so custom tags cannot collide with or redefine reserved ones.

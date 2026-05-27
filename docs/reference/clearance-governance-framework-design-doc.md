# Extractable Agent Governance Framework: Design Document

**Status:** Design / Pre-extraction
**Origin:** Nexus PMO subsystem, battle-tested across 875 work items in 15 days
**Target:** Standalone open-source project, usable by anyone running AI coding agents (Claude Code, Codex, Cursor agent mode, Aider, etc.)
**Working name:** Clearance

-----

## Problem Statement

AI coding agents can now write code, run tests, open PRs, and deploy. But there is no standard governance layer for autonomous agent work. The gap is not “how do I get an agent to write code” — that’s solved. The gap is:

- How does the agent know what it’s allowed to do without asking?
- How does it know when to stop and hand a decision back to the human?
- How do two agents avoid stepping on each other’s work?
- How does the human verify what the agent actually did?
- How do you track what was approved, what was shipped, what was blocked, and why?

Every team building with AI agents today either has no governance (YOLO mode, the agent does whatever it wants) or reinvents governance from scratch in their own prompt files. There is no portable, structured, tool-integrated governance substrate.

This project extracts the governance framework built and proven inside Nexus into a standalone system anyone can plug into their AI coding workflow.

-----

## Origin: How This Was Built

This governance model was not designed upfront. It emerged from real operational pressure over 15 days:

1. **Days 1-4 (May 12-15):** Manual backlog. Alerts and to-do items tracked in a table. 2-4 items/day.
1. **Days 5-9 (May 16-20):** Structured project phases. Filing work becomes a habit. 15-20 items/day.
1. **Days 10-11 (May 21-22):** ProjectManager agent starts auto-filing work from Discord. The pile grows faster than a human can drain.
1. **Days 12-13 (May 23-24):** 67 items one day, 109 the next. Agents discovering side-work while executing other work and filing it in real time. The system is filing work faster than anyone can process.
1. **Day 14 (May 25):** The PMO comes into existence. 17-item bootstrap sequence. The governance system’s first act: overhaul its own project management. 11 items shipped in one marathon.
1. **Day 15 (May 26):** The PMO’s bug-fix marathon reveals structural problems in the job execution system. The PMO files a 60-item, 10-phase program (JobFoundry) to rebuild its own execution substrate.

Each phase created the conditions that forced the next phase into existence. The governance model is the residue of those corrections.

-----

## What’s Being Extracted

### Core: The Governance Substrate (15 tables)

These tables have zero dependencies on Nexus’s biographical intelligence, PIE pipeline, or any Nexus-specific domain. They are pure project-governance infrastructure.

**Work Items (the backlog)**

|Table                 |Purpose                                                                                                                                                                 |
|----------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`work_items`          |The central work item. Status, priority, title, body, source, category, work_type, operator notes, metadata (JSONB). Currently `operator_backlog_items` in Nexus.       |
|`work_item_candidates`|Proposed work items awaiting human review. Candidate-first doctrine: agents file candidates, humans promote to real work items. Currently `operator_backlog_candidates`.|

**Governance Tags (the access control plane)**

|Table            |Purpose                                                                                                                                                                                                                                        |
|-----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`governance_tags`|The controlled vocabulary of tags that govern what agents can do. Seed data: `autonomous_safe`, `requires_decision`, `requires_clickops`, `requires_investigation`, `requires_secret`, `blocked_on_dependency`, `observation_gate`, `deferred`.|
|`work_item_tags` |Join table: which tags are on which work items, with provenance (who applied, when, why). Currently `ob_tag_map`.                                                                                                                              |

**Claims & Leases (coordination)**

|Table   |Purpose                                                                                                                                                                                                                      |
|--------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`claims`|One active lease per work item. Runner identity, session ref, repo/branch/worktree metadata, heartbeat, lease expiry, outcome, evidence. Prevents two agents from working the same item. Currently `operator_backlog_claims`.|

**Relationships & Dependencies**

|Table            |Purpose                                                                                                                                                                                                                                                                                |
|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`work_item_links`|Parent-child and blocker relationships between work items. `link_kind`: `blocked_by`, `child_of`, `related`, `splits_into`, `absorbs`, etc. Currently `operator_backlog_item_links`.                                                                                                   |
|`preconditions`  |Machine-checkable preconditions on blocked items. Types: `db_object` (verified via `to_regclass`), `migration` (verified via schema version), `file` (verified on disk). Stored in `work_items.metadata.preconditions` in Nexus; could be a first-class table in the extracted version.|

**Projects & Tracks (higher-level grouping)**

|Table                |Purpose                                                                                                                                                                    |
|---------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`project_tracks`     |Higher-level groupings of work: major projects, operating programs, repo projects, workstreams. Optional: work items can exist without a track. Currently `project_tracks`.|
|`project_track_links`|Links between tracks and work items, with relationship type (`anchor`, `advances`, `blocks`, `owns`, etc.). Currently `project_track_links`.                               |
|`project_candidates` |Proposed project tracks awaiting review. Currently `project_tracking_candidates`.                                                                                          |

**Run Packs (scoped execution)**

|Table           |Purpose                                                                                                                                                                                              |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`run_packs`     |Scoped, ordered lists of work items for execution. A run pack is a scoping instruction, never a safety grant. Tracks proposed → approved → launched → completed lifecycle. Currently `pmo_run_packs`.|
|`run_pack_items`|Per-item disposition within a run pack: `shipped`, `blocked`, `skipped_not_eligible`, `failed`. Currently `pmo_run_pack_items`.                                                                      |

**Taxonomy (work classification)**

|Table               |Purpose                                                                                                                                                                                                                                              |
|--------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`work_types`        |Controlled vocabulary for work classification: `fix`, `feature`, `schema`, `security`, `investigation`, `deploy`, `docs`, `validation`, `automation`, `curation`, `integration`, `monitoring`, `reliability`, `reporting`. Currently `ob_work_types`.|
|`surfaces`          |Where work manifests: `nexus`, `mcp`, `discord`, `api`, etc. Extensible per deployment. Currently `ob_surfaces`.                                                                                                                                     |
|`work_item_surfaces`|Join table. Currently `ob_surface_map`.                                                                                                                                                                                                              |

**Decision Threads (optional, for chat-based review)**

|Table             |Purpose                                                                                                                                                                                                  |
|------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`decision_threads`|Tracks decision asks sent to the operator and their resolution. Links a work item to a chat thread (Discord, Slack, etc.) where the decision was presented and answered. Currently `pm_decision_threads`.|

### What’s NOT Extracted

- Nexus agent infrastructure (agent roster, soul specs, eval suites, agent_run_events)
- Biographical intelligence (knowledge_facts, social_identities, photos, communications)
- PIE pipeline (proactive insights, context snapshots)
- Aurora gold-layer views
- Forge/LLM integration (the extracted product is LLM-agnostic)
- Discord gateway (the extracted product is chat-platform-agnostic)

-----

## Product Shape: Four Layers

### Layer 1: The Schema (`@clearance/schema`)

A standalone Postgres migration set. `createdb clearance && npx clearance migrate` gives you the full governance substrate. No Nexus dependencies. No Node.js application server required for the tables themselves.

**Package contents:**

- SQL migration files (numbered, atomic, reversible)
- Seed data for governance tags, work types, and surfaces
- A `migrate` CLI command
- TypeScript type definitions for all tables

**Minimum Postgres version:** 14 (for JSONB subscript syntax and `gen_random_uuid()`).

### Layer 2: The MCP Server (`@clearance/mcp`)

A standalone MCP server that exposes the governance tools. Any MCP-compatible client (Claude Code, Claude Desktop, Codex, Cursor) can connect and use governed execution immediately.

**Core tools (the minimum viable set):**

|Tool              |Purpose                                                                                                                       |Role           |
|------------------|------------------------------------------------------------------------------------------------------------------------------|---------------|
|`claim_next`      |Claim the highest-priority eligible work item. Selects `autonomous_safe` items with no active claim and no human-blocker tags.|Worker         |
|`claim_heartbeat` |Extend an active claim lease.                                                                                                 |Worker         |
|`close_verified`  |Close a work item with evidence. Requires evidence or explicit N/A for tests, smoke, deploy, docs, migration.                 |Worker         |
|`block_with_child`|Create a blocker child, mark the parent blocked, remove `autonomous_safe`, link the rows, release the claim.                  |Worker         |
|`create_work_item`|Create a new work item. Governance tags are validated against the controlled vocabulary.                                      |Manager / Human|
|`update_work_item`|Update status, tags, priority, body. Tag mutations are audit-logged.                                                          |Manager / Human|
|`list_work_items` |Query work items with filters (status, tags, priority, project).                                                              |All            |
|`create_candidate`|File a proposed work item for human review (candidate-first doctrine).                                                        |Manager        |
|`run_pack_create` |Create a scoped execution list. A run pack is a scoping instruction, never a safety grant.                                    |Manager        |
|`run_pack_record` |Record per-item disposition in a run pack.                                                                                    |Worker         |
|`digest`          |Read-only summary: ready queue, active claims, blocked items, recent completions.                                             |Manager / Human|

**Extended tools (phase 2):**

|Tool                |Purpose                                                                           |
|--------------------|----------------------------------------------------------------------------------|
|`investigate`       |Structured investigation disposition: close, graduate, convert to decision, block.|
|`precondition_check`|Verify machine-checkable preconditions on a blocked item.                         |
|`project_tracks`    |CRUD for higher-level project groupings.                                          |
|`decision_thread`   |Create/resolve decision threads for human review.                                 |

**Configuration:** The MCP server connects to a Postgres database (connection string) and optionally to a chat platform webhook (for posting review cards). No other dependencies.

### Layer 3: Role Contracts (`@clearance/contracts`)

Markdown prompt templates for the three roles. Not runnable code — operational contracts that define what each role may and must not do. Someone reads these and adapts them to their own LLM coding tool.

**ProjectWorker contract:**

- Task-only execution role, not a standing autonomous agent
- Claims through `claim_next`, works in isolated branches
- May: edit code/docs/config/tests within claimed scope, run verification, commit/push/deploy when allowed, create blocker children, close with evidence
- Must not: work unclaimed items, create ambiguous future work, invent tags/states, continue past a human decision point, broaden into discovery

**ProjectInvestigator contract:**

- Diagnosis and routing role, never ships code
- Four dispositions: close (no-code resolution), graduate to `autonomous_safe` (hand to Worker), convert to `requires_decision` (hand to human), block (hand to clickops/secret/dependency)
- The defining guard: verify the premise before building. The OB body is a symptom report, not the diagnosis.
- Must not: ship code inline (except trivial interactive fixes), manufacture decisions where the investigation concluded a forced answer

**ProjectManager contract:**

- Discovery, triage, reporting, candidate-first coordination
- Files candidates, not direct work items (candidate-first doctrine)
- Surfaces review cards for human decision
- Reports pipeline health: what’s ready, what’s blocked, what shipped
- Must not: execute work, promote its own candidates, bypass human review

**Reusable run prompt:**
The complete `/projectworker` run prompt from `autonomous-safe-execution-loop.md`, parameterized for the user’s environment. This is the artifact people will copy first.

### Layer 4: Review Surface (optional, `@clearance/bot`)

A pluggable bot that posts review cards, handles reactions, and manages decision threads. Ships with a Discord adapter. Slack adapter as a community contribution target.

**Capabilities:**

- Post work-item candidate cards with Approve/Reject buttons
- Post decision threads for `requires_decision` items
- Handle operator replies and route them back to the governance layer
- Post digest summaries on a schedule

**This layer is optional.** The MCP tools work without it. Someone can use `claim_next` and `close_verified` from the CLI with no bot.

-----

## The Governance Model (What Makes This Different)

### Tags Are the Control Plane

Traditional project management tools use status columns (To Do → In Progress → Done). This system uses **tags as an access control plane**. Status tracks lifecycle. Tags track permissions.

|Tag                     |Meaning                                                                        |Who can apply |Who acts on it       |
|------------------------|-------------------------------------------------------------------------------|--------------|---------------------|
|`autonomous_safe`       |Pre-approved for agent execution. The agent can ship end-to-end without asking.|Human only    |Worker               |
|`requires_decision`     |A human must choose between real options.                                      |Agent or human|Human                |
|`requires_clickops`     |A human must perform a manual action (button click, console login, etc.).      |Agent         |Human                |
|`requires_investigation`|Not enough information to act. Needs diagnosis first.                          |Agent or human|Investigator         |
|`requires_secret`       |Blocked on a credential or token the agent can’t provision.                    |Agent         |Human                |
|`blocked_on_dependency` |Waiting on upstream work to complete.                                          |Agent or human|System (auto-recheck)|
|`observation_gate`      |Waiting for a time-based event (next backup run, next deploy, etc.).           |Agent or human|Time                 |
|`deferred`              |Deliberately parked for later.                                                 |Human         |Human                |

**The critical invariant:** An agent cannot promote its own work to `autonomous_safe`. That tag is a human grant. The agent can demote (remove `autonomous_safe` when it hits a blocker) but never promote. This is the same principle as least-privilege in IAM: explicit grants, no implicit escalation.

### Claim Before You Work

No agent may edit code for a work item it hasn’t claimed. The claim records who is working, when they started, what branch they’re on, and when the lease expires. If the agent disappears, the lease expires and a future agent can reclaim the item.

This prevents two agents from editing the same file, conflicting on the same migration number, or deploying over each other’s changes.

### Verified Close

An agent cannot mark a work item “done” without evidence. The `close_verified` tool requires evidence or an explicit N/A for:

- Tests/build/lint (when code changed)
- Smoke checks (when runtime behavior changed)
- Deploy (when deployed)
- Docs/CHANGES.md (always)
- Migration verification (when schema changed)
- No-code proof (when no files changed)

This prevents the failure mode where an agent marks something done because the prompt said “close when finished” and the agent decided it was finished.

### Candidate-First Doctrine

Agents don’t create real work items directly. They file **candidates** — proposed items that get surfaced for human review. A human promotes a candidate to a real work item (or rejects it). This prevents the backlog from being flooded with low-quality auto-filed items.

The exception: blocker children. When an agent hits a blocker mid-work, it creates a real child work item because the blocker is a concrete, grounded finding from active execution, not speculative discovery.

### Machine-Checkable Preconditions

A blocked work item can declare preconditions that the system verifies automatically:

- `db_object`: Does this table/view exist? (verified via `to_regclass`)
- `migration`: Has this migration been applied? (verified via schema version table)
- `file`: Does this file exist on disk?

When preconditions are satisfied, the item auto-arms without human intervention. When they’re not, it stays blocked silently. The human is out of the loop in both directions: satisfied → arms itself; unsatisfied → waits. This prevents the failure mode where “blocker closed” is treated as “the thing I need now exists.”

-----

## What Someone Gets When They Install This

**Step 1:** `npm install @clearance/schema @clearance/mcp` (or equivalent)

**Step 2:** `createdb clearance && npx clearance migrate` — 15 tables, seeded with governance tags, work types, and surfaces.

**Step 3:** Add the MCP server to their Claude Code / Codex / Cursor config:

```json
{
  "mcpServers": {
    "clearance": {
      "command": "npx",
      "args": ["@clearance/mcp"],
      "env": { "DATABASE_URL": "postgres://localhost/clearance" }
    }
  }
}
```

**Step 4:** Copy the ProjectWorker run prompt into their Claude Code skill or Codex launcher. Adapt the repo paths and deploy commands to their environment.

**Step 5:** File some work items (manually or via the MCP tools). Tag the safe ones `autonomous_safe`. Run `/projectworker`. The agent claims, works, and closes with evidence, or blocks and moves on.

**No Discord required.** No Nexus required. No specific LLM provider required. Postgres + MCP server + a run prompt.

-----

## Naming: Clearance

**Clearance** was chosen for public legibility over the internal blacksmith/shipping naming convention (Furnace, Broadside, Forge, etc.). Someone landing on the GitHub repo cold should understand what the product does from the name alone.

The name works on three levels:

1. **Security clearance:** The authorization level that determines what you’re allowed to access. `autonomous_safe` is “this work item has clearance.” `requires_decision` is “this needs higher clearance, escalate.” The whole tag vocabulary is a clearance system.
1. **Aviation clearance:** “Cleared for takeoff” means approved to execute. The agent checks whether work has clearance before it acts.
1. **Everyday language:** “Does this have clearance?” means “is this approved?” No jargon required.

Package scope: `@clearance/schema`, `@clearance/mcp`, `@clearance/bot-discord`. Domain target: `clearance.dev`.

The security heritage is intentional. The framework was built by a Director of Information Security, and the governance model is explicitly modeled on IAM principles: least privilege, explicit grants, no implicit escalation. The name should carry that lineage.

-----

## Implementation Phases

### Phase 0: Document the Extraction Boundary

Map every Nexus reference in the 15 source tables. Identify columns that are Nexus-specific (e.g., `discord_channel_id` on `operator_backlog_items` — keep as optional, rename to `chat_channel_id`). Identify foreign keys to non-extracted tables (e.g., `suggested_agent` — drop or make generic). Write the table-by-table extraction plan.

### Phase 1: Schema Package

Extract and genericize the 15 tables into a standalone migration set. Rename Nexus-specific columns. Write seed data. Build the `migrate` CLI. Publish `@clearance/schema`. Test: `createdb clearance && npx clearance migrate` succeeds from zero.

### Phase 2: MCP Server (Core Tools)

Extract the 11 core MCP tools from `nexus-mcp`. Strip Nexus-specific imports. Point at the generic schema. Publish `@clearance/mcp`. Test: connect from Claude Code, `claim_next` returns a work item, `close_verified` requires evidence.

### Phase 3: Role Contracts

Extract and genericize the three role prompts from `homelab/docs/agent-workspace/`. Strip Nexus-specific paths and deploy commands. Parameterize for the user’s environment. Publish as markdown in the repo and as a docs site.

### Phase 4: Dogfood

Use the extracted Clearance on a separate, non-Nexus project. File work items, run `/projectworker` against the standalone schema, verify the governance model works outside its birthplace.

### Phase 5: Review Surface (Optional)

Extract the Discord bot into a pluggable adapter. Publish `@clearance/bot-discord`. Define the adapter interface for community Slack/Teams/web contributions.

### Phase 6: Public Launch

Repo, docs site, launch post (the Mosvera playbook: spec + runtime + examples + site). The narrative docs from Nexus become the case studies.

-----

## Open Questions

1. **License:** MIT? Apache 2.0? Dual license like Mosvera?
1. **Postgres-only or abstract the storage?** Postgres is the right answer for v1. The governance model relies on transactions, JSONB, and triggers (`pg_notify` for event-driven re-elicit). Abstracting storage adds complexity without users asking for it. SQLite adapter as a future community contribution for single-user setups.
1. **How opinionated on the tag vocabulary?** Ship the 8 governance tags as defaults but allow extension? Or enforce the core 8 and let users add custom non-governance tags? Recommendation: enforce the core 8 (they encode the governance model), allow custom tags in a separate namespace.
1. **MCP-only or also REST?** MCP is the primary interface (it’s how AI agents talk to tools). A REST API for human dashboards and webhooks is Phase 2+ work.
1. **Relationship to Nexus:** Does Nexus switch to using Clearance as a dependency, or does Clearance remain a fork that evolves independently? Recommendation: Clearance is the upstream. Nexus becomes a consumer. The governance tables in Nexus are replaced by `@clearance/schema` with Nexus-specific extensions layered on top.
1. **Deploy wrapper:** The `projectworker-deploy-nexus.sh` pattern (one audited command that gates all privileged operations) is powerful but deeply environment-specific. Ship the concept and the example, not a generic deploy wrapper. Users write their own for their deploy pipeline.
1. **The daily builder’s blog and Clearance:** The daily blog pipeline (designed earlier this session) could be the first non-Nexus consumer of Clearance. It has work items (daily posts), governance (operator review before publish), and a pipeline. Good dogfood candidate.
# Clearance Founding Plan

Clearance is a portable PMO and work-management system for complex technical systems.

It is the public, standalone extraction of the PMO system used inside Nexus, shaped so someone else can plug it into their own operating environment: a homelab, software platform, research system, automation stack, internal developer platform, or any active system where work needs to be discovered, reviewed, assigned, blocked, verified, and closed.

Agent execution is one of the reasons Clearance needs strong controls, but the core product is the work office around a live technical system.

## What Clearance Is

Clearance is the system of record for operational work:

- project tracks for long-running efforts
- candidates for proposed work that needs review
- work items for approved or accepted work
- tags for execution permissions and blocking states
- claims and leases for worker coordination
- links and preconditions for dependencies
- run packs for scoped execution batches
- decision threads for human choices
- evidence requirements for verified close
- digests for ongoing PMO visibility

The design assumes that work can be done by humans, scripts, services, or AI agents. It also assumes that any of those actors can discover more work while doing their current work. Clearance gives that discovery pressure a shape.

## Who It Is For

Clearance is for operators and builders who already have more work than a simple checklist can represent.

Typical environments include:

- a homelab with services, hardware, deploys, backups, migrations, and recurring repairs
- a software platform with product work, bug fixes, release tasks, incidents, and docs
- a research or data system with sources, pipelines, quality checks, and investigations
- an automation environment where agents or scheduled jobs propose and execute work
- a small team that needs a lightweight PMO without adopting a heavyweight enterprise suite

The common thread is not company size. The common thread is operational complexity.

## Why It Exists

Modern technical systems generate work continuously. Some work is safe to do now. Some work needs investigation. Some work needs a secret, a console click, a stakeholder decision, an upstream deploy, or a later observation window. Some work is speculative and should be reviewed before it touches the backlog at all.

Without a PMO layer, work collapses into prompt files, chat threads, issue comments, scattered notes, and half-remembered decisions. When AI coding agents enter the environment, that pressure increases: agents can execute quickly, but they also need to know what they are allowed to do, when to stop, and what evidence is required before something is done.

Clearance exists to make those boundaries explicit.

## Origin and Provenance

The model comes from the PMO subsystem inside Nexus. It was not designed as a whiteboard abstraction. It emerged while managing hundreds of real work items, candidate discoveries, blockers, decisions, and execution loops over a short period of heavy operational use.

That origin matters because the model has already survived real pressure:

- agents and humans discovered work faster than one person could manually drain it
- candidate-first review became necessary to keep auto-filed work from flooding the backlog
- tags became the permission and routing layer for work
- claims became necessary to prevent workers from colliding
- verified close became necessary because "done" without evidence was not trustworthy
- preconditions became necessary because a closed blocker does not always mean the required object now exists

Clearance keeps that tested PMO shape while removing Nexus-specific domain data, personal data, and platform assumptions.

## Extracted PMO Capabilities

Clearance v1 should extract the reusable work-management substrate.

The core capabilities are:

- Work intake: create work items and candidate work items with provenance.
- Project tracking: group work into tracks and connect tracks to evidence, repos, docs, candidates, and work items.
- Governance tags: mark what is safe, blocked, deferred, waiting, or decision-bound.
- Worker coordination: claim work with leases, heartbeats, branch/worktree metadata, and outcomes.
- Dependency handling: link work items, create blocker children, and represent machine-checkable preconditions.
- Scoped execution: define run packs as ordered execution lists without turning them into safety grants.
- Human review: expose candidates and decisions for review before promotion or action.
- Verified close: require tests, smoke checks, deploy notes, docs, migration proof, or explicit not-applicable evidence.
- Digesting: summarize ready work, active claims, blocked work, recent completions, and stale items.

## What Is Not Extracted

Clearance should not bring along Nexus-specific subsystems.

Out of scope for the public PMO package:

- Nexus biographical intelligence and personal knowledge systems
- domain-specific source ingestion and enrichment pipelines
- Nexus-specific agent rosters and identity systems
- platform-specific Discord automation as a required dependency
- any specific LLM provider dependency
- private service deploy scripts or local homelab assumptions

Clearance can integrate with those kinds of systems through documented adapters, but it should not require them.

## Product Layers

Clearance v1 is planned as four layers.

### Schema Package

`@clearance/schema` provides the Postgres schema and seed data for the PMO substrate.

It should include migrations, default governance tags, work type and surface vocabularies, and generated TypeScript types. Postgres is the v1 storage target because the model depends on transactions, JSONB metadata, constraints, and safe claim selection.

### MCP Server

`@clearance/mcp` exposes the PMO system to MCP-compatible clients.

This is the primary automation interface. It should let humans, agents, and tools list work, create candidates, claim eligible items, heartbeat claims, block with child work, close with evidence, record run-pack disposition, and read operational digests.

### Role Contracts

`@clearance/contracts` contains reusable role and operating contracts.

These are not agents by themselves. They are Markdown contracts and prompt templates for roles such as ProjectManager, ProjectWorker, and ProjectInvestigator. They define what each role may do, what it must not do, and which Clearance tools it should use.

### Review Surface

The optional review surface posts candidate cards, decision requests, and digests into chat or another human review channel.

The first adapter can be Discord because that is where the source system proved the workflow. The architecture should keep the review layer optional so a user can run Clearance through MCP and CLI workflows without chat integration.

## Foundational Model

Clearance separates lifecycle from permission.

Status answers: where is this work in its lifecycle?

Tags answer: who or what is allowed to act on this work now?

That separation is the heart of the system. A work item can be open but not executable. It can be blocked but automatically re-arm when a precondition becomes true. It can be in a run pack but still not safe for a worker to claim. It can be proposed as a candidate without becoming real backlog.

The PMO model should preserve these invariants:

- agents cannot promote their own work to safe execution
- workers claim before they work
- leases expire if workers disappear
- blockers create linked follow-up work instead of hiding failure
- run packs scope execution but do not grant permission
- closed work carries evidence
- candidate work is reviewed before promotion

## Implementation Phases

### Phase 0: Documentation and Extraction Map

Create the public documentation foundation and map the source PMO tables, tools, prompts, and workflows into generic Clearance concepts.

Deliverables:

- public README and documentation map
- founding plan
- source design reference
- concept, architecture, guide, reference, and contributing docs
- table-by-table extraction plan
- list of Nexus-specific columns and assumptions to remove or genericize

### Phase 1: Schema Package

Build the standalone Postgres schema.

Deliverables:

- migration set from empty database
- seed data for core tags and vocabularies
- constraints for tags, claims, links, candidates, and run packs
- TypeScript table types
- migration CLI
- zero-to-schema install test

### Phase 2: MCP Server

Build the core MCP server against the generic schema.

Deliverables:

- read tools for work, projects, candidates, claims, and digests
- write tools for candidates, work items, claims, blocking, run-pack records, and verified close
- strict schemas and clear error messages
- redaction and bounded output rules
- local smoke tests from a clean database

### Phase 3: Role Contracts

Extract and genericize operating contracts.

Deliverables:

- ProjectManager contract
- ProjectWorker contract
- ProjectInvestigator contract
- reusable worker-loop prompt
- examples for human-only, agent-assisted, and automated workflows

### Phase 4: Dogfood

Use Clearance outside Nexus.

Deliverables:

- a separate project running on the standalone schema
- real candidates, work items, claims, blocks, closes, and digests
- notes on gaps found during use
- docs updated from the dogfood run

### Phase 5: Review Surface

Add optional human review adapters.

Deliverables:

- adapter interface
- Discord adapter
- candidate review cards
- decision thread handling
- scheduled digest posting

### Phase 6: Public Launch

Prepare the public project for real use.

Deliverables:

- package publication
- complete install and quickstart docs
- examples
- public changelog
- launch narrative and case study

## Founding Decisions

The founding decisions below were settled on 2026-05-27. The full record, with the reasoning behind each choice, lives in [decision records](architecture/decision-records.md). The summaries here mark what was decided so this plan reads as current; the Nexus relationship remains a standing recommendation rather than a settled decision.

### License

Decision (2026-05-27): Apache 2.0. Settled — it favors broad adoption by individuals, teams, and companies who may embed Clearance in internal systems.

### Package Manager and Monorepo Shape

Decision (2026-05-27): a single monorepo managed with npm workspaces. Settled — npm ships with the Node.js toolchain every contributor already has, which keeps the contribution barrier low without committing to a heavier monorepo tool before the package count justifies it.

### Package Names and Scope

Decision (2026-05-27): packages live under the `@clearance` npm scope — `@clearance/schema`, `@clearance/mcp`, `@clearance/contracts`, and a later optional `@clearance/bot-discord`. Settled — the first three map to the v1 product layers; the Discord adapter is named for clarity but stays out of the core install path.

### Storage

Decision (2026-05-27): Postgres only for v1. Settled — the PMO model depends on transactional claim selection, JSONB metadata, and constraints. SQLite or other adapters are future work after the PMO contract is stable.

### Tag Extensibility

Decision (2026-05-27): ship the core governance tags as reserved system tags, and allow custom tags in a documented namespace. Settled — the governance tags are the permission and routing layer, so their meaning must stay stable while operators can still model environment-specific routing.

### Interface Surface

Decision (2026-05-27): MCP first; REST and dashboard work are out of v1. Settled — MCP is the proven interface and serves humans, agents, and tools through one contract. REST can be added later for dashboards, integrations, and hosted deployments.

### Review Bot

Decision (2026-05-27): keep review surfaces optional. Settled — a PMO system should not require Discord or Slack to be useful, so core Clearance is fully usable through MCP and CLI workflows.

### Nexus Relationship

Recommendation (still open): Clearance becomes the generic upstream once stable. Nexus can later consume it with Nexus-specific extensions layered on top. This is not settled in the 2026-05-27 round because it depends on Clearance reaching stability first, and it does not block v1 work.

## Definition of Success

Clearance v1 succeeds when a new user can:

1. Create a database.
2. Install the schema.
3. Connect the MCP server.
4. Create a project track.
5. Review and promote candidate work.
6. Claim and work an eligible item.
7. Block safely when needed.
8. Close with evidence.
9. Read a digest that tells them what is ready, blocked, active, and recently completed.

The docs succeed when that user can understand why each step exists, not just which command to run.

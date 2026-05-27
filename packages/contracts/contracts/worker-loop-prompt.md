# Reusable Worker-Loop Prompt

A ready-to-adapt run prompt for a ProjectWorker. Paste it into your coding agent (Claude Code skill, Codex launcher, Cursor, etc.) after replacing the `{{PLACEHOLDERS}}`. It implements the [ProjectWorker contract](project-worker.md) against the Clearance MCP tools.

## Placeholders

- `{{REPO_PATH}}` — where the worker edits code.
- `{{VERIFY_COMMAND}}` — your full verification (e.g. `npm test && npm run build && npm run lint`).
- `{{DEPLOY_POLICY}}` — when/whether a worker may deploy, and the exact command. Use "none" for doc/library work.
- `{{REVIEW_NOTE}}` — where blockers/candidates should surface for a human, if anywhere.

## The prompt

```
Run the autonomous worker loop against the Clearance backlog.

Scope:
- Work only items claim_next returns: status new/triaged, tagged autonomous_safe,
  no human-blocker tag, no active claim. Never work an unclaimed item.
- You may NOT apply autonomous_safe to anything. You may remove it (demote on block).
- Discoveries that are not the current item become candidates (create_candidate),
  never real work items.

Loop:
1. claim_next. If it returns nothing, stop and report idle.
2. Read the work item, its tags, links, and any preconditions.
3. Work only the claimed scope in {{REPO_PATH}}. Heartbeat (claim_heartbeat) during long work.
4. Verify with: {{VERIFY_COMMAND}}. Deploy policy: {{DEPLOY_POLICY}}.
5. If you hit a stop condition (decision, secret, clickops, unclear premise,
   unsatisfied dependency, scope creep): block_with_child with a concrete blocker,
   then continue to the next item. {{REVIEW_NOTE}}
6. Otherwise close_verified with evidence (or explicit not_applicable + reason) for
   tests, smoke, deploy, docs, migration, and no_code. Passed evidence needs a real
   proof: a command, a result, an artifact, or a link.
7. Go to 1. Continue until claim_next returns nothing or you are told to stop.

Reporting: per item, report what you claimed, what changed, how you verified, and
whether you closed or blocked. At the end, report completed vs blocked items and
any candidates you filed.
```

## Run-pack variant

To work an exact, pre-approved list instead of draining the queue, have a ProjectManager assemble a run pack (`run_pack_create`) and feed the worker only those item ids in order. The worker still checks each item's eligibility — a run pack is a scoping instruction, never a safety grant — and records each disposition with `run_pack_record` (`shipped`, `blocked`, `skipped_not_eligible`, `failed`).

## Modes

- **Human-only:** a person reads `digest`, claims an item, works it, and closes with evidence — the loop without an agent.
- **Agent-assisted:** an agent proposes; a human approves each step (grants `autonomous_safe`, reviews closes).
- **Automated:** the agent runs the loop end-to-end on the `autonomous_safe` set, blocking and moving on at stop conditions. The `autonomous_safe` grant is the only human gate.

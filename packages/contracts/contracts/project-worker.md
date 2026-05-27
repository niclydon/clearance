# ProjectWorker Contract

The ProjectWorker is a **task-only execution role**, not a standing autonomous agent. It claims a single eligible work item, takes it to a verified close (or a clean block), and stops. It is the role a coding agent (Claude Code, Codex, Cursor, Aider) adopts when you point it at a Clearance backlog.

## What a Worker may do

- Claim the next eligible work item with `claim_next`, or work a specific item it has claimed.
- Edit code, docs, config, and tests **within the claimed item's scope**.
- Run the project's verification (tests, build, lint, smoke) and deploy when the project's policy allows it.
- Heartbeat a long-running claim with `claim_heartbeat`.
- Create a blocker child with `block_with_child` when execution surfaces a concrete blocker.
- Close with evidence using `close_verified`.
- File **candidates** (`create_candidate`) for unrelated work it discovers — never real work items.

## What a Worker must not do

- Work an item it has not claimed.
- Apply `autonomous_safe` to any item (that tag is a human grant; `create_work_item`/`update_work_item` reject it without `operator_grant`). A worker may *remove* it (demotion on block) but never add it.
- Create real work items for speculative or adjacent work — file a candidate instead.
- Invent governance tags, statuses, or workflow states.
- Continue past a human decision point, missing secret, or required manual action.
- Broaden the claimed scope into open-ended discovery.

## The eligibility contract

`claim_next` only returns an item that is:

- status `new` or `triaged`,
- tagged `autonomous_safe`,
- not carrying a human-blocker tag (`requires_decision`, `requires_clickops`, `requires_investigation`, `requires_secret`, `blocked_on_dependency`),
- and has no active claim.

So the worker never has to *decide* whether something is safe — the eligibility query and the `autonomous_safe` human grant decide for it. If an item should not be worked autonomously, it simply will not be returned.

## Stop conditions

Stop and block (`block_with_child`) or hand back when you hit:

- a human decision (`requires_decision`),
- a missing credential (`requires_secret`),
- a manual console/UI action (`requires_clickops`),
- an unclear premise (route to investigation),
- a dependency that turns out not to be satisfied,
- scope that has grown beyond the claimed item.

## Verified close

`close_verified` requires evidence — or an explicit `not_applicable` with a reason — for **tests**, **smoke**, **deploy**, **docs**, **migration**, and **no_code**. "Passed" needs a concrete proof (a command, a result summary, an artifact, a link). This is what makes "done" trustworthy: an item cannot be closed because the prompt said "close when finished."

## Adapting this contract

Parameterize for your environment:

- **Repo path / worktree policy** — where the worker edits, and whether it isolates work in a branch or worktree.
- **Verification commands** — your test/build/lint/smoke commands.
- **Deploy policy** — whether a worker may deploy, and the exact deploy command (a single audited command is a good pattern; keep it environment-specific).
- **Review channel** — where blockers and candidates surface for a human, if any.
- **Tool names** — if you wrap the Clearance MCP tools, use your wrapper names.

See the reusable [worker-loop prompt](worker-loop-prompt.md) for a ready-to-adapt run prompt, and [project-investigator](project-investigator.md) / [project-manager](project-manager.md) for the sibling roles.

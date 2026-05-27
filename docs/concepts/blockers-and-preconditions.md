# Blockers and Preconditions

Blocked work should explain exactly why it cannot proceed.

Clearance models blockers with tags, links, child work items, and machine-checkable preconditions.

## Blocker Children

When a worker discovers a concrete blocker while working a claimed item, it may create a real child work item.

This is the main exception to candidate-first intake. The blocker is not speculative; it is grounded evidence from active execution.

The parent should lose execution permission until the blocker is resolved or the required precondition becomes true.

## Preconditions

Some blocked work can re-arm automatically when a condition is satisfied.

Planned precondition types include:

- database object exists
- migration has been applied
- file exists on disk
- external check reports ready

The important behavior is that Clearance should verify the actual condition, not just assume that closing the blocker made the parent safe.

## Blocking Tags

Common blocking tags include:

- `requires_decision`
- `requires_clickops`
- `requires_secret`
- `blocked_on_dependency`
- `observation_gate`
- `requires_investigation`

## Current Status

Blocking tags are part of the planned seed vocabulary. First-class precondition storage and checks are planned after the initial schema extraction.

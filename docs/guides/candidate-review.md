# Candidate Review

Candidate review protects the backlog.

People and agents can discover useful work, but not every discovery deserves to become real work immediately. Clearance uses candidates as a review lane.

## Review Questions

When reviewing a candidate, ask:

- Is this real work?
- Is it already covered by an existing item or project?
- Is the scope clear enough?
- Does it belong in this PMO system?
- What is the first next action?
- Is it safe for autonomous execution, or does it need a decision, investigation, secret, or clickops?

## Possible Outcomes

- promote to project track
- promote to work item
- reject
- merge into existing work
- request more detail
- defer

## Agent-Filed Candidates

Agent-filed candidates should include provenance and evidence. A reviewer should not need to trust the agent's summary without context.

## MCP tools

Agents and managers file candidates with `create_candidate` (they cannot create real work items as a side effect). A reviewer promotes a candidate by creating the work item (`create_work_item`) and recording the candidate's disposition. Promotion to `autonomous_safe` is a human grant (`update_work_item` with `operator_grant=true`), never something the filing agent can do. See the [MCP tools reference](../reference/mcp-tools.md).

## Current Status

`create_candidate` is implemented in `@clearance/mcp`. The optional review surface (cards/buttons) is a later layer.

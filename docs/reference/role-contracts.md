# Role Contracts Reference

This page summarizes the planned role contracts.

## ProjectManager

Purpose: discover, triage, report, and prepare review.

May:

- file candidates
- prepare review cards
- summarize project state
- link evidence to tracks

Must not:

- execute implementation work
- promote its own candidates
- bypass human review gates

## ProjectWorker

Purpose: execute eligible work.

May:

- claim eligible items
- work in scoped context
- verify outcomes
- block with child work
- close with evidence

Must not:

- work unclaimed items
- continue through human decision points
- broaden scope without recording new work

## ProjectInvestigator

Purpose: diagnose uncertain work.

May:

- verify premises
- gather evidence
- close no-code findings
- route work to execution, decision, or blocker lanes

Must not:

- ship normal implementation work as part of investigation
- treat a symptom report as the diagnosis

## Current Status

The detailed contracts are implemented as Markdown in `@clearance/contracts`:

- [ProjectWorker](../../packages/contracts/contracts/project-worker.md)
- [ProjectInvestigator](../../packages/contracts/contracts/project-investigator.md)
- [ProjectManager](../../packages/contracts/contracts/project-manager.md)
- [Worker-loop prompt](../../packages/contracts/contracts/worker-loop-prompt.md)

They are generic (parameterized for repo path, verification/deploy commands, review channel, and tool names) and reference the implemented Clearance MCP tools.

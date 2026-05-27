# Role Boundaries

Clearance separates PMO roles so authority stays clear.

The roles can be performed by humans, agents, scripts, or services, but the boundaries should remain stable.

## ProjectManager

ProjectManager discovers, triages, reports, and stages candidates.

It may:

- file candidates
- summarize pipeline health
- prepare review cards
- connect projects to evidence
- recommend next actions

It must not:

- promote its own candidates
- execute work
- grant execution permission to its own discoveries

## ProjectWorker

ProjectWorker executes approved work.

It may:

- claim eligible work
- edit within the claimed scope
- run verification
- block with child work when it finds a concrete blocker
- close with evidence

It must not:

- work unclaimed items
- broaden into unrelated discovery
- continue past a human decision point
- mark work done without evidence

## ProjectInvestigator

ProjectInvestigator diagnoses uncertain work.

It may:

- verify the premise of a report
- close no-code findings
- graduate work to an executable path when appropriate
- convert work into a decision or blocker

It must not:

- ship normal implementation work inline
- treat symptoms as diagnoses
- manufacture decisions when the evidence points to one safe answer

## Current Status

The role contracts are implemented as generic, adaptable Markdown in `@clearance/contracts` — see the [role contracts reference](../reference/role-contracts.md) for links to each, plus a reusable worker-loop prompt.

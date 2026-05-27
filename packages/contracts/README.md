# @clearance/contracts

Reusable role and operating contracts for Clearance — Markdown templates and prompt scaffolds for the roles that use the PMO system. These are not agents; they define what each role may do, must not do, and which Clearance MCP tools it uses.

## Contracts

- [ProjectWorker](contracts/project-worker.md) — task-only execution: claim, work, verify, close or block.
- [ProjectInvestigator](contracts/project-investigator.md) — diagnosis and routing; never ships code.
- [ProjectManager](contracts/project-manager.md) — discovery, triage, reporting, candidate-first coordination.
- [Worker-loop prompt](contracts/worker-loop-prompt.md) — a ready-to-adapt run prompt with `{{PLACEHOLDERS}}`.

## Usage

The contracts are plain Markdown — copy them and replace the placeholders for your environment (repo path, verification commands, deploy policy, review channel, tool names). The package also exposes them programmatically:

```ts
import { CONTRACTS, readContract } from '@clearance/contracts';

const workerContract = readContract('project-worker');
```

All four contracts reinforce the Clearance invariants: candidate-first intake, claim-before-work, no agent self-promotion to `autonomous_safe`, and verified close.

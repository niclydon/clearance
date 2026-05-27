// @clearance/contracts — reusable role and operating contracts for Clearance.
// These are Markdown templates (not runnable agents); this module exposes their
// location and contents so tooling can surface or embed them.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Directory holding the contract markdown files. */
export const CONTRACTS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'contracts');

export type RoleContract =
  | 'project-manager'
  | 'project-worker'
  | 'project-investigator'
  | 'worker-loop-prompt';

/** Map of contract name to its markdown file name. */
export const CONTRACTS: Record<RoleContract, string> = {
  'project-manager': 'project-manager.md',
  'project-worker': 'project-worker.md',
  'project-investigator': 'project-investigator.md',
  'worker-loop-prompt': 'worker-loop-prompt.md',
};

/** Read a contract's markdown content. */
export function readContract(name: RoleContract): string {
  return readFileSync(join(CONTRACTS_DIR, CONTRACTS[name]), 'utf8');
}

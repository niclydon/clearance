#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type pg from 'pg';
import { z } from 'zod';
import { closePool, getPool } from './db.js';
import {
  digest,
  getWorkItem,
  listClaims,
  listProjectTracks,
  listRunPacks,
  listWorkItemCandidates,
  listWorkItems,
} from './read.js';
import {
  GovernanceError,
  blockWithChild,
  claimHeartbeat,
  claimNext,
  closeVerified,
  createCandidate,
  createProjectTrack,
  createProjectTrackLink,
  createWorkItem,
  promoteCandidate,
  rejectCandidate,
  runPackCreate,
  runPackRecord,
  updateProjectTrack,
  updateWorkItem,
} from './write.js';

const SERVER_VERSION = '0.1.0';

function json(value: unknown): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}

/** Run a mutating tool, surfacing governance/validation failures as tool errors. */
async function guarded(fn: () => Promise<unknown>): Promise<CallToolResult> {
  try {
    return json(await fn());
  } catch (error) {
    const message =
      error instanceof GovernanceError ? error.message : `${(error as Error).message}`;
    return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
  }
}

const evidenceBucketShape = z.object({
  status: z.enum(['passed', 'not_applicable']),
  reason: z.string().optional(),
  command: z.string().optional(),
  result: z.string().optional(),
  summary: z.string().optional(),
  artifact: z.string().optional(),
});

const listFilterShape = {
  status: z.string().optional().describe('Filter by exact status value.'),
  limit: z.number().int().positive().optional().describe('Max rows (default 50, capped at 200).'),
  offset: z.number().int().nonnegative().optional().describe('Rows to skip for pagination.'),
};

/** Build the Clearance MCP server with the read-only tool set bound to `pool`. */
export function createServer(pool: pg.Pool): McpServer {
  const server = new McpServer({ name: 'clearance', version: SERVER_VERSION });

  server.registerTool(
    'list_work_items',
    {
      title: 'List work items',
      description: 'List work items with optional status, tag, work_type, and category filters.',
      inputSchema: {
        status: z.string().optional().describe('Filter by lifecycle status.'),
        tag: z.string().optional().describe('Require this governance tag.'),
        work_type: z.string().optional().describe('Filter by work type.'),
        category: z.string().optional().describe('Filter by category.'),
        limit: z.number().int().positive().optional(),
        offset: z.number().int().nonnegative().optional(),
      },
    },
    async (args) => json(await listWorkItems(pool, args)),
  );

  server.registerTool(
    'get_work_item',
    {
      title: 'Get a work item',
      description: 'Fetch a single work item by id.',
      inputSchema: { id: z.number().int().describe('Work item id.') },
    },
    async (args) => json(await getWorkItem(pool, args.id)),
  );

  server.registerTool(
    'list_work_item_candidates',
    {
      title: 'List work item candidates',
      description: 'List proposed work items awaiting review.',
      inputSchema: listFilterShape,
    },
    async (args) => json(await listWorkItemCandidates(pool, args)),
  );

  server.registerTool(
    'list_project_tracks',
    {
      title: 'List project tracks',
      description: 'List project tracks (durable workstreams).',
      inputSchema: listFilterShape,
    },
    async (args) => json(await listProjectTracks(pool, args)),
  );

  server.registerTool(
    'list_claims',
    {
      title: 'List claims',
      description: 'List worker claims/leases.',
      inputSchema: listFilterShape,
    },
    async (args) => json(await listClaims(pool, args)),
  );

  server.registerTool(
    'list_run_packs',
    {
      title: 'List run packs',
      description: 'List scoped execution batches.',
      inputSchema: listFilterShape,
    },
    async (args) => json(await listRunPacks(pool, args)),
  );

  server.registerTool(
    'digest',
    {
      title: 'PMO digest',
      description:
        'Operational snapshot: ready queue, blocked count, active/stale claims, pending candidates, recent completions.',
      inputSchema: {},
    },
    async () => json(await digest(pool)),
  );

  // --- Write tools ---

  server.registerTool(
    'create_candidate',
    {
      title: 'Create a work-item candidate',
      description: 'File proposed work for human review (candidate-first doctrine).',
      inputSchema: {
        proposed_title: z.string(),
        proposed_body: z.string().optional(),
        proposed_category: z.string().optional(),
        proposed_priority: z.number().int().optional(),
        filter_reason: z.string().optional(),
        source: z.string().optional(),
        external_ref: z.string().optional(),
        source_content: z.string().optional(),
      },
    },
    async (args) => guarded(() => createCandidate(pool, args)),
  );

  server.registerTool(
    'promote_candidate',
    {
      title: 'Promote a candidate to a work item',
      description:
        'Create a work item from a candidate (with optional overrides), mark the candidate approved, and link them. The new work item carries no tags — autonomous_safe stays a separate human grant.',
      inputSchema: {
        candidate_id: z.number().int(),
        overrides: z
          .object({
            title: z.string().optional(),
            body: z.string().optional(),
            category: z.string().optional(),
            priority: z.number().int().optional(),
            work_type: z.string().optional(),
            source: z.string().optional(),
            operator_note: z.string().optional(),
          })
          .optional(),
      },
    },
    async (args) => guarded(() => promoteCandidate(pool, args)),
  );

  server.registerTool(
    'reject_candidate',
    {
      title: 'Reject a candidate',
      description: 'Mark a candidate rejected (it does not become a work item).',
      inputSchema: {
        candidate_id: z.number().int(),
        reason: z.string().optional(),
      },
    },
    async (args) => guarded(() => rejectCandidate(pool, args)),
  );

  server.registerTool(
    'create_work_item',
    {
      title: 'Create a work item',
      description:
        'Create accepted work. Governance tags are validated; autonomous_safe requires operator_grant.',
      inputSchema: {
        title: z.string(),
        body: z.string().optional(),
        category: z.string().optional(),
        priority: z.number().int().optional(),
        source: z.string().optional(),
        work_type: z.string().optional(),
        tags: z.array(z.string()).optional(),
        operator_note: z.string().optional(),
        operator_grant: z.boolean().optional(),
      },
    },
    async (args) => guarded(() => createWorkItem(pool, args)),
  );

  server.registerTool(
    'update_work_item',
    {
      title: 'Update a work item',
      description:
        'Update status/priority/body/notes/work_type and add/remove governance tags (audit-logged). ' +
        'Adding autonomous_safe requires operator_grant=true.',
      inputSchema: {
        id: z.number().int(),
        status: z.string().optional(),
        priority: z.number().int().optional(),
        body: z.string().optional(),
        operator_note: z.string().optional(),
        work_type: z.string().optional(),
        add_tags: z.array(z.string()).optional(),
        remove_tags: z.array(z.string()).optional(),
        operator_grant: z.boolean().optional(),
      },
    },
    async (args) => guarded(() => updateWorkItem(pool, args)),
  );

  server.registerTool(
    'claim_next',
    {
      title: 'Claim the next eligible work item',
      description:
        'Claim the highest-priority autonomous_safe work item with no active claim and no human-blocker tags.',
      inputSchema: {
        runner_id: z.string(),
        runner_kind: z.string().optional(),
        lease_minutes: z.number().int().optional(),
        session_ref: z.string().optional(),
        repo_path: z.string().optional(),
        branch_name: z.string().optional(),
        worktree_path: z.string().optional(),
      },
    },
    async (args) => guarded(() => claimNext(pool, args)),
  );

  server.registerTool(
    'claim_heartbeat',
    {
      title: 'Heartbeat a claim',
      description: 'Extend an active claim lease.',
      inputSchema: {
        claim_id: z.string(),
        lease_minutes: z.number().int().optional(),
      },
    },
    async (args) => guarded(() => claimHeartbeat(pool, args)),
  );

  server.registerTool(
    'block_with_child',
    {
      title: 'Block a work item with a blocker child',
      description:
        'Create a blocker child work item, mark the parent blocked (removing autonomous_safe), link them, and release the claim.',
      inputSchema: {
        parent_id: z.number().int(),
        child_title: z.string(),
        child_body: z.string().optional(),
        child_tags: z.array(z.string()).optional(),
        blocker_reason: z.string().optional(),
        claim_id: z.string().optional(),
      },
    },
    async (args) => guarded(() => blockWithChild(pool, args)),
  );

  server.registerTool(
    'close_verified',
    {
      title: 'Close a work item with evidence',
      description:
        'Close a work item. Requires evidence for tests, smoke, deploy, docs, migration, and no_code (passed with proof, or not_applicable with a reason).',
      inputSchema: {
        id: z.number().int(),
        resolution_text: z.string(),
        evidence: z.record(z.string(), evidenceBucketShape),
        claim_id: z.string().optional(),
      },
    },
    async (args) => guarded(() => closeVerified(pool, args)),
  );

  server.registerTool(
    'run_pack_create',
    {
      title: 'Create a run pack',
      description:
        'Create a scoped, ordered execution list. A run pack is a scoping instruction, never a safety grant.',
      inputSchema: {
        run_pack_key: z.string(),
        intent: z.string(),
        work_item_ids: z.array(z.number().int()),
        issued_by: z.string().optional(),
        launch_text: z.string().optional(),
      },
    },
    async (args) => guarded(() => runPackCreate(pool, args)),
  );

  server.registerTool(
    'run_pack_record',
    {
      title: 'Record a run-pack item disposition',
      description:
        'Record the per-item result within a run pack (shipped/blocked/skipped_not_eligible/failed).',
      inputSchema: {
        run_pack_id: z.string(),
        work_item_id: z.number().int(),
        result: z.string(),
        result_reason: z.string().optional(),
        pr_number: z.number().int().optional(),
        merge_commit: z.string().optional(),
        child_work_item_ids: z.array(z.number().int()).optional(),
        claim_id: z.string().optional(),
      },
    },
    async (args) => guarded(() => runPackRecord(pool, args)),
  );

  server.registerTool(
    'create_project_track',
    {
      title: 'Create a project track',
      description:
        'Create a durable project track (major project, operating program, repo project, or workstream).',
      inputSchema: {
        track_key: z.string(),
        title: z.string(),
        summary: z.string().optional(),
        status: z.string().optional(),
        track_kind: z.string().optional(),
        priority: z.number().int().optional(),
        owner: z.string().optional(),
        current_state: z.string().optional(),
        next_action: z.string().optional(),
        source: z.string().optional(),
      },
    },
    async (args) => guarded(() => createProjectTrack(pool, args)),
  );

  server.registerTool(
    'update_project_track',
    {
      title: 'Update a project track',
      description:
        'Update a project track by id (status, priority, current state, next action, etc.).',
      inputSchema: {
        id: z.string(),
        title: z.string().optional(),
        summary: z.string().optional(),
        status: z.string().optional(),
        track_kind: z.string().optional(),
        priority: z.number().int().optional(),
        owner: z.string().optional(),
        current_state: z.string().optional(),
        next_action: z.string().optional(),
        stale_risk: z.string().optional(),
      },
    },
    async (args) => guarded(() => updateProjectTrack(pool, args)),
  );

  server.registerTool(
    'create_project_track_link',
    {
      title: 'Link a project track to work',
      description:
        'Link a project track to a work item, candidate, repo, doc, or external reference with a relationship (anchor, advances, blocks, owns, evidence, ...).',
      inputSchema: {
        track_id: z.string(),
        link_kind: z.string(),
        relationship: z.string().optional(),
        target_ref: z.string().optional(),
        target_work_item_id: z.number().int().optional(),
        target_project_candidate_id: z.string().optional(),
        source_work_item_id: z.number().int().optional(),
        title: z.string().optional(),
        summary: z.string().optional(),
      },
    },
    async (args) => guarded(() => createProjectTrackLink(pool, args)),
  );

  return server;
}

async function main(): Promise<void> {
  const pool = getPool();
  const server = createServer(pool);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  main().catch(async (error: unknown) => {
    process.stderr.write(`clearance-mcp failed: ${(error as Error).message}\n`);
    await closePool();
    process.exitCode = 1;
  });
}

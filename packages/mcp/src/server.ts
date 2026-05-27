#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
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

const SERVER_VERSION = '0.1.0';

function json(value: unknown): { content: { type: 'text'; text: string }[] } {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}

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

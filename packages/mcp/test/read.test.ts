import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { applyMigrations } from '@clearance/schema';
import {
  digest,
  getWorkItem,
  listProjectTracks,
  listWorkItemCandidates,
  listWorkItems,
} from '../src/read.js';
import { createServer } from '../src/server.js';

const { Pool } = pg;

const url = process.env.CLEARANCE_TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const suite = url ? describe : describe.skip;

async function seed(pool: pg.Pool): Promise<{ readyId: number }> {
  const insert = async (
    title: string,
    status: string,
    priority: number,
    tags: string[],
  ): Promise<number> => {
    const { rows } = await pool.query<{ id: number }>(
      `INSERT INTO work_items (title, status, priority, tags) VALUES ($1, $2, $3, $4) RETURNING id`,
      [title, status, priority, tags],
    );
    return rows[0]!.id;
  };

  const readyId = await insert('ready item', 'new', 50, ['autonomous_safe']);
  await insert('blocked item', 'blocked', 30, ['blocked_on_dependency']);
  await insert('done item', 'done', 10, []);
  await insert('decision item', 'new', 40, ['requires_decision']);
  const claimedId = await insert('claimed ready item', 'new', 45, ['autonomous_safe']);
  await pool.query(
    `INSERT INTO claims (work_item_id, claim_status, runner_id, runner_kind)
     VALUES ($1, 'active', 'test-runner', 'agent')`,
    [claimedId],
  );

  await pool.query(
    `INSERT INTO work_item_candidates (proposed_title, status, filter_reason)
     VALUES ('a proposal', 'pending', 'looked useful')`,
  );
  await pool.query(
    `INSERT INTO project_tracks (track_key, title) VALUES ('demo-track', 'Demo Track')`,
  );

  return { readyId };
}

suite('clearance mcp read tools', () => {
  let pool: pg.Pool;
  let readyId: number;

  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 1 });
    const { rows } = await pool.query<{ db: string }>('SELECT current_database() AS db');
    if (!/test/.test(rows[0]?.db ?? '')) {
      throw new Error('Refusing to reset a database whose name does not contain "test".');
    }
    await pool.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity
       WHERE datname = current_database() AND pid <> pg_backend_pid()`,
    );
    await pool.query('DROP SCHEMA IF EXISTS public CASCADE');
    await pool.query('CREATE SCHEMA public');
    await applyMigrations({ pool });
    ({ readyId } = await seed(pool));
  }, 30000);

  afterAll(async () => {
    await pool?.end();
  });

  it('lists work items with a total count', async () => {
    const result = await listWorkItems(pool);
    expect(result.total).toBe(5);
    expect(result.items.length).toBe(5);
    // Highest priority first.
    expect(result.items[0]!.priority).toBe(50);
  });

  it('filters work items by status', async () => {
    const result = await listWorkItems(pool, { status: 'blocked' });
    expect(result.total).toBe(1);
    expect(result.items[0]!.status).toBe('blocked');
  });

  it('filters work items by governance tag', async () => {
    const result = await listWorkItems(pool, { tag: 'requires_decision' });
    expect(result.total).toBe(1);
    expect(result.items[0]!.title).toBe('decision item');
  });

  it('fetches a single work item', async () => {
    const item = await getWorkItem(pool, readyId);
    expect(item?.id).toBe(readyId);
    expect(getWorkItem(pool, -1)).resolves.toBeNull();
  });

  it('lists pending candidates and project tracks', async () => {
    expect((await listWorkItemCandidates(pool, { status: 'pending' })).total).toBe(1);
    expect((await listProjectTracks(pool)).total).toBe(1);
  });

  it('produces a digest with correct counts', async () => {
    const d = await digest(pool);
    // Only the unclaimed autonomous_safe item is ready; the claimed one and the
    // requires_decision one are excluded, blocked/done are not eligible.
    expect(d.ready.count).toBe(1);
    expect(d.ready.sample[0]!.title).toBe('ready item');
    expect(d.blocked.count).toBe(1);
    expect(d.active_claims.count).toBe(1);
    expect(d.pending_candidates.count).toBe(1);
    expect(d.recent_completions.map((r) => r.title)).toContain('done item');
  });

  it('serves the read tools to an MCP client over an in-memory transport', async () => {
    const server = createServer(pool);
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'test-client', version: '0.0.0' });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    try {
      const tools = await client.listTools();
      const names = tools.tools.map((tool) => tool.name);
      expect(names).toContain('list_work_items');
      expect(names).toContain('digest');
      expect(names).toContain('get_work_item');

      const result = await client.callTool({ name: 'digest', arguments: {} });
      const content = result.content as { type: string; text: string }[];
      const parsed = JSON.parse(content[0]!.text) as { ready: { count: number } };
      expect(parsed.ready.count).toBe(1);
    } finally {
      await client.close();
      await server.close();
    }
  });
});

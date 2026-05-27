import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import pg from 'pg';
import { applyMigrations } from '@clearance/schema';
import { getWorkItem, listWorkItems } from '../src/read.js';
import {
  GovernanceError,
  blockWithChild,
  claimHeartbeat,
  claimNext,
  closeVerified,
  createCandidate,
  createWorkItem,
  runPackCreate,
  runPackRecord,
  updateWorkItem,
  validateCloseEvidence,
} from '../src/write.js';

const { Pool } = pg;

const url = process.env.CLEARANCE_TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const suite = url ? describe : describe.skip;

const FULL_EVIDENCE = {
  tests: { status: 'passed' as const, result: 'all green' },
  smoke: { status: 'not_applicable' as const, reason: 'no runtime' },
  deploy: { status: 'not_applicable' as const, reason: 'library' },
  docs: { status: 'passed' as const, summary: 'updated' },
  migration: { status: 'not_applicable' as const, reason: 'no schema change' },
  no_code: { status: 'not_applicable' as const, reason: 'has code' },
};

suite('clearance mcp write tools', () => {
  let pool: pg.Pool;

  beforeAll(async () => {
    pool = new Pool({ connectionString: url, max: 1 });
    const { rows } = await pool.query<{ db: string }>('SELECT current_database() AS db');
    if (!/test/.test(rows[0]?.db ?? '')) {
      throw new Error('Refusing to reset a database whose name does not contain "test".');
    }
  }, 30000);

  beforeEach(async () => {
    await pool.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity
       WHERE datname = current_database() AND pid <> pg_backend_pid()`,
    );
    await pool.query('DROP SCHEMA IF EXISTS public CASCADE');
    await pool.query('CREATE SCHEMA public');
    await applyMigrations({ pool });
  }, 30000);

  afterAll(async () => {
    await pool?.end();
  });

  it('files a candidate without creating a work item', async () => {
    const candidate = await createCandidate(pool, {
      proposed_title: 'do the thing',
      filter_reason: 'looked useful',
    });
    expect(candidate.status).toBe('pending');
    expect((await listWorkItems(pool)).total).toBe(0);
  });

  it('refuses to let an agent self-grant autonomous_safe', async () => {
    await expect(
      createWorkItem(pool, { title: 'sneaky', tags: ['autonomous_safe'] }),
    ).rejects.toBeInstanceOf(GovernanceError);
  });

  it('allows autonomous_safe with an explicit operator grant', async () => {
    const item = await createWorkItem(pool, {
      title: 'approved work',
      tags: ['autonomous_safe'],
      operator_grant: true,
    });
    expect(item.tags).toContain('autonomous_safe');
    const tagRows = await pool.query('SELECT tag FROM work_item_tags WHERE work_item_id = $1', [
      item.id,
    ]);
    expect(tagRows.rows.map((r: { tag: string }) => r.tag)).toContain('autonomous_safe');
  });

  it('rejects unknown governance tags', async () => {
    await expect(
      createWorkItem(pool, { title: 'bad tag', tags: ['not_a_tag'], operator_grant: true }),
    ).rejects.toBeInstanceOf(GovernanceError);
  });

  it('claims the highest-priority eligible item and skips ineligible ones', async () => {
    await createWorkItem(pool, { title: 'decision', tags: ['requires_decision'] });
    await createWorkItem(pool, { title: 'plain new' });
    const target = await createWorkItem(pool, {
      title: 'ready high',
      priority: 100,
      tags: ['autonomous_safe'],
      operator_grant: true,
    });

    const claimed = await claimNext(pool, { runner_id: 'r1' });
    expect(claimed?.work_item.id).toBe(target.id);
    expect(claimed?.claim.claim_status).toBe('active');

    // No more eligible items (the only autonomous_safe one is now claimed).
    expect(await claimNext(pool, { runner_id: 'r2' })).toBeNull();
  });

  it('heartbeats an active claim', async () => {
    await createWorkItem(pool, { title: 'ready', tags: ['autonomous_safe'], operator_grant: true });
    const claimed = await claimNext(pool, { runner_id: 'r1', lease_minutes: 30 });
    const before = claimed!.claim.lease_expires_at;
    const beat = await claimHeartbeat(pool, { claim_id: claimed!.claim.id, lease_minutes: 120 });
    expect(new Date(beat.lease_expires_at).getTime()).toBeGreaterThan(new Date(before).getTime());
  });

  it('blocks a parent with a child and demotes autonomous_safe', async () => {
    const parent = await createWorkItem(pool, {
      title: 'needs a secret',
      tags: ['autonomous_safe'],
      operator_grant: true,
    });
    const claimed = await claimNext(pool, { runner_id: 'r1' });
    const { parent: blocked, child } = await blockWithChild(pool, {
      parent_id: parent.id,
      child_title: 'provision the secret',
      child_tags: ['requires_secret'],
      blocker_reason: 'needs API key',
      claim_id: claimed!.claim.id,
    });
    expect(blocked.status).toBe('blocked');
    expect(blocked.tags).not.toContain('autonomous_safe');
    expect(child.title).toBe('provision the secret');

    const link = await pool.query(
      `SELECT 1 FROM work_item_links WHERE parent_work_item_id = $1 AND child_work_item_id = $2 AND link_kind = 'blocked_by'`,
      [parent.id, child.id],
    );
    expect(link.rowCount).toBe(1);
    const claim = await pool.query<{ claim_status: string }>(
      'SELECT claim_status FROM claims WHERE id = $1',
      [claimed!.claim.id],
    );
    expect(claim.rows[0]!.claim_status).toBe('blocked');
  });

  it('validates close evidence and stores it on close', async () => {
    expect(validateCloseEvidence({} as never)).toMatch(/Missing close evidence/);

    const item = await createWorkItem(pool, { title: 'finish me' });
    await expect(
      closeVerified(pool, {
        id: item.id,
        resolution_text: 'done',
        evidence: { tests: { status: 'passed' } } as never,
      }),
    ).rejects.toBeInstanceOf(GovernanceError);

    const closed = await closeVerified(pool, {
      id: item.id,
      resolution_text: 'shipped it',
      evidence: FULL_EVIDENCE,
    });
    expect(closed.status).toBe('done');
    const fresh = await getWorkItem(pool, item.id);
    expect((fresh?.metadata as { resolution_text?: string }).resolution_text).toBe('shipped it');
  });

  it('creates a run pack and records a per-item disposition without granting safety', async () => {
    const a = await createWorkItem(pool, { title: 'pack item a' });
    const b = await createWorkItem(pool, { title: 'pack item b' });
    const pack = await runPackCreate(pool, {
      run_pack_key: 'rp-test-1',
      intent: 'ship a and b',
      work_item_ids: [a.id, b.id],
    });
    expect(pack.status).toBe('proposed');

    const recorded = await runPackRecord(pool, {
      run_pack_id: pack.id,
      work_item_id: a.id,
      result: 'shipped',
      pr_number: 7,
    });
    expect(recorded.result).toBe('shipped');
    expect(recorded.pr_number).toBe(7);

    // Recording a result must not promote the work item to autonomous_safe.
    const item = await getWorkItem(pool, a.id);
    expect(item?.tags).not.toContain('autonomous_safe');
  });

  it('refuses to add autonomous_safe via update without an operator grant', async () => {
    const item = await createWorkItem(pool, { title: 'plain' });
    await expect(
      updateWorkItem(pool, { id: item.id, add_tags: ['autonomous_safe'] }),
    ).rejects.toBeInstanceOf(GovernanceError);
    const granted = await updateWorkItem(pool, {
      id: item.id,
      add_tags: ['autonomous_safe'],
      operator_grant: true,
    });
    expect(granted.tags).toContain('autonomous_safe');
  });
});

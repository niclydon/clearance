import type pg from 'pg';
import type { Claim, RunPack, RunPackItem, WorkItem, WorkItemCandidate } from '@clearance/schema';

const HUMAN_BLOCKER_TAGS = [
  'requires_decision',
  'requires_clickops',
  'requires_investigation',
  'requires_secret',
  'blocked_on_dependency',
];

const EVIDENCE_BUCKETS = ['tests', 'smoke', 'deploy', 'docs', 'migration', 'no_code'] as const;

/** A mutating tool tried to do something the governance model forbids. */
export class GovernanceError extends Error {}

async function withTx<T>(pool: pg.Pool, fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function assertTagsAllowed(client: pg.PoolClient, tags: string[]): Promise<void> {
  if (tags.length === 0) {
    return;
  }
  const { rows } = await client.query<{ tag: string }>(
    'SELECT tag FROM governance_tags WHERE tag = ANY($1::text[])',
    [tags],
  );
  const known = new Set(rows.map((row) => row.tag));
  const unknown = tags.filter((tag) => !known.has(tag));
  if (unknown.length > 0) {
    throw new GovernanceError(
      `Unknown governance tag(s): ${unknown.join(', ')}. Define them in governance_tags first.`,
    );
  }
}

/** Enforce the core invariant: agents cannot grant themselves autonomous_safe. */
function assertNoSelfPromotion(tags: string[], operatorGrant: boolean | undefined): void {
  if (tags.includes('autonomous_safe') && !operatorGrant) {
    throw new GovernanceError(
      'autonomous_safe is a human grant and cannot be applied without operator_grant=true. ' +
        'Agents may remove it (demote on block) but never apply it.',
    );
  }
}

async function syncTagMap(
  client: pg.PoolClient,
  workItemId: number,
  tags: string[],
  appliedBy: string,
): Promise<void> {
  await client.query('DELETE FROM work_item_tags WHERE work_item_id = $1', [workItemId]);
  for (const tag of tags) {
    await client.query(
      `INSERT INTO work_item_tags (work_item_id, tag, applied_by, source)
       VALUES ($1, $2, $3, 'mcp')`,
      [workItemId, tag, appliedBy],
    );
  }
}

export interface CreateCandidateInput {
  proposed_title: string;
  proposed_body?: string;
  proposed_category?: string;
  proposed_priority?: number;
  filter_reason?: string;
  source?: string;
  external_ref?: string;
  source_content?: string;
  metadata?: Record<string, unknown>;
}

/** Candidate-first doctrine: managers/agents file candidates, not real work items. */
export async function createCandidate(
  pool: pg.Pool,
  input: CreateCandidateInput,
): Promise<WorkItemCandidate> {
  const { rows } = await pool.query<WorkItemCandidate>(
    `INSERT INTO work_item_candidates
       (proposed_title, proposed_body, proposed_category, proposed_priority,
        filter_reason, source, external_ref, source_content, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      input.proposed_title,
      input.proposed_body ?? '',
      input.proposed_category ?? null,
      input.proposed_priority ?? 1,
      input.filter_reason ?? '',
      input.source ?? '',
      input.external_ref ?? null,
      input.source_content ?? '',
      input.metadata ?? {},
    ],
  );
  return rows[0]!;
}

export interface CreateWorkItemInput {
  title: string;
  body?: string;
  category?: string;
  priority?: number;
  source?: string;
  work_type?: string;
  tags?: string[];
  operator_note?: string;
  metadata?: Record<string, unknown>;
  applied_by?: string;
  operator_grant?: boolean;
}

export async function createWorkItem(pool: pg.Pool, input: CreateWorkItemInput): Promise<WorkItem> {
  const tags = input.tags ?? [];
  assertNoSelfPromotion(tags, input.operator_grant);
  return withTx(pool, async (client) => {
    await assertTagsAllowed(client, tags);
    const { rows } = await client.query<WorkItem>(
      `INSERT INTO work_items
         (title, body, category, priority, source, work_type, tags, operator_note, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        input.title,
        input.body ?? '',
        input.category ?? '',
        input.priority ?? 1,
        input.source ?? '',
        input.work_type ?? null,
        tags,
        input.operator_note ?? '',
        input.metadata ?? {},
      ],
    );
    const item = rows[0]!;
    await syncTagMap(client, item.id, tags, input.applied_by ?? 'mcp');
    return item;
  });
}

export interface UpdateWorkItemInput {
  id: number;
  status?: string;
  priority?: number;
  body?: string;
  operator_note?: string;
  work_type?: string;
  add_tags?: string[];
  remove_tags?: string[];
  applied_by?: string;
  operator_grant?: boolean;
}

export async function updateWorkItem(pool: pg.Pool, input: UpdateWorkItemInput): Promise<WorkItem> {
  assertNoSelfPromotion(input.add_tags ?? [], input.operator_grant);
  return withTx(pool, async (client) => {
    const current = await client.query<WorkItem>(
      'SELECT * FROM work_items WHERE id = $1 FOR UPDATE',
      [input.id],
    );
    const existing = current.rows[0];
    if (!existing) {
      throw new GovernanceError(`Work item ${input.id} not found.`);
    }

    const addTags = input.add_tags ?? [];
    await assertTagsAllowed(client, addTags);
    const removeTags = new Set(input.remove_tags ?? []);
    const nextTags = Array.from(new Set([...existing.tags, ...addTags])).filter(
      (tag) => !removeTags.has(tag),
    );

    const sets: string[] = [];
    const params: unknown[] = [];
    const push = (column: string, value: unknown): void => {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    };
    if (input.status !== undefined) push('status', input.status);
    if (input.priority !== undefined) push('priority', input.priority);
    if (input.body !== undefined) push('body', input.body);
    if (input.operator_note !== undefined) push('operator_note', input.operator_note);
    if (input.work_type !== undefined) push('work_type', input.work_type);
    push('tags', nextTags);
    sets.push('updated_at = now()');
    params.push(input.id);

    const { rows } = await client.query<WorkItem>(
      `UPDATE work_items SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params,
    );
    await syncTagMap(client, input.id, nextTags, input.applied_by ?? 'mcp');
    return rows[0]!;
  });
}

export interface ClaimNextInput {
  runner_id: string;
  runner_kind?: string;
  lease_minutes?: number;
  session_ref?: string;
  repo_path?: string;
  branch_name?: string;
  worktree_path?: string;
}

export interface ClaimNextResult {
  claim: Claim;
  work_item: WorkItem;
}

/** Claim the highest-priority eligible work item, transaction-safe against races. */
export async function claimNext(
  pool: pg.Pool,
  input: ClaimNextInput,
): Promise<ClaimNextResult | null> {
  const lease = Math.min(Math.max(input.lease_minutes ?? 120, 15), 1440);
  return withTx(pool, async (client) => {
    await client.query(
      `UPDATE claims SET claim_status = 'expired', released_at = now()
       WHERE claim_status = 'active' AND lease_expires_at < now()`,
    );
    const candidate = await client.query<WorkItem>(
      `SELECT wi.* FROM work_items wi
       WHERE wi.status IN ('new', 'triaged')
         AND wi.tags @> ARRAY['autonomous_safe']::text[]
         AND NOT (wi.tags && $1::text[])
         AND NOT EXISTS (
           SELECT 1 FROM claims c WHERE c.work_item_id = wi.id AND c.claim_status = 'active'
         )
       ORDER BY wi.priority DESC, wi.id ASC
       FOR UPDATE OF wi SKIP LOCKED
       LIMIT 1`,
      [HUMAN_BLOCKER_TAGS],
    );
    const item = candidate.rows[0];
    if (!item) {
      return null;
    }
    const { rows } = await client.query<Claim>(
      `INSERT INTO claims
         (work_item_id, runner_id, runner_kind, session_ref, repo_path, branch_name, worktree_path,
          lease_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now() + ($8 || ' minutes')::interval)
       RETURNING *`,
      [
        item.id,
        input.runner_id,
        input.runner_kind ?? 'agent',
        input.session_ref ?? null,
        input.repo_path ?? null,
        input.branch_name ?? null,
        input.worktree_path ?? null,
        String(lease),
      ],
    );
    return { claim: rows[0]!, work_item: item };
  });
}

export async function claimHeartbeat(
  pool: pg.Pool,
  input: { claim_id: string; lease_minutes?: number },
): Promise<Claim> {
  const lease = Math.min(Math.max(input.lease_minutes ?? 120, 15), 1440);
  const { rows } = await pool.query<Claim>(
    `UPDATE claims
     SET heartbeat_at = now(), lease_expires_at = now() + ($2 || ' minutes')::interval
     WHERE id = $1 AND claim_status = 'active'
     RETURNING *`,
    [input.claim_id, String(lease)],
  );
  if (!rows[0]) {
    throw new GovernanceError(`No active claim ${input.claim_id} to heartbeat.`);
  }
  return rows[0];
}

export interface BlockWithChildInput {
  parent_id: number;
  child_title: string;
  child_body?: string;
  child_tags?: string[];
  blocker_reason?: string;
  claim_id?: string;
  applied_by?: string;
}

export interface BlockWithChildResult {
  parent: WorkItem;
  child: WorkItem;
}

/** Create a blocker child, block the parent (demoting autonomous_safe), and release the claim. */
export async function blockWithChild(
  pool: pg.Pool,
  input: BlockWithChildInput,
): Promise<BlockWithChildResult> {
  const childTags = input.child_tags ?? [];
  // A blocker child may carry human-blocker tags but never autonomous_safe.
  assertNoSelfPromotion(childTags, false);
  return withTx(pool, async (client) => {
    await assertTagsAllowed(client, childTags);
    const parentRes = await client.query<WorkItem>(
      'SELECT * FROM work_items WHERE id = $1 FOR UPDATE',
      [input.parent_id],
    );
    const parent = parentRes.rows[0];
    if (!parent) {
      throw new GovernanceError(`Parent work item ${input.parent_id} not found.`);
    }

    const childRes = await client.query<WorkItem>(
      `INSERT INTO work_items (title, body, status, tags, operator_note)
       VALUES ($1, $2, 'new', $3, $4)
       RETURNING *`,
      [input.child_title, input.child_body ?? '', childTags, input.blocker_reason ?? ''],
    );
    const child = childRes.rows[0]!;
    await syncTagMap(client, child.id, childTags, input.applied_by ?? 'mcp');

    const parentTags = parent.tags.filter((tag) => tag !== 'autonomous_safe');
    const updatedParent = await client.query<WorkItem>(
      `UPDATE work_items SET status = 'blocked', tags = $2, updated_at = now()
       WHERE id = $1 RETURNING *`,
      [input.parent_id, parentTags],
    );
    await syncTagMap(client, input.parent_id, parentTags, input.applied_by ?? 'mcp');

    await client.query(
      `INSERT INTO work_item_links (parent_work_item_id, child_work_item_id, link_kind, created_by)
       VALUES ($1, $2, 'blocked_by', $3)
       ON CONFLICT (parent_work_item_id, child_work_item_id, link_kind) DO NOTHING`,
      [input.parent_id, child.id, input.applied_by ?? 'mcp'],
    );

    if (input.claim_id) {
      await client.query(
        `UPDATE claims SET claim_status = 'blocked', released_at = now()
         WHERE id = $1 AND claim_status = 'active'`,
        [input.claim_id],
      );
    }

    return { parent: updatedParent.rows[0]!, child };
  });
}

export interface CloseEvidenceBucket {
  status: 'passed' | 'not_applicable';
  reason?: string;
  command?: string;
  result?: string;
  summary?: string;
  artifact?: string;
}

export type CloseEvidence = Record<string, CloseEvidenceBucket>;

/** Returns an error message if the evidence is incomplete, else null. */
export function validateCloseEvidence(evidence: CloseEvidence): string | null {
  for (const bucket of EVIDENCE_BUCKETS) {
    const entry = evidence[bucket];
    if (!entry) {
      return `Missing close evidence for "${bucket}".`;
    }
    if (entry.status !== 'passed' && entry.status !== 'not_applicable') {
      return `Evidence "${bucket}" must be "passed" or "not_applicable".`;
    }
    if (entry.status === 'not_applicable' && !entry.reason) {
      return `Evidence "${bucket}" is not_applicable but has no reason.`;
    }
    if (
      entry.status === 'passed' &&
      !entry.command &&
      !entry.result &&
      !entry.summary &&
      !entry.artifact
    ) {
      return `Evidence "${bucket}" is passed but provides no command, result, summary, or artifact.`;
    }
  }
  return null;
}

export interface CloseVerifiedInput {
  id: number;
  resolution_text: string;
  evidence: CloseEvidence;
  claim_id?: string;
}

export async function closeVerified(pool: pg.Pool, input: CloseVerifiedInput): Promise<WorkItem> {
  const error = validateCloseEvidence(input.evidence);
  if (error) {
    throw new GovernanceError(error);
  }
  return withTx(pool, async (client) => {
    const res = await client.query<WorkItem>(
      `UPDATE work_items
       SET status = 'done',
           updated_at = now(),
           metadata = metadata || jsonb_build_object('close_evidence', $2::jsonb, 'resolution_text', $3::text)
       WHERE id = $1
       RETURNING *`,
      [input.id, JSON.stringify(input.evidence), input.resolution_text],
    );
    const item = res.rows[0];
    if (!item) {
      throw new GovernanceError(`Work item ${input.id} not found.`);
    }
    if (input.claim_id) {
      await client.query(
        `UPDATE claims SET claim_status = 'completed', released_at = now(), evidence = $2::jsonb
         WHERE id = $1`,
        [input.claim_id, JSON.stringify(input.evidence)],
      );
    }
    return item;
  });
}

export interface RunPackCreateInput {
  run_pack_key: string;
  intent: string;
  work_item_ids: number[];
  issued_by?: string;
  launch_text?: string;
}

export async function runPackCreate(pool: pg.Pool, input: RunPackCreateInput): Promise<RunPack> {
  return withTx(pool, async (client) => {
    const { rows } = await client.query<RunPack>(
      `INSERT INTO run_packs (run_pack_key, intent, work_item_ids, issued_by, launch_text)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        input.run_pack_key,
        input.intent,
        input.work_item_ids,
        input.issued_by ?? '',
        input.launch_text ?? '',
      ],
    );
    const pack = rows[0]!;
    let position = 0;
    for (const workItemId of input.work_item_ids) {
      await client.query(
        `INSERT INTO run_pack_items (run_pack_id, work_item_id, position)
         VALUES ($1, $2, $3)
         ON CONFLICT (run_pack_id, work_item_id) DO NOTHING`,
        [pack.id, workItemId, position],
      );
      position += 1;
    }
    return pack;
  });
}

export interface RunPackRecordInput {
  run_pack_id: string;
  work_item_id: number;
  result: string;
  result_reason?: string;
  pr_number?: number;
  merge_commit?: string;
  child_work_item_ids?: number[];
  claim_id?: string;
}

export async function runPackRecord(
  pool: pg.Pool,
  input: RunPackRecordInput,
): Promise<RunPackItem> {
  const { rows } = await pool.query<RunPackItem>(
    `UPDATE run_pack_items
     SET result = $3,
         result_reason = $4,
         pr_number = $5,
         merge_commit = $6,
         child_work_item_ids = $7,
         claim_id = $8,
         updated_at = now()
     WHERE run_pack_id = $1 AND work_item_id = $2
     RETURNING *`,
    [
      input.run_pack_id,
      input.work_item_id,
      input.result,
      input.result_reason ?? null,
      input.pr_number ?? null,
      input.merge_commit ?? null,
      input.child_work_item_ids ?? [],
      input.claim_id ?? null,
    ],
  );
  if (!rows[0]) {
    throw new GovernanceError(
      `No run-pack item for pack ${input.run_pack_id} / work item ${input.work_item_id}.`,
    );
  }
  return rows[0];
}

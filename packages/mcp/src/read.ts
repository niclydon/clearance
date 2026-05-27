import type pg from 'pg';
import type { Claim, ProjectTrack, RunPack, WorkItem, WorkItemCandidate } from '@clearance/schema';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const HUMAN_BLOCKER_TAGS = [
  'requires_decision',
  'requires_clickops',
  'requires_investigation',
  'requires_secret',
  'blocked_on_dependency',
];

export interface ListResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

function clampLimit(limit?: number): number {
  if (!limit || limit < 1) {
    return DEFAULT_LIMIT;
  }
  return Math.min(limit, MAX_LIMIT);
}

function clampOffset(offset?: number): number {
  return offset && offset > 0 ? offset : 0;
}

export interface ListWorkItemsFilters {
  status?: string;
  tag?: string;
  work_type?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

export async function listWorkItems(
  pool: pg.Pool,
  filters: ListWorkItemsFilters = {},
): Promise<ListResult<WorkItem>> {
  const params: unknown[] = [];
  const where: string[] = [];
  if (filters.status) {
    params.push(filters.status);
    where.push(`status = $${params.length}`);
  }
  if (filters.tag) {
    params.push(filters.tag);
    where.push(`tags @> ARRAY[$${params.length}]::text[]`);
  }
  if (filters.work_type) {
    params.push(filters.work_type);
    where.push(`work_type = $${params.length}`);
  }
  if (filters.category) {
    params.push(filters.category);
    where.push(`category = $${params.length}`);
  }
  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const total = await count(
    pool,
    `SELECT count(*)::int AS count FROM work_items ${whereSql}`,
    params,
  );

  const limit = clampLimit(filters.limit);
  const offset = clampOffset(filters.offset);
  params.push(limit, offset);
  const { rows } = await pool.query<WorkItem>(
    `SELECT * FROM work_items ${whereSql}
     ORDER BY priority DESC, id DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return { items: rows, total, limit, offset };
}

export async function getWorkItem(pool: pg.Pool, id: number): Promise<WorkItem | null> {
  const { rows } = await pool.query<WorkItem>('SELECT * FROM work_items WHERE id = $1', [id]);
  return rows[0] ?? null;
}

interface SimpleListFilters {
  status?: string;
  limit?: number;
  offset?: number;
}

async function listByStatus<T extends pg.QueryResultRow>(
  pool: pg.Pool,
  table: string,
  orderBy: string,
  filters: SimpleListFilters,
): Promise<ListResult<T>> {
  const params: unknown[] = [];
  let whereSql = '';
  if (filters.status) {
    params.push(filters.status);
    whereSql = `WHERE status = $${params.length}`;
  }
  const total = await count(
    pool,
    `SELECT count(*)::int AS count FROM ${table} ${whereSql}`,
    params,
  );
  const limit = clampLimit(filters.limit);
  const offset = clampOffset(filters.offset);
  params.push(limit, offset);
  const { rows } = await pool.query<T>(
    `SELECT * FROM ${table} ${whereSql} ORDER BY ${orderBy} LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return { items: rows, total, limit, offset };
}

export function listWorkItemCandidates(
  pool: pg.Pool,
  filters: SimpleListFilters = {},
): Promise<ListResult<WorkItemCandidate>> {
  return listByStatus<WorkItemCandidate>(pool, 'work_item_candidates', 'captured_at DESC', filters);
}

export function listProjectTracks(
  pool: pg.Pool,
  filters: SimpleListFilters = {},
): Promise<ListResult<ProjectTrack>> {
  return listByStatus<ProjectTrack>(
    pool,
    'project_tracks',
    'priority ASC, updated_at DESC',
    filters,
  );
}

export function listClaims(
  pool: pg.Pool,
  filters: SimpleListFilters = {},
): Promise<ListResult<Claim>> {
  return listByStatus<Claim>(pool, 'claims', 'claimed_at DESC', filters);
}

export function listRunPacks(
  pool: pg.Pool,
  filters: SimpleListFilters = {},
): Promise<ListResult<RunPack>> {
  return listByStatus<RunPack>(pool, 'run_packs', 'created_at DESC', filters);
}

interface SampleItem {
  id: number;
  title: string;
  priority: number;
}

export interface Digest {
  ready: { count: number; sample: SampleItem[] };
  blocked: { count: number };
  active_claims: { count: number; stale: number };
  pending_candidates: { count: number };
  recent_completions: { id: number; title: string; updated_at: Date }[];
}

export async function digest(pool: pg.Pool): Promise<Digest> {
  const readyWhere = `
    wi.status IN ('new', 'triaged')
    AND wi.tags @> ARRAY['autonomous_safe']::text[]
    AND NOT (wi.tags && $1::text[])
    AND NOT EXISTS (
      SELECT 1 FROM claims c WHERE c.work_item_id = wi.id AND c.claim_status = 'active'
    )`;
  const readyCount = await count(
    pool,
    `SELECT count(*)::int AS count FROM work_items wi WHERE ${readyWhere}`,
    [HUMAN_BLOCKER_TAGS],
  );
  const { rows: readySample } = await pool.query<SampleItem>(
    `SELECT wi.id, wi.title, wi.priority FROM work_items wi
     WHERE ${readyWhere}
     ORDER BY wi.priority DESC, wi.id DESC LIMIT 10`,
    [HUMAN_BLOCKER_TAGS],
  );

  const blockedCount = await count(
    pool,
    `SELECT count(*)::int AS count FROM work_items WHERE status = 'blocked'`,
    [],
  );
  const activeClaims = await count(
    pool,
    `SELECT count(*)::int AS count FROM claims WHERE claim_status = 'active'`,
    [],
  );
  const staleClaims = await count(
    pool,
    `SELECT count(*)::int AS count FROM claims WHERE claim_status = 'active' AND lease_expires_at < now()`,
    [],
  );
  const pendingCandidates = await count(
    pool,
    `SELECT count(*)::int AS count FROM work_item_candidates WHERE status = 'pending'`,
    [],
  );
  const { rows: recent } = await pool.query<{ id: number; title: string; updated_at: Date }>(
    `SELECT id, title, updated_at FROM work_items WHERE status = 'done'
     ORDER BY updated_at DESC LIMIT 5`,
  );

  return {
    ready: { count: readyCount, sample: readySample },
    blocked: { count: blockedCount },
    active_claims: { count: activeClaims, stale: staleClaims },
    pending_candidates: { count: pendingCandidates },
    recent_completions: recent,
  };
}

async function count(pool: pg.Pool, sql: string, params: unknown[]): Promise<number> {
  const { rows } = await pool.query<{ count: number }>(sql, params);
  return rows[0]?.count ?? 0;
}

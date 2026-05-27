#!/usr/bin/env node
// Self-contained dogfood: drive a full Clearance work lifecycle through the
// published @clearance packages exactly as an external consumer would, against a
// throwaway demo database. Resets the database whose name must contain "demo".
//
//   createdb clearance_demo
//   DATABASE_URL=postgres://localhost/clearance_demo node examples/dogfood/run.mjs
//
// Requires the workspace packages to be built first (npm run build).
import { applyMigrations } from '@clearance/schema';
import {
  blockWithChild,
  claimNext,
  closeVerified,
  createCandidate,
  createWorkItem,
  digest,
  getPool,
  closePool,
  updateWorkItem,
} from '@clearance/mcp';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Set DATABASE_URL to a throwaway demo database (its name must contain "demo").');
  process.exit(1);
}

function step(label) {
  console.log(`\n=== ${label} ===`);
}

async function main() {
  const pool = getPool(url);
  const { rows } = await pool.query('SELECT current_database() AS db');
  if (!/demo/.test(rows[0].db)) {
    throw new Error(
      `Refusing to reset "${rows[0].db}": the dogfood database name must contain "demo".`,
    );
  }

  step('Fresh install: reset schema + migrate');
  await pool.query('DROP SCHEMA IF EXISTS public CASCADE');
  await pool.query('CREATE SCHEMA public');
  const migrated = await applyMigrations({ pool });
  console.log(`applied ${migrated.applied.length} migrations`);

  step('A manager files a candidate (candidate-first, no work item yet)');
  const candidate = await createCandidate(pool, {
    proposed_title: 'Add a nightly disk-usage report',
    proposed_body: 'Report per-host disk usage and flag any volume over 85%.',
    proposed_category: 'observability',
    proposed_priority: 60,
    filter_reason: 'Operator mentioned a near-full volume in chat.',
    source: 'demo-chat',
  });
  console.log(`candidate #${candidate.id} status=${candidate.status}`);

  step('A human reviews + promotes the candidate to a work item');
  const item = await createWorkItem(pool, {
    title: candidate.proposed_title,
    body: candidate.proposed_body,
    category: candidate.proposed_category,
    priority: candidate.proposed_priority,
    work_type: 'monitoring',
    source: 'promoted-from-candidate',
  });
  await updateWorkItem(pool, {
    id: candidate.created_work_item_id ?? item.id,
    status: 'triaged',
  });
  console.log(`work item #${item.id} created (status promoted to triaged)`);

  step('An agent CANNOT self-grant autonomous_safe (governance guardrail)');
  try {
    await updateWorkItem(pool, { id: item.id, add_tags: ['autonomous_safe'] });
    console.log('UNEXPECTED: self-promotion succeeded');
  } catch (error) {
    console.log(`rejected as expected: ${error.message.split('.')[0]}.`);
  }

  step('A human grants autonomous_safe (operator_grant)');
  const granted = await updateWorkItem(pool, {
    id: item.id,
    add_tags: ['autonomous_safe'],
    operator_grant: true,
  });
  console.log(`work item #${granted.id} tags=[${granted.tags.join(', ')}]`);

  step('A worker claims the next eligible item');
  const claimed = await claimNext(pool, { runner_id: 'demo-worker', runner_kind: 'agent' });
  console.log(
    `claimed work item #${claimed.work_item.id} via claim ${claimed.claim.id.slice(0, 8)}`,
  );

  step('The worker closes it with verified evidence');
  const closed = await closeVerified(pool, {
    id: claimed.work_item.id,
    resolution_text: 'Shipped the nightly disk-usage report.',
    claim_id: claimed.claim.id,
    evidence: {
      tests: { status: 'passed', result: 'unit tests green' },
      smoke: { status: 'passed', summary: 'ran the report once by hand' },
      deploy: { status: 'passed', command: 'systemctl restart disk-report.timer' },
      docs: { status: 'passed', summary: 'README updated' },
      migration: { status: 'not_applicable', reason: 'no schema change' },
      no_code: { status: 'not_applicable', reason: 'code changed' },
    },
  });
  console.log(`work item #${closed.id} status=${closed.status}`);

  step('A second item hits a blocker mid-work -> block_with_child');
  const second = await createWorkItem(pool, {
    title: 'Rotate the backup encryption key',
    body: 'Rotate and re-encrypt existing backups.',
    work_type: 'security',
    tags: ['autonomous_safe'],
    operator_grant: true,
  });
  const claimed2 = await claimNext(pool, { runner_id: 'demo-worker', runner_kind: 'agent' });
  const blocked = await blockWithChild(pool, {
    parent_id: claimed2.work_item.id,
    child_title: 'Provision the new KMS key',
    child_tags: ['requires_secret'],
    blocker_reason: 'Need the new KMS key id before re-encrypting.',
    claim_id: claimed2.claim.id,
  });
  console.log(
    `parent #${blocked.parent.id} status=${blocked.parent.status} tags=[${blocked.parent.tags.join(', ')}]; ` +
      `blocker child #${blocked.child.id} filed`,
  );

  step('The operator reads the digest');
  const snapshot = await digest(pool);
  console.log(JSON.stringify(snapshot, null, 2));

  await closePool();
  console.log(
    '\nDogfood complete: candidate -> promote -> grant -> claim -> close, and claim -> block, all via @clearance.',
  );
}

main().catch((error) => {
  console.error(`dogfood failed: ${error.message}`);
  process.exitCode = 1;
});

// TypeScript types for the Clearance PMO schema. Hand-maintained to match the
// migrations in ../migrations. Timestamps are `Date` (node-postgres parses
// timestamptz to Date); jsonb columns are typed loosely as the caller owns shape.

export type Json = Record<string, unknown>;

// --- Controlled vocabularies ---

export const RESERVED_GOVERNANCE_TAGS = [
  'autonomous_safe',
  'requires_decision',
  'requires_clickops',
  'requires_investigation',
  'requires_secret',
  'blocked_on_dependency',
  'observation_gate',
  'deferred',
] as const;
export type ReservedGovernanceTag = (typeof RESERVED_GOVERNANCE_TAGS)[number];
/** Any tag string; reserved tags are a known subset. Custom tags are allowed. */
export type GovernanceTag = ReservedGovernanceTag | (string & {});

export const WORK_TYPES = [
  'feature',
  'fix',
  'schema',
  'integration',
  'automation',
  'reliability',
  'monitoring',
  'security',
  'validation',
  'investigation',
  'reporting',
  'curation',
  'docs',
  'deploy',
] as const;
export type WorkType = (typeof WORK_TYPES)[number];

export type WorkItemStatus = 'new' | 'triaged' | 'blocked' | 'done' | 'ignored';
export type CandidateStatus = 'pending' | 'approved' | 'rejected' | 'edited';
export type ProjectCandidateStatus = 'pending' | 'approved' | 'rejected';
export type ClaimStatus =
  | 'active'
  | 'released'
  | 'completed'
  | 'blocked'
  | 'expired'
  | 'abandoned'
  | 'failed';
export type RunnerKind = 'manual' | 'agent' | 'worker' | 'automation' | 'other';
export type WorkItemLinkKind =
  | 'blocked_by'
  | 'followup'
  | 'related'
  | 'supersedes'
  | 'decision_for';
export type PreconditionKind = 'db_object' | 'migration' | 'file';
export type ProjectTrackStatus =
  | 'active'
  | 'blocked'
  | 'waiting_decision'
  | 'observation_gate'
  | 'deferred'
  | 'closed'
  | 'closed_operating_program';
export type TrackKind = 'major_project' | 'operating_program' | 'repo_project' | 'workstream';
export type ProjectTrackLinkKind =
  | 'work_item'
  | 'project_candidate'
  | 'repo'
  | 'doc'
  | 'chat_thread'
  | 'external'
  | 'note';
export type LinkRelationship =
  | 'anchor'
  | 'advances'
  | 'blocks'
  | 'owns'
  | 'evidence'
  | 'followup'
  | 'related'
  | 'supersedes'
  | 'child_of'
  | 'splits_into'
  | 'absorbs';
export type RunPackStatus = 'proposed' | 'approved' | 'launched' | 'completed' | 'cancelled';
export type RunPackItemResult =
  | 'pending'
  | 'shipped'
  | 'blocked'
  | 'skipped_not_eligible'
  | 'failed';
export type DecisionThreadStatus = 'open' | 'awaiting_decision' | 'decided' | 'expired';

// --- Table rows ---

export interface WorkItem {
  id: number;
  status: WorkItemStatus;
  priority: number;
  source: string;
  category: string;
  title: string;
  body: string;
  operator_note: string;
  work_type: WorkType | null;
  tags: GovernanceTag[];
  chat_channel_id: string | null;
  chat_message_id: string | null;
  chat_thread_id: string | null;
  chat_reply_to_id: string | null;
  metadata: Json;
  created_at: Date;
  updated_at: Date;
}

export interface WorkItemCandidate {
  id: number;
  status: CandidateStatus;
  filter_reason: string;
  proposed_title: string;
  proposed_body: string;
  proposed_category: string | null;
  proposed_priority: number;
  source: string;
  external_ref: string | null;
  source_content: string;
  chat_channel_id: string | null;
  chat_thread_id: string | null;
  metadata: Json;
  captured_at: Date;
  reviewed_at: Date | null;
  created_work_item_id: number | null;
}

export interface WorkItemTag {
  work_item_id: number;
  tag: GovernanceTag;
  applied_by: string;
  applied_at: Date;
  source: string;
  note: string;
}

export interface WorkItemSurface {
  work_item_id: number;
  surface: string;
  created_at: Date;
}

export interface WorkItemLink {
  id: string;
  parent_work_item_id: number;
  child_work_item_id: number;
  link_kind: WorkItemLinkKind;
  created_by: string;
  metadata: Json;
  created_at: Date;
}

export interface Precondition {
  id: string;
  work_item_id: number;
  kind: PreconditionKind;
  target: string;
  satisfied_at: Date | null;
  metadata: Json;
  created_at: Date;
}

export interface Claim {
  id: string;
  work_item_id: number;
  claim_status: ClaimStatus;
  runner_id: string;
  runner_kind: RunnerKind;
  session_ref: string | null;
  repo_path: string | null;
  branch_name: string | null;
  worktree_path: string | null;
  claimed_at: Date;
  heartbeat_at: Date;
  lease_expires_at: Date;
  released_at: Date | null;
  outcome: string | null;
  metadata: Json;
  evidence: Json;
}

export interface GovernanceTagRow {
  tag: string;
  description: string;
  is_reserved: boolean;
  created_at: Date;
}

export interface WorkTypeRow {
  work_type: string;
  description: string;
  created_at: Date;
}

export interface SurfaceRow {
  surface: string;
  description: string;
  created_at: Date;
}

export interface LinkRelationshipRow {
  relationship: string;
  description: string;
  created_at: Date;
}

export interface ProjectTrack {
  id: string;
  track_key: string;
  title: string;
  summary: string;
  status: ProjectTrackStatus;
  track_kind: TrackKind;
  priority: number;
  owner: string | null;
  current_state: string | null;
  next_action: string | null;
  stale_risk: string | null;
  confidence: number;
  source: string;
  display_seq: number | null;
  metadata: Json;
  created_at: Date;
  updated_at: Date;
}

export interface ProjectCandidate {
  id: string;
  candidate_key: string;
  status: ProjectCandidateStatus;
  title: string;
  summary: string;
  proposed_status: string | null;
  proposed_next_action: string | null;
  confidence: number;
  tags: string[];
  evidence: Json;
  metadata: Json;
  created_track_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProjectTrackLink {
  id: string;
  track_id: string | null;
  link_kind: ProjectTrackLinkKind;
  target_ref: string;
  relationship: LinkRelationship;
  target_work_item_id: number | null;
  target_project_candidate_id: string | null;
  source_work_item_id: number | null;
  title: string | null;
  summary: string | null;
  metadata: Json;
  created_at: Date;
}

export interface RunPack {
  id: string;
  run_pack_key: string;
  intent: string;
  launch_text: string;
  work_item_ids: number[];
  status: RunPackStatus;
  issued_by: string;
  approved_by: string | null;
  approval_text: string | null;
  approved_at: Date | null;
  runner_id: string | null;
  started_at: Date | null;
  finished_at: Date | null;
  summary: string;
  outcome: Json;
  metadata: Json;
  created_at: Date;
  updated_at: Date;
}

export interface RunPackItem {
  id: string;
  run_pack_id: string;
  work_item_id: number;
  position: number;
  result: RunPackItemResult;
  result_reason: string | null;
  pr_number: number | null;
  merge_commit: string | null;
  child_work_item_ids: number[];
  claim_id: string | null;
  evidence: Json;
  created_at: Date;
  updated_at: Date;
}

export interface DecisionThread {
  id: string;
  work_item_id: number;
  question_text: string;
  captured_replies: unknown[];
  decided_summary: string | null;
  rationale_text: string | null;
  answered_at: Date | null;
  answered_by: string | null;
  status: DecisionThreadStatus;
  chat_thread_ref: string | null;
  metadata: Json;
  created_at: Date;
  updated_at: Date;
}

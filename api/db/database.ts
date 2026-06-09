import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import type {
  User,
  Meeting,
  TranscriptSegment,
  ActionItem,
  VersionHistory,
  MaskingRule,
  MaskingMapEntry,
  ApiCallLog,
  ModelVersion,
  Milestone,
  Role,
  ActionItemStatus,
  Speaker,
  FieldConfidence,
  EvidenceSpan,
  DbUserRow,
  DbMeetingRow,
  DbSegmentRow,
  DbActionItemRow,
  DbVersionHistoryRow,
  DbMaskingRuleRow,
  DbModelVersionRow,
  DbMilestoneRow,
} from '#shared/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_PATH = process.env.DATABASE_PATH || './data/app.db';

function resolveDbPath(): string {
  const dbPath = DATABASE_PATH;
  if (path.isAbsolute(dbPath)) return dbPath;
  return path.resolve(path.join(__dirname, '../../..'), dbPath);
}

function ensureDbDir(): void {
  const resolved = resolveDbPath();
  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

ensureDbDir();

const db = new Database(resolveDbPath());
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function createTables(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','manager','reviewer','member')),
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      meeting_date TEXT NOT NULL,
      project_id TEXT NOT NULL,
      speakers_json TEXT NOT NULL DEFAULT '[]',
      topics_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'created' CHECK(status IN ('created','extracting','extracted','failed')),
      extraction_error TEXT,
      masking_applied INTEGER NOT NULL DEFAULT 0,
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_meetings_project ON meetings(project_id);
    CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);

    CREATE TABLE IF NOT EXISTS transcript_segments (
      id TEXT PRIMARY KEY,
      meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
      speaker_id TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      text TEXT NOT NULL,
      original_text TEXT,
      char_offset INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_segments_meeting ON transcript_segments(meeting_id);

    CREATE TABLE IF NOT EXISTS action_items (
      id TEXT PRIMARY KEY,
      meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      assignee TEXT,
      assignee_status TEXT NOT NULL DEFAULT 'pending_assignment',
      due_date TEXT,
      topic TEXT,
      milestone_id TEXT,
      priority TEXT NOT NULL DEFAULT 'P2' CHECK(priority IN ('P0','P1','P2','P3')),
      status TEXT NOT NULL DEFAULT 'draft',
      field_confidences_json TEXT NOT NULL DEFAULT '[]',
      evidence_json TEXT NOT NULL DEFAULT '[]',
      model_version TEXT NOT NULL,
      missing_fields_json TEXT NOT NULL DEFAULT '[]',
      low_confidence_fields_json TEXT NOT NULL DEFAULT '[]',
      remarks TEXT NOT NULL DEFAULT '',
      version INTEGER NOT NULL DEFAULT 1,
      updated_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_actionitems_meeting ON action_items(meeting_id);
    CREATE INDEX IF NOT EXISTS idx_actionitems_status ON action_items(status);
    CREATE INDEX IF NOT EXISTS idx_actionitems_assignee ON action_items(assignee);

    CREATE TABLE IF NOT EXISTS version_history (
      id TEXT PRIMARY KEY,
      action_item_id TEXT NOT NULL REFERENCES action_items(id) ON DELETE CASCADE,
      version INTEGER NOT NULL,
      snapshot_json TEXT NOT NULL,
      diff_json TEXT NOT NULL,
      operator_id TEXT NOT NULL REFERENCES users(id),
      operator_name TEXT NOT NULL,
      remark TEXT,
      timestamp TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_versionhistory_item ON version_history(action_item_id);

    CREATE TABLE IF NOT EXISTS masking_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('regex','keyword')),
      pattern TEXT NOT NULL,
      replacement TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS masking_map_entries (
      id TEXT PRIMARY KEY,
      meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
      masked_token TEXT NOT NULL,
      original_value TEXT NOT NULL,
      rule_id TEXT REFERENCES masking_rules(id),
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_masking_meeting ON masking_map_entries(meeting_id);

    CREATE TABLE IF NOT EXISTS api_call_logs (
      id TEXT PRIMARY KEY,
      endpoint TEXT NOT NULL,
      model TEXT NOT NULL,
      prompt_tokens INTEGER NOT NULL DEFAULT 0,
      completion_tokens INTEGER NOT NULL DEFAULT 0,
      total_tokens INTEGER NOT NULL DEFAULT 0,
      latency_ms INTEGER NOT NULL,
      status_code INTEGER NOT NULL,
      error_message TEXT,
      user_id TEXT REFERENCES users(id),
      timestamp TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_apilogs_time ON api_call_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_apilogs_model ON api_call_logs(model);

    CREATE TABLE IF NOT EXISTS model_versions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      openai_finetune_id TEXT,
      base_model TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      is_active INTEGER NOT NULL DEFAULT 0,
      metrics_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS evaluation_samples (
      id TEXT PRIMARY KEY,
      meeting_id TEXT REFERENCES meetings(id),
      action_item_id TEXT REFERENCES action_items(id),
      source TEXT NOT NULL CHECK(source IN ('ai','human')),
      payload_json TEXT NOT NULL,
      quality_score INTEGER,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      due_date TEXT,
      status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned','in_progress','completed','at_risk','cancelled')),
      action_item_ids_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    );
  `);
}

function seedData(): void {
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
  if (userCount.c > 0) return;

  const passwordHash = bcrypt.hashSync('123456', 10);
  const now = '2025-01-01T00:00:00Z';

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, name, role, password_hash, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('user_admin', 'admin@demo.com', '系统管理员-王五', 'admin', passwordHash, now);
  insertUser.run('user_manager', 'manager@demo.com', '项目经理-李明', 'manager', passwordHash, now);
  insertUser.run('user_reviewer', 'reviewer@demo.com', '审核员-陈静', 'reviewer', passwordHash, now);
  insertUser.run('user_member1', 'zhangsan@demo.com', '成员-张三', 'member', passwordHash, now);
  insertUser.run('user_member2', 'zhaoliu@demo.com', '成员-赵六', 'member', passwordHash, now);

  const insertMaskingRule = db.prepare(`
    INSERT INTO masking_rules (id, name, type, pattern, replacement, enabled)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertMaskingRule.run('rule_email', '邮箱地址', 'regex', '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', '{{EMAIL}}', 1);
  insertMaskingRule.run('rule_phone', '手机号码', 'regex', '1[3-9]\\d{9}', '{{PHONE}}', 1);
  insertMaskingRule.run('rule_idcard', '身份证号', 'regex', '\\d{17}[\\dXx]', '{{ID_CARD}}', 1);
  insertMaskingRule.run('rule_bank', '银行账号', 'regex', '\\d{16,19}', '{{BANK_ACCOUNT}}', 1);
  insertMaskingRule.run('rule_secret', '关键字-机密', 'keyword', '机密|敏感|绝密|薪资|工资', '{{CONFIDENTIAL}}', 1);

  const insertModelVersion = db.prepare(`
    INSERT INTO model_versions (id, name, openai_finetune_id, base_model, status, is_active, metrics_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertModelVersion.run(
    'mv_default',
    'gpt-4o-mini 默认版',
    null,
    'gpt-4o-mini',
    'ready',
    1,
    '{"precision":0.78,"recall":0.72,"f1":0.75}',
    now,
  );

  const insertMilestone = db.prepare(`
    INSERT INTO milestones (id, project_id, title, description, due_date, status, action_item_ids_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertMilestone.run(
    'ms_001',
    'proj_alpha',
    'Q2 产品迭代上线',
    '2025 年第二季度核心功能开发与上线里程碑，包含用户体系重构、AI 模型优化等核心任务',
    '2025-06-30',
    'in_progress',
    '[]',
    now,
  );
  insertMilestone.run(
    'ms_002',
    'proj_alpha',
    'Q3 质量提升',
    '2025 年第三季度质量专项里程碑，重点提升 AI 抽取准确率、系统稳定性与用户体验',
    '2025-09-30',
    'planned',
    '[]',
    now,
  );
}

createTables();
seedData();

type DbMaskingMapEntryRow = {
  id: string;
  meeting_id: string;
  masked_token: string;
  original_value: string;
  rule_id: string | null;
  created_at: string;
};

type DbApiCallLogRow = {
  id: string;
  endpoint: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  status_code: number;
  error_message?: string | null;
  user_id: string | null;
  timestamp: string;
};

function mapUser(row: DbUserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as Role,
  };
}

function mapMeeting(row: DbMeetingRow, segments: TranscriptSegment[] = []): Meeting {
  return {
    id: row.id,
    title: row.title,
    date: row.meeting_date,
    projectId: row.project_id,
    speakers: JSON.parse(row.speakers_json || '[]') as Speaker[],
    topics: JSON.parse(row.topics_json || '[]') as string[],
    transcript: segments,
    maskingApplied: Number(row.masking_applied) === 1,
    status: row.status as Meeting['status'],
    extractionError: row.extraction_error ?? undefined,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

function mapSegment(row: DbSegmentRow): TranscriptSegment {
  return {
    id: row.id,
    speakerId: row.speaker_id,
    startTime: row.start_time ?? undefined,
    endTime: row.end_time ?? undefined,
    text: row.text,
    originalText: row.original_text ?? undefined,
    charOffset: row.char_offset,
  };
}

function mapActionItem(row: DbActionItemRow): ActionItem {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    content: row.content,
    assignee: row.assignee,
    assigneeStatus: row.assignee_status as ActionItem['assigneeStatus'],
    dueDate: row.due_date,
    topic: row.topic,
    milestoneId: row.milestone_id,
    priority: row.priority as ActionItem['priority'],
    status: row.status as ActionItemStatus,
    fieldConfidences: JSON.parse(row.field_confidences_json || '[]') as FieldConfidence[],
    evidence: JSON.parse(row.evidence_json || '[]') as EvidenceSpan[],
    modelVersion: row.model_version,
    missingFields: JSON.parse(row.missing_fields_json || '[]') as string[],
    lowConfidenceFields: JSON.parse(row.low_confidence_fields_json || '[]') as string[],
    remarks: row.remarks,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

function mapVersionHistory(row: DbVersionHistoryRow): VersionHistory {
  return {
    id: row.id,
    actionItemId: row.action_item_id,
    version: row.version,
    snapshot: JSON.parse(row.snapshot_json || '{}') as Partial<ActionItem>,
    diff: JSON.parse(row.diff_json || '{}') as Record<string, { old: unknown; new: unknown }>,
    operatorId: row.operator_id,
    operatorName: row.operator_name,
    remark: row.remark ?? undefined,
    timestamp: row.timestamp,
  };
}

function mapMaskingRule(row: DbMaskingRuleRow): MaskingRule {
  return {
    id: row.id,
    name: row.name,
    type: row.type as MaskingRule['type'],
    pattern: row.pattern,
    replacement: row.replacement,
    enabled: Number(row.enabled) === 1,
  };
}

function mapMaskingMapEntry(row: DbMaskingMapEntryRow): MaskingMapEntry {
  return {
    id: row.id,
    meetingId: row.meeting_id,
    maskedToken: row.masked_token,
    originalValue: row.original_value,
    ruleId: row.rule_id ?? undefined,
    createdAt: row.created_at,
  };
}

function mapApiCallLog(row: DbApiCallLogRow): ApiCallLog {
  return {
    id: row.id,
    endpoint: row.endpoint,
    model: row.model,
    promptTokens: row.prompt_tokens,
    completionTokens: row.completion_tokens,
    totalTokens: row.total_tokens,
    latencyMs: row.latency_ms,
    statusCode: row.status_code,
    errorMessage: row.error_message ?? undefined,
    userId: row.user_id ?? '',
    timestamp: row.timestamp,
  };
}

function mapModelVersion(row: DbModelVersionRow): ModelVersion {
  return {
    id: row.id,
    name: row.name,
    openaiFinetuneId: row.openai_finetune_id ?? undefined,
    baseModel: row.base_model,
    status: row.status as ModelVersion['status'],
    isActive: Number(row.is_active) === 1,
    metrics: row.metrics_json ? (JSON.parse(row.metrics_json) as ModelVersion['metrics']) : undefined,
    createdAt: row.created_at,
  };
}

function mapMilestone(row: DbMilestoneRow): Milestone {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    status: row.status as Milestone['status'],
    actionItemIds: JSON.parse(row.action_item_ids_json || '[]') as string[],
    createdAt: row.created_at,
  };
}

export {
  db,
  uuidv4,
  mapUser,
  mapMeeting,
  mapSegment,
  mapActionItem,
  mapVersionHistory,
  mapMaskingRule,
  mapMaskingMapEntry,
  mapApiCallLog,
  mapModelVersion,
  mapMilestone,
  DbUserRow,
  DbMeetingRow,
  DbSegmentRow,
  DbActionItemRow,
  DbVersionHistoryRow,
  DbMaskingRuleRow,
  DbMaskingMapEntryRow,
  DbApiCallLogRow,
  DbModelVersionRow,
  DbMilestoneRow,
};

export default db;

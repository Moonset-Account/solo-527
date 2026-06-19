import dotenv from 'dotenv'
dotenv.config()

import { query, pool } from '../models/index.js'

async function migrate() {
  console.log('开始数据库迁移...')

  const dropTables = [
    'DROP TABLE IF EXISTS audit_logs CASCADE',
    'DROP TABLE IF EXISTS reminders CASCADE',
    'DROP TABLE IF EXISTS requirement_histories CASCADE',
    'DROP TABLE IF EXISTS attachments CASCADE',
    'DROP TABLE IF EXISTS notes CASCADE',
    'DROP TABLE IF EXISTS comments CASCADE',
    'DROP TABLE IF EXISTS requirements CASCADE',
    'DROP TABLE IF EXISTS default_assignees CASCADE',
    'DROP TABLE IF EXISTS reminder_thresholds CASCADE',
    'DROP TABLE IF EXISTS dictionaries CASCADE',
    'DROP TABLE IF EXISTS users CASCADE',
  ]

  for (const sql of dropTables) {
    await query(sql)
  }
  console.log('已删除旧表')

  await query(`
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'staff',
      department VARCHAR(100),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)
  console.log('已创建 users 表')

  await query(`
    CREATE TABLE dictionaries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type VARCHAR(100) NOT NULL,
      value VARCHAR(100) NOT NULL,
      label VARCHAR(255) NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)
  console.log('已创建 dictionaries 表')

  await query(`
    CREATE TABLE reminder_thresholds (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      department VARCHAR(100) NOT NULL,
      requirement_type VARCHAR(100) NOT NULL,
      hours_before_deadline INTEGER NOT NULL DEFAULT 24,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(department, requirement_type)
    )
  `)
  console.log('已创建 reminder_thresholds 表')

  await query(`
    CREATE TABLE default_assignees (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      department VARCHAR(100) NOT NULL,
      requirement_type VARCHAR(100) NOT NULL,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(department, requirement_type)
    )
  `)
  console.log('已创建 default_assignees 表')

  await query(`
    CREATE TABLE requirements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(500) NOT NULL,
      description TEXT,
      priority VARCHAR(50) NOT NULL DEFAULT 'medium',
      department VARCHAR(100) NOT NULL,
      type VARCHAR(100) NOT NULL,
      deadline TIMESTAMP WITH TIME ZONE,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      assignee_id UUID REFERENCES users(id),
      created_by UUID NOT NULL REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)
  console.log('已创建 requirements 表')

  await query(`
    CREATE TABLE comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'comment',
      author_id UUID NOT NULL REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)
  console.log('已创建 comments 表')

  await query(`
    CREATE TABLE notes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      author_id UUID NOT NULL REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)
  console.log('已创建 notes 表')

  await query(`
    CREATE TABLE attachments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
      filename VARCHAR(500) NOT NULL,
      original_name VARCHAR(500) NOT NULL,
      file_path VARCHAR(1000) NOT NULL,
      file_size BIGINT DEFAULT 0,
      mime_type VARCHAR(255),
      is_missing BOOLEAN DEFAULT false,
      uploaded_by UUID NOT NULL REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)
  console.log('已创建 attachments 表')

  await query(`
    CREATE TABLE requirement_histories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
      field_name VARCHAR(100) NOT NULL,
      old_value TEXT,
      new_value TEXT,
      changed_by UUID NOT NULL REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)
  console.log('已创建 requirement_histories 表')

  await query(`
    CREATE TABLE reminders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      requirement_id UUID REFERENCES requirements(id) ON DELETE SET NULL,
      reminder_type VARCHAR(50) NOT NULL DEFAULT 'overdue',
      message TEXT NOT NULL,
      remind_at TIMESTAMP WITH TIME ZONE NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      acknowledged_at TIMESTAMP WITH TIME ZONE,
      acknowledged_by UUID REFERENCES users(id),
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)
  console.log('已创建 reminders 表')

  await query(`
    CREATE TABLE audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(100) NOT NULL,
      entity_id UUID,
      user_id UUID REFERENCES users(id),
      details JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)
  console.log('已创建 audit_logs 表')

  await query('CREATE INDEX idx_requirements_status ON requirements(status)')
  await query('CREATE INDEX idx_requirements_department ON requirements(department)')
  await query('CREATE INDEX idx_requirements_assignee ON requirements(assignee_id)')
  await query('CREATE INDEX idx_requirements_created_by ON requirements(created_by)')
  await query('CREATE INDEX idx_requirements_deadline ON requirements(deadline)')
  await query('CREATE INDEX idx_comments_requirement ON comments(requirement_id)')
  await query('CREATE INDEX idx_notes_requirement ON notes(requirement_id)')
  await query('CREATE INDEX idx_attachments_requirement ON attachments(requirement_id)')
  await query('CREATE INDEX idx_histories_requirement ON requirement_histories(requirement_id)')
  await query('CREATE INDEX idx_reminders_requirement ON reminders(requirement_id)')
  await query('CREATE INDEX idx_reminders_status ON reminders(status)')
  await query('CREATE INDEX idx_audit_logs_action ON audit_logs(action)')
  await query('CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id)')
  await query('CREATE INDEX idx_audit_logs_user ON audit_logs(user_id)')
  await query('CREATE INDEX idx_audit_logs_created ON audit_logs(created_at)')
  await query('CREATE INDEX idx_dictionaries_type ON dictionaries(type)')
  console.log('已创建索引')

  console.log('数据库迁移完成！')
  await pool.end()
}

migrate().catch((err) => {
  console.error('迁移失败:', err)
  process.exit(1)
})

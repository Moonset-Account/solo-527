import dotenv from 'dotenv'
dotenv.config()

import bcrypt from 'bcryptjs'
import { query, pool } from '../models/index.js'

async function seed() {
  console.log('开始插入种子数据...')

  const adminPasswordHash = await bcrypt.hash('admin123', 10)
  const adminResult = await query(
    `INSERT INTO users (email, name, password_hash, role, department) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    ['admin@remindhub.com', '系统管理员', adminPasswordHash, 'admin', '管理部']
  )
  const adminId = adminResult.rows[0].id
  console.log('已创建管理员用户')

  const pmPasswordHash = await bcrypt.hash('pm123', 10)
  const pmResult = await query(
    `INSERT INTO users (email, name, password_hash, role, department) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    ['pm@remindhub.com', '项目经理张三', pmPasswordHash, 'project_pm', '产品部']
  )
  const pmId = pmResult.rows[0].id
  console.log('已创建项目经理用户')

  const staffPasswordHash = await bcrypt.hash('staff123', 10)
  const staff1Result = await query(
    `INSERT INTO users (email, name, password_hash, role, department) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    ['dev1@remindhub.com', '开发人员李四', staffPasswordHash, 'duty_staff', '技术部']
  )
  const staff1Id = staff1Result.rows[0].id

  const staff2Result = await query(
    `INSERT INTO users (email, name, password_hash, role, department) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    ['dev2@remindhub.com', '开发人员王五', staffPasswordHash, 'duty_staff', '技术部']
  )
  const staff2Id = staff2Result.rows[0].id

  const staff3Result = await query(
    `INSERT INTO users (email, name, password_hash, role, department) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    ['design1@remindhub.com', '设计师赵六', staffPasswordHash, 'duty_staff', '设计部']
  )
  const staff3Id = staff3Result.rows[0].id
  console.log('已创建普通用户')

  const dictionaries = [
    { type: 'department', value: 'tech', label: '技术部', sort_order: 1 },
    { type: 'department', value: 'product', label: '产品部', sort_order: 2 },
    { type: 'department', value: 'design', label: '设计部', sort_order: 3 },
    { type: 'department', value: 'marketing', label: '市场部', sort_order: 4 },
    { type: 'department', value: 'management', label: '管理部', sort_order: 5 },
    { type: 'requirement_type', value: 'feature', label: '新功能', sort_order: 1 },
    { type: 'requirement_type', value: 'bugfix', label: 'Bug修复', sort_order: 2 },
    { type: 'requirement_type', value: 'optimization', label: '优化', sort_order: 3 },
    { type: 'requirement_type', value: 'refactor', label: '重构', sort_order: 4 },
    { type: 'priority', value: 'urgent', label: '紧急', sort_order: 1 },
    { type: 'priority', value: 'high', label: '高', sort_order: 2 },
    { type: 'priority', value: 'medium', label: '中', sort_order: 3 },
    { type: 'priority', value: 'low', label: '低', sort_order: 4 },
    { type: 'status', value: 'pending', label: '待处理', sort_order: 1 },
    { type: 'status', value: 'in_progress', label: '进行中', sort_order: 2 },
    { type: 'status', value: 'completed', label: '已完成', sort_order: 3 },
    { type: 'status', value: 'cancelled', label: '已取消', sort_order: 4 },
    { type: 'reminder_type', value: 'overdue', label: '逾期提醒', sort_order: 1 },
    { type: 'reminder_type', value: 'deadline', label: '截止提醒', sort_order: 2 },
    { type: 'reminder_type', value: 'custom', label: '自定义提醒', sort_order: 3 },
  ]

  for (const dict of dictionaries) {
    await query(
      'INSERT INTO dictionaries (type, value, label, sort_order) VALUES ($1, $2, $3, $4)',
      [dict.type, dict.value, dict.label, dict.sort_order]
    )
  }
  console.log('已创建字典数据')

  const thresholds = [
    { department: 'tech', requirement_type: 'feature', hours: 48 },
    { department: 'tech', requirement_type: 'bugfix', hours: 24 },
    { department: 'tech', requirement_type: 'optimization', hours: 72 },
    { department: 'product', requirement_type: 'feature', hours: 48 },
    { department: 'design', requirement_type: 'feature', hours: 72 },
  ]

  for (const t of thresholds) {
    await query(
      'INSERT INTO reminder_thresholds (department, requirement_type, hours_before_deadline) VALUES ($1, $2, $3)',
      [t.department, t.requirement_type, t.hours]
    )
  }
  console.log('已创建提醒阈值')

  const defaultAssignees = [
    { department: 'tech', requirement_type: 'feature', user_id: staff1Id },
    { department: 'tech', requirement_type: 'bugfix', user_id: staff1Id },
    { department: 'tech', requirement_type: 'optimization', user_id: staff2Id },
    { department: 'design', requirement_type: 'feature', user_id: staff3Id },
  ]

  for (const da of defaultAssignees) {
    await query(
      'INSERT INTO default_assignees (department, requirement_type, user_id) VALUES ($1, $2, $3)',
      [da.department, da.requirement_type, da.user_id]
    )
  }
  console.log('已创建默认处理人')

  console.log('种子数据插入完成！')
  console.log('')
  console.log('默认用户账号:')
  console.log('  管理员: admin@remindhub.com / admin123')
  console.log('  项目经理: pm@remindhub.com / pm123')
  console.log('  开发人员: dev1@remindhub.com / staff123')
  console.log('  开发人员: dev2@remindhub.com / staff123')
  console.log('  设计师: design1@remindhub.com / staff123')

  await pool.end()
}

seed().catch((err) => {
  console.error('种子数据插入失败:', err)
  process.exit(1)
})

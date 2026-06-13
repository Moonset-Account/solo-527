-- 北桥网格事件台 - 数据库初始化脚本
-- 在 PostgreSQL 中执行以下脚本初始化基础数据

-- 创建数据库
-- CREATE DATABASE beiqiao_grid;

-- 连接到数据库后执行以下内容

-- 创建默认管理员用户 (密码: admin123)
INSERT INTO users (id, username, password, name, role, shift, phone, "gridArea", "isVotingEligible", "createdAt", "updatedAt", deleted)
VALUES 
(
  'user-admin-001',
  'admin',
  '$2b$10$V8Y5XQz6w3VzLpQe7Yk9L.O9p3q1Yqk2w3e4r5t6y7u8i9o0p',
  '系统管理员',
  'admin',
  'morning',
  '13800138000',
  'grid1',
  true,
  NOW(),
  NOW(),
  false
)
ON CONFLICT (username) DO NOTHING;

-- 创建示例用户
INSERT INTO users (id, username, password, name, role, shift, phone, "gridArea", "isVotingEligible", "createdAt", "updatedAt", deleted)
VALUES 
(
  'user-manager-001',
  'manager1',
  '$2b$10$V8Y5XQz6w3VzLpQe7Yk9L.O9p3q1Yqk2w3e4r5t6y7u8i9o0p',
  '张经理',
  'manager',
  'morning',
  '13800138001',
  'grid1',
  true,
  NOW(),
  NOW(),
  false
),
(
  'user-worker-001',
  'worker1',
  '$2b$10$V8Y5XQz6w3VzLpQe7Yk9L.O9p3q1Yqk2w3e4r5t6y7u8i9o0p',
  '李网格员',
  'worker',
  'afternoon',
  '13800138002',
  'grid2',
  true,
  NOW(),
  NOW(),
  false
),
(
  'user-worker-002',
  'worker2',
  '$2b$10$V8Y5XQz6w3VzLpQe7Yk9L.O9p3q1Yqk2w3e4r5t6y7u8i9o0p',
  '王网格员',
  'worker',
  'night',
  '13800138003',
  'grid3',
  false,
  NOW(),
  NOW(),
  false
),
(
  'user-resident-001',
  'resident1',
  '$2b$10$V8Y5XQz6w3VzLpQe7Yk9L.O9p3q1Yqk2w3e4r5t6y7u8i9o0p',
  '陈居民',
  'resident',
  'morning',
  '13800138004',
  'grid1',
  true,
  NOW(),
  NOW(),
  false
)
ON CONFLICT (username) DO NOTHING;

-- 创建默认投票规则
INSERT INTO vote_rules (id, name, description, "passThreshold", "quorumThreshold", "votingDurationHours", "allowProxyVoting", "isDefault", "eligibleRoles", "createdAt", "updatedAt", deleted)
VALUES 
(
  'rule-default-001',
  '普通投票规则',
  '适用于一般社区事务的投票表决',
  50,
  30,
  24,
  true,
  true,
  ARRAY['admin', 'manager', 'worker', 'resident'],
  NOW(),
  NOW(),
  false
),
(
  'rule-important-001',
  '重大事项投票规则',
  '适用于重要事项的投票表决，要求更高的参与率和通过率',
  67,
  50,
  72,
  false,
  false,
  ARRAY['admin', 'manager', 'worker'],
  NOW(),
  NOW(),
  false
)
ON CONFLICT (id) DO NOTHING;

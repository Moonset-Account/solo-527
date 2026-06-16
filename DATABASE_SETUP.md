# 数据库部署指南

本系统使用 **Supabase (PostgreSQL)** 作为唯一持久化数据源。所有业务数据（线索、阶段、标签、账号、附件、变更记录）均存储在 PostgreSQL 中，不再使用 Mock 数据或本地 fallback。

---

## 📋 目录结构

```
supabase/migrations/
├── 000_create_exec_sql.sql       # 执行 SQL 的辅助函数（必须先执行）
├── 001_init_schema.sql           # 9 张表结构 + 触发器 + 索引 + RLS 策略
└── 002_seed_data.sql             # 种子数据（用户、阶段、标签、示例线索等）

scripts/
├── init-db.ts                    # `npm run db:init` - 执行建表脚本
├── seed-db.ts                    # `npm run db:seed` - 执行种子数据脚本
├── check-db.ts                   # `npm run db:check` - 检查数据库配置
└── reset-db.ts                   # `npm run db:reset` - 重置数据库
```

---

## 🚀 快速开始（3 步）

### 步骤 1: 创建 Supabase 项目

1. 访问 https://supabase.com 注册/登录
2. 点击 **New Project** 创建新项目
3. 选择区域（建议选择靠近你的区域，如 `Southeast Asia (Singapore)`）
4. 设置数据库密码（请记住这个密码）
5. 等待项目初始化完成（约 2 分钟）

### 步骤 2: 配置环境变量

在 Supabase Dashboard 中:
- 进入 **Project Settings** → **API**
- 复制 **Project URL** 和 **anon public key**
- 复制 **service_role secret** (需要点击 reveal 显示)

编辑 `.env.local` 文件:

```env
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的-anon-key
SUPABASE_SERVICE_ROLE_KEY=你的-service-role-key
```

### 步骤 3: 初始化数据库

**方式 A: 通过 Supabase SQL Editor（推荐）**

1. 在 Supabase Dashboard 中进入 **SQL Editor**
2. 依次执行以下文件的内容（按顺序）：

   ```
   supabase/migrations/000_create_exec_sql.sql
   supabase/migrations/001_init_schema.sql
   supabase/migrations/002_seed_data.sql
   ```

3. 每个文件执行完成后点击 **Run** 按钮

**方式 B: 通过命令行脚本**

1. 首先在 Supabase SQL Editor 中执行 `000_create_exec_sql.sql` 创建 exec_sql 函数
2. 然后在项目根目录运行：

   ```bash
   npm run db:init   # 创建表结构
   npm run db:seed   # 插入种子数据
   ```

### 步骤 4: 验证配置

```bash
npm run db:check
```

如果一切正常，你会看到：
```
✅ 9/9 张表已就绪
🎉 数据库配置完整!
```

---

## 📊 数据表说明

### 核心业务表

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `users` | 用户账号 | `id`, `email`, `name`, `role`(super_admin/sales_manager/sales_consultant/analyst) |
| `lead_stages` | 跟进阶段 | `id`, `name`, `color`, `order` |
| `lead_tags` | 客户标签 | `id`, `name`, `color`, `category` |
| `leads` | 线索主表 | `id`, `customer_name`, `phone`, `stage_id`, `assignee_id`, `is_in_pool` |
| `follow_up_records` | 跟进记录 | `id`, `lead_id`, `method`, `content`, `created_by` |
| `survey_records` | 量房记录 | `id`, `lead_id`, `surveyor_id`, `photos`, `layout_notes` |
| `contract_attachments` | 合同附件 | `id`, `lead_id`, `file_name`, `file_url`, `uploaded_by` |
| `change_logs` | 变更记录 | `id`, `lead_id`, `field`, `old_value`, `new_value`, `changed_by` |
| `revisit_records` | 回访记录 | `id`, `lead_id`, `revisit_count`, `reasons`, `handler_id` |

### 自动机制

- **updated_at 自动更新**: 通过触发器 `set_updated_at` 实现，更新数据时自动刷新时间戳
- **索引优化**: 所有常用查询字段都已建立索引（stage_id, assignee_id, phone, created_at 等）
- **RLS 行级安全**: 所有表已启用 RLS，anon 和 authenticated 角色可读写

---

## 👤 默认账号

种子数据包含以下测试账号（需要在 Supabase Auth 中单独配置密码）：

| 邮箱 | 角色 | 名称 |
|------|------|------|
| `admin@example.com` | super_admin | 系统管理员 |
| `manager@example.com` | sales_manager | 张经理 |
| `sales1@example.com` | sales_consultant | 李销售 |
| `sales2@example.com` | sales_consultant | 王顾问 |
| `analyst@example.com` | analyst | 赵分析 |

**设置密码步骤**：
1. 在 Supabase Dashboard 进入 **Authentication** → **Users**
2. 点击 **Add user** → **Create new user**
3. 输入邮箱和密码
4. 确保 **Auto confirm user** 已勾选
5. 点击 **Create user**

---

## 🔧 数据库脚本命令

```bash
# 检查数据库配置和表状态
npm run db:check

# 初始化表结构（需先创建 exec_sql 函数）
npm run db:init

# 插入种子数据
npm run db:seed

# 重置数据库（删除所有表！谨慎使用）
npm run db:reset
```

---

## 🔄 数据流架构

```
用户操作 → UI 组件 → Zustand Store → API 层 → Supabase PostgreSQL
                                 ↓
                        返回数据库保存的数据
                                 ↓
                        更新 Store 状态 → 刷新 UI
```

**关键特性**：
1. **无 Mock 回退**: 所有操作必须成功写入数据库，否则抛出错误
2. **ChangeLog 自动记录**: 所有字段修改（stage_id, assignee_id 除外）自动生成变更记录
3. **API 返回值优先**: Store 状态完全使用 API 返回的数据库数据，不做本地构造
4. **错误透明**: 数据库错误直接向上抛出，由 UI 层展示给用户

---

## ❓ 常见问题

### Q1: 执行脚本时提示 `exec_sql 函数不存在`

**A**: 首先在 Supabase SQL Editor 中执行 `supabase/migrations/000_create_exec_sql.sql` 创建该函数。

### Q2: 提示 `relation "users" does not exist`

**A**: 表未创建，请先运行 `npm run db:init` 或手动执行 `001_init_schema.sql`。

### Q3: 提示 `new row violates row-level security policy`

**A**: RLS 策略配置问题，请检查 `001_init_schema.sql` 末尾的 RLS 策略是否正确执行。

### Q4: `npm run db:check` 显示部分表不存在

**A**: 可能是建表脚本执行不完整，重新执行 `001_init_schema.sql`。

### Q5: 如何添加新字段或新表？

**A**: 在 `supabase/migrations/` 目录创建新的 SQL 文件（如 `003_add_new_field.sql`），在 Supabase SQL Editor 中执行即可。

---

## ⚠️ 注意事项

1. **SUPABASE_SERVICE_ROLE_KEY** 仅用于服务器端脚本，绝不能暴露给前端或提交到代码仓库
2. 所有写操作（创建/更新/删除）都会自动记录 `created_by` / `updated_by` / `changed_by`
3. 数据库删除操作使用 **ON DELETE CASCADE**，删除 lead 会级联删除所有关联的 followup、survey、attachment、change_log
4. 生产环境建议创建数据库备份策略

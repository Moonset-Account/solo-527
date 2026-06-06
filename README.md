# 艺术馆展品借展管理系统

基于 Next.js + Supabase 构建的专业艺术馆展品借展管理系统，围绕真实业务流程设计，而非通用后台管理系统。

## 📋 目录

- [系统概述](#系统概述)
- [技术栈](#技术栈)
- [核心功能](#核心功能)
- [业务流程](#业务流程)
- [数据模型](#数据模型)
- [访问控制](#访问控制)
- [异步提醒](#异步提醒)
- [导入导出队列](#导入导出队列)
- [错误日志](#错误日志)
- [快速开始](#快速开始)
- [测试账号](#测试账号)
- [项目结构](#项目结构)

---

## 系统概述

本系统专为艺术馆展览统筹设计，实现展品借展全流程数字化管理。系统围绕**六大台账**（展品、借展合同、保险单、运输箱、布展位置、状况报告）建立完整的数据管理，处理链路从登记开始，经过资格/库存/时段三重校验，再到人工确认、执行记录和月度对账。

### 设计原则

- **真实业务导向**：严格按照艺术馆实际借展流程设计，而非通用 CRUD 后台
- **流程闭环**：从申请到归还的全流程可追溯
- **权限细分**：7种角色对应不同岗位的真实职责
- **关键节点控制**：状况报告未确认不能签收，运输交接必须双方电子签名

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 15+ | React 框架，App Router |
| TypeScript | 5+ | 类型安全 |
| Supabase | - | 后端服务（数据库、认证、存储） |
| Tailwind CSS | 4+ | 样式框架 |
| Lucide React | - | 图标库 |
| date-fns | - | 日期处理 |
| zod | - | 表单验证 |
| exceljs | - | Excel 导入导出 |

---

## 核心功能

### 六大台账管理

1. **展品台账** - 完整的展品信息管理，含入藏编号、艺术家、材质、估价、状态等
2. **借展合同** - 合同信息、借展机构、费用、期限、条款等
3. **保险单** - 保单信息、保额、保险公司、核验状态
4. **运输箱** - 运输专用箱管理，恒温、震动传感等特性
5. **布展位置** - 展厅、库房等位置管理，容量控制
6. **状况报告** - 展品状况记录，含图片和双方签名

### 五大业务节点

1. ✅ **借展申请** - 三重校验（资格/库存/时段）
2. ✅ **保险核验** - 保单有效性核验
3. ✅ **运输交接** - 双方电子签名确认
4. ✅ **布展确认** - 现场布展完成确认
5. ✅ **撤展归还** - 展品归还库房确认

### 特殊业务规则

> **🔴 状况报告未确认前不能签收**
>
> 运输交接的接收方签名操作，必须在对应的状况报告状态为 `confirmed` 时才能进行。这是为了确保展品在运输前后的状况得到双方确认，避免纠纷。

> **🔴 运输交接需要双方电子签名**
>
> 运输交接单必须由发送方和接收方分别完成电子签名，状态才会更新为已签收。系统使用 Canvas 实现手写签名功能。

---

## 业务流程

### 完整借展流程

```
┌─────────────┐    ┌─────────────────────┐    ┌──────────────────┐
│  借展登记   │───▶│  三重校验           │───▶│  人工确认        │
│  (创建申请) │    │  • 机构资格校验     │    │  (策展人/管理员) │
└─────────────┘    │  • 库存状态校验     │    └────────┬─────────┘
                   │  • 时段冲突校验     │             │
                   └─────────────────────┘             ▼
                                                         
┌─────────────┐    ┌─────────────────────┐    ┌──────────────────┐
│  撤展归还   │◀───│  布展确认           │◀───│  运输交接        │
│  (回库)     │    │  (现场确认)         │    │  (双方电子签名)  │
└──────┬──────┘    └─────────────────────┘    └────────┬─────────┘
       │                                               │
       │    ┌─────────────────────┐    ┌──────────────▼────────┐
       └───▶│  执行记录归档        │    │  状况报告确认         │
            │  (全流程可追溯)      │    │  (必须先确认)        │
            └─────────────────────┘    └───────────────────────┘
                          │
                          ▼
            ┌─────────────────────┐
            │  月度对账            │
            │  (费用/保险/运输)    │
            └─────────────────────┘
```

### 状态流转说明

借展申请状态（LoanStatus）：
- `draft` - 草稿
- `pending_review` - 待审核（校验中）
- `qualified` - 资格校验通过
- `inventory_verified` - 库存核验通过
- `schedule_confirmed` - 时段确认通过
- `awaiting_confirmation` - 待人工确认
- `confirmed` - 已确认
- `in_progress` - 进行中（布展完成后）
- `completed` - 已完成（撤展归还后）
- `cancelled` - 已取消
- `rejected` - 已拒绝

---

## 数据模型

### 核心数据表

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `profiles` | 用户资料 | id, username, full_name, role, department |
| `exhibits` | 展品台账 | accession_number, title, artist, medium, status, estimated_value |
| `exhibition_locations` | 布展位置 | code, name, type, floor, max_exhibits |
| `borrowing_institutions` | 借展机构 | name, type, contact_*, is_qualified |
| `loan_contracts` | 借展合同 | contract_number, borrowing_institution_id, start_date, end_date, fee_amount |
| `loan_applications` | 借展申请 | contract_id, exhibit_id, requested_*_date, *_check_passed, status |
| `insurance_policies` | 保险单 | policy_number, insurance_company, coverage_amount, status |
| `shipping_crates` | 运输箱 | crate_number, dimensions, climate_control, shock_sensors |
| `condition_reports` | 状况报告 | exhibit_id, overall_condition, *_signature, status |
| `transport_handovers` | 运输交接 | handover_number, sender_/receiver_signature, *_signed_at |
| `installation_records` | 布展记录 | location_id, planned_/actual_*, is_completed |
| `deinstallation_records` | 撤展记录 | planned_/actual_*, returned_to_storage |
| `execution_records` | 执行记录 | application_id, action, performed_by, metadata |
| `monthly_reconciliations` | 月度对账 | reconciliation_month, total_fees, status |
| `reconciliation_items` | 对表明细 | reconciliation_id, item_type, amount |
| `notifications` | 通知 | user_id, type, title, content, is_read |
| `import_export_jobs` | 导入导出队列 | job_type, entity_type, status, file_url |
| `error_logs` | 错误日志 | error_code, error_message, stack_trace, path |
| `audit_logs` | 审计日志 | table_name, record_id, action, old_data, new_data |

### 关键校验函数（PL/pgSQL）

```sql
-- 检查展品时段是否可用
check_exhibit_availability(p_exhibit_id, p_start_date, p_end_date)

-- 检查机构资格
check_institution_qualification(p_institution_id)

-- 检查状况报告是否已确认
check_condition_report_confirmed(p_application_id)

-- 检查运输交接是否双方签名
check_transport_both_signed(p_handover_id)
```

### 枚举类型

- `user_role`: admin, curator, registrar, conservator, logistics, finance, viewer
- `exhibit_status`: in_collection, on_loan, in_transit, in_installation, in_deinstallation, under_conservation, retired
- `loan_status`: 见上文状态流转
- `insurance_status`: draft, submitted, verified, expired, cancelled
- `condition_report_status`: draft, pending_confirmation, confirmed, disputed
- `transport_status`: preparing, in_transit, delivered, received, returned

---

## 访问控制

### 基于角色的访问控制（RBAC）

系统定义 7 种角色，对应艺术馆真实岗位：

| 角色 | 职责 | 主要权限 |
|------|------|----------|
| **admin** | 系统管理员 | 所有权限（all） |
| **curator** | 策展人 | 展品管理、合同管理、申请管理、布撤展管理 |
| **registrar** | 登记员 | 展品管理、合同管理、申请管理、保险管理、运输管理、状况报告管理、机构管理、导入导出 |
| **conservator** | 文物保护员 | 展品查看、状况报告管理 |
| **logistics** | 物流专员 | 运输管理、运输箱管理、布撤展管理 |
| **finance** | 财务人员 | 合同查看、保险查看、月度对账管理 |
| **viewer** | 查看者 | 基础数据查看权限 |

### 行级安全策略（RLS）

所有数据表均启用 **Row Level Security**，策略示例：

```sql
-- 示例：展品表策略
CREATE POLICY "认证用户可读展品" ON exhibits 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "管理员和策展人和登记员可管理展品" ON exhibits 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'curator', 'registrar', 'conservator')
  )
);
```

所有策略定义见 `supabase/schema.sql`。

### 前端权限校验

```typescript
// 使用 usePermissions hook
const { can, role } = usePermissions();

if (can('exhibits:write')) {
  // 显示编辑按钮
}
```

---

## 异步提醒

### 通知机制

系统内置通知中心，支持以下类型的通知：

| 通知类型 | 触发场景 |
|----------|----------|
| `system` | 系统通知 |
| `loan_status` | 借展申请状态变更 |
| `condition_report` | 状况报告待确认/有争议 |
| `transport` | 运输状态更新、待签收 |
| `insurance` | 保险到期、待核验 |
| `reconciliation` | 月度对账生成、待确认 |

### 通知创建

```typescript
// 调用工具函数创建通知
await createNotification(
  userId,
  'loan_status',
  '借展申请待审核',
  '有新的借展申请需要您的审核',
  applicationId,
  'loan_application'
);
```

### 实时提醒（可选扩展）

可通过 Supabase Realtime 实现实时通知推送：

```javascript
// 监听通知变化
const channel = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // 显示浏览器通知
    showNotification(payload.new.title, payload.new.content);
  })
  .subscribe();
```

---

## 导入导出队列

### 设计原理

大批量数据的导入导出操作采用**异步队列**处理，避免阻塞用户界面：

1. 用户提交导入/导出任务
2. 任务进入队列（状态：pending）
3. 后台 Worker 处理任务（状态：processing）
4. 处理完成，更新状态（状态：completed/failed）
5. 用户可下载结果文件

### 数据结构

```typescript
interface ImportExportJob {
  id: string;
  job_type: 'import' | 'export';
  entity_type: string;       // 'exhibits' | 'contracts' | ...
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_url?: string;
  file_name?: string;
  total_records: number;
  processed_records: number;
  failed_records: number;
  error_message?: string;
  created_by?: string;
  started_at?: string;
  completed_at?: string;
}
```

### 支持导出的实体

- 展品数据（exhibits）
- 借展合同（contracts）
- 借展申请（applications）
- 保险单（insurance）
- 运输记录（transport）

### 使用说明

在 **系统设置 → 导入导出队列** 页面：
1. 点击"导出"按钮创建导出任务
2. 查看任务列表，等待处理完成
3. 处理完成后下载结果文件

---

## 错误日志

### 日志记录范围

系统自动记录以下类型的错误：

- API 请求错误
- 数据库操作错误
- 用户操作异常
- 业务规则校验失败

### 数据结构

```typescript
interface ErrorLog {
  id: string;
  error_code?: string;
  error_message: string;
  stack_trace?: string;
  user_id?: string;
  path?: string;
  metadata?: Json;
  created_at: string;
}
```

### 错误日志工具

```typescript
// 全局错误记录
import { logError } from '@/lib/utils';

try {
  // 业务逻辑
} catch (error) {
  await logError(error as Error, '/api/applications/create', {
    applicationId: appId,
    userId: userId,
  });
}
```

### 日志查看

在 **系统设置 → 错误日志** 页面，管理员可以：
- 查看所有错误记录
- 按时间筛选
- 查看错误详情和堆栈信息
- 分析系统稳定性

---

## 快速开始

### 1. 环境准备

- Node.js 18+
- npm 或 yarn
- Supabase 账号（或本地 Supabase）

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.local` 并填入你的 Supabase 配置：

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 4. 初始化数据库

1. 在 Supabase Dashboard 创建新项目
2. 打开 SQL Editor，执行 `supabase/schema.sql` 中的所有 SQL
3. 在 Authentication 中创建测试用户（见下方测试账号）

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 即可使用系统。

---

## 测试账号

> ⚠️ **生产环境请务必修改密码！**

在 Supabase Authentication 中创建以下用户，并在 `profiles` 表中设置对应角色：

| 角色 | 邮箱 | 密码 | 说明 |
|------|------|------|------|
| **系统管理员** | admin@museum.com | admin123 | 拥有所有权限 |
| **策展人** | curator@museum.com | curator123 | 展览策划、展品管理 |
| **登记员** | registrar@museum.com | registrar123 | 登记建档、流程跟踪 |
| **文物保护员** | conservator@museum.com | conservator123 | 状况检查、修复记录 |
| **物流专员** | logistics@museum.com | logistics123 | 运输安排、布撤展 |
| **财务人员** | finance@museum.com | finance123 | 费用核算、月度对账 |
| **普通查看者** | viewer@museum.com | viewer123 | 只读权限 |

### 用户创建步骤

1. 进入 Supabase Dashboard → Authentication → Users
2. 点击 "Add user" → "Create new user"
3. 输入邮箱和密码
4. 创建后，系统触发器会自动在 `profiles` 表中创建记录
5. 在 SQL Editor 中更新用户角色：
   ```sql
   UPDATE profiles 
   SET role = 'admin'::user_role 
   WHERE username = 'admin@museum.com';
   ```

---

## 项目结构

```
question-083/
├── src/
│   ├── app/
│   │   ├── login/                  # 登录页面
│   │   ├── dashboard/              # 仪表盘
│   │   ├── exhibits/               # 展品台账
│   │   ├── contracts/              # 借展合同
│   │   ├── applications/           # 借展申请（核心流程）
│   │   ├── insurance/              # 保险单管理
│   │   ├── transport/              # 运输交接（电子签名）
│   │   ├── crates/                 # 运输箱管理
│   │   ├── locations/              # 布展位置
│   │   ├── condition-reports/      # 状况报告
│   │   ├── installations/          # 布展确认
│   │   ├── deinstallations/        # 撤展归还
│   │   ├── reconciliation/         # 月度对账
│   │   ├── notifications/          # 通知中心
│   │   └── settings/               # 系统设置（含导入导出、错误日志）
│   ├── components/
│   │   ├── layout/                 # 布局组件
│   │   │   ├── AppLayout.tsx       # 主布局
│   │   │   └── Sidebar.tsx         # 侧边栏导航
│   │   └── ui/                     # UI 组件库
│   │       ├── Button.tsx
│   │       ├── Badge.tsx
│   │       ├── DataTable.tsx
│   │       └── PageHeader.tsx
│   ├── hooks/
│   │   └── useAuth.ts              # 认证和权限 Hook
│   ├── lib/
│   │   ├── supabase/               # Supabase 客户端
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   └── utils.ts                # 工具函数
│   ├── types/
│   │   └── database.ts             # 数据库类型定义
│   └── middleware.ts               # Next.js 中间件
├── supabase/
│   └── schema.sql                  # 完整数据库 Schema
├── .env.local                      # 环境变量
└── README.md                       # 本文件
```

---

## 业务亮点总结

### ✅ 真实业务流程，而非通用后台

系统不追求功能大而全，而是深度贴合艺术馆借展的真实流程：

- 三重校验机制（资格/库存/时段）避免人工疏漏
- 状况报告 → 运输签收的强依赖关系确保业务严谨
- 双方电子签名的运输交接具有法律效力
- 执行记录全程留痕，支持审计追溯

### ✅ 严谨的权限体系

7 种角色严格对应艺术馆岗位分工，数据操作可审计。

### ✅ 完整的运维支撑

- 异步导入导出队列，支持大数据量处理
- 结构化错误日志，便于排查问题
- 审计日志记录所有数据变更

---

**如有问题，请参考代码中的注释或联系开发团队。**

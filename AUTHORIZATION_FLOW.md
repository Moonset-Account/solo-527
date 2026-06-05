# 婚礼策划协作系统 - 权限与状态流转验证说明

## 一、角色权限矩阵

### 1. 四种角色定义

| 角色 | 说明 |
|------|------|
| ADMIN | 系统管理员，拥有全部权限 |
| PLANNER | 婚礼策划师，负责项目整体管理 |
| SUPPLIER | 供应商（花艺师、摄影师等），仅能处理分配的任务 |
| COUPLE | 新人，仅能查看项目、确认内容、发表评论 |

### 2. 详细权限对照表

| 权限项 | ADMIN | PLANNER | SUPPLIER | COUPLE |
|--------|-------|---------|----------|--------|
| 查看项目 | ✅ | ✅ | ✅ | ✅ |
| 创建/编辑项目 | ✅ | ✅ | ❌ | ❌ |
| 删除项目 | ✅ | ❌ | ❌ | ❌ |
| 查看任务 | ✅ | ✅ | ✅ | ✅ |
| 创建/编辑任务 | ✅ | ✅ | ❌ | ❌ |
| 更新任务状态 | ✅ | ✅ | ✅（有限制） | ✅（仅审核中） |
| 查看预算 | ✅ | ✅ | ❌ | ✅ |
| 查看内部预算明细 | ✅ | ✅ | ❌ | **❌（关键限制）** |
| 编辑预算 | ✅ | ✅ | ❌ | ❌ |
| 查看供应商 | ✅ | ✅ | ✅ | ❌ |
| 管理供应商 | ✅ | ✅ | ❌ | ❌ |
| 查看文件 | ✅ | ✅ | ✅ | ✅ |
| 上传文件 | ✅ | ✅ | ✅ | ❌ |
| 审批文件 | ✅ | ✅ | ❌ | ❌ |
| 查看确认单 | ✅ | ✅ | ❌ | ✅ |
| 确认/拒绝确认单 | ✅ | ❌ | ❌ | ✅ |
| 查看/发表评论 | ✅ | ✅ | ✅ | ✅ |
| 管理用户 | ✅ | ❌ | ❌ | ❌ |

---

## 二、预算权限验证（核心）

### 1. `isInternal` 字段说明

预算项中有一个 `isInternal` 布尔字段，用于标记**内部费用**（如服务费、佣金等），这些费用**不向新人展示**。

### 2. 过滤逻辑

在 [permissions.ts](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-039/src/lib/permissions.ts#L107-L115) 中：

```typescript
export function filterBudgetItemsByRole<T extends { isInternal: boolean }>(
  items: T[],
  role: Role
): T[] {
  if (role === 'ADMIN' || role === 'PLANNER') {
    return items;  // 内部人员看全部
  }
  return items.filter(item => !item.isInternal);  // 新人/供应商只看非内部
}
```

### 3. 验证场景

**场景：新人查看预算**
- 预算项A：场地租赁 ¥35,000（isInternal=false）→ **可见**
- 预算项B：场地内部服务费 ¥5,000（isInternal=true）→ **不可见**
- 预算项C：花艺布置 ¥25,000（isInternal=false）→ **可见**

在项目详情页 [projectId].tsx 中，预算明细表格会自动对新人隐藏内部项，并显示提示：
> 💡 提示：部分内部费用项已对您隐藏，仅显示对外报价部分。

---

## 三、任务状态流转验证

### 1. 完整状态定义

```
TODO（待办） → IN_PROGRESS（进行中） → REVIEW（待审核） → APPROVED（已确认） → COMPLETED（已完成）
                                                          ↘
                                                            CANCELLED（已取消）
```

### 2. 角色状态更新限制

| 角色 | 可更新到的状态 | 说明 |
|------|---------------|------|
| **SUPPLIER** | TODO, IN_PROGRESS, REVIEW | 供应商只能把任务推进到待审核，不能直接完成 |
| **COUPLE** | 仅 REVIEW → APPROVED | 新人只能确认审核中的任务 |
| **PLANNER/ADMIN** | 全部状态 | 策划师和管理员可任意调整 |

### 3. API 层校验

在 [tasks/[taskId].ts](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-039/src/pages/api/tasks/[taskId].ts#L70-L91) 中：

```typescript
if (role === 'SUPPLIER' && currentTask.assigneeId === userId) {
  const allowedTransitions = ['TODO', 'IN_PROGRESS', 'REVIEW'];
  if (!allowedTransitions.includes(data.status)) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: '供应商只能更新任务到待办、进行中或待审核状态',
    });
  }
}

if (role === 'COUPLE' && data.status) {
  if (data.status !== 'APPROVED' && currentTask.status !== 'REVIEW') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: '新人只能确认审核中的任务',
    });
  }
}
```

---

## 四、确认单权限验证

### 1. 确认单状态流转

```
PENDING（待确认） → CONFIRMED（已确认）
                 ↘
                   DECLINED（已拒绝）
```

### 2. 角色操作权限

| 角色 | 可执行操作 |
|------|-----------|
| PLANNER | 创建确认单、查看 |
| **COUPLE** | 查看、确认(CONFIRMED)、拒绝(DECLINED) |
| SUPPLIER | 不能访问确认单 |

### 3. 新人确认验证

在 [confirmations/[confirmationId].ts](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-039/src/pages/api/confirmations/[confirmationId].ts#L25-L39) 中：

1. 校验当前用户是否是该项目的新人（`project.coupleId === userId`）
2. 校验只能设置 `CONFIRMED` 或 `DECLINED` 状态
3. 确认时自动记录 `confirmedAt` 时间

---

## 五、项目访问权限验证

### 1. 项目级访问控制

在 [canAccessProject](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-039/src/lib/permissions.ts#L72-L105) 函数中：

```
ADMIN → 全部项目可访问
PLANNER → 只能访问自己是 manager 的项目
COUPLE → 只能访问自己是 couple 的项目
SUPPLIER → 只能访问有分配任务给自己的项目
```

### 2. API 层自动校验

每个项目相关的 API 都可以通过设置 `requireProjectAccess: true` 来自动校验访问权限：

```typescript
export default createApiHandler(handler, {
  requirePermission: 'task:read',
  requireProjectAccess: true,  // 自动校验项目访问权限
});
```

---

## 六、测试账号

运行 `npm run prisma:seed` 后，系统会自动创建以下测试账号（密码统一为 `password123`）：

| 角色 | 邮箱 | 说明 |
|------|------|------|
| 管理员 | admin@wedding.com | 系统管理员，全部权限 |
| 策划师 | planner@wedding.com | 婚礼策划师李姐，项目负责人 |
| 新人 | couple@wedding.com | 张先生 & 王小姐，用于验证新人权限 |
| 花艺师 | florist@wedding.com | 供应商账号，花艺师小林 |
| 摄影师 | photographer@wedding.com | 供应商账号，摄影师老王 |

---

## 七、主流程校验步骤

### 测试流程：婚礼项目从创建到完成

1. **登录策划师** (planner@wedding.com)
   - ✅ 可创建项目、添加任务、录入预算（含内部费用）
   - ✅ 可看到所有预算项（含 isInternal=true）

2. **登录花艺师供应商** (florist@wedding.com)
   - ✅ 可查看分配给自己的任务
   - ✅ 可更新任务状态到 IN_PROGRESS、REVIEW
   - ✅ 可上传文件
   - ❌ 尝试更新到 COMPLETED → 被拦截
   - ❌ 看不到预算、供应商管理菜单

3. **登录新人** (couple@wedding.com)
   - ✅ 可查看项目进度、任务列表
   - ✅ 可查看预算，但看不到 `isInternal=true` 的内部费用项
   - ✅ 可对 REVIEW 状态的任务点击确认
   - ✅ 可对 PENDING 状态的确认单进行确认/拒绝
   - ✅ 可发表评论
   - ❌ 看不到供应商菜单
   - ❌ 不能创建任务、不能编辑预算

4. **登录管理员** (admin@wedding.com)
   - ✅ 全部功能可访问
   - ✅ 可管理用户

---

## 八、移动端特性验证

### 1. 响应式适配
- 侧边栏在移动端变为抽屉式导航
- 表格在移动端支持横向滚动
- 按钮和输入框适配触摸操作（最小 44px 点击区域）

### 2. 拍照上传
- 调用 `useCamera` hook 访问设备摄像头
- 支持直接拍照和从相册选择
- 照片转 base64 通过 API 上传到对象存储

### 3. 离线同步
- 使用 `useOfflineSync` hook 监听网络状态
- 离线时操作暂存到 localStorage
- 网络恢复后自动同步到服务器（通过 `/api/offline/sync`）
- 顶部状态栏显示在线/离线状态和待同步数量

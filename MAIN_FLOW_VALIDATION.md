# 社区菜园认领管理平台 - 主流程验证文档

## 一、权限矩阵验证

### 1.1 角色定义
| 角色 | 权限范围 |
|------|----------|
| admin | 所有功能的增删改查权限 |
| resident | 认领申请、轮值打卡、工具借用、收获记录、照片日志 |
| guest | 仅查看公开信息（地块地图、公告等） |

### 1.2 页面访问权限验证
| 页面 | admin | resident | guest | 验证方式 |
|------|-------|----------|-------|----------|
| 数据看板 | ✅ | ✅ | ❌ | 路由守卫 `meta.requiresAuth: true` |
| 地块地图 | ✅ | ✅ | ❌ | 路由守卫 + 字段过滤 |
| 认领申请 | ✅(审批) | ✅(申请/取消) | ❌ | 服务层权限校验 |
| 作物管理 | ✅ | ✅(自己的地块) | ❌ | 服务层权限校验 |
| 轮值表 | ✅(安排/标记) | ✅(打卡) | ❌ | 服务层权限校验 |
| 公共工具 | ✅(管理) | ✅(借用/归还) | ❌ | 服务层权限校验 |
| 公共公告 | ✅(发布) | ✅(查看) | ❌ | 服务层权限校验 |
| 收获记录 | ✅ | ✅(自己的地块) | ❌ | 服务层权限校验 |
| 照片日志 | ✅ | ✅(上传/删除自己的) | ❌ | 服务层权限校验 |
| 用户管理 | ✅ | ❌ | ❌ | 路由守卫 `meta.roles: ['admin']` |

### 1.3 敏感字段过滤验证
验证位置：[permission.js](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-059/src/middleware/permission.js#L1)

| 集合 | admin 可见 | resident 可见 | guest 可见 | 敏感字段 |
|------|-----------|--------------|------------|----------|
| users | * | id, name, email, phone, avatar, role, plotIds | id, name, avatar, role | consecutiveAbsences, lastAbsenceCheckDate |
| claims | * | id, plotId, applicantId, applicantName, plotNumber, reason, plannedCrops, status, createdAt | 无 | reviewedBy, reviewedAt, reviewComment |
| plots | * | * | id, plotNumber, name, area, status, location, description | claimedBy, claimedAt |

## 二、状态流转验证

### 2.1 地块状态流转
```
available (可认领)
    ↓ 申请通过 →
claimed (已认领)
    ↓ 释放/维护 →
available / maintenance
    ↓ 维护完成 →
available
```

验证点：
- [ ] 只有 admin 可以将地块设为 maintenance
- [ ] 认领申请 approved 时自动更新地块状态为 claimed
- [ ] 释放地块时自动清空 claimedBy 和 currentCropId
- [ ] 触发位置: [claimService.js](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-059/src/services/claimService.js#L46) approveClaim

### 2.2 认领申请状态流转
```
pending (待审批)
    ├→ approved (已通过) → 地块状态自动更新
    ├→ rejected (已拒绝)
    └→ cancelled (已取消)
```

验证点：
- [ ] 只有 applicant 本人可以取消申请
- [ ] 只有 admin 可以审批（通过/拒绝）
- [ ] approved 状态触发地块状态更新和通知
- [ ] 触发位置: [functions/index.js](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-059/functions/index.js#L142) onClaimStatusChange

### 2.3 轮值任务状态流转
```
pending (待执行)
    ├→ in_progress (进行中) → assignee 本人点击开始
    │   └→ completed (已完成) → assignee 本人点击完成
    └→ absent (已缺席) → admin 标记 / 系统自动检测
```

验证点：
- [ ] 只有 assignee 本人可以点击开始/完成
- [ ] 只有 admin 可以标记缺席
- [ ] completed 状态触发：重置连续缺席计数
- [ ] absent 状态触发：连续缺席计数+1，达到阈值发送提醒
- [ ] 触发位置: [functions/index.js](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-059/functions/index.js#L162) onRotationStatusChange

### 2.4 工具借用状态流转
```
available (可用)
    ↓ 借用 →
in_use (使用中)
    ↓ 归还 →
available
    ↓ 逾期未还 →
overdue (逾期)
```

验证点：
- [ ] 借用时自动扣减 availableQuantity
- [ ] 归还时自动恢复 availableQuantity
- [ ] 每日定时检查逾期，发送提醒
- [ ] 触发位置: [functions/index.js](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-059/functions/index.js#L97) checkToolOverdue

## 三、连续缺席提醒规则验证

### 3.1 业务规则
- 系统每日 08:00 自动检查所有居民的连续缺席次数
- 连续缺席达到 3 次及以上：
  - ✅ 给用户发送警告通知
  - ✅ 给所有管理员发送提醒通知
  - ❌ 不自动取消认领资格（关键规则）
- 用户完成一次轮值后，连续缺席计数清零

### 3.2 验证清单
| 检查项 | 预期结果 | 验证位置 |
|--------|----------|----------|
| 每日定时任务触发 | 每天 08:00 执行 | [functions/index.js](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-059/functions/index.js#L16) checkConsecutiveAbsences |
| 计算连续缺席次数 | 只统计最近的连续缺席，遇到 completed 停止 | [functions/index.js](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-059/functions/index.js#L44) calculateConsecutiveAbsences |
| 达到阈值发送通知 | 用户端 + 管理员端 | [functions/index.js](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-059/functions/index.js#L62) createAbsenceWarningNotification |
| 不自动取消资格 | 仅发送通知，不修改地块状态 | ✅ 代码中无取消认领逻辑 |
| 完成轮值后清零 | consecutiveAbsences 重置为 0 | [functions/index.js](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-059/functions/index.js#L165) |

### 3.3 通知类型矩阵
| 触发场景 | 通知对象 | 通知类型 |
|----------|----------|----------|
| 连续缺席≥3次 | 用户本人 | warning |
| 连续缺席≥3次 | 所有管理员 | warning |
| 明日轮值提醒 | 轮值负责人 | reminder |
| 工具逾期 | 借用人 | warning |
| 认领申请状态变更 | 申请人 | info |
| 新公告发布 | 所有用户 | info |

## 四、看板筛选功能验证

### 4.1 维度定义
| 维度 | 选项 | 验证点 |
|------|------|--------|
| 时间范围 | 近一周 / 近一月 / 近三月 / 全部 | 按 date 字段过滤 |
| 状态 | pending / in_progress / completed / absent | 按 status 字段过滤 |
| 负责人 | 所有居民 | 按 assigneeId 字段过滤 |

### 4.2 资源利用率监控
| 指标 | 计算公式 | 状态阈值 |
|------|----------|----------|
| 地块利用率 | 已认领地块数 / 总地块数 | <50% 低 / 50-80% 中 / >80% 高 |
| 工具使用率 | (总量-可用量) / 总量 | <30% 低 / 30-60% 中 / >60% 高 |
| 轮值完成率 | 完成轮值数 / 总轮值数 | <70% 低 / 70-90% 中 / >90% 高 |

### 4.3 瓶颈分析检测项
| 瓶颈类型 | 触发条件 | 严重程度 |
|----------|----------|----------|
| 待处理认领申请 | pending > 5 份 | high |
| 近期轮值任务 | 未来3天 > 3 项 | medium |
| 逾期工具借用 | 存在逾期记录 | medium |
| 高连续缺席用户 | ≥3次缺席用户 > 0 | high |

## 五、Firestore 安全规则验证

### 5.1 读写权限矩阵
| 集合 | 读权限 | 写权限 |
|------|--------|--------|
| users | 自己或 admin | 自己或 admin |
| plots | 所有认证用户 | admin 创建/删除，admin+resident 更新 |
| claims | 自己的申请 或 admin | resident 创建自己的，admin 审批 |
| rotations | 所有认证用户 | admin 创建，assignee 更新自己的状态 |
| tools | 所有认证用户 | admin 创建/删除，所有人更新状态 |
| announcements | 所有认证用户 | admin 独占 |
| photoLogs | 所有认证用户 | resident 创建，自己或 admin 删除 |

### 5.2 验证位置
- Firestore Rules: [firestore.rules](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-059/firestore.rules)
- Storage Rules: [storage.rules](file:///Users/xingyaolei/Desktop/trae-solo-generated-projects/question-059/storage.rules)

## 六、部署流程

### 6.1 环境要求
- Node.js >= 18
- Firebase CLI >= 12.0

### 6.2 部署步骤
```bash
# 1. 安装依赖
npm install
cd functions && npm install && cd ..

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 填入实际 Firebase 配置

# 3. 登录 Firebase
firebase login

# 4. 部署 Firestore 规则
npm run deploy:firestore

# 5. 部署 Cloud Functions
npm run deploy:functions

# 6. 构建前端
npm run build

# 7. 部署前端
npm run deploy:hosting

# 或一键部署全部
npm run deploy
```

### 6.3 初始化数据脚本（可选）
首次部署后，需要创建初始管理员账号：
1. 在 Firebase Console 中创建用户
2. 在 Firestore 中手动创建 users 文档，设置 role: 'admin'
3. 使用管理员账号登录后可在用户管理中设置其他管理员

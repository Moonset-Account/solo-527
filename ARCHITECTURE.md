# 财务费用申请审批流平台 - 架构设计

## 技术栈
- **后端**: Spring Boot 3.2, Spring Security, Spring Data JPA, Redis
- **前端**: React 18, TypeScript, Ant Design, React Router
- **数据库**: PostgreSQL 15
- **缓存**: Redis 7
- **构建工具**: Maven (后端), Vite (前端)

## 模块划分

### 后端模块
1. **entity** - 数据库实体
2. **repository** - 数据访问层
3. **service** - 业务逻辑层
4. **controller** - REST API层
5. **config** - 配置类
6. **dto** - 数据传输对象
7. **security** - 安全认证和权限
8. **audit** - 审计日志
9. **exception** - 异常处理
10. **util** - 工具类

### 前端模块
1. **pages** - 页面组件
2. **components** - 公共组件
3. **api** - API调用
4. **store** - 状态管理
5. **types** - TypeScript类型定义
6. **utils** - 工具函数
7. **router** - 路由配置

## 核心业务流程
1. 申请人提交费用申请（含附件）
2. 系统根据审批规则自动匹配审批流程
3. 各级审批人审批（同意/退回）
4. 审批完成后通知申请人
5. 超时节点自动提醒和异常处理

## 权限角色
- **ADMIN** - 系统管理员（全权限）
- **FINANCE_MANAGER** - 财务经理（配置规则、查看所有）
- **APPROVER** - 审批人（审批申请）
- **APPLICANT** - 申请人（提交申请、查看自己的）

## 数据库核心表
1. sys_user - 用户表
2. sys_role - 角色表
3. sys_user_role - 用户角色关联表
4. expense_application - 费用申请表
5. expense_attachment - 附件表
6. approval_rule - 审批规则表
7. approval_node - 审批节点表
8. approval_record - 审批记录表
9. approval_config - 系统配置表（附件、退回原因、资源占用）
10. change_log - 口径变更记录表
11. timeout_exception - 超时异常表
12. audit_log - 审计日志表

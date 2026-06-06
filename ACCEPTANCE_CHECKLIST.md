# 批发仓库订单履约系统 - 验收检查清单

## 一、数据库设计与唯一约束

### ✅ 1.1 数据库表设计
- [x] 客户表 (customers) - 含赊账额度、当前欠款字段
- [x] 商品表 (products) - SKU、条码、价格体系
- [x] 仓位表 (locations) - 仓位编码、类型、区域
- [x] 库存表 (inventories) - 商品+仓位+批次号的库存
- [x] 库存锁定表 (inventory_locks) - 库存锁定记录
- [x] 客户价格表 (customer_price_lists) - 客户专属价格
- [x] 订单表 (orders) - 订单主表
- [x] 订单项表 (order_items) - 订单明细
- [x] 拣货单表 (picking_lists) - 拣货单主表
- [x] 拣货项表 (picking_items) - 拣货明细
- [x] 拣货扫描表 (picking_scans) - 扫描记录
- [x] 欠款表 (debts) - 欠款记录
- [x] 还款记录表 (debt_payments) - 还款记录
- [x] 退货申请表 (return_requests) - 退货申请主表
- [x] 退货项表 (return_items) - 退货明细
- [x] 对账单表 (statements) - 对账单主表
- [x] 对账单项表 (statement_items) - 对账单明细
- [x] 通知表 (notifications) - 通知主表
- [x] 通知日志表 (notification_logs) - 通知发送日志
- [x] 审计日志表 (audit_trails) - 操作审计
- [x] 导入导出任务表 (import_export_tasks) - 任务记录

### ✅ 1.2 数据库唯一约束
- [x] customers.customer_code - 客户编码唯一
- [x] users.email - 用户邮箱唯一
- [x] users.employee_code - 员工编号唯一
- [x] products.sku - 商品SKU唯一
- [x] products.barcode - 商品条码唯一
- [x] locations.code - 仓位编码唯一
- [x] inventories (product_id + location_id + batch_no) - 库存联合唯一
- [x] customer_price_lists (customer_id + product_id + min_quantity) - 价格表联合唯一
- [x] orders.order_no - 订单编号唯一
- [x] picking_lists.picking_no - 拣货单号唯一
- [x] debts.debt_no - 欠款编号唯一
- [x] debt_payments.payment_no - 还款编号唯一
- [x] return_requests.return_no - 退货编号唯一
- [x] statements.statement_no - 对账单编号唯一
- [x] statements (customer_id + start_date + end_date) - 对账单时段联合唯一
- [x] import_export_tasks.task_no - 任务编号唯一
- [x] permissions (name + guard_name) - 权限联合唯一

---

## 二、核心业务功能

### ✅ 2.1 订单管理
- [x] 创建订单 - 支持电话下单录入
- [x] 库存检查 - 创建时自动校验库存
- [x] 拆单提示 - 库存不足时提示拆单
- [x] 赊账额度控制 - 老客户赊账不能超过设定额度
- [x] 订单确认 - 确认后锁定库存
- [x] 订单取消 - 取消后释放库存、调整欠款
- [x] 订单拆单 - 支持拆分订单
- [x] 客户价格表 - 自动应用客户专属价格

### ✅ 2.2 库存管理
- [x] 库存锁定 - 订单确认后锁定对应库存
- [x] 库存释放 - 订单取消时释放锁定
- [x] 库存消耗 - 拣货完成后消耗锁定库存
- [x] 库存回补 - 退货入库后回补库存
- [x] 库存预警 - 低库存商品预警

### ✅ 2.3 拣货流程
- [x] 拣货单生成 - 根据订单生成拣货单
- [x] 拣货分配 - 分配拣货员
- [x] 拣货开始 - 开始拣货操作
- [x] 扫描拣货 - 扫描条码确认拣货
- [x] 跳过拣货 - 支持跳过缺货商品
- [x] 拣货完成 - 完成后自动扣减库存

### ✅ 2.4 退货流程
- [x] 退货申请 - 创建退货申请
- [x] 退货审批 - 审批通过/拒绝
- [x] 退货收货 - 实际收到退货
- [x] 退货入库 - 退货入库回补库存
- [x] 欠款调整 - 退货后调整对应欠款

### ✅ 2.5 欠款与对账
- [x] 欠款记录 - 订单生成时自动创建欠款
- [x] 还款记录 - 支持多次还款
- [x] 逾期判断 - 自动判断是否逾期
- [x] 对账单生成 - 按时间段生成对账单
- [x] 对账单确认 - 财务确认对账单
- [x] 对账单发送 - 发送给客户

---

## 三、API权限边界

### ✅ 3.1 角色定义 (6个角色)
- [x] admin - 系统管理员
- [x] manager - 仓库经理
- [x] sales - 业务员
- [x] picker - 拣货员
- [x] warehouse - 仓管员
- [x] finance - 财务

### ✅ 3.2 权限定义 (47个权限)
- [x] 客户管理 (view, create, edit, delete, price_list)
- [x] 商品管理 (view, create, edit, delete)
- [x] 仓位管理 (view, create, edit, delete)
- [x] 订单管理 (view, create, edit, confirm, cancel, split)
- [x] 拣货管理 (view, create, start, scan, skip)
- [x] 退货管理 (view, create, approve, reject, receive, restock)
- [x] 欠款管理 (view, create, edit, payment)
- [x] 对账单管理 (view, create, confirm, send)
- [x] 看板管理 (view, timeout, resource)
- [x] 审计日志 (view)
- [x] 导入导出 (view, import, export, download)

### ✅ 3.3 API权限控制
- [x] 所有API接口使用 Gate::authorize 进行权限验证
- [x] 路由中间件 auth:sanctum 认证保护
- [x] 前端路由级别的权限检查
- [x] 按钮级别的权限控制

---

## 四、前端状态管理

### ✅ 4.1 状态管理 (Pinia)
- [x] 用户状态管理 (user store)
  - [x] Token持久化
  - [x] 用户信息存储
  - [x] 角色/权限缓存
  - [x] 登录/登出方法
- [x] 订单状态管理 (order store)
  - [x] 订单列表缓存
  - [x] 当前订单详情
  - [x] 筛选条件持久化
  - [x] 分页管理
- [x] 看板状态管理 (dashboard store)
  - [x] 看板数据缓存
  - [x] 超时预警数据
  - [x] 资源利用率数据
  - [x] 工作流统计数据

### ✅ 4.2 API请求封装
- [x] Axios请求拦截器 - 自动添加Token
- [x] Axios响应拦截器 - 统一错误处理
- [x] 401自动跳转登录
- [x] 403权限不足提示
- [x] 422表单验证错误处理

### ✅ 4.3 核心页面
- [x] 登录页
- [x] 主布局 (侧边栏+顶部导航)
- [x] 数据看板页
- [x] 订单列表页
- [x] 订单详情/创建页 (占位)
- [x] 404页面

---

## 五、导入导出任务队列

### ✅ 5.1 导入功能
- [x] 客户数据导入
- [x] 商品数据导入
- [x] 库存数据导入
- [x] 后台队列异步处理
- [x] 导入进度跟踪
- [x] 成功/失败统计
- [x] 错误详情记录

### ✅ 5.2 导出功能
- [x] 客户数据导出
- [x] 商品数据导出
- [x] 订单数据导出
- [x] 欠款数据导出
- [x] 后台队列异步处理
- [x] 导出文件下载

### ✅ 5.3 任务管理
- [x] 任务状态跟踪 (pending/processing/completed/failed)
- [x] 任务列表查询
- [x] 3次重试机制
- [x] 失败原因记录

---

## 六、通知重试与回滚策略

### ✅ 6.1 通知渠道
- [x] 邮件通知
- [x] 短信通知
- [x] 微信通知
- [x] 系统通知

### ✅ 6.2 重试机制
- [x] 最大重试次数: 5次
- [x] 指数退避策略: 30s * 2^(n-1)
- [x] 第1次失败: 30秒后重试
- [x] 第2次失败: 60秒后重试
- [x] 第3次失败: 120秒后重试
- [x] 第4次失败: 240秒后重试
- [x] 第5次失败: 480秒后重试

### ✅ 6.3 回滚策略
- [x] 发送过程数据库事务保护
- [x] 发送失败自动回滚
- [x] 永久失败记录日志
- [x] 关联业务回滚提示

---

## 七、后台看板功能

### ✅ 7.1 数据总览
- [x] 今日订单数
- [x] 待拣货数量
- [x] 今日销售额
- [x] 超时预警数量
- [x] 同比/环比数据

### ✅ 7.2 超时预警 (多维度)
- [x] 订单超时 (24/48/72小时)
- [x] 拣货超时
- [x] 退货处理超时
- [x] 欠款逾期
- [x] 按负责人筛选
- [x] 按状态筛选
- [x] 按时间范围筛选

### ✅ 7.3 资源监控
- [x] 拣货员利用率
- [x] 仓位利用率
- [x] 低库存商品列表
- [x] 今日完成统计

### ✅ 7.4 工作流统计
- [x] 各状态订单数量
- [x] 平均处理时长
- [x] 按负责人维度筛选
- [x] 按时间范围筛选

---

## 八、审计日志与记录追踪

### ✅ 8.1 审计记录
- [x] 新增操作记录 (CREATE)
- [x] 修改操作记录 (UPDATE)
- [x] 删除操作记录 (DELETE)
- [x] 记录操作人
- [x] 记录操作时间
- [x] 记录变更前数据
- [x] 记录变更后数据

### ✅ 8.2 审计查询
- [x] 按表名筛选
- [x] 按操作类型筛选
- [x] 按操作人筛选
- [x] 按时间范围筛选
- [x] 按记录ID查询完整变更历史

---

## 九、验收测试场景

### ✅ 9.1 新增订单流程
1. [x] 选择客户，校验客户状态是否正常
2. [x] 添加商品，自动应用客户价格表
3. [x] 校验库存，库存不足提示拆单
4. [x] 校验赊账额度，超过则禁止
5. [x] 提交订单，生成订单记录
6. [x] 确认订单，锁定库存
7. [x] 生成欠款记录（赊账订单）
8. [x] 审计日志记录创建操作

### ✅ 9.2 退货流程
1. [x] 创建退货申请，关联原订单
2. [x] 选择退货商品，填写退货原因
3. [x] 审批退货申请（通过/拒绝）
4. [x] 退货收货，确认实收数量
5. [x] 退货入库，回补库存
6. [x] 调整对应欠款金额
7. [x] 审计日志记录每一步操作

### ✅ 9.3 审计记录验证
1. [x] 创建客户 -> 审计日志有CREATE记录
2. [x] 修改客户 -> 审计日志有UPDATE记录，含新旧值
3. [x] 创建订单 -> 审计日志有CREATE记录
4. [x] 确认订单 -> 审计日志有UPDATE记录
5. [x] 退货审批 -> 审计日志有对应操作记录

---

## 十、项目结构总览

```
question-072/
├── app/
│   ├── Http/Controllers/API/    # 11个API控制器
│   ├── Models/                   # 18个Eloquent模型
│   ├── Services/                 # 5个核心业务服务
│   └── Jobs/                     # 3个队列任务
├── database/
│   ├── migrations/               # 14个数据库迁移
│   └── seeders/                  # 权限数据填充
├── frontend/
│   ├── src/
│   │   ├── stores/               # 3个Pinia状态管理
│   │   ├── views/                # 核心页面组件
│   │   ├── layouts/              # 布局组件
│   │   └── router/               # 路由配置
│   └── package.json
├── routes/api.php                # API路由定义
├── composer.json                 # PHP依赖配置
└── ACCEPTANCE_CHECKLIST.md       # 本文件
```

import Database from 'better-sqlite3'

type DatabaseInstance = InstanceType<typeof Database>

const db: DatabaseInstance = new Database(':memory:')

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'analyst',
    email VARCHAR(100),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS dataset (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    source VARCHAR(200),
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    version INTEGER NOT NULL DEFAULT 1,
    created_by INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES user(id)
  );

  CREATE TABLE IF NOT EXISTS dataset_field (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'string',
    is_desensitized INTEGER NOT NULL DEFAULT 0,
    desensitization_type VARCHAR(20),
    description TEXT,
    FOREIGN KEY (dataset_id) REFERENCES dataset(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS desensitization_rule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    field_id INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL,
    params TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (field_id) REFERENCES dataset_field(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS metric (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    caliber TEXT NOT NULL,
    formula TEXT,
    dataset_id INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'normal',
    notify_on_change INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES dataset(id)
  );

  CREATE TABLE IF NOT EXISTS dimension (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'enum',
    "values" TEXT,
    FOREIGN KEY (metric_id) REFERENCES metric(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS caliber_change (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_id INTEGER NOT NULL,
    old_caliber TEXT NOT NULL,
    new_caliber TEXT NOT NULL,
    changed_by INTEGER NOT NULL,
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    security_note TEXT,
    FOREIGN KEY (metric_id) REFERENCES metric(id),
    FOREIGN KEY (changed_by) REFERENCES user(id)
  );

  CREATE TABLE IF NOT EXISTS approval_request (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_id INTEGER NOT NULL,
    target_type VARCHAR(20) NOT NULL,
    target_id INTEGER NOT NULL,
    target_name VARCHAR(200) NOT NULL,
    access_level VARCHAR(20) NOT NULL DEFAULT 'view',
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    reviewer_id INTEGER,
    review_comment TEXT,
    expires_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    FOREIGN KEY (requester_id) REFERENCES user(id),
    FOREIGN KEY (reviewer_id) REFERENCES user(id)
  );

  CREATE TABLE IF NOT EXISTS subscription (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    condition_type VARCHAR(30) NOT NULL DEFAULT 'threshold',
    condition_value REAL NOT NULL,
    direction VARCHAR(10) NOT NULL DEFAULT 'both',
    notify_channels VARCHAR(100) NOT NULL DEFAULT 'in_app',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (metric_id) REFERENCES metric(id),
    FOREIGN KEY (user_id) REFERENCES user(id)
  );

  CREATE TABLE IF NOT EXISTS anomaly_event (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_id INTEGER NOT NULL,
    detected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actual_value REAL NOT NULL,
    expected_value REAL NOT NULL,
    deviation REAL NOT NULL,
    severity VARCHAR(10) NOT NULL DEFAULT 'medium',
    root_cause TEXT,
    is_caliber_related INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    FOREIGN KEY (metric_id) REFERENCES metric(id)
  );

  CREATE TABLE IF NOT EXISTS export_task (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_ids TEXT NOT NULL,
    requested_by INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'processing',
    watermark_enabled INTEGER NOT NULL DEFAULT 1,
    security_note TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (requested_by) REFERENCES user(id)
  );

  CREATE TABLE IF NOT EXISTS export_result (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    report_id INTEGER NOT NULL,
    report_name VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL,
    reason TEXT,
    file_path VARCHAR(500),
    duration REAL,
    FOREIGN KEY (task_id) REFERENCES export_task(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS version_snapshot (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type VARCHAR(30) NOT NULL,
    entity_id INTEGER NOT NULL,
    version INTEGER NOT NULL,
    snapshot TEXT NOT NULL,
    changed_by INTEGER NOT NULL,
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    change_description TEXT,
    FOREIGN KEY (changed_by) REFERENCES user(id)
  );
`)

const seedUsers = db.prepare(`
  INSERT INTO user (username, password_hash, display_name, role, email) VALUES (?, ?, ?, ?, ?)
`)

const users = [
  ['admin', '123456', '系统管理员', 'admin', 'admin@example.com'],
  ['ops_lead', '123456', '运营负责人', 'ops_lead', 'ops_lead@example.com'],
  ['supply_chain', '123456', '供应链分析师', 'analyst', 'supply_chain@example.com'],
  ['analyst', '123456', '数据分析师', 'analyst', 'analyst@example.com'],
]

const insertUser = db.transaction((rows) => {
  for (const row of rows) seedUsers.run(...row)
})
insertUser(users)

const seedDatasets = db.prepare(`
  INSERT INTO dataset (id, name, description, source, status, version, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)
`)

const datasets = [
  [1, '用户行为日志', '用户在APP和Web端的行为埋点数据', '埋点系统', 'published', 2, 1],
  [2, '订单交易明细', '全渠道订单交易流水数据', '交易中台', 'published', 1, 2],
  [3, '供应链库存数据', '仓库与门店库存变动数据', 'WMS系统', 'draft', 1, 3],
]

const insertDatasets = db.transaction((rows) => {
  for (const row of rows) seedDatasets.run(...row)
})
insertDatasets(datasets)

const seedFields = db.prepare(`
  INSERT INTO dataset_field (id, dataset_id, name, type, is_desensitized, desensitization_type, description) VALUES (?, ?, ?, ?, ?, ?, ?)
`)

const fields = [
  [1, 1, 'user_id', 'string', 1, 'mask', '用户ID，需脱敏'],
  [2, 1, 'event_type', 'string', 0, null, '事件类型'],
  [3, 1, 'event_time', 'datetime', 0, null, '事件时间'],
  [4, 1, 'ip_address', 'string', 1, 'hash', 'IP地址，需脱敏'],
  [5, 2, 'order_id', 'string', 0, null, '订单编号'],
  [6, 2, 'customer_phone', 'string', 1, 'mask', '客户手机号，需脱敏'],
  [7, 2, 'amount', 'number', 0, null, '订单金额'],
  [8, 2, 'payment_method', 'string', 0, null, '支付方式'],
  [9, 3, 'sku_id', 'string', 0, null, 'SKU编号'],
  [10, 3, 'warehouse_code', 'string', 0, null, '仓库编码'],
  [11, 3, 'quantity', 'number', 0, null, '库存数量'],
  [12, 3, 'supplier_contact', 'string', 1, 'mask', '供应商联系方式，需脱敏'],
]

const insertFields = db.transaction((rows) => {
  for (const row of rows) seedFields.run(...row)
})
insertFields(fields)

const seedDesensRules = db.prepare(`
  INSERT INTO desensitization_rule (field_id, type, params, version) VALUES (?, ?, ?, ?)
`)

const desensRules = [
  [1, 'mask', '{"keepLeft":2,"keepRight":2,"maskChar":"*"}', 1],
  [4, 'hash', '{"algorithm":"sha256","salt":"random_salt"}', 2],
  [6, 'mask', '{"keepLeft":3,"keepRight":0,"maskChar":"*"}', 1],
  [12, 'mask', '{"keepLeft":0,"keepRight":4,"maskChar":"*"}', 1],
]

const insertDesensRules = db.transaction((rows) => {
  for (const row of rows) seedDesensRules.run(...row)
})
insertDesensRules(desensRules)

const seedMetrics = db.prepare(`
  INSERT INTO metric (id, name, caliber, formula, dataset_id, status, notify_on_change) VALUES (?, ?, ?, ?, ?, ?, ?)
`)

const metrics = [
  [1, '日活跃用户数(DAU)', '当日至少触发一次有效行为的独立用户数', 'COUNT(DISTINCT user_id) WHERE event_date = TODAY', 1, 'normal', 1],
  [2, '新增注册用户数', '当日完成注册流程的独立用户数', 'COUNT(DISTINCT user_id) WHERE event_type = "register"', 1, 'normal', 1],
  [3, '订单转化率', '下单用户数/活跃用户数', 'COUNT(DISTINCT order_user_id) / DAU * 100', 2, 'normal', 0],
  [4, '平均订单金额', '总订单金额/订单数', 'SUM(amount) / COUNT(order_id)', 2, 'normal', 0],
  [5, '库存周转天数', '平均库存/日均消耗量', 'AVG(quantity) / daily_consumption', 3, 'normal', 1],
]

const insertMetrics = db.transaction((rows) => {
  for (const row of rows) seedMetrics.run(...row)
})
insertMetrics(metrics)

const seedDimensions = db.prepare(`
  INSERT INTO dimension (metric_id, name, type, "values") VALUES (?, ?, ?, ?)
`)

const dimensions = [
  [1, '平台', 'enum', '["iOS","Android","Web","小程序"]'],
  [1, '用户类型', 'enum', '["新用户","老用户"]'],
  [2, '渠道', 'enum', '["自然流量","广告投放","邀请注册"]'],
  [3, '品类', 'enum', '["电子产品","服装","食品","家居"]'],
  [4, '支付方式', 'enum', '["支付宝","微信","银行卡","货到付款"]'],
  [5, '仓库类型', 'enum', '["中心仓","区域仓","门店"]'],
]

const insertDimensions = db.transaction((rows) => {
  for (const row of rows) seedDimensions.run(...row)
})
insertDimensions(dimensions)

const seedCaliberChanges = db.prepare(`
  INSERT INTO caliber_change (metric_id, old_caliber, new_caliber, changed_by, security_note) VALUES (?, ?, ?, ?, ?)
`)

const caliberChanges = [
  [1, '当日登录的独立用户数', '当日至少触发一次有效行为的独立用户数', 1, '扩展口径：从登录行为扩展到任何有效行为'],
  [3, '下单用户数/注册用户数', '下单用户数/活跃用户数', 2, '分母从注册用户改为活跃用户，更准确反映转化'],
  [5, '月末库存/月消耗量', '平均库存/日均消耗量', 3, '改为日粒度计算，提高时效性'],
]

const insertCaliberChanges = db.transaction((rows) => {
  for (const row of rows) seedCaliberChanges.run(...row)
})
insertCaliberChanges(caliberChanges)

const seedApprovals = db.prepare(`
  INSERT INTO approval_request (id, requester_id, target_type, target_id, target_name, access_level, reason, status, reviewer_id, review_comment, expires_at, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const approvals = [
  [1, 4, 'dataset', 2, '订单交易明细', 'view', '需要查看订单数据完成月度分析报告', 'approved', 1, '已确认需求合理', '2026-07-01 00:00:00', '2026-06-10 09:30:00'],
  [2, 3, 'dataset', 1, '用户行为日志', 'export', '需要导出用户行为数据用于供应链预测', 'approved', 1, '审批通过，注意数据安全', '2026-07-15 00:00:00', '2026-06-11 14:20:00'],
  [3, 4, 'metric', 3, '订单转化率', 'edit', '需要调整转化率计算口径', 'rejected', 2, '当前口径稳定，不宜频繁变更', null, '2026-06-12 10:00:00'],
  [4, 3, 'dataset', 2, '订单交易明细', 'export', '需要导出Q2订单数据', 'pending', null, null, null, null],
  [5, 4, 'metric', 5, '库存周转天数', 'view', '需要查看库存周转指标', 'pending', null, null, null, null],
]

const insertApprovals = db.transaction((rows) => {
  for (const row of rows) seedApprovals.run(...row)
})
insertApprovals(approvals)

const seedSubscriptions = db.prepare(`
  INSERT INTO subscription (id, metric_id, user_id, condition_type, condition_value, direction, notify_channels, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)

const subscriptions = [
  [1, 1, 2, 'threshold', 10.0, 'down', 'in_app,email', 1],
  [2, 3, 1, 'threshold', 5.0, 'down', 'in_app', 1],
  [3, 5, 3, 'threshold', 20.0, 'up', 'email', 1],
]

const insertSubscriptions = db.transaction((rows) => {
  for (const row of rows) seedSubscriptions.run(...row)
})
insertSubscriptions(subscriptions)

const seedAnomalyEvents = db.prepare(`
  INSERT INTO anomaly_event (id, metric_id, detected_at, actual_value, expected_value, deviation, severity, root_cause, is_caliber_related, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const anomalyEvents = [
  [1, 1, '2026-06-15 08:00:00', 85000, 120000, -29.2, 'high', 'APP版本更新导致埋点丢失，部分用户行为未被记录', 1, 'acknowledged'],
  [2, 3, '2026-06-16 10:30:00', 2.1, 4.5, -53.3, 'high', '口径变更后未同步更新计算逻辑', 1, 'new'],
  [3, 4, '2026-06-17 14:00:00', 356, 280, 27.1, 'medium', '大促活动导致客单价上升', 0, 'resolved'],
  [4, 5, '2026-06-18 09:15:00', 42, 30, 40.0, 'medium', '供应链中断导致库存积压', 0, 'new'],
  [5, 2, '2026-06-19 16:45:00', 5000, 8000, -37.5, 'low', '自然波动，注册渠道正常', 0, 'acknowledged'],
]

const insertAnomalyEvents = db.transaction((rows) => {
  for (const row of rows) seedAnomalyEvents.run(...row)
})
insertAnomalyEvents(anomalyEvents)

const seedExportTasks = db.prepare(`
  INSERT INTO export_task (id, report_ids, requested_by, status, watermark_enabled, security_note, created_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)

const exportTasks = [
  [1, '[1,2]', 4, 'completed', 1, '月度分析报告数据导出', '2026-06-10 09:00:00', '2026-06-10 09:05:00'],
  [2, '[3,4,5]', 3, 'completed', 1, '供应链季度数据导出', '2026-06-12 14:00:00', '2026-06-12 14:08:00'],
  [3, '[1,5]', 2, 'completed', 0, '运营数据导出-无水印', '2026-06-15 11:00:00', '2026-06-15 11:03:00'],
]

const insertExportTasks = db.transaction((rows) => {
  for (const row of rows) seedExportTasks.run(...row)
})
insertExportTasks(exportTasks)

const seedExportResults = db.prepare(`
  INSERT INTO export_result (task_id, report_id, report_name, status, reason, file_path, duration) VALUES (?, ?, ?, ?, ?, ?, ?)
`)

const exportResults = [
  [1, 1, '日活跃用户数(DAU)', 'success', null, '/exports/2026-06/dau_report.xlsx', 12.5],
  [1, 2, '新增注册用户数', 'success', null, '/exports/2026-06/registration_report.xlsx', 8.3],
  [2, 3, '订单转化率', 'success', null, '/exports/2026-06/conversion_report.xlsx', 15.2],
  [2, 4, '平均订单金额', 'failed', '数据源连接超时', null, 30.1],
  [2, 5, '库存周转天数', 'skipped', '无数据权限', null, 0],
  [3, 1, '日活跃用户数(DAU)', 'success', null, '/exports/2026-06/dau_ops.xlsx', 10.0],
  [3, 5, '库存周转天数', 'success', null, '/exports/2026-06/inventory_ops.xlsx', 22.7],
]

const insertExportResults = db.transaction((rows) => {
  for (const row of rows) seedExportResults.run(...row)
})
insertExportResults(exportResults)

const seedVersionSnapshots = db.prepare(`
  INSERT INTO version_snapshot (entity_type, entity_id, version, snapshot, changed_by, change_description) VALUES (?, ?, ?, ?, ?, ?)
`)

const versionSnapshots = [
  ['desensitization', 1, 1, '{"field_id":1,"type":"mask","params":"{\\"keepLeft\\":2,\\"keepRight\\":2,\\"maskChar\\":\\"*\\"}","version":1}', 1, '初始脱敏规则'],
  ['desensitization', 4, 2, '{"field_id":4,"type":"hash","params":"{\\"algorithm\\":\\"sha256\\",\\"salt\\":\\"random_salt\\"}","version":2}', 1, '从mask升级为hash脱敏，提高安全性'],
  ['caliber', 1, 2, '{"metric_id":1,"name":"日活跃用户数(DAU)","caliber":"当日至少触发一次有效行为的独立用户数","formula":"COUNT(DISTINCT user_id) WHERE event_date = TODAY"}', 1, '扩展口径从登录行为到任何有效行为'],
  ['caliber', 3, 2, '{"metric_id":3,"name":"订单转化率","caliber":"下单用户数/活跃用户数","formula":"COUNT(DISTINCT order_user_id) / DAU * 100"}', 2, '分母从注册用户改为活跃用户'],
  ['subscription', 1, 1, '{"metric_id":1,"user_id":2,"condition_type":"threshold","condition_value":10.0,"direction":"down","notify_channels":"in_app,email"}', 2, '创建DAU下降告警订阅'],
  ['subscription', 2, 1, '{"metric_id":3,"user_id":1,"condition_type":"threshold","condition_value":5.0,"direction":"down","notify_channels":"in_app"}', 1, '创建转化率下降告警订阅'],
]

const insertVersionSnapshots = db.transaction((rows) => {
  for (const row of rows) seedVersionSnapshots.run(...row)
})
insertVersionSnapshots(versionSnapshots)

export default db

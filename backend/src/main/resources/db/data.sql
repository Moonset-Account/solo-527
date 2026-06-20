INSERT INTO sys_permission (permission_code, permission_name, description) VALUES
('anomaly:view', '查看异常原因', '查看数据异常波动原因'),
('anomaly:manage', '管理异常记录', '处理和关闭异常记录'),
('approval:view', '查看审批', '查看权限审批申请'),
('approval:approve', '审批权限', '审批数据访问权限'),
('alert:view', '查看告警规则', '查看告警配置'),
('alert:manage', '管理告警规则', '创建和编辑告警规则'),
('dimension:view', '查看维度配置', '查看分析维度'),
('dimension:manage', '管理维度配置', '创建和编辑维度配置'),
('dataset:view', '查看数据集权限', '查看数据集权限配置'),
('dataset:manage', '管理数据集权限', '配置数据集访问权限'),
('desensitization:view', '查看脱敏配置', '查看数据脱敏规则'),
('desensitization:manage', '管理脱敏配置', '配置数据脱敏规则'),
('delay:view', '查看数据延迟', '查看数据延迟监控'),
('report:view', '查看报表效率', '查看报表生成效率'),
('filter:manage', '管理筛选模板', '保存和管理筛选条件'),
('admin:all', '管理员权限', '全部系统权限')
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO sys_role (role_code, role_name, description) VALUES
('ADMIN', '系统管理员', '拥有全部系统权限'),
('OPERATION_LEADER', '运营负责人', '查看数据和审批权限'),
('DATA_ANALYST', '业务分析师', '数据分析和查看权限'),
('OPERATION_STAFF', '运营人员', '基础数据查看权限')
ON CONFLICT (role_code) DO NOTHING;

INSERT INTO sys_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM sys_role r, sys_permission p
WHERE r.role_code = 'ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO sys_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM sys_role r, sys_permission p
WHERE r.role_code = 'OPERATION_LEADER'
AND p.permission_code IN ('anomaly:view', 'anomaly:manage', 'approval:view', 'approval:approve',
                         'alert:view', 'dimension:view', 'dataset:view', 'delay:view', 'report:view', 'filter:manage')
ON CONFLICT DO NOTHING;

INSERT INTO sys_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM sys_role r, sys_permission p
WHERE r.role_code = 'DATA_ANALYST'
AND p.permission_code IN ('anomaly:view', 'alert:view', 'dimension:view', 'dataset:view',
                         'delay:view', 'report:view', 'filter:manage')
ON CONFLICT DO NOTHING;

INSERT INTO sys_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM sys_role r, sys_permission p
WHERE r.role_code = 'OPERATION_STAFF'
AND p.permission_code IN ('anomaly:view', 'dimension:view', 'filter:manage')
ON CONFLICT DO NOTHING;

INSERT INTO sys_user (username, password, real_name, email, phone, enabled) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVbKCi', '系统管理员', 'admin@example.com', '13800000000', true),
('leader', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVbKCi', '运营负责人', 'leader@example.com', '13800000001', true),
('analyst', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVbKCi', '业务分析师', 'analyst@example.com', '13800000002', true),
('staff', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVbKCi', '运营人员', 'staff@example.com', '13800000003', true)
ON CONFLICT (username) DO NOTHING;

INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, r.id FROM sys_user u, sys_role r
WHERE u.username = 'admin' AND r.role_code = 'ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, r.id FROM sys_user u, sys_role r
WHERE u.username = 'leader' AND r.role_code = 'OPERATION_LEADER'
ON CONFLICT DO NOTHING;

INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, r.id FROM sys_user u, sys_role r
WHERE u.username = 'analyst' AND r.role_code = 'DATA_ANALYST'
ON CONFLICT DO NOTHING;

INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, r.id FROM sys_user u, sys_role r
WHERE u.username = 'staff' AND r.role_code = 'OPERATION_STAFF'
ON CONFLICT DO NOTHING;

INSERT INTO dimension_config (dimension_code, dimension_name, dimension_type, dimension_values, effective_condition, enabled, description, created_by) VALUES
('channel', '获客渠道', 'ENUM', '["自然流量","广告投放","社交媒体","合作伙伴","线下活动"]', 'enabled=true', true, '用户获取来源渠道', 'admin'),
('region', '地区', 'ENUM', '["华东","华南","华北","华中","西南","西北","东北"]', 'enabled=true', true, '用户所属地区', 'admin'),
('user_level', '用户等级', 'ENUM', '["新用户","普通用户","银卡用户","金卡用户","钻石用户"]', 'enabled=true', true, '用户会员等级', 'admin'),
('device', '设备类型', 'ENUM', '["iOS","Android","Web","小程序"]', 'enabled=true', true, '用户使用设备', 'admin'),
('age_group', '年龄段', 'ENUM', '["18-24","25-34","35-44","45-54","55+"]', 'enabled=true', true, '用户年龄分组', 'admin')
ON CONFLICT DO NOTHING;

INSERT INTO alert_rule (rule_name, metric_name, dimension, alert_type, threshold, operator, severity, effective_condition, enabled, notification_channels, notify_users, created_by) VALUES
('日活用户下降告警', 'daily_active_users', 'channel', 'DECREASE_RATE', 15.00, 'GT', 'HIGH', 'enabled=true', true, 'EMAIL,WEBHOOK', 'leader,analyst', 'admin'),
('转化率异常告警', 'conversion_rate', 'region', 'DEVIATION', 10.00, 'GT', 'MEDIUM', 'enabled=true', true, 'EMAIL', 'leader', 'admin'),
('新增用户波动告警', 'new_users', NULL, 'FLUCTUATION', 20.00, 'GT', 'HIGH', 'enabled=true', true, 'EMAIL,WEBHOOK,SMS', 'leader,analyst', 'admin'),
('留存率下降告警', 'retention_rate', 'user_level', 'DECREASE_RATE', 8.00, 'GT', 'MEDIUM', 'enabled=true', true, 'EMAIL', 'analyst', 'admin'),
('GMV异常告警', 'gmv', 'channel', 'DEVIATION', 25.00, 'GT', 'CRITICAL', 'enabled=true', true, 'EMAIL,WEBHOOK,SMS', 'leader,analyst,admin', 'admin')
ON CONFLICT DO NOTHING;

INSERT INTO dataset_permission (dataset_code, dataset_name, description, data_level, role_id, permission_type, row_filter_condition, column_mask_config, effective_condition, enabled, created_by)
SELECT 'user_growth', '用户增长数据集', '包含用户增长核心指标', 'SENSITIVE', r.id, 'READ', NULL, 'phone:MASK_MIDDLE,email:MASK_LOCAL', 'enabled=true', true, 'admin'
FROM sys_role r WHERE r.role_code = 'OPERATION_LEADER'
ON CONFLICT DO NOTHING;

INSERT INTO dataset_permission (dataset_code, dataset_name, description, data_level, role_id, permission_type, row_filter_condition, column_mask_config, effective_condition, enabled, created_by)
SELECT 'user_growth', '用户增长数据集', '包含用户增长核心指标', 'CONFIDENTIAL', r.id, 'READ', '1=1', 'phone:MASK_ALL,email:MASK_ALL,real_name:MASK_ALL', 'enabled=true', true, 'admin'
FROM sys_role r WHERE r.role_code = 'DATA_ANALYST'
ON CONFLICT DO NOTHING;

INSERT INTO dataset_permission (dataset_code, dataset_name, description, data_level, role_id, permission_type, row_filter_condition, column_mask_config, effective_condition, enabled, created_by)
SELECT 'user_growth', '用户增长数据集', '包含用户增长核心指标', 'PUBLIC', r.id, 'READ', NULL, 'phone:MASK_ALL,email:MASK_ALL,real_name:MASK_ALL', 'enabled=true', true, 'admin'
FROM sys_role r WHERE r.role_code = 'OPERATION_STAFF'
ON CONFLICT DO NOTHING;

INSERT INTO desensitization_config (dataset_code, table_name, column_name, column_alias, desensitization_type, desensitization_rule, data_level, effective_condition, enabled, description, created_by) VALUES
('user_growth', 'user_profile', 'phone', '手机号码', 'MASK_MIDDLE', '3,4,*', 'SENSITIVE', 'enabled=true', true, '手机号中间4位脱敏', 'admin'),
('user_growth', 'user_profile', 'email', '邮箱', 'MASK_LOCAL', NULL, 'SENSITIVE', 'enabled=true', true, '邮箱本地部分脱敏', 'admin'),
('user_growth', 'user_profile', 'real_name', '真实姓名', 'MASK_ALL', NULL, 'CONFIDENTIAL', 'enabled=true', true, '姓名全脱敏', 'admin'),
('user_growth', 'user_profile', 'id_card', '身份证号', 'MASK_MIDDLE', '6,8,*', 'HIGH_SENSITIVE', 'enabled=true', true, '身份证中间8位脱敏', 'admin'),
('transaction', 'order_record', 'amount', '交易金额', 'ROUND', '0', 'SENSITIVE', 'enabled=true', true, '金额取整', 'admin')
ON CONFLICT DO NOTHING;

INSERT INTO data_delay_monitor (dataset_code, dataset_name, last_update_time, expected_update_time, delay_minutes, status, notify_users) VALUES
('user_growth_daily', '用户增长日报表', NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '15 minutes', 30, 'DELAYED', 'analyst,leader'),
('user_growth_hourly', '用户增长小时报', NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '5 minutes', 5, 'NORMAL', 'analyst'),
('transaction_daily', '交易日报表', NOW() - INTERVAL '60 minutes', NOW() - INTERVAL '30 minutes', 30, 'DELAYED', 'analyst,leader'),
('funnel_report', '漏斗分析报表', NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '5 minutes', 0, 'NORMAL', 'analyst')
ON CONFLICT DO NOTHING;

INSERT INTO report_efficiency (report_code, report_name, stat_date, generation_count, avg_generation_time_ms, max_generation_time_ms, min_generation_time_ms, total_time_ms, success_count, fail_count, success_rate, remark) VALUES
('user_growth_daily', '用户增长日报表', CURRENT_DATE - 1, 156, 2350, 8500, 800, 366600, 152, 4, 97.44, '正常'),
('user_growth_hourly', '用户增长小时报', CURRENT_DATE - 1, 3744, 850, 3200, 200, 3182400, 3720, 24, 99.36, '正常'),
('transaction_daily', '交易日报表', CURRENT_DATE - 1, 89, 5600, 15000, 2000, 498400, 85, 4, 95.51, '数据量大导致较慢'),
('funnel_report', '漏斗分析报表', CURRENT_DATE - 1, 67, 8900, 25000, 3000, 596300, 65, 2, 97.01, '多表关联查询'),
('retention_report', '留存分析报表', CURRENT_DATE - 1, 45, 12500, 45000, 4000, 562500, 42, 3, 93.33, '需要优化查询性能'),
('user_growth_daily', '用户增长日报表', CURRENT_DATE - 2, 148, 2450, 9200, 750, 362600, 145, 3, 97.97, '正常'),
('user_growth_hourly', '用户增长小时报', CURRENT_DATE - 2, 3600, 820, 3500, 180, 2952000, 3580, 20, 99.44, '正常'),
('transaction_daily', '交易日报表', CURRENT_DATE - 2, 95, 5800, 16000, 2100, 551000, 91, 4, 95.79, '数据量大导致较慢'),
('funnel_report', '漏斗分析报表', CURRENT_DATE - 2, 72, 9200, 28000, 3200, 662400, 70, 2, 97.22, '多表关联查询'),
('retention_report', '留存分析报表', CURRENT_DATE - 2, 52, 11800, 42000, 3800, 613600, 49, 3, 94.23, '需要优化查询性能')
ON CONFLICT (report_code, stat_date) DO NOTHING;

INSERT INTO anomaly_record (metric_name, dimension, dimension_value, current_value, expected_value, deviation_rate, severity, anomaly_reason, suggestion, status, anomaly_time, handled_by, handled_at) VALUES
('daily_active_users', 'channel', '广告投放', 12500.00, 18500.00, -32.43, 'HIGH', '1. 主要投放渠道Google Ads预算耗尽，投放暂停2小时
2. 竞品同期进行大规模促销活动，分流部分用户
3. 周末效应影响，用户活跃度普遍下降
4. 新用户注册流程存在bug，导致约8%的注册失败', '1. 立即补充广告投放预算，恢复投放
2. 分析竞品促销策略，制定应对方案
3. 紧急修复注册流程bug
4. 增加周末运营活动提升活跃度', 'HANDLING', NOW() - INTERVAL '2 hours', NULL, NULL),
('conversion_rate', 'region', '华东', 2.15, 3.50, -38.57, 'MEDIUM', '1. 华东地区近期服务器响应较慢，影响用户体验
2. 支付渠道出现间歇性故障，导致部分订单支付失败
3. 华东地区竞品推出本地化优惠活动', '1. 优化华东地区服务器配置，增加CDN节点
2. 排查支付渠道问题，增加备用支付渠道
3. 研究推出华东地区专属优惠活动', 'PENDING', NOW() - INTERVAL '5 hours', NULL, NULL),
('new_users', NULL, NULL, 8500.00, 12000.00, -29.17, 'HIGH', '1. 应用商店排名下降，自然流量减少25%
2. 主要广告素材点击率下降，转化效果变差
3. 新用户引导流程过长，流失率增加', '1. 优化ASO策略，提升应用商店排名
2. 更新广告素材，进行A/B测试
3. 简化新用户引导流程，优化用户体验', 'HANDLING', NOW() - INTERVAL '8 hours', 'leader', NOW() - INTERVAL '1 hour'),
('retention_rate', 'user_level', '新用户', 25.50, 35.00, -27.14, 'MEDIUM', '1. 新用户首日任务难度过高，完成率低
2. 新用户专属福利吸引力不足
3. 产品核心功能对新用户引导不足', '1. 降低新用户首日任务难度，优化奖励机制
2. 提升新用户专属福利力度
3. 优化新用户引导流程，突出核心功能价值', 'RESOLVED', NOW() - INTERVAL '24 hours', 'analyst', NOW() - INTERVAL '12 hours'),
('gmv', 'channel', '社交媒体', 156000.00, 220000.00, -29.09, 'CRITICAL', '1. 社交媒体KOL合作暂停，流量大幅下降
2. 社交平台算法调整，内容曝光量减少40%
3. 近期社交平台负面舆情影响用户购买意愿', '1. 紧急联系备用KOL资源，快速恢复内容投放
2. 优化社交内容策略，适应新算法要求
3. 启动舆情公关，积极回应用户关切', 'HANDLING', NOW() - INTERVAL '3 hours', NULL, NULL),
('daily_active_users', 'region', '华南', 8200.00, 10500.00, -21.90, 'MEDIUM', '1. 华南地区暴雨天气，部分物流配送延迟，影响用户活跃
2. 华南地区线下活动取消，用户参与度下降', '1. 增加线上活动弥补线下活动取消的影响
2. 优化物流配送方案，应对极端天气', 'PENDING', NOW() - INTERVAL '6 hours', NULL, NULL),
('conversion_rate', 'device', '小程序', 1.85, 3.20, -42.19, 'HIGH', '1. 小程序版本更新后出现支付bug
2. 小程序加载速度变慢，用户流失增加', '1. 紧急回滚小程序版本或发布热修复
2. 优化小程序性能，提升加载速度', 'HANDLING', NOW() - INTERVAL '4 hours', 'leader', NOW() - INTERVAL '30 minutes')
ON CONFLICT DO NOTHING;

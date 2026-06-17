INSERT INTO tour_route (route_code, route_name, description, city, duration_days, base_price, max_capacity, status, version, created_by) VALUES
('R001', '北京经典三日游', '故宫、长城、天坛经典路线，感受千年帝都魅力', '北京', 3, 1999.00, 50, 'ACTIVE', 1, 'admin'),
('R002', '上海都市两日游', '外滩、东方明珠、迪士尼，体验魔都风采', '上海', 2, 1599.00, 40, 'ACTIVE', 1, 'admin'),
('R003', '杭州西湖一日游', '西湖十景、灵隐寺，人间天堂之旅', '杭州', 1, 399.00, 30, 'ACTIVE', 1, 'admin'),
('R004', '西安古都四日游', '兵马俑、大雁塔、华清池，梦回大唐', '西安', 4, 2599.00, 45, 'ACTIVE', 1, 'admin'),
('R005', '成都美食三日游', '宽窄巷子、锦里、熊猫基地，美食与萌宠', '成都', 3, 1899.00, 35, 'INACTIVE', 2, 'admin');

INSERT INTO room_inventory (route_id, hotel_code, hotel_name, room_type, inventory_date, total_quantity, booked_quantity, blocked_quantity, available_quantity, room_status, version, created_by) VALUES
(1, 'HOTEL001', '北京王府井大酒店', '标准间', CURRENT_DATE + 7, 20, 5, 2, 13, 'NORMAL', 1, 'admin'),
(1, 'HOTEL001', '北京王府井大酒店', '大床房', CURRENT_DATE + 7, 15, 3, 1, 11, 'NORMAL', 1, 'admin'),
(1, 'HOTEL001', '北京王府井大酒店', '标准间', CURRENT_DATE + 8, 20, 8, 0, 12, 'NORMAL', 1, 'admin'),
(1, 'HOTEL002', '北京国贸酒店', '标准间', CURRENT_DATE + 7, 25, 10, 3, 12, 'NORMAL', 1, 'admin'),
(2, 'HOTEL003', '上海外滩酒店', '标准间', CURRENT_DATE + 5, 30, 15, 2, 13, 'NORMAL', 1, 'admin'),
(2, 'HOTEL003', '上海外滩酒店', '江景房', CURRENT_DATE + 5, 10, 6, 1, 3, 'TIGHT', 1, 'admin'),
(3, 'HOTEL004', '杭州西湖国宾馆', '标准间', CURRENT_DATE + 3, 15, 5, 0, 10, 'NORMAL', 1, 'admin'),
(4, 'HOTEL005', '西安钟楼饭店', '标准间', CURRENT_DATE + 10, 20, 2, 1, 17, 'NORMAL', 1, 'admin');

INSERT INTO inventory_detail (room_inventory_id, route_id, hotel_code, room_type, inventory_date, room_number, order_no, guest_name, room_status, clean_status, source_type, created_by) VALUES
(1, 1, 'HOTEL001', '标准间', CURRENT_DATE + 7, '801', 'TO202401001', '张三', 'OCCUPIED', 'CLEAN', 'ONLINE', 'admin'),
(1, 1, 'HOTEL001', '标准间', CURRENT_DATE + 7, '802', 'TO202401002', '李四', 'OCCUPIED', 'CLEAN', 'ONLINE', 'admin'),
(1, 1, 'HOTEL001', '标准间', CURRENT_DATE + 7, '803', NULL, NULL, 'VACANT', 'DIRTY', 'WALKIN', 'admin'),
(1, 1, 'HOTEL001', '标准间', CURRENT_DATE + 7, '805', 'TO202401003', '王五', 'OCCUPIED', 'CLEAN', 'AGENCY', 'admin'),
(1, 1, 'HOTEL001', '标准间', CURRENT_DATE + 7, '806', NULL, NULL, 'VACANT', 'CLEAN', NULL, 'admin'),
(2, 1, 'HOTEL001', '大床房', CURRENT_DATE + 7, '901', 'TO202401004', '赵六', 'OCCUPIED', 'CLEAN', 'ONLINE', 'admin'),
(2, 1, 'HOTEL001', '大床房', CURRENT_DATE + 7, '902', NULL, NULL, 'MAINTENANCE', 'DIRTY', NULL, 'admin'),
(6, 2, 'HOTEL003', '江景房', CURRENT_DATE + 5, '1201', 'TO202401005', '钱七', 'OCCUPIED', 'CLEAN', 'ONLINE', 'admin');

INSERT INTO cleaning_task (task_no, hotel_code, hotel_name, room_number, room_type, task_date, task_type, task_status, priority, assignee, created_by) VALUES
('CT202401001', 'HOTEL001', '北京王府井大酒店', '803', '标准间', CURRENT_DATE, 'DAILY_CLEAN', 'PENDING', 'NORMAL', '张阿姨', 'admin'),
('CT202401002', 'HOTEL001', '北京王府井大酒店', '902', '大床房', CURRENT_DATE, 'REPAIR_CLEAN', 'IN_PROGRESS', 'HIGH', '李师傅', 'admin'),
('CT202401003', 'HOTEL001', '北京王府井大酒店', '806', '标准间', CURRENT_DATE, 'DAILY_CLEAN', 'COMPLETED', 'NORMAL', '张阿姨', 'admin'),
('CT202401004', 'HOTEL003', '上海外滩酒店', '1201', '江景房', CURRENT_DATE + 1, 'TURN_DOWN', 'PENDING', 'LOW', '王阿姨', 'admin');

INSERT INTO tour_order (order_no, route_id, route_name, customer_name, customer_phone, travel_date, guest_count, room_count, total_amount, paid_amount, order_status, payment_status, refund_status, hotel_code, room_type, version, created_by) VALUES
('TO202401001', 1, '北京经典三日游', '张三', '13800138001', CURRENT_DATE + 7, 2, 1, 1999.00, 1999.00, 'CONFIRMED', 'PAID', 'NONE', 'HOTEL001', '标准间', 1, 'admin'),
('TO202401002', 1, '北京经典三日游', '李四', '13800138002', CURRENT_DATE + 7, 3, 2, 3998.00, 3998.00, 'CONFIRMED', 'PAID', 'NONE', 'HOTEL001', '标准间', 1, 'admin'),
('TO202401003', 1, '北京经典三日游', '王五', '13800138003', CURRENT_DATE + 7, 1, 1, 1999.00, 1999.00, 'PENDING', 'UNPAID', 'NONE', 'HOTEL001', '标准间', 1, 'admin'),
('TO202401004', 1, '北京经典三日游', '赵六', '13800138004', CURRENT_DATE + 7, 2, 1, 2299.00, 2299.00, 'CONFIRMED', 'PAID', 'NONE', 'HOTEL001', '大床房', 1, 'admin'),
('TO202401005', 2, '上海都市两日游', '钱七', '13800138005', CURRENT_DATE + 5, 2, 1, 1899.00, 1899.00, 'CONFIRMED', 'PAID', 'PROCESSING', 'HOTEL003', '江景房', 2, 'admin');

INSERT INTO refund_record (refund_no, order_no, route_id, refund_amount, refund_reason, refund_type, refund_status, created_by) VALUES
('RF202401001', 'TO202401005', 2, 1899.00, '行程变更', 'FULL_REFUND', 'PENDING', 'admin');

INSERT INTO config_version (config_type, config_key, config_name, version_no, config_value, status, effect_start_time, created_by) VALUES
('PRICE_RULE', 'peak_season', '旺季定价规则', 1, '{"peakSeason": ["07-01", "08-31"], "multiplier": 1.5}', 'ACTIVE', CURRENT_TIMESTAMP, 'admin'),
('INVENTORY_RULE', 'auto_release', '库存自动释放规则', 1, '{"releaseMinutes": 30, "notifyBeforeMinutes": 15}', 'ACTIVE', CURRENT_TIMESTAMP, 'admin'),
('REMINDER_RULE', 'room_conflict', '房态冲突提醒', 1, '{"conflictTypes": ["OVERBOOK", "STATUS_MISMATCH"], "notifyChannels": ["SMS", "EMAIL"]}', 'ACTIVE', CURRENT_TIMESTAMP, 'admin'),
('CLEANING_RULE', 'priority_config', '清洁任务优先级配置', 1, '{"highPriorityRooms": ["VIP", "SUITE"], "normalCleanHours": 2}', 'ACTIVE', CURRENT_TIMESTAMP, 'admin');

INSERT INTO reminder_rule (rule_code, rule_name, rule_type, trigger_condition, reminder_level, reminder_way, reminder_template, upgrade_condition, upgrade_rule_code, enabled, version, created_by) VALUES
('RULE_LOW_INVENTORY', '低库存提醒', 'INVENTORY', 'availableQuantity < 5', 'INFO', 'SYSTEM', '房型{roomType}库存不足，剩余{availableQuantity}间', 'availableQuantity < 2', 'RULE_CRITICAL_INVENTORY', true, 1, 'admin'),
('RULE_CRITICAL_INVENTORY', '库存紧急提醒', 'INVENTORY', 'availableQuantity < 2', 'WARN', 'SMS', '紧急提醒：房型{roomType}库存仅剩{availableQuantity}间，请及时补充', NULL, NULL, true, 1, 'admin'),
('RULE_ROOM_CONFLICT', '房态冲突提醒', 'ROOM_STATUS', 'roomStatus == CONFLICT', 'ERROR', 'SYSTEM', '房态冲突：{roomNumber}存在状态不一致问题', 'conflictDuration > 3600', 'RULE_CONFLICT_UPGRADE', true, 1, 'admin'),
('RULE_CONFLICT_UPGRADE', '房态冲突升级提醒', 'ROOM_STATUS', 'conflictDuration > 3600', 'CRITICAL', 'EMAIL', '房态冲突持续超过1小时，请立即处理：{roomNumber}', NULL, NULL, true, 1, 'admin'),
('RULE_CLEAN_DELAY', '清洁超时提醒', 'CLEANING', 'taskStatus == IN_PROGRESS and duration > 120', 'WARN', 'SYSTEM', '清洁任务超时：{taskNo}已超过预期时间', 'duration > 240', 'RULE_CLEAN_CRITICAL', true, 1, 'admin'),
('RULE_CLEAN_CRITICAL', '清洁严重超时提醒', 'CLEANING', 'duration > 240', 'ERROR', 'SMS', '清洁严重超时：{taskNo}请立即协调处理', NULL, NULL, true, 1, 'admin');

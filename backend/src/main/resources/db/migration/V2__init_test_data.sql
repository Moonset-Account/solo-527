-- ========================================
-- 初始化测试数据
-- ========================================

-- 插入系统用户（密码都是 123456，BCrypt加密）
INSERT INTO sys_user (username, password, real_name, phone, email, role, status) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '张主管', '13800000001', 'admin@property.com', 'ADMIN', 1),
('property01', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '李物业', '13800000002', 'property01@property.com', 'PROPERTY', 1),
('maint01', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '王师傅', '13800000003', 'maint01@property.com', 'MAINTENANCE', 1),
('maint02', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '赵师傅', '13800000004', 'maint02@property.com', 'MAINTENANCE', 1),
('inspector01', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '刘巡检', '13800000005', 'inspector01@property.com', 'INSPECTOR', 1),
('owner01', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '陈业主', '13900000001', 'owner01@test.com', 'OWNER', 1),
('owner02', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '林业主', '13900000002', 'owner02@test.com', 'OWNER', 1),
('owner03', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '黄业主', '13900000003', 'owner03@test.com', 'OWNER', 1);

-- 插入业主信息
INSERT INTO owner (user_id, id_card, contact_address, emergency_contact, emergency_phone) VALUES
(6, '440101199001011234', '阳光花园1栋101室', '陈先生', '13900000001'),
(7, '440101199102022345', '阳光花园1栋202室', '林女士', '13900000002'),
(8, '440101199203033456', '阳光花园2栋303室', '黄先生', '13900000003');

-- 插入楼栋数据
INSERT INTO building (building_no, building_name, total_floors, description) VALUES
('B001', '1栋', 18, '高层住宅楼'),
('B002', '2栋', 18, '高层住宅楼'),
('B003', '3栋', 11, '小高层住宅楼'),
('B004', '物业服务中心', 2, '物业服务办公地点');

-- 插入房间数据
INSERT INTO room (building_id, room_no, floor, area, room_type, owner_id, status) VALUES
(1, '101', 1, 89.50, '两室一厅', 1, 'OCCUPIED'),
(1, '102', 1, 75.00, '一室一厅', NULL, 'EMPTY'),
(1, '201', 2, 89.50, '两室一厅', NULL, 'EMPTY'),
(1, '202', 2, 105.00, '三室一厅', 2, 'OCCUPIED'),
(1, '301', 3, 89.50, '两室一厅', NULL, 'EMPTY'),
(2, '303', 3, 120.00, '三室两厅', 3, 'OCCUPIED'),
(2, '501', 5, 89.50, '两室一厅', NULL, 'EMPTY'),
(2, '502', 5, 105.00, '三室一厅', NULL, 'EMPTY'),
(3, '101', 1, 75.00, '一室一厅', NULL, 'EMPTY'),
(3, '201', 2, 89.50, '两室一厅', NULL, 'EMPTY');

-- 插入维修材料
INSERT INTO material (material_code, material_name, category, specification, unit, unit_price, stock_quantity, description) VALUES
('MAT001', '水龙头', '水暖配件', 'DN15 冷热通用', '个', 85.00, 50, '品牌铜质水龙头'),
('MAT002', 'LED灯泡', '电工材料', 'E27 12W 暖光', '个', 25.00, 100, '节能LED灯泡'),
('MAT003', '空气开关', '电工材料', 'C32 2P', '个', 45.00, 30, '正泰空气开关'),
('MAT004', 'PPR水管', '水暖配件', 'DN20 4米/根', '根', 35.00, 40, '伟星PPR热水管'),
('MAT005', '门锁芯', '五金配件', '通用型 C级', '个', 120.00, 20, '防盗门锁芯'),
('MAT006', '玻璃胶', '五金配件', '中性透明 300ml', '支', 18.00, 60, '道康宁玻璃胶'),
('MAT007', '电线', '电工材料', 'BV2.5平方 100米/卷', '卷', 180.00, 15, '国标铜芯电线'),
('MAT008', '地漏', '水暖配件', '不锈钢 防臭型', '个', 55.00, 25, '潜水艇地漏');

-- 插入巡检点
INSERT INTO inspection_point (point_code, point_name, location, category, check_items, status) VALUES
('IP001', '1栋电梯机房', '1栋楼顶电梯机房', '电梯', '["电梯运行声音","控制柜温度","应急照明","盘车手轮"]', 1),
('IP002', '1栋一层消防栓', '1栋1楼大厅', '消防设施', '["消防栓门","水带水枪","压力表","报警按钮"]', 1),
('IP003', '1栋配电室', '1栋负一层配电室', '水电', '["配电柜温度","指示灯","消防器材","卫生情况"]', 1),
('IP004', '小区主入口门禁', '小区大门岗亭', '安防设施', '["门禁系统","道闸","摄像头","岗亭设备"]', 1),
('IP005', '儿童游乐区', '小区中心花园', '公共区域', '["游乐设施","地面铺装","护栏","卫生情况"]', 1),
('IP006', '2栋消防通道', '2栋各楼层', '消防设施', '["通道畅通","应急照明","疏散指示","防火门"]', 1),
('IP007', '水泵房', '小区地下水泵房', '水电', '["水泵运行","压力表","阀门","积水情况"]', 1),
('IP008', '监控中心', '物业服务中心2楼', '安防设施', '["监控画面","录像存储","报警系统","UPS电源"]', 1);

-- 插入测试工单数据
INSERT INTO work_order (order_no, title, description, category, priority, status, owner_id, room_id, contact_person, contact_phone, appoint_time, assignee_id, assign_time, start_process_time, complete_time, expected_cost, actual_cost, handler_remark, has_photo) VALUES
('WO202401001', '客厅水龙头漏水', '客厅洗手盆水龙头漏水，需要更换', '水电维修', 'NORMAL', 'CLOSED', 1, 1, '陈业主', '13900000001', '2024-01-15 09:00:00', 3, '2024-01-15 08:30:00', '2024-01-15 09:15:00', '2024-01-15 10:30:00', 120.00, 100.00, '已更换水龙头，测试正常', 1),
('WO202401002', '卧室灯不亮', '主卧吸顶灯不亮，可能是灯泡坏了', '水电维修', 'LOW', 'COMPLETED', 1, 1, '陈业主', '13900000001', '2024-01-16 14:00:00', 3, '2024-01-16 10:00:00', '2024-01-16 14:30:00', '2024-01-16 15:00:00', 50.00, 25.00, '更换LED灯泡，正常使用', 1),
('WO202401003', '厨房水管爆裂紧急报修', '厨房冷水管爆裂，漏水严重！', '水电维修', 'URGENT', 'PROCESSING', 2, 4, '林女士', '13900000002', NULL, 4, '2024-01-17 08:05:00', '2024-01-17 08:20:00', NULL, 300.00, 0.00, '正在紧急抢修中', 0),
('WO202401004', '防盗门门锁故障', '入户门门锁打不开，钥匙插不进去', '门窗维修', 'HIGH', 'APPROVED', 3, 6, '黄先生', '13900000003', '2024-01-17 10:00:00', 3, '2024-01-17 09:00:00', NULL, NULL, 200.00, 0.00, NULL, 0),
('WO202401005', '墙面脱落需要修补', '客厅墙面有一处约1平方脱落', '墙面地面', 'LOW', 'PENDING', 2, 4, '林女士', '13900000002', '2024-01-20 00:00:00', NULL, NULL, NULL, NULL, 500.00, 0.00, NULL, 0),
('WO202401006', '电梯故障停运', '2栋电梯突然停运，有人被困', '公共设施', 'URGENT', 'PENDING', NULL, NULL, '物业值班', '13800000002', NULL, NULL, NULL, NULL, NULL, 0.00, 0.00, NULL, 0);

-- 插入工单历史记录
INSERT INTO work_order_history (work_order_id, operation, old_status, new_status, operator_id, operator_name, remark) VALUES
(1, 'CREATE', NULL, 'PENDING', 6, '陈业主', '业主在线提交报修'),
(1, 'APPROVE', 'PENDING', 'APPROVED', 2, '李物业', '审核通过，派单给王师傅'),
(1, 'ASSIGN', 'APPROVED', 'APPROVED', 2, '李物业', '指派王师傅处理'),
(1, 'START_PROCESS', 'APPROVED', 'PROCESSING', 3, '王师傅', '开始上门处理'),
(1, 'COMPLETE', 'PROCESSING', 'COMPLETED', 3, '王师傅', '处理完成，等待业主验收'),
(1, 'CLOSE', 'COMPLETED', 'CLOSED', 6, '陈业主', '业主验收通过，已上传处理照片');

-- 插入工单材料使用记录
INSERT INTO work_order_material (work_order_id, material_id, material_name, specification, unit, quantity, unit_price, total_price) VALUES
(1, 1, '水龙头', 'DN15 冷热通用', '个', 1, 85.00, 85.00),
(1, 6, '玻璃胶', '中性透明 300ml', '支', 1, 18.00, 18.00),
(2, 2, 'LED灯泡', 'E27 12W 暖光', '个', 1, 25.00, 25.00),
(3, 4, 'PPR水管', 'DN20 4米/根', '根', 2, 35.00, 70.00);

-- 插入满意度评价
INSERT INTO satisfaction (work_order_id, owner_id, overall_score, response_speed_score, service_attitude_score, quality_score, content, is_solved) VALUES
(1, 1, 5, 5, 5, 5, '师傅上门很及时，服务态度好，维修质量也不错，非常满意！', 1),
(2, 1, 4, 5, 4, 4, '整体还可以，就是预约时间稍微等了下', 1);

-- 插入巡检记录
INSERT INTO inspection_record (record_no, point_id, inspector_id, check_time, status, abnormal_description, is_handled, handle_remark, location_lng, location_lat) VALUES
('IR20240117001', 1, 5, '2024-01-17 08:00:00', 'NORMAL', NULL, 1, '一切正常', 113.3245678, 23.1234567),
('IR20240117002', 2, 5, '2024-01-17 08:15:00', 'ABNORMAL', '消防栓玻璃有裂纹', 1, '已登记，安排更换', 113.3245600, 23.1234500),
('IR20240117003', 3, 5, '2024-01-17 08:30:00', 'NORMAL', NULL, 1, '温度正常', 113.3245500, 23.1234400),
('IR20240117004', 4, 5, '2024-01-17 09:00:00', 'NORMAL', NULL, 1, '设备运行正常', 113.3244000, 23.1233000);

-- 插入站内消息
INSERT INTO sys_message (receiver_id, sender_id, message_type, title, content, related_type, related_id, priority) VALUES
(1, 6, 'ORDER_NEW', '新报修工单', '陈业主提交了新的报修工单：客厅水龙头漏水，请及时处理', 'WORK_ORDER', 1, 'NORMAL'),
(3, 2, 'ORDER_ASSIGN', '工单派单通知', '您有新的工单待处理：WO202401001 客厅水龙头漏水', 'WORK_ORDER', 1, 'NORMAL'),
(6, 3, 'ORDER_COMPLETE', '工单完成通知', '您的工单 WO202401001 已处理完成，请及时验收评价', 'WORK_ORDER', 1, 'NORMAL'),
(4, 2, 'ORDER_ASSIGN', '紧急工单派单', '紧急工单！WO202401003 厨房水管爆裂，请立即前往处理！', 'WORK_ORDER', 3, 'URGENT'),
(3, 2, 'ORDER_ASSIGN', '工单派单通知', '您有新的工单待处理：WO202401004 防盗门门锁故障', 'WORK_ORDER', 4, 'HIGH'),
(1, NULL, 'URGENT_REMIND', '紧急工单提醒', 'WO202401006 2栋电梯故障停运，需要立即处理！', 'WORK_ORDER', 6, 'URGENT'),
(2, NULL, 'URGENT_REMIND', '紧急工单提醒', 'WO202401006 2栋电梯故障停运，请立即派单处理！', 'WORK_ORDER', 6, 'URGENT');

-- 插入附件（模拟处理照片）
INSERT INTO attachment (biz_type, biz_id, file_name, original_name, file_path, file_url, file_size, file_type, mime_type, uploader_id) VALUES
('WORK_ORDER', 1, 'wo1_photo1.jpg', '维修前照片.jpg', '/uploads/workorder/wo1_photo1.jpg', 'http://localhost:8080/api/files/workorder/wo1_photo1.jpg', 204800, 'image', 'image/jpeg', 3),
('WORK_ORDER', 1, 'wo1_photo2.jpg', '维修后照片.jpg', '/uploads/workorder/wo1_photo2.jpg', 'http://localhost:8080/api/files/workorder/wo1_photo2.jpg', 256000, 'image', 'image/jpeg', 3),
('WORK_ORDER', 2, 'wo2_photo1.jpg', '换灯照片.jpg', '/uploads/workorder/wo2_photo1.jpg', 'http://localhost:8080/api/files/workorder/wo2_photo1.jpg', 102400, 'image', 'image/jpeg', 3),
('INSPECTION', 2, 'ir2_photo1.jpg', '消防栓裂纹.jpg', '/uploads/inspection/ir2_photo1.jpg', 'http://localhost:8080/api/files/inspection/ir2_photo1.jpg', 153600, 'image', 'image/jpeg', 5);

-- 插入费用记录
INSERT INTO expense_record (expense_no, work_order_id, expense_type, amount, description, payer_id, pay_status, pay_time, pay_method, operator_id) VALUES
('EXP202401001', 1, 'MATERIAL', 103.00, '水龙头+玻璃胶材料费', 1, 'PAID', '2024-01-15 10:35:00', 'WECHAT', 2),
('EXP202401001', 1, 'LABOR', 50.00, '上门维修人工费', 1, 'PAID', '2024-01-15 10:35:00', 'WECHAT', 2),
('EXP202401002', 2, 'MATERIAL', 25.00, 'LED灯泡材料费', 1, 'PAID', '2024-01-16 15:05:00', 'ALIPAY', 2),
('EXP202401002', 2, 'LABOR', 30.00, '上门维修人工费', 1, 'PAID', '2024-01-16 15:05:00', 'ALIPAY', 2),
('EXP202401003', 3, 'MATERIAL', 70.00, 'PPR水管材料费', 2, 'UNPAID', NULL, NULL, 2);

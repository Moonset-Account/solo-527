-- 初始化用户
INSERT INTO users (username, password, name, role, email, phone, is_active) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '管理员', 'INTERNAL', 'admin@ceramic.com', '13800000001', true),
('staff', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '工作人员', 'INTERNAL', 'staff@ceramic.com', '13800000002', true);

-- 初始化泥料
INSERT INTO clays (name, code, temperature_zone, min_temperature, max_temperature, description, is_active) VALUES
('紫砂泥', 'CLAY_ZS', 'HIGH', 1180, 1230, '高温紫砂泥料', true),
('瓷泥', 'CLAY_CI', 'HIGH', 1280, 1320, '高温白瓷泥', true),
('陶泥', 'CLAY_TAO', 'LOW', 1050, 1100, '低温陶泥', true),
('青瓷泥', 'CLAY_QC', 'MIDDLE', 1180, 1230, '中温青瓷泥', true);

-- 初始化釉料
INSERT INTO glazes (name, code, temperature_zone, min_temperature, max_temperature, atmosphere, description, is_active) VALUES
('透明釉', 'GLAZE_TM', 'HIGH', 1280, 1320, 'OXIDATION', '高温透明釉', true),
('紫砂釉', 'GLAZE_ZS', 'HIGH', 1180, 1230, 'OXIDATION', '紫砂专用釉', true),
('低温釉', 'GLAZE_DW', 'LOW', 1050, 1100, 'OXIDATION', '低温彩釉', true),
('青瓷釉', 'GLAZE_QC', 'MIDDLE', 1180, 1230, 'REDUCTION', '青瓷还原釉', true);

-- 初始化烧成曲线
INSERT INTO firing_curves (name, code, temperature_zone, target_temperature, total_duration, curve_data, description, is_public, created_by) VALUES
('标准高温曲线', 'CURVE_HIGH_STD', 'HIGH', 1300, 480, 
 '{"segments":[{"duration":60,"target":200},{"duration":120,"target":600},{"duration":180,"target":1300},{"duration":60,"soak":true}]}',
 '标准高温氧化烧曲线', true, 1),
('标准中温曲线', 'CURVE_MID_STD', 'MIDDLE', 1220, 420,
 '{"segments":[{"duration":60,"target":200},{"duration":90,"target":600},{"duration":180,"target":1220},{"duration":90,"soak":true}]}',
 '标准中温曲线', true, 1),
('标准低温曲线', 'CURVE_LOW_STD', 'LOW', 1080, 360,
 '{"segments":[{"duration":60,"target":200},{"duration":90,"target":600},{"duration":120,"target":1080},{"duration":90,"soak":true}]}',
 '标准低温素烧曲线', true, 1);

-- 初始化窑炉
INSERT INTO kilns (name, code, capacity, max_temperature, temperature_zones, status, description) VALUES
('1号窑', 'KILN_001', 50, 1350, ARRAY['LOW', 'MIDDLE', 'HIGH'], 'IDLE', '大型气窑，支持全温区'),
('2号窑', 'KILN_002', 30, 1250, ARRAY['LOW', 'MIDDLE'], 'IDLE', '中型电窑，中低温'),
('3号窑', 'KILN_003', 20, 1100, ARRAY['LOW'], 'IDLE', '小型试验窑，仅低温');

-- 初始化学员
INSERT INTO students (name, phone, email, member_level) VALUES
('张三', '13900000001', 'zhangsan@example.com', 'VIP'),
('李四', '13900000002', 'lisi@example.com', 'NORMAL'),
('王五', '13900000003', 'wangwu@example.com', 'NORMAL');

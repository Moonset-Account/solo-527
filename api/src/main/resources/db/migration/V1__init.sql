CREATE DATABASE IF NOT EXISTS energy_dashboard DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE energy_dashboard;

CREATE TABLE `user` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(20) NOT NULL DEFAULT 'user',
    `real_name` VARCHAR(50),
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `zone` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `source_document_no` VARCHAR(50),
    `remark` VARCHAR(500),
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `meter` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `meter_no` VARCHAR(50) NOT NULL,
    `location` VARCHAR(200),
    `zone_id` BIGINT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'online',
    `communication_params` VARCHAR(500),
    `source_document_no` VARCHAR(50),
    `remark` VARCHAR(500),
    `last_sync_time` DATETIME,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_meter_no` (`meter_no`),
    KEY `idx_zone_id` (`zone_id`),
    CONSTRAINT `fk_meter_zone` FOREIGN KEY (`zone_id`) REFERENCES `zone` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `energy_data` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `meter_id` BIGINT NOT NULL,
    `value` DECIMAL(15,2) NOT NULL,
    `unit` VARCHAR(20) NOT NULL,
    `data_type` VARCHAR(20) NOT NULL,
    `recorded_at` DATETIME NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_meter_id` (`meter_id`),
    KEY `idx_data_type` (`data_type`),
    KEY `idx_recorded_at` (`recorded_at`),
    CONSTRAINT `fk_energy_data_meter` FOREIGN KEY (`meter_id`) REFERENCES `meter` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `alarm` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(50) NOT NULL,
    `level` VARCHAR(20) NOT NULL,
    `meter_id` BIGINT,
    `message` VARCHAR(500),
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `assignee` VARCHAR(50),
    `occurred_at` DATETIME NOT NULL,
    `confirmed_at` DATETIME,
    `resolved_at` DATETIME,
    `response_duration` BIGINT,
    `root_cause` VARCHAR(500),
    `source_document_no` VARCHAR(50),
    `remark` VARCHAR(500),
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_alarm_status` (`status`),
    KEY `idx_alarm_level` (`level`),
    KEY `idx_alarm_type` (`type`),
    KEY `idx_alarm_meter` (`meter_id`),
    CONSTRAINT `fk_alarm_meter` FOREIGN KEY (`meter_id`) REFERENCES `meter` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `subsidy` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(50) NOT NULL,
    `amount` DECIMAL(15,2) NOT NULL,
    `source_document_no` VARCHAR(50),
    `remark` VARCHAR(500),
    `created_by` VARCHAR(50),
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `approved_by` VARCHAR(50),
    `approved_at` DATETIME,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    PRIMARY KEY (`id`),
    KEY `idx_subsidy_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sync_task` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(50) NOT NULL,
    `meter_id` BIGINT,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `triggered_at` DATETIME NOT NULL,
    `completed_at` DATETIME,
    `duration` BIGINT,
    `fail_reason` VARCHAR(500),
    `friendly_fail_reason` VARCHAR(500),
    `fail_category` VARCHAR(50),
    `retry_count` INT DEFAULT 0,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_sync_task_status` (`status`),
    KEY `idx_sync_task_meter` (`meter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sync_retry_log` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `sync_task_id` BIGINT NOT NULL,
    `retry_at` DATETIME NOT NULL,
    `success` TINYINT(1) NOT NULL DEFAULT 0,
    `message` VARCHAR(500),
    PRIMARY KEY (`id`),
    KEY `idx_sync_retry_task` (`sync_task_id`),
    CONSTRAINT `fk_sync_retry_task` FOREIGN KEY (`sync_task_id`) REFERENCES `sync_task` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `user` (`username`, `password_hash`, `role`, `real_name`, `created_at`) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin', '系统管理员', '2024-01-01 00:00:00');

INSERT INTO `zone` (`name`, `source_document_no`, `remark`, `created_at`, `updated_at`) VALUES
('教学楼A区', 'DOC-Z-001', '教学楼A区包含1-3号楼', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
('教学楼B区', 'DOC-Z-002', '教学楼B区包含4-6号楼', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
('实验楼区', 'DOC-Z-003', '实验楼区域包含物理、化学、生物实验室', '2024-01-01 00:00:00', '2024-01-01 00:00:00'),
('宿舍楼区', 'DOC-Z-004', '学生宿舍1-5栋', '2024-01-01 00:00:00', '2024-01-01 00:00:00');

INSERT INTO `meter` (`meter_no`, `location`, `zone_id`, `status`, `communication_params`, `source_document_no`, `remark`, `last_sync_time`, `created_at`, `updated_at`) VALUES
('E-A101', 'A区1号楼配电室', 1, 'online', '{"protocol":"Modbus","baudRate":9600}', 'DOC-M-001', 'A区1号楼总电表', '2024-06-15 10:30:00', '2024-01-01 00:00:00', '2024-06-15 10:30:00'),
('E-A102', 'A区2号楼配电室', 1, 'online', '{"protocol":"Modbus","baudRate":9600}', 'DOC-M-002', 'A区2号楼总电表', '2024-06-15 10:30:00', '2024-01-01 00:00:00', '2024-06-15 10:30:00'),
('E-A103', 'A区3号楼配电室', 1, 'offline', '{"protocol":"Modbus","baudRate":9600}', 'DOC-M-003', 'A区3号楼总电表', '2024-06-14 08:00:00', '2024-01-01 00:00:00', '2024-06-14 08:00:00'),
('E-B201', 'B区4号楼配电室', 2, 'online', '{"protocol":"DLT645","baudRate":2400}', 'DOC-M-004', 'B区4号楼总电表', '2024-06-15 10:30:00', '2024-01-01 00:00:00', '2024-06-15 10:30:00'),
('E-B202', 'B区5号楼配电室', 2, 'online', '{"protocol":"DLT645","baudRate":2400}', 'DOC-M-005', 'B区5号楼总电表', '2024-06-15 10:30:00', '2024-01-01 00:00:00', '2024-06-15 10:30:00'),
('E-B203', 'B区6号楼配电室', 2, 'online', '{"protocol":"DLT645","baudRate":2400}', 'DOC-M-006', 'B区6号楼总电表', '2024-06-15 10:30:00', '2024-01-01 00:00:00', '2024-06-15 10:30:00'),
('W-A101', 'A区1号楼水泵房', 1, 'online', '{"protocol":"Modbus","baudRate":9600}', 'DOC-M-007', 'A区1号楼总水表', '2024-06-15 10:00:00', '2024-01-01 00:00:00', '2024-06-15 10:00:00'),
('W-A102', 'A区2号楼水泵房', 1, 'online', '{"protocol":"Modbus","baudRate":9600}', 'DOC-M-008', 'A区2号楼总水表', '2024-06-15 10:00:00', '2024-01-01 00:00:00', '2024-06-15 10:00:00'),
('W-B201', 'B区4号楼水泵房', 2, 'online', '{"protocol":"Modbus","baudRate":9600}', 'DOC-M-009', 'B区4号楼总水表', '2024-06-15 10:00:00', '2024-01-01 00:00:00', '2024-06-15 10:00:00'),
('G-E301', '实验楼配电室', 3, 'online', '{"protocol":"Modbus","baudRate":9600}', 'DOC-M-010', '实验楼总电表', '2024-06-15 10:30:00', '2024-01-01 00:00:00', '2024-06-15 10:30:00'),
('G-E302', '实验楼燃气表间', 3, 'online', '{"protocol":"Modbus","baudRate":9600}', 'DOC-M-011', '实验楼总燃气表', '2024-06-15 09:00:00', '2024-01-01 00:00:00', '2024-06-15 09:00:00'),
('E-D401', '宿舍1栋配电室', 4, 'online', '{"protocol":"DLT645","baudRate":2400}', 'DOC-M-012', '宿舍1栋总电表', '2024-06-15 10:30:00', '2024-01-01 00:00:00', '2024-06-15 10:30:00'),
('W-D401', '宿舍1栋水泵房', 4, 'warning', '{"protocol":"DLT645","baudRate":2400}', 'DOC-M-013', '宿舍1栋总水表', '2024-06-15 08:00:00', '2024-01-01 00:00:00', '2024-06-15 08:00:00');

INSERT INTO `energy_data` (`meter_id`, `value`, `unit`, `data_type`, `recorded_at`, `created_at`) VALUES
(1, 1250.50, 'kWh', 'electricity', '2024-06-14 00:00:00', '2024-06-14 00:05:00'),
(1, 1180.30, 'kWh', 'electricity', '2024-06-14 01:00:00', '2024-06-14 01:05:00'),
(1, 980.20, 'kWh', 'electricity', '2024-06-14 02:00:00', '2024-06-14 02:05:00'),
(1, 950.10, 'kWh', 'electricity', '2024-06-14 03:00:00', '2024-06-14 03:05:00'),
(1, 920.50, 'kWh', 'electricity', '2024-06-14 04:00:00', '2024-06-14 04:05:00'),
(1, 1100.00, 'kWh', 'electricity', '2024-06-14 05:00:00', '2024-06-14 05:05:00'),
(1, 1500.20, 'kWh', 'electricity', '2024-06-14 06:00:00', '2024-06-14 06:05:00'),
(1, 2100.80, 'kWh', 'electricity', '2024-06-14 07:00:00', '2024-06-14 07:05:00'),
(1, 2800.50, 'kWh', 'electricity', '2024-06-14 08:00:00', '2024-06-14 08:05:00'),
(1, 3200.30, 'kWh', 'electricity', '2024-06-14 09:00:00', '2024-06-14 09:05:00'),
(1, 3500.10, 'kWh', 'electricity', '2024-06-14 10:00:00', '2024-06-14 10:05:00'),
(1, 3400.60, 'kWh', 'electricity', '2024-06-14 11:00:00', '2024-06-14 11:05:00'),
(1, 3100.40, 'kWh', 'electricity', '2024-06-14 12:00:00', '2024-06-14 12:05:00'),
(1, 3300.20, 'kWh', 'electricity', '2024-06-14 13:00:00', '2024-06-14 13:05:00'),
(1, 3500.80, 'kWh', 'electricity', '2024-06-14 14:00:00', '2024-06-14 14:05:00'),
(1, 3200.50, 'kWh', 'electricity', '2024-06-14 15:00:00', '2024-06-14 15:05:00'),
(1, 2900.30, 'kWh', 'electricity', '2024-06-14 16:00:00', '2024-06-14 16:05:00'),
(1, 2400.10, 'kWh', 'electricity', '2024-06-14 17:00:00', '2024-06-14 17:05:00'),
(1, 2000.60, 'kWh', 'electricity', '2024-06-14 18:00:00', '2024-06-14 18:05:00'),
(1, 1800.40, 'kWh', 'electricity', '2024-06-14 19:00:00', '2024-06-14 19:05:00'),
(1, 1600.20, 'kWh', 'electricity', '2024-06-14 20:00:00', '2024-06-14 20:05:00'),
(1, 1400.80, 'kWh', 'electricity', '2024-06-14 21:00:00', '2024-06-14 21:05:00'),
(1, 1300.50, 'kWh', 'electricity', '2024-06-14 22:00:00', '2024-06-14 22:05:00'),
(1, 1280.30, 'kWh', 'electricity', '2024-06-14 23:00:00', '2024-06-14 23:05:00'),
(1, 1230.50, 'kWh', 'electricity', '2024-06-15 00:00:00', '2024-06-15 00:05:00'),
(1, 1190.30, 'kWh', 'electricity', '2024-06-15 01:00:00', '2024-06-15 01:05:00'),
(1, 960.20, 'kWh', 'electricity', '2024-06-15 02:00:00', '2024-06-15 02:05:00'),
(1, 940.10, 'kWh', 'electricity', '2024-06-15 03:00:00', '2024-06-15 03:05:00'),
(1, 910.50, 'kWh', 'electricity', '2024-06-15 04:00:00', '2024-06-15 04:05:00'),
(1, 1080.00, 'kWh', 'electricity', '2024-06-15 05:00:00', '2024-06-15 05:05:00'),
(1, 1480.20, 'kWh', 'electricity', '2024-06-15 06:00:00', '2024-06-15 06:05:00'),
(1, 2050.80, 'kWh', 'electricity', '2024-06-15 07:00:00', '2024-06-15 07:05:00'),
(1, 2750.50, 'kWh', 'electricity', '2024-06-15 08:00:00', '2024-06-15 08:05:00'),
(1, 3150.30, 'kWh', 'electricity', '2024-06-15 09:00:00', '2024-06-15 09:05:00'),
(1, 3450.10, 'kWh', 'electricity', '2024-06-15 10:00:00', '2024-06-15 10:05:00'),
(7, 45.20, 'm³', 'water', '2024-06-14 00:00:00', '2024-06-14 00:05:00'),
(7, 38.50, 'm³', 'water', '2024-06-14 06:00:00', '2024-06-14 06:05:00'),
(7, 62.30, 'm³', 'water', '2024-06-14 12:00:00', '2024-06-14 12:05:00'),
(7, 55.80, 'm³', 'water', '2024-06-14 18:00:00', '2024-06-14 18:05:00'),
(7, 42.10, 'm³', 'water', '2024-06-15 00:00:00', '2024-06-15 00:05:00'),
(7, 40.30, 'm³', 'water', '2024-06-15 06:00:00', '2024-06-15 06:05:00'),
(7, 58.60, 'm³', 'water', '2024-06-15 12:00:00', '2024-06-15 12:05:00'),
(11, 120.50, 'm³', 'gas', '2024-06-14 00:00:00', '2024-06-14 00:05:00'),
(11, 95.30, 'm³', 'gas', '2024-06-14 06:00:00', '2024-06-14 06:05:00'),
(11, 180.20, 'm³', 'gas', '2024-06-14 12:00:00', '2024-06-14 12:05:00'),
(11, 150.80, 'm³', 'gas', '2024-06-14 18:00:00', '2024-06-14 18:05:00'),
(11, 110.50, 'm³', 'gas', '2024-06-15 00:00:00', '2024-06-15 00:05:00'),
(11, 88.30, 'm³', 'gas', '2024-06-15 06:00:00', '2024-06-15 06:05:00'),
(11, 175.60, 'm³', 'gas', '2024-06-15 12:00:00', '2024-06-15 12:05:00'),
(4, 980.40, 'kWh', 'electricity', '2024-06-14 08:00:00', '2024-06-14 08:05:00'),
(4, 1250.60, 'kWh', 'electricity', '2024-06-14 12:00:00', '2024-06-14 12:05:00'),
(4, 1180.20, 'kWh', 'electricity', '2024-06-14 18:00:00', '2024-06-14 18:05:00'),
(4, 1020.50, 'kWh', 'electricity', '2024-06-15 08:00:00', '2024-06-15 08:05:00'),
(4, 1300.30, 'kWh', 'electricity', '2024-06-15 12:00:00', '2024-06-15 12:05:00'),
(12, 2200.50, 'kWh', 'electricity', '2024-06-14 08:00:00', '2024-06-14 08:05:00'),
(12, 3100.30, 'kWh', 'electricity', '2024-06-14 12:00:00', '2024-06-14 12:05:00'),
(12, 2800.80, 'kWh', 'electricity', '2024-06-14 18:00:00', '2024-06-14 18:05:00'),
(12, 2100.40, 'kWh', 'electricity', '2024-06-15 08:00:00', '2024-06-15 08:05:00'),
(12, 3050.60, 'kWh', 'electricity', '2024-06-15 12:00:00', '2024-06-15 12:05:00');

INSERT INTO `alarm` (`type`, `level`, `meter_id`, `message`, `status`, `assignee`, `occurred_at`, `confirmed_at`, `resolved_at`, `response_duration`, `root_cause`, `source_document_no`, `remark`, `created_at`, `updated_at`) VALUES
('over_limit', 'high', 1, 'A区1号楼用电量超过日限额5000kWh', 'resolved', '张工', '2024-06-14 14:00:00', '2024-06-14 14:30:00', '2024-06-14 16:00:00', 120, '空调系统运行时间过长', 'DOC-A-001', '已安排优化空调运行策略', '2024-06-14 14:00:00', '2024-06-14 16:00:00'),
('communication_failure', 'high', 3, 'A区3号楼电表通讯中断', 'confirmed', '李工', '2024-06-14 08:00:00', '2024-06-14 09:00:00', NULL, 60, NULL, 'DOC-A-002', '现场检查中', '2024-06-14 08:00:00', '2024-06-14 09:00:00'),
('abnormal_reading', 'medium', 7, 'A区1号楼水表读数异常偏高', 'resolved', '王工', '2024-06-14 12:00:00', '2024-06-14 12:15:00', '2024-06-14 14:00:00', 15, '水管漏水', 'DOC-A-003', '已修复漏水点', '2024-06-14 12:00:00', '2024-06-14 14:00:00'),
('over_limit', 'medium', 11, '实验楼燃气用量超过日限额500m³', 'pending', NULL, '2024-06-15 12:00:00', NULL, NULL, NULL, NULL, 'DOC-A-004', NULL, '2024-06-15 12:00:00', '2024-06-15 12:00:00'),
('equipment_fault', 'high', 13, '宿舍1栋水表设备故障报警', 'confirmed', '赵工', '2024-06-15 08:00:00', '2024-06-15 08:20:00', NULL, 20, NULL, 'DOC-A-005', '等待更换设备', '2024-06-15 08:00:00', '2024-06-15 08:20:00'),
('abnormal_reading', 'low', 4, 'B区4号楼电表读数波动异常', 'resolved', '张工', '2024-06-14 10:00:00', '2024-06-14 10:30:00', '2024-06-14 11:00:00', 30, '传感器灵敏度漂移', 'DOC-A-006', '已校准传感器', '2024-06-14 10:00:00', '2024-06-14 11:00:00'),
('communication_failure', 'medium', 13, '宿舍1栋水表通讯不稳定', 'pending', NULL, '2024-06-15 08:00:00', NULL, NULL, NULL, NULL, 'DOC-A-007', NULL, '2024-06-15 08:00:00', '2024-06-15 08:00:00'),
('over_limit', 'low', 12, '宿舍1栋用电量接近日限额', 'pending', NULL, '2024-06-15 13:00:00', NULL, NULL, NULL, NULL, 'DOC-A-008', NULL, '2024-06-15 13:00:00', '2024-06-15 13:00:00');

INSERT INTO `subsidy` (`type`, `amount`, `source_document_no`, `remark`, `created_by`, `created_at`, `approved_by`, `approved_at`, `status`) VALUES
('节能改造', 50000.00, 'DOC-S-001', 'A区教学楼LED照明改造补贴', 'admin', '2024-03-01 00:00:00', '财务主管', '2024-03-05 00:00:00', 'approved'),
('节能改造', 120000.00, 'DOC-S-002', '实验楼中央空调系统节能改造补贴', 'admin', '2024-03-15 00:00:00', '财务主管', '2024-03-20 00:00:00', 'approved'),
('新能源', 80000.00, 'DOC-S-003', '宿舍楼区太阳能热水系统建设补贴', 'admin', '2024-04-01 00:00:00', NULL, NULL, 'pending'),
('新能源', 200000.00, 'DOC-S-004', '校园光伏发电项目建设补贴', 'admin', '2024-04-10 00:00:00', '财务主管', '2024-04-15 00:00:00', 'approved'),
('节能改造', 35000.00, 'DOC-S-005', 'B区教学楼智能电表升级补贴', 'admin', '2024-05-01 00:00:00', NULL, NULL, 'pending');

INSERT INTO `sync_task` (`type`, `meter_id`, `status`, `triggered_at`, `completed_at`, `duration`, `fail_reason`, `friendly_fail_reason`, `fail_category`, `retry_count`, `created_at`) VALUES
('meter_reading', 1, 'completed', '2024-06-15 10:30:00', '2024-06-15 10:31:00', 60000, NULL, NULL, NULL, 0, '2024-06-15 10:30:00'),
('meter_reading', 2, 'completed', '2024-06-15 10:30:00', '2024-06-15 10:31:05', 65000, NULL, NULL, NULL, 0, '2024-06-15 10:30:00'),
('meter_reading', 3, 'failed', '2024-06-14 08:00:00', '2024-06-14 08:01:00', 60000, 'ConnectionRefusedException: Modbus connection refused', '设备通讯连接被拒绝，请检查设备电源及线路', 'communication', 2, '2024-06-14 08:00:00'),
('meter_config', 4, 'completed', '2024-06-15 10:30:00', '2024-06-15 10:31:10', 70000, NULL, NULL, NULL, 0, '2024-06-15 10:30:00'),
('meter_config', 5, 'completed', '2024-06-15 10:30:00', '2024-06-15 10:31:20', 80000, NULL, NULL, NULL, 0, '2024-06-15 10:30:00'),
('alarm_sync', 6, 'completed', '2024-06-15 10:30:00', '2024-06-15 10:31:15', 75000, NULL, NULL, NULL, 0, '2024-06-15 10:30:00'),
('alarm_sync', 7, 'completed', '2024-06-15 10:00:00', '2024-06-15 10:00:45', 45000, NULL, NULL, NULL, 0, '2024-06-15 10:00:00'),
('meter_reading', 8, 'failed', '2024-06-15 10:00:00', '2024-06-15 10:01:00', 60000, 'TimeoutException: Read timeout after 30000ms', '数据读取超时，设备可能响应缓慢', 'timeout', 1, '2024-06-15 10:00:00'),
('meter_config', 9, 'completed', '2024-06-15 10:00:00', '2024-06-15 10:00:50', 50000, NULL, NULL, NULL, 0, '2024-06-15 10:00:00'),
('alarm_sync', 11, 'failed', '2024-06-15 09:00:00', '2024-06-15 09:01:30', 90000, 'ChecksumException: Data checksum mismatch', '数据校验失败，传输数据可能存在干扰', 'data', 3, '2024-06-15 09:00:00'),
('meter_reading', 12, 'completed', '2024-06-15 10:30:00', '2024-06-15 10:31:00', 60000, NULL, NULL, NULL, 0, '2024-06-15 10:30:00'),
('meter_reading', 13, 'failed', '2024-06-15 08:00:00', '2024-06-15 08:00:30', 30000, 'DeviceNotRespondingException: No response from device', '设备无响应，请检查设备状态', 'equipment', 2, '2024-06-15 08:00:00');

INSERT INTO `sync_retry_log` (`sync_task_id`, `retry_at`, `success`, `message`) VALUES
(3, '2024-06-14 09:00:00', 0, 'Retry 1: Connection still refused'),
(3, '2024-06-14 10:00:00', 0, 'Retry 2: Connection still refused'),
(8, '2024-06-15 10:30:00', 1, 'Retry 1: Read successful on second attempt'),
(10, '2024-06-15 09:30:00', 0, 'Retry 1: Checksum still mismatch'),
(10, '2024-06-15 10:00:00', 0, 'Retry 2: Checksum still mismatch'),
(10, '2024-06-15 10:30:00', 1, 'Retry 3: Checksum passed'),
(12, '2024-06-15 08:30:00', 0, 'Retry 1: Device still not responding'),
(12, '2024-06-15 09:00:00', 0, 'Retry 2: Device still not responding');

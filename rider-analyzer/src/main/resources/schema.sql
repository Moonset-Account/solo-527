CREATE DATABASE IF NOT EXISTS rider_analyzer DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE rider_analyzer;

CREATE TABLE IF NOT EXISTS `rider` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(64) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'ONLINE',
    `station_id` BIGINT,
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `station` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(128) NOT NULL,
    `address` VARCHAR(256),
    `lng` DECIMAL(10,6),
    `lat` DECIMAL(10,6),
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `delivery_order` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `order_no` VARCHAR(64) NOT NULL,
    `rider_id` BIGINT,
    `station_id` BIGINT,
    `receiver_name` VARCHAR(64),
    `receiver_phone` VARCHAR(20),
    `receiver_address` VARCHAR(256),
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `promise_time` DATETIME,
    `accept_time` DATETIME,
    `pickup_time` DATETIME,
    `deliver_time` DATETIME,
    `sign_time` DATETIME,
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_rider_status` (`rider_id`, `status`),
    INDEX `idx_station` (`station_id`),
    INDEX `idx_status_create` (`status`, `create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `station_inventory` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `station_id` BIGINT NOT NULL,
    `sku_code` VARCHAR(64) NOT NULL,
    `sku_name` VARCHAR(128),
    `quantity` INT NOT NULL DEFAULT 0,
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_station` (`station_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sign_record` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT NOT NULL,
    `expected_qty` INT NOT NULL DEFAULT 0,
    `actual_qty` INT NOT NULL DEFAULT 0,
    `diff_qty` INT NOT NULL DEFAULT 0,
    `diff_reason` VARCHAR(256),
    `sign_type` VARCHAR(20),
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `exception_record` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `description` VARCHAR(512),
    `temp_anomaly_reason` VARCHAR(256),
    `handle_duration_min` INT,
    `handler_name` VARCHAR(64),
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `resolve_time` DATETIME,
    PRIMARY KEY (`id`),
    INDEX `idx_type_status` (`type`, `status`),
    INDEX `idx_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `operation_log` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT,
    `user_name` VARCHAR(64),
    `module` VARCHAR(64),
    `action` VARCHAR(128),
    `detail` TEXT,
    `ip` VARCHAR(45),
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_module_create` (`module`, `create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `batch_import_record` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `batch_no` VARCHAR(64) NOT NULL,
    `type` VARCHAR(32),
    `total_count` INT NOT NULL DEFAULT 0,
    `success_count` INT NOT NULL DEFAULT 0,
    `fail_count` INT NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `error_file_path` VARCHAR(256),
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_batch_no` (`batch_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `timeliness_node` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT NOT NULL,
    `node_type` VARCHAR(20) NOT NULL,
    `plan_time` DATETIME,
    `actual_time` DATETIME,
    `is_timeout` TINYINT NOT NULL DEFAULT 0,
    `timeout_minutes` INT NOT NULL DEFAULT 0,
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_order` (`order_id`),
    INDEX `idx_timeout_create` (`is_timeout`, `create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `settlement_record` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT NOT NULL,
    `rider_id` BIGINT NOT NULL,
    `amount` DECIMAL(10,2) NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `accuracy_flag` TINYINT NOT NULL DEFAULT 1,
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_order` (`order_id`),
    INDEX `idx_rider` (`rider_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

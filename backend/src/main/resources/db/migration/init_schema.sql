-- ============================================================
-- 跨部门需求协同工作台 - 数据库初始化脚本
-- ============================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------
-- 1. sys_user - 用户表
-- -----------------------------------------------------------
CREATE TABLE `sys_user` (
    `id`         BIGINT       NOT NULL AUTO_INCREMENT,
    `username`   VARCHAR(64)  NOT NULL,
    `password`   VARCHAR(255) NOT NULL,
    `real_name`  VARCHAR(64)  NOT NULL,
    `email`      VARCHAR(128) DEFAULT NULL,
    `phone`      VARCHAR(32)  DEFAULT NULL,
    `department` VARCHAR(128) DEFAULT NULL,
    `role_type`  ENUM('GENERAL_OFFICE','ADMIN','USER') NOT NULL DEFAULT 'USER',
    `status`     TINYINT      NOT NULL DEFAULT 1 COMMENT '1-启用 0-禁用',
    `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`),
    KEY `idx_department` (`department`),
    KEY `idx_role_type` (`role_type`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- -----------------------------------------------------------
-- 2. sys_role - 角色表
-- -----------------------------------------------------------
CREATE TABLE `sys_role` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT,
    `role_name`   VARCHAR(64)  NOT NULL,
    `role_code`   VARCHAR(64)  NOT NULL,
    `role_type`   ENUM('GENERAL_OFFICE','ADMIN') NOT NULL,
    `description` VARCHAR(512) DEFAULT NULL,
    `permissions` JSON         DEFAULT NULL,
    `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_role_code` (`role_code`),
    KEY `idx_role_type` (`role_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- -----------------------------------------------------------
-- 3. reminder_rule - 提醒规则表
-- -----------------------------------------------------------
CREATE TABLE `reminder_rule` (
    `id`                BIGINT       NOT NULL AUTO_INCREMENT,
    `rule_name`         VARCHAR(128) NOT NULL,
    `rule_type`         ENUM('COMMENT_NO_REPLY','TODO_DUE','MEETING_UPCOMING','PROCESS_TIMEOUT') NOT NULL,
    `trigger_condition` JSON         DEFAULT NULL,
    `remind_method`     JSON         DEFAULT NULL COMMENT '提醒方式：EMAIL/SMS/IN_APP数组',
    `remind_before_hours` INT        DEFAULT NULL COMMENT '提前提醒小时数',
    `enabled`           TINYINT(1)   NOT NULL DEFAULT 1,
    `created_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_rule_type` (`rule_type`),
    KEY `idx_enabled` (`enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='提醒规则表';

-- -----------------------------------------------------------
-- 4. process_definition - 流程定义表
-- -----------------------------------------------------------
CREATE TABLE `process_definition` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT,
    `name`        VARCHAR(128) NOT NULL,
    `description` VARCHAR(512) DEFAULT NULL,
    `status`      TINYINT      NOT NULL DEFAULT 1 COMMENT '1-启用 0-禁用',
    `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='流程定义表';

-- -----------------------------------------------------------
-- 5. requirement - 需求表
-- -----------------------------------------------------------
CREATE TABLE `requirement` (
    `id`                  BIGINT        NOT NULL AUTO_INCREMENT,
    `title`               VARCHAR(256)  NOT NULL,
    `description`         TEXT          DEFAULT NULL,
    `priority`            ENUM('URGENT','HIGH','MEDIUM','LOW') NOT NULL DEFAULT 'MEDIUM',
    `status`              ENUM('DRAFT','SUBMITTED','IN_PROGRESS','COMPLETED','DELAYED','CLOSED') NOT NULL DEFAULT 'DRAFT',
    `submitter_id`        BIGINT        NOT NULL,
    `assignee_id`         BIGINT        DEFAULT NULL,
    `department`          VARCHAR(128)  DEFAULT NULL,
    `deadline`            DATE          DEFAULT NULL,
    `completed_at`        DATETIME      DEFAULT NULL,
    `delay_days`          INT           DEFAULT 0 COMMENT '延期天数',
    `conclusion`          ENUM('ON_TIME','DELAYED','CANCELLED') DEFAULT NULL COMMENT '完成结论',
    `process_instance_id` BIGINT        DEFAULT NULL,
    `created_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_submitter_id` (`submitter_id`),
    KEY `idx_assignee_id` (`assignee_id`),
    KEY `idx_department` (`department`),
    KEY `idx_status` (`status`),
    KEY `idx_priority` (`priority`),
    KEY `idx_deadline` (`deadline`),
    KEY `idx_conclusion` (`conclusion`),
    KEY `idx_created_at` (`created_at`),
    CONSTRAINT `fk_requirement_submitter` FOREIGN KEY (`submitter_id`) REFERENCES `sys_user` (`id`),
    CONSTRAINT `fk_requirement_assignee`  FOREIGN KEY (`assignee_id`)  REFERENCES `sys_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='需求表';

-- -----------------------------------------------------------
-- 6. process_node - 流程节点表
-- -----------------------------------------------------------
CREATE TABLE `process_node` (
    `id`             BIGINT       NOT NULL AUTO_INCREMENT,
    `definition_id`  BIGINT       NOT NULL,
    `node_name`      VARCHAR(128) NOT NULL,
    `node_order`     INT          NOT NULL DEFAULT 0,
    `role_id`        BIGINT       DEFAULT NULL,
    `assignee_type`  ENUM('ROLE','SPECIFIC_USER') NOT NULL DEFAULT 'ROLE',
    `assignee_id`    BIGINT       DEFAULT NULL COMMENT '指定审批人ID(assignee_type=SPECIFIC_USER时)',
    `auto_remind`    TINYINT(1)   NOT NULL DEFAULT 0,
    `remind_hours`   INT          DEFAULT NULL COMMENT '超时提醒小时数',
    `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_definition_id` (`definition_id`),
    KEY `idx_role_id` (`role_id`),
    KEY `idx_node_order` (`definition_id`, `node_order`),
    CONSTRAINT `fk_process_node_definition` FOREIGN KEY (`definition_id`) REFERENCES `process_definition` (`id`),
    CONSTRAINT `fk_process_node_role`       FOREIGN KEY (`role_id`)       REFERENCES `sys_role` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='流程节点表';

-- -----------------------------------------------------------
-- 7. process_instance - 流程实例表
-- -----------------------------------------------------------
CREATE TABLE `process_instance` (
    `id`              BIGINT  NOT NULL AUTO_INCREMENT,
    `definition_id`   BIGINT  NOT NULL,
    `requirement_id`  BIGINT  NOT NULL,
    `current_node_id` BIGINT  DEFAULT NULL,
    `status`          ENUM('PENDING','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
    `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_definition_id` (`definition_id`),
    KEY `idx_requirement_id` (`requirement_id`),
    KEY `idx_current_node_id` (`current_node_id`),
    KEY `idx_status` (`status`),
    CONSTRAINT `fk_process_instance_definition` FOREIGN KEY (`definition_id`)   REFERENCES `process_definition` (`id`),
    CONSTRAINT `fk_process_instance_requirement` FOREIGN KEY (`requirement_id`) REFERENCES `requirement` (`id`),
    CONSTRAINT `fk_process_instance_node`       FOREIGN KEY (`current_node_id`) REFERENCES `process_node` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='流程实例表';

-- -----------------------------------------------------------
-- 8. process_instance_node - 流程实例节点记录表
-- -----------------------------------------------------------
CREATE TABLE `process_instance_node` (
    `id`          BIGINT NOT NULL AUTO_INCREMENT,
    `instance_id` BIGINT NOT NULL,
    `node_id`     BIGINT NOT NULL,
    `assignee_id` BIGINT DEFAULT NULL,
    `status`      ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
    `operated_at` DATETIME DEFAULT NULL,
    `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_instance_id` (`instance_id`),
    KEY `idx_node_id` (`node_id`),
    KEY `idx_assignee_id` (`assignee_id`),
    KEY `idx_status` (`status`),
    CONSTRAINT `fk_instance_node_instance` FOREIGN KEY (`instance_id`)  REFERENCES `process_instance` (`id`),
    CONSTRAINT `fk_instance_node_node`     FOREIGN KEY (`node_id`)      REFERENCES `process_node` (`id`),
    CONSTRAINT `fk_instance_node_assignee` FOREIGN KEY (`assignee_id`)  REFERENCES `sys_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='流程实例节点记录表';

-- -----------------------------------------------------------
-- 9. comment - 评论表
-- -----------------------------------------------------------
CREATE TABLE `comment` (
    `id`             BIGINT       NOT NULL AUTO_INCREMENT,
    `requirement_id` BIGINT       NOT NULL,
    `user_id`        BIGINT       NOT NULL,
    `content`        TEXT         NOT NULL,
    `parent_id`      BIGINT       DEFAULT NULL COMMENT '父评论ID, 自关联',
    `has_reply`      TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '是否有人回复',
    `reply_reminded` TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '是否已提醒评论人有人回复',
    `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_requirement_id` (`requirement_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_parent_id` (`parent_id`),
    KEY `idx_has_reply` (`has_reply`),
    KEY `idx_created_at` (`created_at`),
    CONSTRAINT `fk_comment_requirement` FOREIGN KEY (`requirement_id`) REFERENCES `requirement` (`id`),
    CONSTRAINT `fk_comment_user`        FOREIGN KEY (`user_id`)        REFERENCES `sys_user` (`id`),
    CONSTRAINT `fk_comment_parent`      FOREIGN KEY (`parent_id`)      REFERENCES `comment` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- -----------------------------------------------------------
-- 10. todo_item - 待办事项表
-- -----------------------------------------------------------
CREATE TABLE `todo_item` (
    `id`               BIGINT       NOT NULL AUTO_INCREMENT,
    `requirement_id`   BIGINT       NOT NULL,
    `user_id`          BIGINT       NOT NULL,
    `title`            VARCHAR(256) NOT NULL,
    `description`      TEXT         DEFAULT NULL,
    `status`           ENUM('PENDING','COMPLETED') NOT NULL DEFAULT 'PENDING',
    `due_date`         DATE         DEFAULT NULL,
    `reminder_rule_id` BIGINT       DEFAULT NULL,
    `reminded`         TINYINT(1)   NOT NULL DEFAULT 0,
    `completed_at`     DATETIME     DEFAULT NULL,
    `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_requirement_id` (`requirement_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_status` (`status`),
    KEY `idx_due_date` (`due_date`),
    KEY `idx_reminder_rule_id` (`reminder_rule_id`),
    CONSTRAINT `fk_todo_item_requirement`    FOREIGN KEY (`requirement_id`)   REFERENCES `requirement` (`id`),
    CONSTRAINT `fk_todo_item_user`           FOREIGN KEY (`user_id`)          REFERENCES `sys_user` (`id`),
    CONSTRAINT `fk_todo_item_reminder_rule`  FOREIGN KEY (`reminder_rule_id`) REFERENCES `reminder_rule` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='待办事项表';

-- -----------------------------------------------------------
-- 11. meeting_minutes - 会议纪要表
-- -----------------------------------------------------------
CREATE TABLE `meeting_minutes` (
    `id`               BIGINT       NOT NULL AUTO_INCREMENT,
    `requirement_id`   BIGINT       NOT NULL,
    `title`            VARCHAR(256) NOT NULL,
    `content`          TEXT         DEFAULT NULL,
    `meeting_date`     DATE         NOT NULL,
    `recorder_id`      BIGINT       NOT NULL,
    `participants`     JSON         DEFAULT NULL COMMENT '参会人user_id数组',
    `reminder_rule_id` BIGINT       DEFAULT NULL,
    `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_requirement_id` (`requirement_id`),
    KEY `idx_recorder_id` (`recorder_id`),
    KEY `idx_meeting_date` (`meeting_date`),
    KEY `idx_reminder_rule_id` (`reminder_rule_id`),
    CONSTRAINT `fk_meeting_minutes_requirement`   FOREIGN KEY (`requirement_id`)   REFERENCES `requirement` (`id`),
    CONSTRAINT `fk_meeting_minutes_recorder`      FOREIGN KEY (`recorder_id`)      REFERENCES `sys_user` (`id`),
    CONSTRAINT `fk_meeting_minutes_reminder_rule` FOREIGN KEY (`reminder_rule_id`) REFERENCES `reminder_rule` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会议纪要表';

-- -----------------------------------------------------------
-- 12. reminder_log - 提醒日志表
-- -----------------------------------------------------------
CREATE TABLE `reminder_log` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT,
    `rule_id`     BIGINT       NOT NULL,
    `target_type` ENUM('COMMENT','TODO','MEETING','PROCESS') NOT NULL,
    `target_id`   BIGINT       NOT NULL,
    `receiver_id` BIGINT       NOT NULL,
    `content`     TEXT         DEFAULT NULL,
    `sent_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `status`      ENUM('SUCCESS','FAILED') NOT NULL DEFAULT 'SUCCESS',
    PRIMARY KEY (`id`),
    KEY `idx_rule_id` (`rule_id`),
    KEY `idx_target` (`target_type`, `target_id`),
    KEY `idx_receiver_id` (`receiver_id`),
    KEY `idx_sent_at` (`sent_at`),
    KEY `idx_status` (`status`),
    CONSTRAINT `fk_reminder_log_rule`    FOREIGN KEY (`rule_id`)     REFERENCES `reminder_rule` (`id`),
    CONSTRAINT `fk_reminder_log_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `sys_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='提醒日志表';

-- -----------------------------------------------------------
-- 13. audit_log - 审计日志表
-- -----------------------------------------------------------
CREATE TABLE `audit_log` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT,
    `user_id`     BIGINT       NOT NULL,
    `action`      ENUM('COMMENT_NO_REPLY','BATCH_IMPORT','BATCH_APPROVE','ROLE_CHANGE','PROCESS_CONFIG') NOT NULL,
    `target_type` VARCHAR(64)  DEFAULT NULL,
    `target_id`   BIGINT       DEFAULT NULL,
    `detail`      JSON         DEFAULT NULL,
    `ip_address`  VARCHAR(64)  DEFAULT NULL,
    `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_action` (`action`),
    KEY `idx_target` (`target_type`, `target_id`),
    KEY `idx_created_at` (`created_at`),
    CONSTRAINT `fk_audit_log_user` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审计日志表';

-- -----------------------------------------------------------
-- 14. import_error - 导入错误记录表
-- -----------------------------------------------------------
CREATE TABLE `import_error` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT,
    `batch_no`      VARCHAR(64)  NOT NULL,
    `row_number`    INT          NOT NULL,
    `raw_data`      JSON         DEFAULT NULL,
    `error_message` TEXT         NOT NULL,
    `status`        ENUM('PENDING','FIXED') NOT NULL DEFAULT 'PENDING',
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_batch_no` (`batch_no`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='导入错误记录表';

-- -----------------------------------------------------------
-- 15. collaboration_report - 协作报表快照表
-- -----------------------------------------------------------
CREATE TABLE `collaboration_report` (
    `id`                  BIGINT  NOT NULL AUTO_INCREMENT,
    `report_date`         DATE    NOT NULL,
    `total_requirements`  INT     NOT NULL DEFAULT 0,
    `completed_count`     INT     NOT NULL DEFAULT 0,
    `delayed_count`       INT     NOT NULL DEFAULT 0,
    `delay_ratio`         DECIMAL(5,4) DEFAULT 0.0000 COMMENT '延期比例',
    `avg_process_days`    DECIMAL(8,2) DEFAULT 0.00 COMMENT '平均处理天数',
    `dept_metrics`        JSON    DEFAULT NULL COMMENT '部门维度指标',
    `created_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_report_date` (`report_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='协作报表快照表';

-- -----------------------------------------------------------
-- 补充：requirement 表外键关联 process_instance
-- -----------------------------------------------------------
ALTER TABLE `requirement`
    ADD CONSTRAINT `fk_requirement_process_instance` FOREIGN KEY (`process_instance_id`) REFERENCES `process_instance` (`id`);

SET FOREIGN_KEY_CHECKS = 1;

-- 跨部门需求审批流系统 数据库初始化脚本
-- PostgreSQL

-- 创建数据库
-- CREATE DATABASE approval_workflow;

-- 连接到数据库后执行以下脚本

-- 部门表
CREATE TABLE IF NOT EXISTS departments (
    id BIGSERIAL PRIMARY KEY,
    dept_code VARCHAR(50) NOT NULL UNIQUE,
    dept_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    manager_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    real_name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    dept_id BIGINT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 需求表
CREATE TABLE IF NOT EXISTS requirements (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    priority INTEGER NOT NULL DEFAULT 3,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    dept_id BIGINT,
    creator_id BIGINT NOT NULL,
    assignee_id BIGINT,
    expected_date DATE,
    actual_date DATE,
    merged_to_id BIGINT,
    workflow_id BIGINT,
    tags VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_requirement_status ON requirements(status);
CREATE INDEX IF NOT EXISTS idx_requirement_dept ON requirements(dept_id);
CREATE INDEX IF NOT EXISTS idx_requirement_creator ON requirements(creator_id);
CREATE INDEX IF NOT EXISTS idx_requirement_assignee ON requirements(assignee_id);
CREATE INDEX IF NOT EXISTS idx_requirement_priority ON requirements(priority);

-- 工作流定义表
CREATE TABLE IF NOT EXISTS workflow_definitions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 工作流节点定义表
CREATE TABLE IF NOT EXISTS workflow_nodes (
    id BIGSERIAL PRIMARY KEY,
    workflow_id BIGINT NOT NULL,
    node_name VARCHAR(100) NOT NULL,
    node_description VARCHAR(500),
    node_order INTEGER NOT NULL,
    assignee_role VARCHAR(50),
    assignee_dept_id BIGINT,
    assignee_user_id BIGINT,
    days_limit INTEGER NOT NULL DEFAULT 3
);

-- 节点实例表
CREATE TABLE IF NOT EXISTS node_instances (
    id BIGSERIAL PRIMARY KEY,
    requirement_id BIGINT NOT NULL,
    node_def_id BIGINT NOT NULL,
    node_name VARCHAR(100) NOT NULL,
    node_order INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    assignee_id BIGINT,
    assignee_dept_id BIGINT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    due_time TIMESTAMP,
    comment TEXT,
    delay_reason VARCHAR(500),
    is_stuck BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_node_req ON node_instances(requirement_id);
CREATE INDEX IF NOT EXISTS idx_node_status ON node_instances(status);
CREATE INDEX IF NOT EXISTS idx_node_assignee ON node_instances(assignee_id);

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
    id BIGSERIAL PRIMARY KEY,
    requirement_id BIGINT,
    node_id BIGINT,
    operation_type VARCHAR(30) NOT NULL,
    operator_id BIGINT NOT NULL,
    operator_name VARCHAR(50),
    detail TEXT,
    before_status VARCHAR(30),
    after_status VARCHAR(30),
    remark VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_log_req ON operation_logs(requirement_id);
CREATE INDEX IF NOT EXISTS idx_log_operator ON operation_logs(operator_id);
CREATE INDEX IF NOT EXISTS idx_log_type ON operation_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_log_time ON operation_logs(created_at);

-- 延期记录表
CREATE TABLE IF NOT EXISTS delay_records (
    id BIGSERIAL PRIMARY KEY,
    requirement_id BIGINT NOT NULL,
    node_id BIGINT,
    dept_id BIGINT,
    responsible_dept_id BIGINT,
    reason VARCHAR(500) NOT NULL,
    delay_days INTEGER NOT NULL,
    original_date DATE,
    new_date DATE,
    operator_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_delay_req ON delay_records(requirement_id);
CREATE INDEX IF NOT EXISTS idx_delay_dept ON delay_records(dept_id);

-- 初始化数据
-- 部门
INSERT INTO departments (dept_code, dept_name, description) VALUES
('D001', '技术部', '技术研发部门'),
('D002', '产品部', '产品设计部门'),
('D003', '运营部', '运营推广部门'),
('D004', '市场部', '市场营销部门'),
('D005', '财务部', '财务管理部门')
ON CONFLICT (dept_code) DO NOTHING;

-- 默认工作流
INSERT INTO workflow_definitions (name, description, active) VALUES
('标准审批流', '标准的跨部门需求审批流程', TRUE)
ON CONFLICT DO NOTHING;

-- 工作流节点（假设标准审批流ID为1）
INSERT INTO workflow_nodes (workflow_id, node_name, node_description, node_order, assignee_role, days_limit) VALUES
(1, '提交申请', '申请人提交需求', 1, 'NORMAL', 1),
(1, '部门主管审批', '部门主管审核需求', 2, 'DEPT_MANAGER', 3),
(1, '产品部评估', '产品部评估需求可行性', 3, 'DEPT_MANAGER', 5),
(1, '技术部评估', '技术部评估开发工作量', 4, 'DEPT_MANAGER', 5),
(1, '最终审批', '管理层最终审批', 5, 'ADMIN', 3)
ON CONFLICT DO NOTHING;

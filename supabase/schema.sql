-- 技术面试题库测评台 - 数据库 Schema
-- 适用于 Supabase PostgreSQL

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 题库相关表
-- ============================================

-- 题目表
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    options JSONB,
    correct_answer TEXT,
    reference_answer TEXT,
    scoring_standard_id UUID,
    points INTEGER DEFAULT 10,
    time_limit INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_is_active ON questions(is_active);

-- ============================================
-- 评分标准相关表
-- ============================================

-- 评分标准表
CREATE TABLE IF NOT EXISTS scoring_standards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    position VARCHAR(100),
    description TEXT,
    dimensions JSONB NOT NULL,
    levels JSONB,
    total_score INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scoring_standards_position ON scoring_standards(position);
CREATE INDEX IF NOT EXISTS idx_scoring_standards_is_active ON scoring_standards(is_active);

-- ============================================
-- 面试官相关表
-- ============================================

-- 面试官表
CREATE TABLE IF NOT EXISTS interviewers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    title VARCHAR(100),
    department VARCHAR(100),
    email VARCHAR(200),
    phone VARCHAR(50),
    avatar_url TEXT,
    specialties TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 讲师档期表
CREATE TABLE IF NOT EXISTS instructor_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interviewer_id UUID NOT NULL REFERENCES interviewers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instructor_availability_interviewer_id ON instructor_availability(interviewer_id);
CREATE INDEX IF NOT EXISTS idx_instructor_availability_date ON instructor_availability(date);
CREATE INDEX IF NOT EXISTS idx_instructor_availability_status ON instructor_availability(status);

-- ============================================
-- 测评相关表
-- ============================================

-- 测评表
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    question_ids UUID[] NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    total_points INTEGER DEFAULT 100,
    passing_score INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessments_category ON assessments(category);
CREATE INDEX IF NOT EXISTS idx_assessments_is_active ON assessments(is_active);

-- 测评提交表
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    candidate_name VARCHAR(200) NOT NULL,
    candidate_email VARCHAR(200),
    answers JSONB NOT NULL,
    score INTEGER,
    status VARCHAR(20) DEFAULT 'in_progress',
    started_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_assessment_id ON submissions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- ============================================
-- 面试安排相关表
-- ============================================

-- 面试表
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_name VARCHAR(200) NOT NULL,
    candidate_email VARCHAR(200),
    candidate_phone VARCHAR(50),
    position VARCHAR(100),
    department VARCHAR(100),
    interviewer_id UUID REFERENCES interviewers(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    type VARCHAR(50),
    location TEXT,
    meeting_link TEXT,
    assessment_id UUID REFERENCES assessments(id) ON DELETE SET NULL,
    scoring_result JSONB,
    total_score INTEGER,
    result VARCHAR(20),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interviews_interviewer_id ON interviews(interviewer_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
CREATE INDEX IF NOT EXISTS idx_interviews_start_time ON interviews(start_time);
CREATE INDEX IF NOT EXISTS idx_interviews_department ON interviews(department);

-- ============================================
-- 录用结果相关表
-- ============================================

-- 录用结果表
CREATE TABLE IF NOT EXISTS hiring_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id UUID REFERENCES interviews(id) ON DELETE SET NULL,
    candidate_name VARCHAR(200) NOT NULL,
    position VARCHAR(100),
    department VARCHAR(100),
    decision VARCHAR(20) NOT NULL,
    decision_date DATE NOT NULL,
    salary_offered NUMERIC(12, 2),
    notes TEXT,
    decided_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hiring_results_decision ON hiring_results(decision);
CREATE INDEX IF NOT EXISTS idx_hiring_results_department ON hiring_results(department);
CREATE INDEX IF NOT EXISTS idx_hiring_results_decision_date ON hiring_results(decision_date);

-- ============================================
-- 系统配置相关表
-- ============================================

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    is_toggleable BOOLEAN DEFAULT false,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_system_configs_key ON system_configs(key);

-- 配置变更记录表
CREATE TABLE IF NOT EXISTS config_change_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by UUID,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_config_change_logs_config_key ON config_change_logs(config_key);
CREATE INDEX IF NOT EXISTS idx_config_change_logs_changed_at ON config_change_logs(changed_at);

-- ============================================
-- 提醒规则相关表
-- ============================================

-- 提醒规则表
CREATE TABLE IF NOT EXISTS reminder_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    trigger_condition TEXT NOT NULL,
    urgency_level VARCHAR(20) NOT NULL DEFAULT 'medium',
    notify_channels TEXT[] NOT NULL DEFAULT '{}',
    config JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminder_rules_rule_type ON reminder_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_reminder_rules_urgency_level ON reminder_rules(urgency_level);
CREATE INDEX IF NOT EXISTS idx_reminder_rules_is_active ON reminder_rules(is_active);

-- 预警表
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    urgency_level VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    related_type VARCHAR(50),
    related_id UUID,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_urgency_level ON alerts(urgency_level);
CREATE INDEX IF NOT EXISTS idx_alerts_is_resolved ON alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);

-- ============================================
-- 导出报表相关表
-- ============================================

-- 导出报表记录表
CREATE TABLE IF NOT EXISTS export_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,
    filters JSONB NOT NULL,
    filter_summary TEXT NOT NULL,
    generated_by UUID,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_export_reports_type ON export_reports(type);
CREATE INDEX IF NOT EXISTS idx_export_reports_created_at ON export_reports(created_at);

-- ============================================
-- 初始数据
-- ============================================

-- 插入初始系统配置
INSERT INTO system_configs (key, value, description, is_toggleable) VALUES
    ('module_question_bank', 'true', '题库管理模块开关', true),
    ('module_scoring_standards', 'true', '评分标准模块开关', true),
    ('module_interview_scheduling', 'true', '面试安排模块开关', true),
    ('module_instructor_availability', 'true', '讲师档期模块开关', true),
    ('module_hiring_results', 'true', '录用结果模块开关', true),
    ('module_quality_dashboard', 'true', '质量看板模块开关', true),
    ('reminder_conflict_detection', 'true', '面试冲突检测提醒开关', true),
    ('reminder_score_anomaly', 'true', '评分异常提醒开关', true),
    ('reminder_overdue_scoring', 'true', '超时未评分提醒开关', true),
    ('system_max_interview_per_day', '4', '每位面试官每日最大面试数量', false),
    ('system_scoring_overdue_hours', '24', '评分逾期时长（小时）', false),
    ('system_score_anomaly_threshold', '20', '评分异常阈值（百分比）', false),
    ('system_reminder_lead_minutes', '30', '面试提前提醒时间（分钟）', false)
ON CONFLICT (key) DO NOTHING;

-- 行级别安全策略（RLS）
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE hiring_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_change_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_reports ENABLE ROW LEVEL SECURITY;

-- 简单的公开读取策略（根据实际需求调整）
CREATE POLICY "Allow public read access on questions"
    ON questions FOR SELECT USING (true);

CREATE POLICY "Allow public read access on scoring_standards"
    ON scoring_standards FOR SELECT USING (true);

CREATE POLICY "Allow public read access on interviewers"
    ON interviewers FOR SELECT USING (true);

CREATE POLICY "Allow public read access on instructor_availability"
    ON instructor_availability FOR SELECT USING (true);

CREATE POLICY "Allow public read access on assessments"
    ON assessments FOR SELECT USING (true);

CREATE POLICY "Allow public read on submissions"
    ON submissions FOR SELECT USING (true);

CREATE POLICY "Allow public insert on submissions"
    ON submissions FOR INSERT WITH CHECK (true);

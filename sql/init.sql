-- 实验室样本复核数据库初始化脚本
-- PostgreSQL 12+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 志愿者表
CREATE TABLE IF NOT EXISTS volunteers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    volunteer_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10),
    age INT,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_dirty BOOLEAN DEFAULT FALSE,
    dirty_reason TEXT
);

-- 样本登记表
CREATE TABLE IF NOT EXISTS sample_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sample_code VARCHAR(100) UNIQUE NOT NULL,
    batch_code VARCHAR(50) NOT NULL,
    volunteer_id UUID NOT NULL REFERENCES volunteers(id),
    sample_type VARCHAR(50) NOT NULL,
    collection_time TIMESTAMP WITH TIME ZONE NOT NULL,
    initial_result TEXT,
    initial_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    reviewer_id VARCHAR(50),
    review_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_dirty BOOLEAN DEFAULT FALSE,
    dirty_reason TEXT
);

CREATE INDEX idx_sample_batch ON sample_records(batch_code);
CREATE INDEX idx_sample_status ON sample_records(initial_status);
CREATE INDEX idx_sample_dirty ON sample_records(is_dirty);

-- 补样记录表
CREATE TABLE IF NOT EXISTS resample_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_sample_id UUID NOT NULL REFERENCES sample_records(id),
    new_sample_id UUID NOT NULL REFERENCES sample_records(id),
    reason TEXT NOT NULL,
    reason_category VARCHAR(50) NOT NULL,
    operator VARCHAR(50) NOT NULL,
    resample_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_resample_original ON resample_records(original_sample_id);
CREATE INDEX idx_resample_category ON resample_records(reason_category);

-- 异常截图表
CREATE TABLE IF NOT EXISTS exception_screenshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sample_id UUID NOT NULL REFERENCES sample_records(id),
    screenshot_path TEXT NOT NULL,
    description TEXT,
    uploaded_by VARCHAR(50) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_screenshot_sample ON exception_screenshots(sample_id);

-- 二审结论表
CREATE TABLE IF NOT EXISTS second_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sample_id UUID NOT NULL REFERENCES sample_records(id),
    first_reviewer VARCHAR(50) NOT NULL,
    first_review_result VARCHAR(20) NOT NULL,
    first_review_time TIMESTAMP WITH TIME ZONE NOT NULL,
    second_reviewer VARCHAR(50),
    second_review_result VARCHAR(20),
    second_review_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_review_sample ON second_reviews(sample_id);
CREATE INDEX idx_review_status ON second_reviews(status);

-- ========== 插入模拟数据 ==========

-- 志愿者数据
INSERT INTO volunteers (volunteer_code, name, gender, age, phone) VALUES
('V001', '张三', '男', 28, '13800138001'),
('V002', '李四', '女', 35, '13800138002'),
('V003', '王五', '男', 42, '13800138003'),
('V004', '赵六', '女', 25, '13800138004'),
('V005', '钱七', '男', 31, '13800138005'),
('V006', '孙八', '女', 38, '13800138006'),
('V007', '周九', '男', 29, '13800138007'),
('V008', '吴十', '女', 33, '13800138008'),
('V009', '郑十一', '男', 45, '13800138009'),
('V010', '王十二', '女', 27, '13800138010');

-- 样本数据 - 批次 BATCH-2024-01 (50个样本，超过阈值)
INSERT INTO sample_records (sample_code, batch_code, volunteer_id, sample_type, collection_time, initial_result, initial_status, reviewer_id, review_time, is_dirty)
SELECT 
    'S-B1-' || LPAD(i::text, 3, '0'),
    'BATCH-2024-01',
    (SELECT id FROM volunteers ORDER BY RANDOM() LIMIT 1),
    CASE WHEN i % 3 = 0 THEN '血液' WHEN i % 3 = 1 THEN '唾液' ELSE '尿液' END,
    NOW() - INTERVAL '30 days' + (i || ' hours')::interval,
    CASE WHEN i % 10 = 0 THEN '指标异常' ELSE '正常' END,
    CASE 
        WHEN i % 10 = 0 THEN 'fail'
        WHEN i % 25 = 0 THEN 'pending'
        ELSE 'pass'
    END,
    'R001',
    NOW() - INTERVAL '25 days',
    CASE WHEN i = 7 THEN TRUE ELSE FALSE END
FROM generate_series(1, 50) AS i;

-- 更新脏数据原因
UPDATE sample_records SET dirty_reason = '样本编号重复' WHERE is_dirty = TRUE AND batch_code = 'BATCH-2024-01';

-- 批次 BATCH-2024-02 (45个样本，超过阈值)
INSERT INTO sample_records (sample_code, batch_code, volunteer_id, sample_type, collection_time, initial_result, initial_status, reviewer_id, review_time, is_dirty)
SELECT 
    'S-B2-' || LPAD(i::text, 3, '0'),
    'BATCH-2024-02',
    (SELECT id FROM volunteers ORDER BY RANDOM() LIMIT 1),
    CASE WHEN i % 3 = 0 THEN '血液' WHEN i % 3 = 1 THEN '唾液' ELSE '尿液' END,
    NOW() - INTERVAL '20 days' + (i || ' hours')::interval,
    CASE WHEN i % 8 = 0 THEN '指标异常' ELSE '正常' END,
    CASE 
        WHEN i % 8 = 0 THEN 'fail'
        WHEN i % 20 = 0 THEN 'pending'
        ELSE 'pass'
    END,
    'R002',
    NOW() - INTERVAL '15 days',
    CASE WHEN i = 13 OR i = 22 THEN TRUE ELSE FALSE END
FROM generate_series(1, 45) AS i;

UPDATE sample_records SET dirty_reason = '采集时间异常' WHERE is_dirty = TRUE AND batch_code = 'BATCH-2024-02';

-- 批次 BATCH-2024-03 (20个样本，低于阈值，待观察)
INSERT INTO sample_records (sample_code, batch_code, volunteer_id, sample_type, collection_time, initial_result, initial_status, reviewer_id, review_time)
SELECT 
    'S-B3-' || LPAD(i::text, 3, '0'),
    'BATCH-2024-03',
    (SELECT id FROM volunteers ORDER BY RANDOM() LIMIT 1),
    CASE WHEN i % 3 = 0 THEN '血液' WHEN i % 3 = 1 THEN '唾液' ELSE '尿液' END,
    NOW() - INTERVAL '10 days' + (i || ' hours')::interval,
    CASE WHEN i % 5 = 0 THEN '指标异常' ELSE '正常' END,
    CASE 
        WHEN i % 5 = 0 THEN 'fail'
        ELSE 'pass'
    END,
    'R001',
    NOW() - INTERVAL '8 days'
FROM generate_series(1, 20) AS i;

-- 补样记录
INSERT INTO resample_records (original_sample_id, new_sample_id, reason, reason_category, operator)
SELECT 
    (SELECT id FROM sample_records WHERE sample_code = 'S-B1-010'),
    (SELECT id FROM sample_records WHERE sample_code = 'S-B2-040'),
    '样本溶血，无法检测',
    '样本质量问题',
    'O001';

INSERT INTO resample_records (original_sample_id, new_sample_id, reason, reason_category, operator)
SELECT 
    (SELECT id FROM sample_records WHERE sample_code = 'S-B1-020'),
    (SELECT id FROM sample_records WHERE sample_code = 'S-B2-041'),
    '受试者信息登记错误',
    '信息录入错误',
    'O002';

INSERT INTO resample_records (original_sample_id, new_sample_id, reason, reason_category, operator)
SELECT 
    (SELECT id FROM sample_records WHERE sample_code = 'S-B2-008'),
    (SELECT id FROM sample_records WHERE sample_code = 'S-B2-042'),
    '样本污染',
    '样本质量问题',
    'O001';

INSERT INTO resample_records (original_sample_id, new_sample_id, reason, reason_category, operator)
SELECT 
    (SELECT id FROM sample_records WHERE sample_code = 'S-B2-016'),
    (SELECT id FROM sample_records WHERE sample_code = 'S-B2-043'),
    '设备故障导致数据丢失',
    '设备问题',
    'O003';

INSERT INTO resample_records (original_sample_id, new_sample_id, reason, reason_category, operator)
SELECT 
    (SELECT id FROM sample_records WHERE sample_code = 'S-B2-024'),
    (SELECT id FROM sample_records WHERE sample_code = 'S-B2-044'),
    '样本标签脱落',
    '样本质量问题',
    'O001';

INSERT INTO resample_records (original_sample_id, new_sample_id, reason, reason_category, operator)
SELECT 
    (SELECT id FROM sample_records WHERE sample_code = 'S-B3-005'),
    (SELECT id FROM sample_records WHERE sample_code = 'S-B3-016'),
    '采集量不足',
    '样本质量问题',
    'O002';

INSERT INTO resample_records (original_sample_id, new_sample_id, reason, reason_category, operator)
SELECT 
    (SELECT id FROM sample_records WHERE sample_code = 'S-B3-010'),
    (SELECT id FROM sample_records WHERE sample_code = 'S-B3-017'),
    '受试者撤回同意',
    '受试者原因',
    'O002';

-- 异常截图
INSERT INTO exception_screenshots (sample_id, screenshot_path, description, uploaded_by)
SELECT id, '/screenshots/' || sample_code || '_1.png', '初检异常波形图', 'R001'
FROM sample_records WHERE initial_status = 'fail' LIMIT 5;

INSERT INTO exception_screenshots (sample_id, screenshot_path, description, uploaded_by)
SELECT id, '/screenshots/' || sample_code || '_2.png', '复检对比图', 'R002'
FROM sample_records WHERE initial_status = 'fail' LIMIT 3;

-- 二审记录
INSERT INTO second_reviews (sample_id, first_reviewer, first_review_result, first_review_time, status, comment)
SELECT id, 'R001', 'fail', NOW() - INTERVAL '5 days', 'pending', '需要确认异常原因'
FROM sample_records WHERE initial_status = 'fail' LIMIT 8;

INSERT INTO second_reviews (sample_id, first_reviewer, first_review_result, first_review_time, second_reviewer, second_review_result, second_review_time, status, comment)
SELECT id, 'R001', 'fail', NOW() - INTERVAL '15 days', 'R003', 'pass', NOW() - INTERVAL '10 days', 'completed', '假阳性，确认通过'
FROM sample_records WHERE initial_status = 'fail' LIMIT 3;

INSERT INTO second_reviews (sample_id, first_reviewer, first_review_result, first_review_time, second_reviewer, second_review_result, second_review_time, status, comment)
SELECT id, 'R002', 'fail', NOW() - INTERVAL '10 days', 'R003', 'fail', NOW() - INTERVAL '3 days', 'completed', '确认异常'
FROM sample_records WHERE initial_status = 'fail' OFFSET 3 LIMIT 2;

INSERT INTO second_reviews (sample_id, first_reviewer, first_review_result, first_review_time, status, comment)
SELECT id, 'R002', 'fail', NOW() - INTERVAL '3 days', 'pending', '待二审'
FROM sample_records WHERE initial_status = 'fail' OFFSET 5 LIMIT 3;

INSERT INTO second_reviews (sample_id, first_reviewer, first_review_result, first_review_time, status, comment)
SELECT id, 'R001', 'fail', NOW() - INTERVAL '40 hours', 'pending', '待二审'
FROM sample_records WHERE initial_status = 'fail' OFFSET 8 LIMIT 2;

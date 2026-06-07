CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE IF NOT EXISTS lab_samples (
    sample_id VARCHAR(64) PRIMARY KEY,
    sample_type VARCHAR(32) NOT NULL,
    priority VARCHAR(16) NOT NULL DEFAULT 'routine',
    requesting_department VARCHAR(64) NOT NULL,
    patient_id VARCHAR(64),
    collected_at TIMESTAMPTZ NOT NULL,
    collected_at_source VARCHAR(16) DEFAULT 'auto',
    dispatched_at TIMESTAMPTZ,
    dispatched_at_source VARCHAR(16) DEFAULT 'auto',
    received_at TIMESTAMPTZ,
    received_at_source VARCHAR(16) DEFAULT 'auto',
    tested_at TIMESTAMPTZ,
    tested_at_source VARCHAR(16) DEFAULT 'auto',
    reviewed_at TIMESTAMPTZ,
    reviewed_at_source VARCHAR(16) DEFAULT 'auto',
    reported_at TIMESTAMPTZ,
    reported_at_source VARCHAR(16) DEFAULT 'auto',
    status VARCHAR(32) DEFAULT 'completed',
    test_items TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_hypertable('lab_samples', 'collected_at', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_sample_type ON lab_samples(sample_type);
CREATE INDEX IF NOT EXISTS idx_priority ON lab_samples(priority);
CREATE INDEX IF NOT EXISTS idx_dept ON lab_samples(requesting_department);
CREATE INDEX IF NOT EXISTS idx_status ON lab_samples(status);

CREATE TABLE IF NOT EXISTS threshold_configs (
    id SERIAL PRIMARY KEY,
    sample_type VARCHAR(32) NOT NULL,
    priority VARCHAR(16) NOT NULL DEFAULT 'routine',
    stage_name VARCHAR(32) NOT NULL,
    threshold_minutes INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sample_type, priority, stage_name)
);

CREATE TABLE IF NOT EXISTS sample_return_records (
    id SERIAL PRIMARY KEY,
    sample_id VARCHAR(64) NOT NULL REFERENCES lab_samples(sample_id),
    return_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    return_reason TEXT NOT NULL,
    responsible_department VARCHAR(64) NOT NULL,
    returned_by VARCHAR(64),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_return_sample_id ON sample_return_records(sample_id);
CREATE INDEX IF NOT EXISTS idx_return_dept ON sample_return_records(responsible_department);

INSERT INTO threshold_configs (sample_type, priority, stage_name, threshold_minutes, description) VALUES
('blood', 'emergency', 'collection_to_dispatch', 10, '急诊采血到送检'),
('blood', 'emergency', 'dispatch_to_receive', 15, '急诊送检到接收'),
('blood', 'emergency', 'receive_to_test', 20, '急诊接收到检测'),
('blood', 'emergency', 'test_to_review', 30, '急诊检测到复核'),
('blood', 'emergency', 'review_to_report', 10, '急诊复核到报告'),
('blood', 'routine', 'collection_to_dispatch', 30, '常规采血到送检'),
('blood', 'routine', 'dispatch_to_receive', 45, '常规送检到接收'),
('blood', 'routine', 'receive_to_test', 60, '常规接收到检测'),
('blood', 'routine', 'test_to_review', 90, '常规检测到复核'),
('blood', 'routine', 'review_to_report', 30, '常规复核到报告'),
('urine', 'emergency', 'collection_to_dispatch', 15, '急诊尿液到送检'),
('urine', 'emergency', 'dispatch_to_receive', 20, '急诊送检到接收'),
('urine', 'emergency', 'receive_to_test', 25, '急诊接收到检测'),
('urine', 'emergency', 'test_to_review', 20, '急诊检测到复核'),
('urine', 'emergency', 'review_to_report', 10, '急诊复核到报告'),
('urine', 'routine', 'collection_to_dispatch', 45, '常规尿液到送检'),
('urine', 'routine', 'dispatch_to_receive', 60, '常规送检到接收'),
('urine', 'routine', 'receive_to_test', 90, '常规接收到检测'),
('urine', 'routine', 'test_to_review', 60, '常规检测到复核'),
('urine', 'routine', 'review_to_report', 30, '常规复核到报告'),
('stool', 'routine', 'collection_to_dispatch', 60, '常规粪便到送检'),
('stool', 'routine', 'dispatch_to_receive', 60, '常规送检到接收'),
('stool', 'routine', 'receive_to_test', 120, '常规接收到检测'),
('stool', 'routine', 'test_to_review', 60, '常规检测到复核'),
('stool', 'routine', 'review_to_report', 30, '常规复核到报告'),
('biochemistry', 'emergency', 'collection_to_dispatch', 10, '急诊生化到送检'),
('biochemistry', 'emergency', 'dispatch_to_receive', 15, '急诊送检到接收'),
('biochemistry', 'emergency', 'receive_to_test', 30, '急诊接收到检测'),
('biochemistry', 'emergency', 'test_to_review', 45, '急诊检测到复核'),
('biochemistry', 'emergency', 'review_to_report', 15, '急诊复核到报告'),
('biochemistry', 'routine', 'collection_to_dispatch', 30, '常规生化到送检'),
('biochemistry', 'routine', 'dispatch_to_receive', 45, '常规送检到接收'),
('biochemistry', 'routine', 'receive_to_test', 90, '常规接收到检测'),
('biochemistry', 'routine', 'test_to_review', 120, '常规检测到复核'),
('biochemistry', 'routine', 'review_to_report', 30, '常规复核到报告'),
('immunology', 'routine', 'collection_to_dispatch', 30, '常规免疫到送检'),
('immunology', 'routine', 'dispatch_to_receive', 45, '常规送检到接收'),
('immunology', 'routine', 'receive_to_test', 120, '常规接收到检测'),
('immunology', 'routine', 'test_to_review', 180, '常规检测到复核'),
('immunology', 'routine', 'review_to_report', 45, '常规复核到报告'),
('microbiology', 'routine', 'collection_to_dispatch', 30, '常规微生物到送检'),
('microbiology', 'routine', 'dispatch_to_receive', 45, '常规送检到接收'),
('microbiology', 'routine', 'receive_to_test', 240, '常规接收到检测'),
('microbiology', 'routine', 'test_to_review', 1440, '常规微生物检测到复核'),
('microbiology', 'routine', 'review_to_report', 60, '常规复核到报告');

CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE IF NOT EXISTS candidates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(50),
    position VARCHAR(100),
    department VARCHAR(100),
    channel VARCHAR(100),
    recruiter VARCHAR(100),
    current_stage VARCHAR(50),
    application_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stage_transitions (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    stage_name VARCHAR(50) NOT NULL,
    stage_order INTEGER NOT NULL,
    enter_date DATE NOT NULL,
    exit_date DATE,
    interviewer VARCHAR(100),
    duration_days FLOAT,
    result VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidate_feedback (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    overall_rating FLOAT,
    interview_experience FLOAT,
    communication_rating FLOAT,
    process_speed_rating FLOAT,
    comments TEXT,
    feedback_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_filters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    filter_config TEXT NOT NULL,
    created_by VARCHAR(100) DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_quality_logs (
    id SERIAL PRIMARY KEY,
    check_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    affected_fields TEXT,
    check_date TIMESTAMPTZ DEFAULT NOW(),
    resolved INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_candidates_position ON candidates(position);
CREATE INDEX IF NOT EXISTS idx_candidates_department ON candidates(department);
CREATE INDEX IF NOT EXISTS idx_candidates_channel ON candidates(channel);
CREATE INDEX IF NOT EXISTS idx_candidates_recruiter ON candidates(recruiter);
CREATE INDEX IF NOT EXISTS idx_candidates_stage ON candidates(current_stage);
CREATE INDEX IF NOT EXISTS idx_candidates_app_date ON candidates(application_date);

CREATE INDEX IF NOT EXISTS idx_transitions_candidate ON stage_transitions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_transitions_stage ON stage_transitions(stage_name);
CREATE INDEX IF NOT EXISTS idx_transitions_interviewer ON stage_transitions(interviewer);
CREATE INDEX IF NOT EXISTS idx_transitions_enter_date ON stage_transitions(enter_date);

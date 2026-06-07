SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS chapters (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chapter_versions (
    id SERIAL PRIMARY KEY,
    chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    change_description TEXT,
    is_current BOOLEAN DEFAULT FALSE,
    UNIQUE(chapter_id, version_number)
);

CREATE TABLE IF NOT EXISTS chapter_sections (
    id SERIAL PRIMARY KEY,
    chapter_version_id INTEGER REFERENCES chapter_versions(id) ON DELETE CASCADE,
    section_order INTEGER NOT NULL,
    section_name VARCHAR(255) NOT NULL,
    parent_section_id INTEGER REFERENCES chapter_sections(id)
);

CREATE TABLE IF NOT EXISTS section_mappings (
    id SERIAL PRIMARY KEY,
    old_section_id INTEGER REFERENCES chapter_sections(id) ON DELETE CASCADE,
    new_section_id INTEGER REFERENCES chapter_sections(id) ON DELETE CASCADE,
    mapping_type VARCHAR(20) NOT NULL CHECK (mapping_type IN ('direct','split','merge','unmapped'))
);

CREATE TABLE IF NOT EXISTS viewing_records (
    time TIMESTAMP NOT NULL,
    user_id INTEGER NOT NULL,
    section_id INTEGER REFERENCES chapter_sections(id),
    duration_seconds FLOAT DEFAULT 0,
    completion_pct FLOAT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quiz_records (
    time TIMESTAMP NOT NULL,
    user_id INTEGER NOT NULL,
    section_id INTEGER REFERENCES chapter_sections(id),
    quiz_id INTEGER NOT NULL,
    score FLOAT DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS error_records (
    time TIMESTAMP NOT NULL,
    user_id INTEGER NOT NULL,
    section_id INTEGER REFERENCES chapter_sections(id),
    question_id INTEGER NOT NULL,
    selected_answer VARCHAR(10),
    correct_answer VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS discussion_records (
    time TIMESTAMP NOT NULL,
    user_id INTEGER NOT NULL,
    section_id INTEGER REFERENCES chapter_sections(id),
    content TEXT,
    topic_tags TEXT[]
);

CREATE TABLE IF NOT EXISTS refund_requests (
    time TIMESTAMP NOT NULL,
    user_id INTEGER NOT NULL,
    chapter_id INTEGER REFERENCES chapters(id),
    reason TEXT,
    category VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS learning_path_events (
    time TIMESTAMP NOT NULL,
    user_id INTEGER NOT NULL,
    section_id INTEGER REFERENCES chapter_sections(id),
    event_type VARCHAR(20) CHECK (event_type IN ('enter','complete','skip','revisit')),
    from_section_id INTEGER,
    to_section_id INTEGER
);

SELECT create_hypertable('viewing_records', 'time', if_not_exists => TRUE);
SELECT create_hypertable('quiz_records', 'time', if_not_exists => TRUE);
SELECT create_hypertable('error_records', 'time', if_not_exists => TRUE);
SELECT create_hypertable('discussion_records', 'time', if_not_exists => TRUE);
SELECT create_hypertable('refund_requests', 'time', if_not_exists => TRUE);
SELECT create_hypertable('learning_path_events', 'time', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_viewing_section ON viewing_records(section_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_section ON quiz_records(section_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_error_section ON error_records(section_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_discussion_section ON discussion_records(section_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_refund_chapter ON refund_requests(chapter_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_lpe_section ON learning_path_events(section_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_lpe_event_type ON learning_path_events(event_type, time DESC);
"""

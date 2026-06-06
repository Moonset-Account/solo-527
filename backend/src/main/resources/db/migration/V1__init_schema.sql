-- 学员表
CREATE TABLE students (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(100) UNIQUE,
    member_level VARCHAR(20) DEFAULT 'NORMAL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_students_name ON students(name);
CREATE INDEX idx_students_phone ON students(phone);

-- 泥料表
CREATE TABLE clays (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    temperature_zone VARCHAR(20) NOT NULL,
    min_temperature INTEGER NOT NULL,
    max_temperature INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_clays_temperature_zone ON clays(temperature_zone);
CREATE INDEX idx_clays_code ON clays(code);

-- 釉料表
CREATE TABLE glazes (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    temperature_zone VARCHAR(20) NOT NULL,
    min_temperature INTEGER NOT NULL,
    max_temperature INTEGER NOT NULL,
    atmosphere VARCHAR(20),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_glazes_temperature_zone ON glazes(temperature_zone);
CREATE INDEX idx_glazes_code ON glazes(code);

-- 烧成曲线模板表
CREATE TABLE firing_curves (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    temperature_zone VARCHAR(20) NOT NULL,
    target_temperature INTEGER NOT NULL,
    total_duration INTEGER NOT NULL,
    curve_data JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_firing_curves_temperature_zone ON firing_curves(temperature_zone);
CREATE INDEX idx_firing_curves_code ON firing_curves(code);

-- 窑炉表
CREATE TABLE kilns (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    capacity INTEGER NOT NULL,
    max_temperature INTEGER NOT NULL,
    temperature_zones TEXT[] NOT NULL,
    status VARCHAR(20) DEFAULT 'IDLE',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_kilns_status ON kilns(status);
CREATE INDEX idx_kilns_temperature_zones ON kilns USING GIN(temperature_zones);

-- 窑次表
CREATE TABLE kiln_runs (
    id BIGSERIAL PRIMARY KEY,
    run_code VARCHAR(50) UNIQUE NOT NULL,
    kiln_id BIGINT NOT NULL REFERENCES kilns(id),
    firing_curve_id BIGINT NOT NULL REFERENCES firing_curves(id),
    temperature_zone VARCHAR(20) NOT NULL,
    scheduled_start_time TIMESTAMP,
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'DRAFT',
    max_capacity INTEGER NOT NULL,
    used_capacity INTEGER DEFAULT 0,
    notes TEXT,
    created_by BIGINT,
    approved_by BIGINT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_kiln_runs_status ON kiln_runs(status);
CREATE INDEX idx_kiln_runs_temperature_zone ON kiln_runs(temperature_zone);
CREATE INDEX idx_kiln_runs_kiln_id ON kiln_runs(kiln_id);
CREATE INDEX idx_kiln_runs_scheduled_start ON kiln_runs(scheduled_start_time);

-- 作品表
CREATE TABLE artworks (
    id BIGSERIAL PRIMARY KEY,
    artwork_code VARCHAR(50) UNIQUE NOT NULL,
    student_id BIGINT NOT NULL REFERENCES students(id),
    clay_id BIGINT NOT NULL REFERENCES clays(id),
    glaze_id BIGINT REFERENCES glazes(id),
    name VARCHAR(200),
    description TEXT,
    weight DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'SUBMITTED',
    kiln_run_id BIGINT REFERENCES kiln_runs(id),
    position_in_kiln VARCHAR(50),
    submission_source VARCHAR(20) DEFAULT 'EXTERNAL',
    submitted_by BIGINT,
    reviewed_by BIGINT,
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_artworks_student_id ON artworks(student_id);
CREATE INDEX idx_artworks_status ON artworks(status);
CREATE INDEX idx_artworks_kiln_run_id ON artworks(kiln_run_id);
CREATE INDEX idx_artworks_clay_id ON artworks(clay_id);
CREATE INDEX idx_artworks_glaze_id ON artworks(glaze_id);
CREATE INDEX idx_artworks_submission_source ON artworks(submission_source);

-- 出窑记录表
CREATE TABLE kiln_out_records (
    id BIGSERIAL PRIMARY KEY,
    kiln_run_id BIGINT NOT NULL REFERENCES kiln_runs(id),
    artwork_id BIGINT NOT NULL REFERENCES artworks(id),
    out_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    quality_status VARCHAR(20) NOT NULL,
    notes TEXT,
    recorded_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_kiln_out_records_kiln_run_id ON kiln_out_records(kiln_run_id);
CREATE INDEX idx_kiln_out_records_artwork_id ON kiln_out_records(artwork_id);
CREATE INDEX idx_kiln_out_records_quality_status ON kiln_out_records(quality_status);

-- 出窑照片表
CREATE TABLE artwork_photos (
    id BIGSERIAL PRIMARY KEY,
    artwork_id BIGINT NOT NULL REFERENCES artworks(id),
    kiln_out_record_id BIGINT REFERENCES kiln_out_records(id),
    photo_url VARCHAR(500) NOT NULL,
    photo_type VARCHAR(20) DEFAULT 'OUT_KILN',
    description TEXT,
    uploaded_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_artwork_photos_artwork_id ON artwork_photos(artwork_id);
CREATE INDEX idx_artwork_photos_kiln_out_record_id ON artwork_photos(kiln_out_record_id);

-- 破损赔付表
CREATE TABLE damage_claims (
    id BIGSERIAL PRIMARY KEY,
    claim_code VARCHAR(50) UNIQUE NOT NULL,
    artwork_id BIGINT NOT NULL REFERENCES artworks(id),
    student_id BIGINT NOT NULL REFERENCES students(id),
    damage_type VARCHAR(50) NOT NULL,
    damage_description TEXT,
    compensation_type VARCHAR(20) NOT NULL,
    compensation_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'PENDING',
    processed_by BIGINT,
    processed_at TIMESTAMP,
    process_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_damage_claims_status ON damage_claims(status);
CREATE INDEX idx_damage_claims_student_id ON damage_claims(student_id);
CREATE INDEX idx_damage_claims_artwork_id ON damage_claims(artwork_id);

-- 保存的筛选条件表
CREATE TABLE saved_filters (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    page_name VARCHAR(100) NOT NULL,
    filter_name VARCHAR(100) NOT NULL,
    filter_criteria JSONB NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, page_name, filter_name)
);
CREATE INDEX idx_saved_filters_user_page ON saved_filters(user_id, page_name);

-- 用户表
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- 操作日志表
CREATE TABLE operation_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    operation_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id BIGINT,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_operation_logs_target ON operation_logs(target_type, target_id);
CREATE INDEX idx_operation_logs_created_at ON operation_logs(created_at);

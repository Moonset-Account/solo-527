-- 健身房会员训练留存分析系统数据库初始化脚本

CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(50),
    address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coaches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    store_id INTEGER REFERENCES stores(id),
    specialty VARCHAR(100),
    level VARCHAR(20),
    hire_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    duration INTEGER,
    capacity INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS member_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    gender VARCHAR(10),
    age INTEGER,
    member_type_id INTEGER REFERENCES member_types(id),
    store_id INTEGER REFERENCES stores(id),
    join_date DATE NOT NULL,
    expire_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS membership_cards (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES members(id),
    card_type VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_times INTEGER,
    used_times INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suspensions (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES members(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(255),
    status VARCHAR(20) DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES members(id),
    course_id INTEGER REFERENCES courses(id),
    coach_id INTEGER REFERENCES coaches(id),
    store_id INTEGER REFERENCES stores(id),
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'booked',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS checkins (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES members(id),
    store_id INTEGER REFERENCES stores(id),
    checkin_time TIMESTAMP NOT NULL,
    checkout_time TIMESTAMP,
    booking_id INTEGER REFERENCES bookings(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS body_measurements (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES members(id),
    coach_id INTEGER REFERENCES coaches(id),
    measure_date DATE NOT NULL,
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    body_fat DECIMAL(5,2),
    muscle_mass DECIMAL(5,2),
    bmi DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pt_purchases (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES members(id),
    coach_id INTEGER REFERENCES coaches(id),
    purchase_date DATE NOT NULL,
    sessions INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    used_sessions INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feedbacks (
    id SERIAL PRIMARY KEY,
    member_id INTEGER REFERENCES members(id),
    coach_id INTEGER,
    course_id INTEGER,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    content TEXT,
    feedback_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_members_store ON members(store_id);
CREATE INDEX IF NOT EXISTS idx_members_type ON members(member_type_id);
CREATE INDEX IF NOT EXISTS idx_checkins_member ON checkins(member_id);
CREATE INDEX IF NOT EXISTS idx_checkins_time ON checkins(checkin_time);
CREATE INDEX IF NOT EXISTS idx_bookings_member ON bookings(member_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_suspensions_member ON suspensions(member_id);

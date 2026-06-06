-- 用户表（包含管理员、前台、教练）
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    real_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    role VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- 教练表
CREATE TABLE coaches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    coach_no VARCHAR(50) NOT NULL UNIQUE,
    specialty VARCHAR(200),
    description TEXT,
    hire_date DATE,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_coaches_coach_no ON coaches(coach_no);
CREATE INDEX idx_coaches_user_id ON coaches(user_id);

-- 会员表
CREATE TABLE members (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_no VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    gender VARCHAR(10),
    birthday DATE,
    address VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    source VARCHAR(50),
    remark TEXT,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_members_member_no ON members(member_no);
CREATE INDEX idx_members_phone ON members(phone);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_name ON members(name);

-- 课包类型表
CREATE TABLE package_types (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL,
    total_sessions INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration INT,
    description TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_package_types_type ON package_types(type);
CREATE INDEX idx_package_types_status ON package_types(status);

-- 会员课包表
CREATE TABLE member_packages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id BIGINT NOT NULL,
    package_type_id BIGINT NOT NULL,
    coach_id BIGINT,
    purchase_date DATE NOT NULL,
    expire_date DATE,
    total_sessions INT NOT NULL,
    remaining_sessions INT NOT NULL,
    used_sessions INT DEFAULT 0,
    freeze_days INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    remark TEXT,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (package_type_id) REFERENCES package_types(id),
    FOREIGN KEY (coach_id) REFERENCES coaches(id)
);

CREATE INDEX idx_member_packages_member_id ON member_packages(member_id);
CREATE INDEX idx_member_packages_coach_id ON member_packages(coach_id);
CREATE INDEX idx_member_packages_status ON member_packages(status);
CREATE INDEX idx_member_packages_expire_date ON member_packages(expire_date);

-- 团课表
CREATE TABLE group_classes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    class_no VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    coach_id BIGINT NOT NULL,
    class_date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    capacity INT NOT NULL,
    registered_count INT DEFAULT 0,
    location VARCHAR(100),
    description TEXT,
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coach_id) REFERENCES coaches(id)
);

CREATE INDEX idx_group_classes_class_no ON group_classes(class_no);
CREATE INDEX idx_group_classes_coach_id ON group_classes(coach_id);
CREATE INDEX idx_group_classes_class_date ON group_classes(class_date);
CREATE INDEX idx_group_classes_status ON group_classes(status);

-- 预约表
CREATE TABLE bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_no VARCHAR(50) NOT NULL UNIQUE,
    member_id BIGINT NOT NULL,
    member_package_id BIGINT,
    coach_id BIGINT,
    group_id BIGINT,
    booking_type VARCHAR(20) NOT NULL,
    booking_date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'BOOKED',
    check_in_time TIMESTAMP,
    remark TEXT,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (member_package_id) REFERENCES member_packages(id),
    FOREIGN KEY (coach_id) REFERENCES coaches(id),
    FOREIGN KEY (group_id) REFERENCES group_classes(id)
);

CREATE INDEX idx_bookings_booking_no ON bookings(booking_no);
CREATE INDEX idx_bookings_member_id ON bookings(member_id);
CREATE INDEX idx_bookings_coach_id ON bookings(coach_id);
CREATE INDEX idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_type ON bookings(booking_type);

-- 会员冻结表
CREATE TABLE member_freezes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    freeze_no VARCHAR(50) NOT NULL UNIQUE,
    member_id BIGINT NOT NULL,
    freeze_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    freeze_days INT NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id)
);

CREATE INDEX idx_member_freezes_freeze_no ON member_freezes(freeze_no);
CREATE INDEX idx_member_freezes_member_id ON member_freezes(member_id);
CREATE INDEX idx_member_freezes_status ON member_freezes(status);
CREATE INDEX idx_member_freezes_date_range ON member_freezes(start_date, end_date);

-- 体测记录表
CREATE TABLE body_measurements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id BIGINT NOT NULL,
    measure_date DATE NOT NULL,
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    bmi DECIMAL(4,1),
    body_fat DECIMAL(4,1),
    muscle_mass DECIMAL(5,2),
    waist DECIMAL(5,2),
    hip DECIMAL(5,2),
    chest DECIMAL(5,2),
    remark TEXT,
    attachment_url VARCHAR(255),
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id)
);

CREATE INDEX idx_body_measurements_member_id ON body_measurements(member_id);
CREATE INDEX idx_body_measurements_measure_date ON body_measurements(measure_date);

-- 通知表
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    notification_no VARCHAR(50) NOT NULL UNIQUE,
    member_id BIGINT,
    coach_id BIGINT,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (coach_id) REFERENCES coaches(id)
);

CREATE INDEX idx_notifications_member_id ON notifications(member_id);
CREATE INDEX idx_notifications_coach_id ON notifications(coach_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);

-- 审计日志表
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    target_type VARCHAR(50) NOT NULL,
    target_id BIGINT,
    action VARCHAR(50) NOT NULL,
    operator VARCHAR(100) NOT NULL,
    detail TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_logs_operator ON audit_logs(operator);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- 续费记录表
CREATE TABLE renewals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id BIGINT NOT NULL,
    old_package_id BIGINT,
    new_package_id BIGINT NOT NULL,
    renewal_date DATE NOT NULL,
    price DECIMAL(10,2),
    remark TEXT,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (old_package_id) REFERENCES member_packages(id),
    FOREIGN KEY (new_package_id) REFERENCES member_packages(id)
);

CREATE INDEX idx_renewals_member_id ON renewals(member_id);
CREATE INDEX idx_renewals_renewal_date ON renewals(renewal_date);

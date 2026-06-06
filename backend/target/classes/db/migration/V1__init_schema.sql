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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_status (status)
);

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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_coach_no (coach_no),
    INDEX idx_user_id (user_id)
);

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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_member_no (member_no),
    INDEX idx_phone (phone),
    INDEX idx_status (status),
    INDEX idx_name (name)
);

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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_status (status)
);

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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (package_type_id) REFERENCES package_types(id),
    FOREIGN KEY (coach_id) REFERENCES coaches(id),
    INDEX idx_member_id (member_id),
    INDEX idx_coach_id (coach_id),
    INDEX idx_status (status),
    INDEX idx_expire_date (expire_date)
);

-- 团课表
CREATE TABLE group_classes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    class_no VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    coach_id BIGINT NOT NULL,
    class_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INT NOT NULL,
    registered_count INT DEFAULT 0,
    location VARCHAR(100),
    description TEXT,
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (coach_id) REFERENCES coaches(id),
    INDEX idx_class_no (class_no),
    INDEX idx_coach_id (coach_id),
    INDEX idx_class_date (class_date),
    INDEX idx_status (status)
);

-- 预约表
CREATE TABLE bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_no VARCHAR(50) NOT NULL UNIQUE,
    member_id BIGINT NOT NULL,
    member_package_id BIGINT,
    coach_id BIGINT,
    group_class_id BIGINT,
    booking_type VARCHAR(20) NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'BOOKED',
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    remark TEXT,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (member_package_id) REFERENCES member_packages(id),
    FOREIGN KEY (coach_id) REFERENCES coaches(id),
    FOREIGN KEY (group_class_id) REFERENCES group_classes(id),
    INDEX idx_booking_no (booking_no),
    INDEX idx_member_id (member_id),
    INDEX idx_coach_id (coach_id),
    INDEX idx_booking_date (booking_date),
    INDEX idx_status (status)
);

-- 会员冻结表
CREATE TABLE member_freezes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    freeze_no VARCHAR(50) NOT NULL UNIQUE,
    member_id BIGINT NOT NULL,
    member_package_id BIGINT,
    freeze_type VARCHAR(20) DEFAULT 'NORMAL',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    freeze_days INT NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (member_package_id) REFERENCES member_packages(id),
    INDEX idx_freeze_no (freeze_no),
    INDEX idx_member_id (member_id),
    INDEX idx_status (status),
    INDEX idx_date_range (start_date, end_date)
);

-- 体测记录表
CREATE TABLE body_measurements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id BIGINT NOT NULL,
    measure_date DATE NOT NULL,
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    bmi DECIMAL(5,2),
    body_fat DECIMAL(5,2),
    muscle_mass DECIMAL(5,2),
    waist DECIMAL(5,2),
    hip DECIMAL(5,2),
    chest DECIMAL(5,2),
    arm_left DECIMAL(5,2),
    arm_right DECIMAL(5,2),
    thigh_left DECIMAL(5,2),
    thigh_right DECIMAL(5,2),
    remark TEXT,
    attachment_url VARCHAR(255),
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id),
    INDEX idx_member_id (member_id),
    INDEX idx_measure_date (measure_date)
);

-- 通知表
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    notification_no VARCHAR(50) NOT NULL UNIQUE,
    user_id BIGINT,
    member_id BIGINT,
    type VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notification_no (notification_no),
    INDEX idx_user_id (user_id),
    INDEX idx_member_id (member_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- 审计日志表
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    log_no VARCHAR(50) NOT NULL UNIQUE,
    user_id BIGINT,
    username VARCHAR(50),
    operation VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    target_id BIGINT,
    target_type VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(50),
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_log_no (log_no),
    INDEX idx_user_id (user_id),
    INDEX idx_module (module),
    INDEX idx_operation (operation),
    INDEX idx_created_at (created_at)
);

-- 团课预约关联表
CREATE TABLE group_class_bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    group_class_id BIGINT NOT NULL,
    booking_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'REGISTERED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_class_id) REFERENCES group_classes(id),
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
    FOREIGN KEY (member_id) REFERENCES members(id),
    UNIQUE KEY uk_class_booking (group_class_id, member_id),
    INDEX idx_group_class_id (group_class_id),
    INDEX idx_member_id (member_id)
);

-- 续费记录表
CREATE TABLE renewals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    renewal_no VARCHAR(50) NOT NULL UNIQUE,
    member_id BIGINT NOT NULL,
    old_package_id BIGINT,
    new_package_id BIGINT NOT NULL,
    coach_id BIGINT,
    renewal_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'COMPLETED',
    remark TEXT,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (old_package_id) REFERENCES member_packages(id),
    FOREIGN KEY (new_package_id) REFERENCES member_packages(id),
    FOREIGN KEY (coach_id) REFERENCES coaches(id),
    INDEX idx_renewal_no (renewal_no),
    INDEX idx_member_id (member_id),
    INDEX idx_renewal_date (renewal_date)
);

-- 教练业绩表
CREATE TABLE coach_performances (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    coach_id BIGINT NOT NULL,
    stat_date DATE NOT NULL,
    private_count INT DEFAULT 0,
    group_count INT DEFAULT 0,
    new_member_count INT DEFAULT 0,
    renewal_count INT DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (coach_id) REFERENCES coaches(id),
    UNIQUE KEY uk_coach_date (coach_id, stat_date),
    INDEX idx_coach_id (coach_id),
    INDEX idx_stat_date (stat_date)
);

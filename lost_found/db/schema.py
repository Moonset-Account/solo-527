from .connection import get_connection


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('external', 'internal', 'admin')),
            name TEXT,
            phone TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            building TEXT,
            floor TEXT,
            description TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS lockers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            location_id INTEGER,
            capacity INTEGER DEFAULT 10,
            current_count INTEGER DEFAULT 0,
            status TEXT DEFAULT 'available' CHECK(status IN ('available', 'full', 'maintenance')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (location_id) REFERENCES locations(id)
        );

        CREATE TABLE IF NOT EXISTS lost_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_name TEXT NOT NULL,
            category TEXT,
            description TEXT,
            photo_path TEXT,
            is_sensitive INTEGER DEFAULT 0,
            is_valuable INTEGER DEFAULT 0,
            pickup_location_id INTEGER,
            pickup_time TIMESTAMP,
            pickup_person TEXT,
            locker_id INTEGER,
            status TEXT DEFAULT 'registered' CHECK(status IN ('registered', 'storing', 'claiming', 'claimed', 'returned', 'expired')),
            submitter_id INTEGER,
            submitter_name TEXT,
            submitter_phone TEXT,
            handler_id INTEGER,
            remark TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (pickup_location_id) REFERENCES locations(id),
            FOREIGN KEY (locker_id) REFERENCES lockers(id),
            FOREIGN KEY (submitter_id) REFERENCES users(id),
            FOREIGN KEY (handler_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS claimants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            student_id TEXT,
            id_last4 TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS claim_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lost_item_id INTEGER NOT NULL,
            claimant_id INTEGER NOT NULL,
            description TEXT,
            loss_time TIMESTAMP,
            loss_location TEXT,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'withdrawn', 'completed')),
            submitter_id INTEGER,
            reviewer_id INTEGER,
            review_remark TEXT,
            reviewed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lost_item_id) REFERENCES lost_items(id),
            FOREIGN KEY (claimant_id) REFERENCES claimants(id),
            FOREIGN KEY (submitter_id) REFERENCES users(id),
            FOREIGN KEY (reviewer_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS proof_materials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            claim_request_id INTEGER NOT NULL,
            material_type TEXT NOT NULL,
            material_path TEXT,
            description TEXT,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (claim_request_id) REFERENCES claim_requests(id)
        );

        CREATE TABLE IF NOT EXISTS claim_verifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            claim_request_id INTEGER NOT NULL,
            verifier_id INTEGER NOT NULL,
            verification_result TEXT CHECK(verification_result IN ('passed', 'failed')),
            remark TEXT,
            verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (claim_request_id) REFERENCES claim_requests(id),
            FOREIGN KEY (verifier_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS pickup_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            claim_request_id INTEGER NOT NULL,
            claimant_id INTEGER NOT NULL,
            id_last4 TEXT,
            pickup_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            handler_id INTEGER,
            signature_path TEXT,
            remark TEXT,
            FOREIGN KEY (claim_request_id) REFERENCES claim_requests(id),
            FOREIGN KEY (claimant_id) REFERENCES claimants(id),
            FOREIGN KEY (handler_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS saved_filters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            filter_name TEXT NOT NULL,
            filter_type TEXT NOT NULL,
            filter_data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, filter_name, filter_type)
        );

        CREATE TABLE IF NOT EXISTS operation_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            operation TEXT NOT NULL,
            target_type TEXT,
            target_id INTEGER,
            detail TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE INDEX IF NOT EXISTS idx_lost_items_status ON lost_items(status);
        CREATE INDEX IF NOT EXISTS idx_lost_items_category ON lost_items(category);
        CREATE INDEX IF NOT EXISTS idx_lost_items_created_at ON lost_items(created_at);
        CREATE INDEX IF NOT EXISTS idx_lost_items_valuable ON lost_items(is_valuable);
        CREATE INDEX IF NOT EXISTS idx_claim_requests_status ON claim_requests(status);
        CREATE INDEX IF NOT EXISTS idx_claim_requests_item ON claim_requests(lost_item_id);
        CREATE INDEX IF NOT EXISTS idx_claimants_phone ON claimants(phone);
        CREATE INDEX IF NOT EXISTS idx_locker_code ON lockers(code);
        CREATE INDEX IF NOT EXISTS idx_location_name ON locations(name);
        CREATE INDEX IF NOT EXISTS idx_saved_filters_user ON saved_filters(user_id, filter_type);
    """)

    cursor.executemany("""
        INSERT OR IGNORE INTO users (username, password_hash, role, name)
        VALUES (?, ?, ?, ?)
    """, [
        ('admin', 'admin123', 'admin', '系统管理员'),
        ('staff1', 'staff123', 'internal', '工作人员张三'),
        ('staff2', 'staff123', 'internal', '工作人员李四'),
    ])

    cursor.executemany("""
        INSERT OR IGNORE INTO locations (name, building, floor, description)
        VALUES (?, ?, ?, ?)
    """, [
        ('图书馆前台', '图书馆', '1楼', '图书馆一楼服务台'),
        ('教学楼A门卫', '教学楼A', '1楼', '教学楼A座门卫室'),
        ('食堂服务台', '第一食堂', '1楼', '第一食堂入口服务台'),
        ('宿舍管理处', '学生宿舍1号楼', '1楼', '宿舍1号楼管理处'),
        ('体育馆入口', '体育馆', '1楼', '体育馆主入口'),
    ])

    cursor.executemany("""
        INSERT OR IGNORE INTO lockers (code, location_id, capacity)
        VALUES (?, ?, ?)
    """, [
        ('LIB-A01', 1, 20),
        ('LIB-A02', 1, 20),
        ('LIB-B01', 1, 20),
        ('BLD-A01', 2, 15),
        ('CAN-001', 3, 15),
        ('DOR-001', 4, 10),
        ('GYM-001', 5, 10),
    ])

    conn.commit()

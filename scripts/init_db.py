import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'transfer_orders.db')


def init_database():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS transfer_orders (
        order_id TEXT PRIMARY KEY,
        source_warehouse TEXT NOT NULL,
        target_warehouse TEXT NOT NULL,
        carrier TEXT NOT NULL,
        evidence_type TEXT NOT NULL,
        handler TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('正常', '返工', '审计中', '已完成')),
        create_time TIMESTAMP NOT NULL,
        complete_time TIMESTAMP,
        processing_hours REAL,
        is_rework INTEGER DEFAULT 0,
        is_auditing INTEGER DEFAULT 0,
        missing_attachment INTEGER DEFAULT 0,
        manual_entry INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS evidence_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL,
        evidence_name TEXT,
        evidence_status TEXT NOT NULL CHECK(evidence_status IN ('已上传', '缺失', '无效', '待审核')),
        upload_time TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES transfer_orders(order_id)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS rework_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL,
        rework_reason TEXT NOT NULL,
        rework_time TIMESTAMP NOT NULL,
        handler TEXT,
        remark TEXT,
        FOREIGN KEY (order_id) REFERENCES transfer_orders(order_id)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS import_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        import_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        source_file TEXT,
        total_records INTEGER,
        duplicates_removed INTEGER,
        missing_attachment_count INTEGER,
        manual_entry_count INTEGER,
        imported_count INTEGER
    )
    ''')

    cursor.execute('CREATE INDEX IF NOT EXISTS idx_order_status ON transfer_orders(status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_source_wh ON transfer_orders(source_warehouse)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_target_wh ON transfer_orders(target_warehouse)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_carrier ON transfer_orders(carrier)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_evidence_type ON transfer_orders(evidence_type)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_handler ON transfer_orders(handler)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_ev_order ON evidence_records(order_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_rw_order ON rework_records(order_id)')

    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH}")


if __name__ == '__main__':
    init_database()

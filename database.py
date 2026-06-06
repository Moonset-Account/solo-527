import os
import duckdb
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "procurement_archive.db")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_db():
    con = duckdb.connect(DATABASE_URL)
    return con

def get_next_id(con, table_name, id_column="id"):
    result = con.execute(f"SELECT COALESCE(MAX({id_column}), 0) FROM {table_name}").fetchone()
    return result[0] + 1

def init_db():
    con = get_db()
    
    con.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username VARCHAR UNIQUE NOT NULL,
            password_hash VARCHAR NOT NULL,
            role VARCHAR NOT NULL CHECK (role IN ('buyer', 'auditor', 'admin')),
            full_name VARCHAR NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    con.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY,
            project_code VARCHAR UNIQUE NOT NULL,
            project_name VARCHAR NOT NULL,
            supplier_name VARCHAR NOT NULL,
            amount DECIMAL(15,2) NOT NULL,
            status VARCHAR NOT NULL DEFAULT 'draft' 
                CHECK (status IN ('draft', 'pending_review', 'first_reviewed', 'archived', 'rejected')),
            created_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id)
        )
    """)
    
    con.execute("""
        CREATE SEQUENCE IF NOT EXISTS seq_project_id START WITH 1 INCREMENT BY 1
    """)
    
    con.execute("""
        CREATE TABLE IF NOT EXISTS evidence_files (
            id INTEGER PRIMARY KEY,
            project_id INTEGER NOT NULL,
            file_type VARCHAR NOT NULL 
                CHECK (file_type IN ('price_comparison', 'supplier_quote', 'approval_form')),
            file_name VARCHAR NOT NULL,
            file_path VARCHAR NOT NULL,
            file_size INTEGER NOT NULL,
            uploaded_by INTEGER NOT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_archived BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (project_id) REFERENCES projects(id),
            FOREIGN KEY (uploaded_by) REFERENCES users(id)
        )
    """)
    
    con.execute("""
        CREATE SEQUENCE IF NOT EXISTS seq_evidence_id START WITH 1 INCREMENT BY 1
    """)
    
    con.execute("""
        CREATE TABLE IF NOT EXISTS review_records (
            id INTEGER PRIMARY KEY,
            project_id INTEGER NOT NULL,
            reviewer_id INTEGER NOT NULL,
            review_type VARCHAR NOT NULL 
                CHECK (review_type IN ('first_review', 'second_review')),
            decision VARCHAR NOT NULL 
                CHECK (decision IN ('approve', 'reject')),
            comments TEXT,
            reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id),
            FOREIGN KEY (reviewer_id) REFERENCES users(id)
        )
    """)
    
    con.execute("""
        CREATE SEQUENCE IF NOT EXISTS seq_review_id START WITH 1 INCREMENT BY 1
    """)
    
    con.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL,
            project_id INTEGER NOT NULL,
            notification_type VARCHAR NOT NULL,
            message TEXT NOT NULL,
            status VARCHAR NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'sent', 'failed', 'retrying')),
            retry_count INTEGER DEFAULT 0,
            max_retries INTEGER DEFAULT 5,
            next_retry_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            sent_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (project_id) REFERENCES projects(id)
        )
    """)
    
    con.execute("""
        CREATE SEQUENCE IF NOT EXISTS seq_notification_id START WITH 1 INCREMENT BY 1
    """)
    
    con.execute("""
        CREATE TABLE IF NOT EXISTS evidence_comments (
            id INTEGER PRIMARY KEY,
            evidence_id INTEGER NOT NULL,
            comment_text TEXT NOT NULL,
            created_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (evidence_id) REFERENCES evidence_files(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        )
    """)
    
    con.execute("""
        CREATE SEQUENCE IF NOT EXISTS seq_comment_id START WITH 1 INCREMENT BY 1
    """)
    
    con.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL,
            action VARCHAR NOT NULL,
            target_type VARCHAR NOT NULL,
            target_id INTEGER NOT NULL,
            details TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    con.execute("""
        CREATE SEQUENCE IF NOT EXISTS seq_audit_id START WITH 1 INCREMENT BY 1
    """)
    
    result = con.execute("SELECT COUNT(*) FROM users").fetchone()
    if result[0] == 0:
        hashed_admin = pwd_context.hash("admin123")
        hashed_buyer = pwd_context.hash("buyer123")
        hashed_auditor = pwd_context.hash("auditor123")
        
        con.execute("""
            INSERT INTO users (id, username, password_hash, role, full_name) VALUES
            (1, 'admin', ?, 'admin', '系统管理员'),
            (2, 'buyer01', ?, 'buyer', '采购员张三'),
            (3, 'auditor01', ?, 'auditor', '审计员李四')
        """, [hashed_admin, hashed_buyer, hashed_auditor])
    
    con.close()

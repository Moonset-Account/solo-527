package database

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func InitDB() error {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./data/pharmacy.db"
	}

	dbDir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		return fmt.Errorf("failed to create db directory: %w", err)
	}

	var err error
	DB, err = sql.Open("sqlite3", dbPath+"?_foreign_keys=on&_journal_mode=WAL")
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}

	DB.SetMaxOpenConns(1)
	DB.SetMaxIdleConns(1)
	DB.SetConnMaxLifetime(time.Hour)

	if err := DB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	if err := runMigrations(); err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	if err := seedData(); err != nil {
		return fmt.Errorf("failed to seed data: %w", err)
	}

	return nil
}

func runMigrations() error {
	schemaPath := filepath.Join("database", "schema.sql")
	schema, err := os.ReadFile(schemaPath)
	if err != nil {
		return fmt.Errorf("failed to read schema: %w", err)
	}

	_, err = DB.Exec(string(schema))
	if err != nil {
		return fmt.Errorf("failed to execute schema: %w", err)
	}

	return nil
}

func seedData() error {
	var count int
	err := DB.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	_, err = DB.Exec(`
		INSERT INTO users (username, password, role, name) VALUES
		('admin', 'admin123', 'admin', '系统管理员'),
		('pharmacist1', 'pharma123', 'pharmacist', '李药师'),
		('pharmacist2', 'pharma123', 'pharmacist', '王药师'),
		('window1', 'window123', 'window', '1号窗口'),
		('window2', 'window123', 'window', '2号窗口')
	`)
	if err != nil {
		return err
	}

	_, err = DB.Exec(`
		INSERT INTO windows (window_no, name) VALUES
		('W001', '慢病续方1号窗口'),
		('W002', '慢病续方2号窗口'),
		('W003', '慢病续方3号窗口')
	`)
	if err != nil {
		return err
	}

	_, err = DB.Exec(`
		INSERT INTO medicines (name, code) VALUES
		('硝苯地平缓释片', 'MED001'),
		('二甲双胍片', 'MED002'),
		('阿司匹林肠溶片', 'MED003'),
		('阿托伐他汀钙片', 'MED004'),
		('缬沙坦胶囊', 'MED005')
	`)
	if err != nil {
		return err
	}

	_, err = DB.Exec(`
		INSERT INTO medicine_batches (medicine_id, batch_no, quantity, expiry_date) VALUES
		(1, 'B20250101', 500, '2026-12-31'),
		(1, 'B20250601', 300, '2027-06-30'),
		(2, 'B20250201', 400, '2026-12-31'),
		(2, 'B20250701', 200, '2027-07-31'),
		(3, 'B20250301', 600, '2026-08-31'),
		(4, 'B20250401', 350, '2026-10-31'),
		(5, 'B20250501', 280, '2026-11-30')
	`)
	if err != nil {
		return err
	}

	return nil
}

func CloseDB() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}

package database

import (
	"database/sql"
	"log"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func InitDB() {
	var err error
	DB, err = sql.Open("sqlite3", "./renovation.db")
	if err != nil {
		log.Fatal(err)
	}

	createTables()
	insertSeedData()
}

func createTables() {
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT UNIQUE NOT NULL,
		password TEXT NOT NULL,
		role TEXT NOT NULL,
		name TEXT,
		phone TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS construction_teams (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		leader_name TEXT,
		leader_phone TEXT,
		license_number TEXT,
		violation_count INTEGER DEFAULT 0,
		needs_manual_review BOOLEAN DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS applications (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		application_no TEXT UNIQUE NOT NULL,
		owner_name TEXT NOT NULL,
		owner_phone TEXT,
		building TEXT NOT NULL,
		unit TEXT NOT NULL,
		room TEXT NOT NULL,
		team_id INTEGER,
		work_types TEXT NOT NULL,
		material_entry_time DATETIME,
		start_date DATE NOT NULL,
		end_date DATE NOT NULL,
		has_noise_work BOOLEAN DEFAULT 0,
		noise_time_slots TEXT,
		status TEXT DEFAULT 'pending',
		reviewer_id INTEGER,
		review_comment TEXT,
		reviewed_at DATETIME,
		qr_code TEXT,
		created_by INTEGER,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (team_id) REFERENCES construction_teams(id),
		FOREIGN KEY (reviewer_id) REFERENCES users(id)
	);

	CREATE TABLE IF NOT EXISTS violations (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		application_id INTEGER NOT NULL,
		team_id INTEGER NOT NULL,
		violation_type TEXT NOT NULL,
		description TEXT,
		violation_time DATETIME DEFAULT CURRENT_TIMESTAMP,
		reported_by INTEGER,
		status TEXT DEFAULT 'open',
		handled_by INTEGER,
		handle_comment TEXT,
		handled_at DATETIME,
		FOREIGN KEY (application_id) REFERENCES applications(id),
		FOREIGN KEY (team_id) REFERENCES construction_teams(id)
	);

	CREATE TABLE IF NOT EXISTS gate_verifications (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		application_id INTEGER NOT NULL,
		qr_code TEXT NOT NULL,
		verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		verifier_id INTEGER,
		result TEXT NOT NULL,
		detail TEXT,
		FOREIGN KEY (application_id) REFERENCES applications(id)
	);

	CREATE TABLE IF NOT EXISTS notifications (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER,
		title TEXT NOT NULL,
		content TEXT NOT NULL,
		type TEXT DEFAULT 'system',
		is_read BOOLEAN DEFAULT 0,
		related_id INTEGER,
		related_type TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id)
	);

	CREATE TABLE IF NOT EXISTS audit_logs (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER,
		action TEXT NOT NULL,
		module TEXT NOT NULL,
		detail TEXT,
		ip_address TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id)
	);

	CREATE TABLE IF NOT EXISTS holidays (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		date DATE UNIQUE NOT NULL,
		is_noise_prohibited BOOLEAN DEFAULT 1
	);

	CREATE TABLE IF NOT EXISTS time_slots (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		start_time TEXT NOT NULL,
		end_time TEXT NOT NULL,
		is_noise_allowed BOOLEAN DEFAULT 0,
		day_type TEXT DEFAULT 'workday'
	);
	`

	_, err := DB.Exec(createTableSQL)
	if err != nil {
		log.Fatal(err)
	}
}

func insertSeedData() {
	tx, err := DB.Begin()
	if err != nil {
		log.Fatal(err)
	}
	defer tx.Rollback()

	var count int
	tx.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if count == 0 {
		users := []struct {
			username, password, role, name, phone string
		}{
			{"admin", "admin123", "admin", "系统管理员", "13800138000"},
			{"engineer", "engineer123", "engineer", "工程部张工", "13800138001"},
			{"gate", "gate123", "gate", "门岗李师傅", "13800138002"},
			{"owner", "owner123", "owner", "业主王先生", "13800138003"},
		}
		for _, u := range users {
			tx.Exec("INSERT INTO users (username, password, role, name, phone) VALUES (?, ?, ?, ?, ?)",
				u.username, u.password, u.role, u.name, u.phone)
		}
	}

	tx.QueryRow("SELECT COUNT(*) FROM time_slots").Scan(&count)
	if count == 0 {
		slots := []struct {
			name, start, end string
			isNoise          bool
			dayType          string
		}{
			{"上午工作时段", "08:00", "12:00", false, "workday"},
			{"下午工作时段", "14:00", "18:00", false, "workday"},
			{"上午噪音时段", "09:00", "11:30", true, "workday"},
			{"下午噪音时段", "14:30", "17:30", true, "workday"},
			{"周末上午", "09:00", "12:00", false, "weekend"},
			{"周末下午", "14:00", "17:00", false, "weekend"},
		}
		for _, s := range slots {
			tx.Exec("INSERT INTO time_slots (name, start_time, end_time, is_noise_allowed, day_type) VALUES (?, ?, ?, ?, ?)",
				s.name, s.start, s.end, s.isNoise, s.dayType)
		}
	}

	tx.QueryRow("SELECT COUNT(*) FROM holidays").Scan(&count)
	if count == 0 {
		holidays := []struct {
			name, date string
		}{
			{"元旦", "2026-01-01"},
			{"春节", "2026-02-17"},
			{"春节", "2026-02-18"},
			{"春节", "2026-02-19"},
			{"清明节", "2026-04-05"},
			{"劳动节", "2026-05-01"},
			{"端午节", "2026-06-19"},
			{"中秋节", "2026-09-25"},
			{"国庆节", "2026-10-01"},
			{"国庆节", "2026-10-02"},
			{"国庆节", "2026-10-03"},
		}
		for _, h := range holidays {
			tx.Exec("INSERT INTO holidays (name, date, is_noise_prohibited) VALUES (?, ?, 1)", h.name, h.date)
		}
	}

	tx.QueryRow("SELECT COUNT(*) FROM construction_teams").Scan(&count)
	if count == 0 {
		teams := []struct {
			name, leader, phone, license string
		}{
			{"诚信装修队", "张队长", "13900139001", "JZ2024001"},
			{"家装优选施工队", "李工头", "13900139002", "JZ2024002"},
			{"精品装饰工程队", "王经理", "13900139003", "JZ2024003"},
		}
		for _, t := range teams {
			tx.Exec("INSERT INTO construction_teams (name, leader_name, leader_phone, license_number) VALUES (?, ?, ?, ?)",
				t.name, t.leader, t.phone, t.license)
		}
	}

	if err := tx.Commit(); err != nil {
		log.Fatal(err)
	}
	log.Println("Database initialized with seed data")
}

func IsHoliday(date string) bool {
	var count int
	DB.QueryRow("SELECT COUNT(*) FROM holidays WHERE date = ?", date).Scan(&count)
	return count > 0
}

func HasHolidayInRange(startDate, endDate string) (bool, string) {
	var holidayDate, holidayName string
	err := DB.QueryRow(`
		SELECT date, name FROM holidays 
		WHERE date >= ? AND date <= ? AND is_noise_prohibited = 1
		ORDER BY date ASC LIMIT 1
	`, startDate, endDate).Scan(&holidayDate, &holidayName)
	if err != nil {
		return false, ""
	}
	return true, holidayName + "(" + holidayDate + ")"
}

func GetTimeSlots(dayType string, isNoise bool) []map[string]interface{} {
	rows, err := DB.Query("SELECT id, name, start_time, end_time FROM time_slots WHERE day_type = ? AND is_noise_allowed = ?",
		dayType, isNoise)
	if err != nil {
		return nil
	}
	defer rows.Close()

	var slots []map[string]interface{}
	for rows.Next() {
		var id int
		var name, start, end string
		rows.Scan(&id, &name, &start, &end)
		slots = append(slots, map[string]interface{}{
			"id":         id,
			"name":       name,
			"start_time": start,
			"end_time":   end,
		})
	}
	return slots
}

func FormatTime(t time.Time) string {
	return t.Format("2006-01-02 15:04:05")
}

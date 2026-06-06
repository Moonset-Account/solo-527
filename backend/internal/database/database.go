package database

import (
	"database/sql"
	"encoding/json"
	"log"
	"time"

	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/bcrypt"
)

var DB *sql.DB

func InitDB(dbPath string) error {
	var err error
	DB, err = sql.Open("sqlite3", dbPath+"?_foreign_keys=on")
	if err != nil {
		return err
	}

	if err = createTables(); err != nil {
		return err
	}

	if err = seedData(); err != nil {
		return err
	}

	return nil
}

func createTables() error {
	statements := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			username TEXT UNIQUE NOT NULL,
			password TEXT NOT NULL,
			role TEXT NOT NULL,
			name TEXT NOT NULL,
			phone TEXT,
			site_id TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS sites (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			address TEXT,
			phone TEXT,
			contact TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS boxes (
			id TEXT PRIMARY KEY,
			box_number TEXT UNIQUE NOT NULL,
			thermometer_id TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'idle',
			vaccine_type TEXT,
			vaccine_count INTEGER DEFAULT 0,
			current_task_id TEXT,
			temperature REAL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS routes (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			site_ids TEXT NOT NULL,
			order_num INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS tasks (
			id TEXT PRIMARY KEY,
			box_id TEXT NOT NULL,
			box_number TEXT NOT NULL,
			route_id TEXT NOT NULL,
			route_name TEXT NOT NULL,
			site_id TEXT NOT NULL,
			site_name TEXT NOT NULL,
			dispatcher_id TEXT NOT NULL,
			dispatcher_name TEXT NOT NULL,
			nurse_id TEXT,
			nurse_name TEXT,
			status TEXT NOT NULL DEFAULT 'pending',
			expected_arrival DATETIME,
			actual_arrival DATETIME,
			signed_at DATETIME,
			return_reason TEXT,
			exception_note TEXT,
			temperature_ok INTEGER,
			reviewed INTEGER DEFAULT 0,
			reviewed_by TEXT,
			reviewed_at DATETIME,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (box_id) REFERENCES boxes(id),
			FOREIGN KEY (site_id) REFERENCES sites(id)
		)`,
		`CREATE TABLE IF NOT EXISTS temperature_records (
			id TEXT PRIMARY KEY,
			box_id TEXT NOT NULL,
			task_id TEXT NOT NULL,
			temperature REAL NOT NULL,
			recorded_at DATETIME NOT NULL,
			recorded_by TEXT NOT NULL,
			attachment TEXT,
			is_normal INTEGER DEFAULT 1,
			note TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (box_id) REFERENCES boxes(id),
			FOREIGN KEY (task_id) REFERENCES tasks(id)
		)`,
		`CREATE TABLE IF NOT EXISTS exception_records (
			id TEXT PRIMARY KEY,
			task_id TEXT NOT NULL,
			box_id TEXT NOT NULL,
			type TEXT NOT NULL,
			description TEXT NOT NULL,
			temperature REAL,
			reported_by TEXT NOT NULL,
			resolved INTEGER DEFAULT 0,
			resolved_by TEXT,
			resolved_at DATETIME,
			resolution TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (task_id) REFERENCES tasks(id),
			FOREIGN KEY (box_id) REFERENCES boxes(id)
		)`,
		`CREATE TABLE IF NOT EXISTS sms_notifications (
			id TEXT PRIMARY KEY,
			task_id TEXT NOT NULL,
			phone TEXT NOT NULL,
			message TEXT NOT NULL,
			type TEXT NOT NULL,
			sent_at DATETIME,
			status TEXT DEFAULT 'pending',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (task_id) REFERENCES tasks(id)
		)`,
		`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`,
		`CREATE INDEX IF NOT EXISTS idx_tasks_site ON tasks(site_id)`,
		`CREATE INDEX IF NOT EXISTS idx_tasks_box ON tasks(box_number)`,
		`CREATE INDEX IF NOT EXISTS idx_boxes_status ON boxes(status)`,
	}

	for _, stmt := range statements {
		_, err := DB.Exec(stmt)
		if err != nil {
			return err
		}
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

	now := time.Now()
	siteIDs := []string{"site-001", "site-002", "site-003", "site-004", "site-005"}
	siteNames := []string{"朝阳区社区卫生服务中心", "海淀区中关村社区医院", "西城区德胜社区卫生中心", "东城区东华门社区医院", "丰台区方庄社区卫生中心"}
	siteAddresses := []string{"朝阳区朝阳路100号", "海淀区中关村大街50号", "西城区德胜门内大街200号", "东城区王府井大街80号", "丰台区方庄路120号"}
	sitePhones := []string{"010-81234567", "010-82345678", "010-83456789", "010-84567890", "010-85678901"}
	siteContacts := []string{"张主任", "李主任", "王主任", "赵主任", "刘主任"}

	for i, id := range siteIDs {
		_, err := DB.Exec(
			"INSERT INTO sites (id, name, address, phone, contact, created_at) VALUES (?, ?, ?, ?, ?, ?)",
			id, siteNames[i], siteAddresses[i], sitePhones[i], siteContacts[i], now,
		)
		if err != nil {
			log.Printf("Error inserting site %s: %v", id, err)
		}
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Error generating password hash: %v", err)
		hashedPassword = []byte("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy")
	}

	users := []struct {
		id       string
		username string
		password string
		role     string
		name     string
		phone    string
		siteID   *string
	}{
		{"user-admin", "admin", string(hashedPassword), "admin", "系统管理员", "13800000000", nil},
		{"user-disp1", "dispatcher1", string(hashedPassword), "dispatcher", "王调度", "13800000001", nil},
		{"user-disp2", "dispatcher2", string(hashedPassword), "dispatcher", "李调度", "13800000002", nil},
		{"user-nurse1", "nurse1", string(hashedPassword), "nurse", "张护士", "13800000003", &siteIDs[0]},
		{"user-nurse2", "nurse2", string(hashedPassword), "nurse", "刘护士", "13800000004", &siteIDs[1]},
		{"user-nurse3", "nurse3", string(hashedPassword), "nurse", "陈护士", "13800000005", &siteIDs[2]},
		{"user-nurse4", "nurse4", string(hashedPassword), "nurse", "杨护士", "13800000006", &siteIDs[3]},
		{"user-nurse5", "nurse5", string(hashedPassword), "nurse", "黄护士", "13800000007", &siteIDs[4]},
	}

	for _, u := range users {
		_, err := DB.Exec(
			"INSERT INTO users (id, username, password, role, name, phone, site_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
			u.id, u.username, u.password, u.role, u.name, u.phone, u.siteID, now,
		)
		if err != nil {
			log.Printf("Error inserting user %s: %v", u.id, err)
		}
	}

	routeIDs := []string{"route-001", "route-002", "route-003"}
	routeNames := []string{"东部线", "西部线", "南北线"}
	routeSiteIDs := [][]string{
		{siteIDs[0], siteIDs[4]},
		{siteIDs[1], siteIDs[2]},
		{siteIDs[0], siteIDs[3]},
	}

	for i, id := range routeIDs {
		siteIDsJSON, _ := json.Marshal(routeSiteIDs[i])
		_, err := DB.Exec(
			"INSERT INTO routes (id, name, site_ids, order_num, created_at) VALUES (?, ?, ?, ?, ?)",
			id, routeNames[i], string(siteIDsJSON), i+1, now,
		)
		if err != nil {
			log.Printf("Error inserting route %s: %v", id, err)
		}
	}

	boxNumbers := []string{"CCB-001", "CCB-002", "CCB-003", "CCB-004", "CCB-005", "CCB-006", "CCB-007", "CCB-008", "CCB-009", "CCB-010"}
	thermometerIDs := []string{"TH-001", "TH-002", "TH-003", "TH-004", "TH-005", "TH-006", "TH-007", "TH-008", "TH-009", "TH-010"}

	for i, bn := range boxNumbers {
		boxID := "box-" + bn
		_, err := DB.Exec(
			"INSERT INTO boxes (id, box_number, thermometer_id, status, vaccine_type, vaccine_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
			boxID, bn, thermometerIDs[i], "idle", "", 0, now, now,
		)
		if err != nil {
			log.Printf("Error inserting box %s: %v", boxID, err)
		}
	}

	return nil
}

func Close() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}

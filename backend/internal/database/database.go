package database

import (
	"database/sql"
	"log"
	"time"

	_ "modernc.org/sqlite"
)

var DB *sql.DB

func InitDB() {
	var err error
	DB, err = sql.Open("sqlite", "./cold_chain.db")
	if err != nil {
		log.Fatal(err)
	}

	createTables()
	seedInitialData()
}

func createTables() {
	statements := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT UNIQUE NOT NULL,
			password TEXT NOT NULL,
			role TEXT NOT NULL DEFAULT 'nurse',
			name TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS vaccine_batches (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			batch_no TEXT NOT NULL,
			box_no TEXT NOT NULL,
			vaccine_name TEXT NOT NULL,
			manufacturer TEXT,
			quantity INTEGER NOT NULL,
			receive_temp REAL NOT NULL,
			temp_min REAL NOT NULL,
			temp_max REAL NOT NULL,
			expire_date TEXT NOT NULL,
			receiver_id INTEGER NOT NULL,
			receiver_name TEXT NOT NULL,
			signature TEXT,
			status TEXT NOT NULL DEFAULT 'available',
			temperature_ok INTEGER NOT NULL DEFAULT 1,
			isolation_reason TEXT,
			received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS handover_records (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			batch_id INTEGER NOT NULL,
			batch_no TEXT NOT NULL,
			vaccine_name TEXT NOT NULL,
			quantity INTEGER NOT NULL,
			check_temp REAL NOT NULL,
			temp_ok INTEGER NOT NULL DEFAULT 1,
			sender_id INTEGER NOT NULL,
			sender_name TEXT NOT NULL,
			receiver_id INTEGER,
			receiver_name TEXT,
			receiver_signature TEXT,
			status TEXT NOT NULL DEFAULT 'pending',
			failure_reason TEXT,
			handler_id INTEGER,
			handler_name TEXT,
			next_review_time TEXT,
			handover_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS temp_attachments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			batch_id INTEGER NOT NULL,
			file_name TEXT NOT NULL,
			file_type TEXT NOT NULL,
			file_data BLOB NOT NULL,
			uploaded_by INTEGER NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE INDEX IF NOT EXISTS idx_batches_status ON vaccine_batches(status)`,
		`CREATE INDEX IF NOT EXISTS idx_batches_received ON vaccine_batches(received_at)`,
		`CREATE INDEX IF NOT EXISTS idx_handover_batch ON handover_records(batch_id)`,
	}

	for _, stmt := range statements {
		_, err := DB.Exec(stmt)
		if err != nil {
			log.Printf("Error creating table: %v\n", err)
		}
	}
}

func seedInitialData() {
	var count int
	err := DB.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if err != nil {
		log.Printf("Error checking users: %v", err)
		return
	}

	if count > 0 {
		return
	}

	users := []struct {
		username, password, role, name string
	}{
		{"admin", "admin123", "admin", "系统管理员"},
		{"nurse1", "nurse123", "nurse", "张护士"},
		{"nurse2", "nurse123", "nurse", "李护士"},
		{"vaccinator1", "vac123", "vaccinator", "王接种员"},
	}

	for _, u := range users {
		_, err := DB.Exec(
			"INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)",
			u.username, u.password, u.role, u.name,
		)
		if err != nil {
			log.Printf("Error inserting user: %v", err)
		}
	}

	now := time.Now()
	expireDate1 := now.AddDate(0, 6, 0).Format("2006-01-02")
	expireDate2 := now.AddDate(0, 1, 0).Format("2006-01-02")
	expireDate3 := now.AddDate(0, 0, 5).Format("2006-01-02")

	batches := []struct {
		batchNo, boxNo, vacName, mfr, expireDate, receiverName string
		qty                                                    int
		recvTemp, tMin, tMax                                   float64
		status                                                 string
		tempOk                                                 int
	}{
		{"B2024001", "BOX001", "新冠疫苗", "国药", expireDate1, "张护士", 100, 2.5, 2, 8, "available", 1},
		{"B2024002", "BOX002", "乙肝疫苗", "科兴", expireDate2, "李护士", 50, 5.0, 2, 8, "available", 1},
		{"B2024003", "BOX003", "流感疫苗", "华兰", expireDate3, "张护士", 30, 12.0, 2, 8, "isolated", 0},
		{"B2024004", "BOX004", "HPV疫苗", "默沙东", expireDate1, "李护士", 20, 3.0, 2, 8, "available", 1},
	}

	for _, b := range batches {
		res, err := DB.Exec(`INSERT INTO vaccine_batches 
			(batch_no, box_no, vaccine_name, manufacturer, quantity, receive_temp, temp_min, temp_max, 
			 expire_date, receiver_id, receiver_name, status, temperature_ok, isolation_reason)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			b.batchNo, b.boxNo, b.vacName, b.mfr, b.qty, b.recvTemp, b.tMin, b.tMax,
			b.expireDate, 2, b.receiverName, b.status, b.tempOk,
			func() string {
				if b.tempOk == 0 {
					return "接收时温度超标"
				}
				return ""
			}(),
		)
		if err != nil {
			log.Printf("Error inserting batch: %v", err)
			continue
		}

		if b.status == "available" {
			batchID, _ := res.LastInsertId()
			_, _ = DB.Exec(`INSERT INTO handover_records 
				(batch_id, batch_no, vaccine_name, quantity, check_temp, temp_ok, sender_id, sender_name, status)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				batchID, b.batchNo, b.vacName, 10, b.recvTemp+0.5, b.tempOk, 2, b.receiverName, "completed",
			)
		}
	}

	log.Println("Initial data seeded successfully")
}

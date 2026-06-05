package handlers

import (
	"database/sql"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"pharmacy-queue/database"
	"pharmacy-queue/middleware"

	"github.com/gofiber/fiber/v2"
)

func GetMedicines(c *fiber.Ctx) error {
	rows, err := database.DB.Query(`
		SELECT id, name, code, created_at FROM medicines ORDER BY name
	`)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	type Medicine struct {
		ID        int    `json:"id"`
		Name      string `json:"name"`
		Code      string `json:"code"`
		CreatedAt string `json:"created_at"`
	}

	var medicines []Medicine
	for rows.Next() {
		var m Medicine
		err := rows.Scan(&m.ID, &m.Name, &m.Code, &m.CreatedAt)
		if err != nil {
			continue
		}
		medicines = append(medicines, m)
	}

	return c.JSON(fiber.Map{"medicines": medicines})
}

func GetMedicineBatches(c *fiber.Ctx) error {
	medicineID := c.Params("medicine_id")

	rows, err := database.DB.Query(`
		SELECT mb.id, mb.batch_no, mb.quantity, mb.expiry_date, m.name as medicine_name
		FROM medicine_batches mb
		JOIN medicines m ON mb.medicine_id = m.id
		WHERE mb.medicine_id = ? AND mb.expiry_date >= DATE('now')
		ORDER BY mb.expiry_date ASC
	`, medicineID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	type Batch struct {
		ID           int    `json:"id"`
		BatchNo      string `json:"batch_no"`
		Quantity     int    `json:"quantity"`
		ExpiryDate   string `json:"expiry_date"`
		MedicineName string `json:"medicine_name"`
	}

	var batches []Batch
	for rows.Next() {
		var b Batch
		err := rows.Scan(&b.ID, &b.BatchNo, &b.Quantity, &b.ExpiryDate, &b.MedicineName)
		if err != nil {
			continue
		}
		batches = append(batches, b)
	}

	return c.JSON(fiber.Map{"batches": batches})
}

func GetAllBatches(c *fiber.Ctx) error {
	rows, err := database.DB.Query(`
		SELECT mb.id, mb.batch_no, mb.quantity, mb.expiry_date, m.name as medicine_name, m.code as medicine_code
		FROM medicine_batches mb
		JOIN medicines m ON mb.medicine_id = m.id
		ORDER BY mb.expiry_date ASC
	`)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	type Batch struct {
		ID           int    `json:"id"`
		BatchNo      string `json:"batch_no"`
		Quantity     int    `json:"quantity"`
		ExpiryDate   string `json:"expiry_date"`
		MedicineName string `json:"medicine_name"`
		MedicineCode string `json:"medicine_code"`
	}

	var batches []Batch
	for rows.Next() {
		var b Batch
		err := rows.Scan(&b.ID, &b.BatchNo, &b.Quantity, &b.ExpiryDate, &b.MedicineName, &b.MedicineCode)
		if err != nil {
			continue
		}
		batches = append(batches, b)
	}

	return c.JSON(fiber.Map{"batches": batches})
}

func GetRestockTodos(c *fiber.Ctx) error {
	status := c.Query("status", "pending")

	query := `
		SELECT rt.id, rt.quantity_needed, rt.status, rt.created_at, rt.notes,
		       m.name as medicine_name, mb.batch_no, u.name as created_by,
		       cu.name as completed_by, rt.completed_at
		FROM restock_todos rt
		JOIN medicines m ON rt.medicine_id = m.id
		LEFT JOIN medicine_batches mb ON rt.batch_id = mb.id
		JOIN users u ON rt.created_by = u.id
		LEFT JOIN users cu ON rt.completed_by = cu.id
	`
	var args []interface{}

	if status != "" {
		query += " WHERE rt.status = ?"
		args = append(args, status)
	}
	query += " ORDER BY rt.created_at DESC"

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	type RestockTodo struct {
		ID            int     `json:"id"`
		MedicineName  string  `json:"medicine_name"`
		BatchNo       *string `json:"batch_no"`
		QuantityNeeded int    `json:"quantity_needed"`
		Status        string  `json:"status"`
		CreatedAt     string  `json:"created_at"`
		CreatedBy     string  `json:"created_by"`
		Notes         *string `json:"notes"`
		CompletedAt   *string `json:"completed_at"`
		CompletedBy   *string `json:"completed_by"`
	}

	var todos []RestockTodo
	for rows.Next() {
		var t RestockTodo
		var batchNo, notes, completedAt, completedBy sql.NullString
		err := rows.Scan(&t.ID, &t.QuantityNeeded, &t.Status, &t.CreatedAt, &t.Notes,
			&t.MedicineName, &batchNo, &t.CreatedBy, &completedBy, &completedAt)
		if err != nil {
			continue
		}
		if batchNo.Valid {
			t.BatchNo = &batchNo.String
		}
		if notes.Valid {
			t.Notes = &notes.String
		}
		if completedAt.Valid {
			t.CompletedAt = &completedAt.String
		}
		if completedBy.Valid {
			t.CompletedBy = &completedBy.String
		}
		todos = append(todos, t)
	}

	return c.JSON(fiber.Map{"restock_todos": todos})
}

func CompleteRestockTodo(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)
	todoID := c.Params("id")

	var req struct {
		QuantityAdded int `json:"quantity_added"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	tx, err := database.DB.Begin()
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to begin transaction"})
	}
	defer tx.Rollback()

	var batchID sql.NullInt64
	err = tx.QueryRow("SELECT batch_id FROM restock_todos WHERE id = ?", todoID).Scan(&batchID)
	if err == sql.ErrNoRows {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "restock todo not found"})
	}

	if batchID.Valid && req.QuantityAdded > 0 {
		_, err = tx.Exec(`
			UPDATE medicine_batches SET quantity = quantity + ? WHERE id = ?
		`, req.QuantityAdded, batchID.Int64)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update batch quantity"})
		}
	}

	_, err = tx.Exec(`
		UPDATE restock_todos 
		SET status = 'completed', completed_at = CURRENT_TIMESTAMP, completed_by = ?
		WHERE id = ?
	`, user.UserID, todoID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update restock todo"})
	}

	if err := tx.Commit(); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to commit transaction"})
	}

	return c.JSON(fiber.Map{"message": "restock todo completed"})
}

func CreateBackup(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)

	backupDir := "./data/backups"
	if err := os.MkdirAll(backupDir, 0755); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create backup directory"})
	}

	timestamp := time.Now().Format("20060102_150405")
	backupPath := filepath.Join(backupDir, "backup_"+timestamp+".db")

	srcDB := "./data/pharmacy.db"
	src, err := os.Open(srcDB)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to open source database"})
	}
	defer src.Close()

	dst, err := os.Create(backupPath)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create backup file"})
	}
	defer dst.Close()

	bytesCopied, err := io.Copy(dst, src)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to copy database"})
	}

	_, err = database.DB.Exec(`
		INSERT INTO backup_records (file_path, file_size, created_by)
		VALUES (?, ?, ?)
	`, backupPath, bytesCopied, user.UserID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to record backup"})
	}

	return c.JSON(fiber.Map{
		"message":   "backup created successfully",
		"file_path": backupPath,
		"file_size": bytesCopied,
	})
}

func GetBackupRecords(c *fiber.Ctx) error {
	rows, err := database.DB.Query(`
		SELECT br.id, br.file_path, br.file_size, br.created_at, u.name as created_by
		FROM backup_records br
		JOIN users u ON br.created_by = u.id
		ORDER BY br.created_at DESC
		LIMIT 20
	`)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	type BackupRecord struct {
		ID        int    `json:"id"`
		FilePath  string `json:"file_path"`
		FileSize  int64  `json:"file_size"`
		CreatedAt string `json:"created_at"`
		CreatedBy string `json:"created_by"`
	}

	var records []BackupRecord
	for rows.Next() {
		var r BackupRecord
		err := rows.Scan(&r.ID, &r.FilePath, &r.FileSize, &r.CreatedAt, &r.CreatedBy)
		if err != nil {
			continue
		}
		records = append(records, r)
	}

	return c.JSON(fiber.Map{"backup_records": records})
}

func GetSmsNotifications(c *fiber.Ctx) error {
	rows, err := database.DB.Query(`
		SELECT sn.id, sn.phone, sn.content, sn.status, sn.sent_at, sn.created_at,
		       p.prescription_no
		FROM sms_notifications sn
		JOIN prescriptions p ON sn.prescription_id = p.id
		ORDER BY sn.created_at DESC
		LIMIT 50
	`)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	type SmsNotification struct {
		ID             int    `json:"id"`
		PrescriptionNo string `json:"prescription_no"`
		Phone          string `json:"phone"`
		Content        string `json:"content"`
		Status         string `json:"status"`
		SentAt         string `json:"sent_at"`
		CreatedAt      string `json:"created_at"`
	}

	var notifications []SmsNotification
	for rows.Next() {
		var n SmsNotification
		var sentAt sql.NullString
		err := rows.Scan(&n.ID, &n.Phone, &n.Content, &n.Status, &sentAt, &n.CreatedAt, &n.PrescriptionNo)
		if err != nil {
			continue
		}
		if sentAt.Valid {
			n.SentAt = sentAt.String
		}
		notifications = append(notifications, n)
	}

	return c.JSON(fiber.Map{"sms_notifications": notifications})
}

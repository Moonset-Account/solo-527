package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"pharmacy-queue/database"
	"pharmacy-queue/middleware"

	"github.com/gofiber/fiber/v2"
)

type CallNextRequest struct {
	WindowID int `json:"window_id"`
}

func CallNext(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)
	var req CallNextRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if req.WindowID == 0 {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "window_id is required"})
	}

	tx, err := database.DB.Begin()
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to begin transaction"})
	}
	defer tx.Rollback()

	queueDate := time.Now().Format("2006-01-02")
	var queueID, prescriptionID, queueNo int
	var prescriptionNo, patientName string

	err = tx.QueryRow(`
		SELECT q.id, q.prescription_id, q.queue_no, p.prescription_no, p.patient_name
		FROM queue_records q
		JOIN prescriptions p ON q.prescription_id = p.id
		WHERE q.queue_date = ? AND q.status = 'waiting'
		ORDER BY q.queue_no ASC
		LIMIT 1
	`, queueDate).Scan(&queueID, &prescriptionID, &queueNo, &prescriptionNo, &patientName)

	if err == sql.ErrNoRows {
		return c.JSON(fiber.Map{"message": "no patients waiting in queue"})
	}
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	_, err = tx.Exec(`
		UPDATE queue_records 
		SET status = 'called', called_at = CURRENT_TIMESTAMP, window_id = ?
		WHERE id = ?
	`, req.WindowID, queueID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update queue record"})
	}

	_, err = tx.Exec(`
		UPDATE prescriptions 
		SET status = 'called', window_id = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`, req.WindowID, prescriptionID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update prescription"})
	}

	_ = sendSmsNotification(tx, prescriptionID,
		fmt.Sprintf("请%s到%d号窗口取药，排队号：%d。", patientName, req.WindowID, queueNo))

	if err := tx.Commit(); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to commit transaction"})
	}

	return c.JSON(fiber.Map{
		"queue_id":         queueID,
		"prescription_id":  prescriptionID,
		"prescription_no":  prescriptionNo,
		"patient_name":     patientName,
		"queue_no":         queueNo,
		"window_id":        req.WindowID,
		"called_by":        user.Name,
		"called_at":        time.Now().Format(time.RFC3339),
	})
}

type DispenseRequest struct {
	PrescriptionID int `json:"prescription_id"`
}

func DispensePrescription(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)
	var req DispenseRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	tx, err := database.DB.Begin()
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to begin transaction"})
	}
	defer tx.Rollback()

	var status string
	var expiryDate string
	err = tx.QueryRow("SELECT status, expiry_date FROM prescriptions WHERE id = ?", req.PrescriptionID).Scan(&status, &expiryDate)
	if err == sql.ErrNoRows {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "prescription not found"})
	}

	expiry, _ := time.Parse("2006-01-02", expiryDate)
	if time.Now().After(expiry) {
		_, _ = tx.Exec("UPDATE prescriptions SET status = 'expired' WHERE id = ?", req.PrescriptionID)
		tx.Commit()
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "prescription has expired, cannot dispense"})
	}

	if status != "called" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "prescription must be called before dispensing"})
	}

	rows, err := tx.Query(`
		SELECT pi.batch_id, pi.quantity, mb.quantity as stock_quantity, m.name
		FROM prescription_items pi
		JOIN medicine_batches mb ON pi.batch_id = mb.id
		JOIN medicines m ON pi.medicine_id = m.id
		WHERE pi.prescription_id = ?
	`, req.PrescriptionID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	type StockItem struct {
		BatchID       int
		Quantity      int
		StockQuantity int
		MedicineName  string
	}

	var items []StockItem
	var lackDrugs []string
	for rows.Next() {
		var item StockItem
		err := rows.Scan(&item.BatchID, &item.Quantity, &item.StockQuantity, &item.MedicineName)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		if item.StockQuantity < item.Quantity {
			lackDrugs = append(lackDrugs, item.MedicineName)
		}
		items = append(items, item)
	}

	if len(lackDrugs) > 0 {
		_, err = tx.Exec("UPDATE prescriptions SET status = 'lack_drug' WHERE id = ?", req.PrescriptionID)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update prescription status"})
		}

		for _, item := range items {
			if item.StockQuantity < item.Quantity {
				needed := item.Quantity - item.StockQuantity
				_, err = tx.Exec(`
					INSERT INTO restock_todos (medicine_id, batch_id, quantity_needed, created_by, notes)
					SELECT medicine_id, ?, ?, ?, '窗口缺药补货'
					FROM medicine_batches WHERE id = ?
				`, item.BatchID, needed, user.UserID, item.BatchID)
				if err != nil {
					return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create restock todo"})
				}
			}
		}

		if err := tx.Commit(); err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to commit transaction"})
		}

		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error":      "insufficient stock",
			"lack_drugs": lackDrugs,
		})
	}

	for _, item := range items {
		_, err = tx.Exec(`
			UPDATE medicine_batches SET quantity = quantity - ? WHERE id = ?
		`, item.Quantity, item.BatchID)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update stock"})
		}
	}

	_, err = tx.Exec(`
		UPDATE prescriptions SET status = 'dispensed', updated_at = CURRENT_TIMESTAMP WHERE id = ?
	`, req.PrescriptionID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update prescription"})
	}

	queueDate := time.Now().Format("2006-01-02")
	_, err = tx.Exec(`
		UPDATE queue_records 
		SET status = 'completed', completed_at = CURRENT_TIMESTAMP
		WHERE prescription_id = ? AND queue_date = ?
	`, req.PrescriptionID, queueDate)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update queue record"})
	}

	if err := tx.Commit(); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to commit transaction"})
	}

	return c.JSON(fiber.Map{
		"message":         "prescription dispensed successfully",
		"dispensed_by":    user.Name,
		"dispensed_at":    time.Now().Format(time.RFC3339),
	})
}

func GetQueueStatus(c *fiber.Ctx) error {
	queueDate := c.Query("date", time.Now().Format("2006-01-02"))

	var waitingCount, calledCount, completedCount int

	database.DB.QueryRow(`
		SELECT COUNT(*) FROM queue_records WHERE queue_date = ? AND status = 'waiting'
	`, queueDate).Scan(&waitingCount)

	database.DB.QueryRow(`
		SELECT COUNT(*) FROM queue_records WHERE queue_date = ? AND status = 'called'
	`, queueDate).Scan(&calledCount)

	database.DB.QueryRow(`
		SELECT COUNT(*) FROM queue_records WHERE queue_date = ? AND status = 'completed'
	`, queueDate).Scan(&completedCount)

	rows, err := database.DB.Query(`
		SELECT q.id, q.queue_no, q.status, p.prescription_no, p.patient_name,
		       w.window_no, q.called_at
		FROM queue_records q
		JOIN prescriptions p ON q.prescription_id = p.id
		LEFT JOIN windows w ON q.window_id = w.id
		WHERE q.queue_date = ? AND q.status IN ('waiting', 'called')
		ORDER BY q.queue_no ASC
	`, queueDate)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	type QueueItem struct {
		ID             int     `json:"id"`
		QueueNo        int     `json:"queue_no"`
		Status         string  `json:"status"`
		PrescriptionNo string  `json:"prescription_no"`
		PatientName    string  `json:"patient_name"`
		WindowNo       *string `json:"window_no"`
		CalledAt       *string `json:"called_at"`
	}

	var queue []QueueItem
	for rows.Next() {
		var item QueueItem
		var windowNo, calledAt sql.NullString
		err := rows.Scan(&item.ID, &item.QueueNo, &item.Status, &item.PrescriptionNo,
			&item.PatientName, &windowNo, &calledAt)
		if err != nil {
			continue
		}
		if windowNo.Valid {
			item.WindowNo = &windowNo.String
		}
		if calledAt.Valid {
			item.CalledAt = &calledAt.String
		}
		queue = append(queue, item)
	}

	return c.JSON(fiber.Map{
		"date":            queueDate,
		"waiting_count":   waitingCount,
		"called_count":    calledCount,
		"completed_count": completedCount,
		"queue":           queue,
	})
}

func GetWindows(c *fiber.Ctx) error {
	rows, err := database.DB.Query(`
		SELECT id, window_no, name, is_active FROM windows ORDER BY id
	`)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	type Window struct {
		ID       int    `json:"id"`
		WindowNo string `json:"window_no"`
		Name     string `json:"name"`
		IsActive bool   `json:"is_active"`
	}

	var windows []Window
	for rows.Next() {
		var w Window
		var isActive int
		err := rows.Scan(&w.ID, &w.WindowNo, &w.Name, &isActive)
		if err != nil {
			continue
		}
		w.IsActive = isActive == 1
		windows = append(windows, w)
	}

	return c.JSON(fiber.Map{"windows": windows})
}

func ConfirmAlternative(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)
	itemID := c.Params("item_id")

	var req struct {
		AlternativeBatchID int  `json:"alternative_batch_id"`
		AcceptAlternative  bool `json:"accept_alternative"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	tx, err := database.DB.Begin()
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to begin transaction"})
	}
	defer tx.Rollback()

	acceptAlt := 0
	if req.AcceptAlternative {
		acceptAlt = 1
	}

	_, err = tx.Exec(`
		UPDATE prescription_items 
		SET alternative_batch_id = ?, accept_alternative = ?, 
		    alternative_confirmed_at = CURRENT_TIMESTAMP, alternative_confirmed_by = ?
		WHERE id = ?
	`, req.AlternativeBatchID, acceptAlt, user.UserID, itemID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update item"})
	}

	if err := tx.Commit(); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to commit transaction"})
	}

	return c.JSON(fiber.Map{"message": "alternative batch confirmation recorded"})
}

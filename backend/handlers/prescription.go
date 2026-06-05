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

type PrescriptionItemInput struct {
	MedicineID int `json:"medicine_id"`
	BatchID    int `json:"batch_id"`
	Quantity   int `json:"quantity"`
}

type CreatePrescriptionRequest struct {
	PrescriptionNo string                    `json:"prescription_no"`
	PatientName    string                    `json:"patient_name"`
	PatientPhone   string                    `json:"patient_phone"`
	IDCard         string                    `json:"id_card"`
	PickUpTime     string                    `json:"pick_up_time"`
	ExpiryDate     string                    `json:"expiry_date"`
	Items          []PrescriptionItemInput   `json:"items"`
	IsManualEntry  bool                      `json:"is_manual_entry"`
	ManualReason   string                    `json:"manual_reason"`
}

func CreatePrescription(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)
	var req CreatePrescriptionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	tx, err := database.DB.Begin()
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to begin transaction"})
	}
	defer tx.Rollback()

	pickUpTime, err := time.Parse(time.RFC3339, req.PickUpTime)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid pick_up_time format"})
	}

	expiryDate, err := time.Parse("2006-01-02", req.ExpiryDate)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid expiry_date format"})
	}

	var prescriptionID int64
	manualEntryBy := sql.NullInt64{Int64: int64(user.UserID), Valid: req.IsManualEntry}
	manualEntryAt := sql.NullTime{Time: time.Now(), Valid: req.IsManualEntry}
	manualReason := sql.NullString{String: req.ManualReason, Valid: req.IsManualEntry && req.ManualReason != ""}

	isManualEntry := 0
	if req.IsManualEntry {
		isManualEntry = 1
	}

	result, err := tx.Exec(`
		INSERT INTO prescriptions 
		(prescription_no, patient_name, patient_phone, id_card, status, pick_up_time, expiry_date, 
		 is_manual_entry, manual_entry_by, manual_entry_at, manual_entry_reason)
		VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)
	`, req.PrescriptionNo, req.PatientName, req.PatientPhone, req.IDCard,
		pickUpTime, expiryDate.Format("2006-01-02"),
		isManualEntry, manualEntryBy, manualEntryAt, manualReason)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create prescription: " + err.Error()})
	}

	prescriptionID, _ = result.LastInsertId()

	for _, item := range req.Items {
		_, err = tx.Exec(`
			INSERT INTO prescription_items (prescription_id, medicine_id, batch_id, quantity)
			VALUES (?, ?, ?, ?)
		`, prescriptionID, item.MedicineID, item.BatchID, item.Quantity)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to add prescription item"})
		}
	}

	if err := tx.Commit(); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to commit transaction"})
	}

	return c.JSON(fiber.Map{
		"id":              prescriptionID,
		"prescription_no": req.PrescriptionNo,
		"status":          "pending",
	})
}

func EnqueuePrescription(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)
	prescriptionID := c.Params("id")

	tx, err := database.DB.Begin()
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to begin transaction"})
	}
	defer tx.Rollback()

	var status string
	var expiryDate string
	var pickUpTime string
	err = tx.QueryRow(`
		SELECT status, expiry_date, pick_up_time FROM prescriptions WHERE id = ?
	`, prescriptionID).Scan(&status, &expiryDate, &pickUpTime)
	if err == sql.ErrNoRows {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "prescription not found"})
	}
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	expiry, _ := time.Parse("2006-01-02", expiryDate)
	if time.Now().After(expiry) {
		_, _ = tx.Exec("UPDATE prescriptions SET status = 'expired' WHERE id = ?", prescriptionID)
		tx.Commit()
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "prescription has expired, cannot enqueue"})
	}

	if status != "pending" && status != "lack_drug" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "prescription cannot be enqueued from current status: " + status})
	}

	queueDate := time.Now().Format("2006-01-02")
	var maxQueueNo int
	err = tx.QueryRow(`
		SELECT COALESCE(MAX(queue_no), 0) FROM queue_records WHERE queue_date = ?
	`, queueDate).Scan(&maxQueueNo)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	queueNo := maxQueueNo + 1

	_, err = tx.Exec(`
		INSERT INTO queue_records (prescription_id, queue_date, queue_no, status)
		VALUES (?, ?, ?, 'waiting')
	`, prescriptionID, queueDate, queueNo)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create queue record"})
	}

	_, err = tx.Exec(`
		UPDATE prescriptions 
		SET status = 'queued', queue_no = ?, updated_at = CURRENT_TIMESTAMP 
		WHERE id = ?
	`, queueNo, prescriptionID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update prescription"})
	}

	_ = sendSmsNotification(tx, prescriptionID, fmt.Sprintf("您的处方已排队，排队号：%d。请等候叫号。", queueNo))

	if err := tx.Commit(); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to commit transaction"})
	}

	return c.JSON(fiber.Map{
		"prescription_id": prescriptionID,
		"queue_no":        queueNo,
		"queue_date":      queueDate,
		"enqueued_by":     user.Name,
	})
}

func sendSmsNotification(tx *sql.Tx, prescriptionID interface{}, content string) error {
	var patientPhone string
	err := tx.QueryRow("SELECT patient_phone FROM prescriptions WHERE id = ?", prescriptionID).Scan(&patientPhone)
	if err != nil {
		return err
	}

	_, err = tx.Exec(`
		INSERT INTO sms_notifications (prescription_id, phone, content, status)
		VALUES (?, ?, ?, 'sent')
	`, prescriptionID, patientPhone, content)

	fmt.Printf("[SMS Sent] To: %s, Content: %s\n", patientPhone, content)
	return err
}

func GetPrescription(c *fiber.Ctx) error {
	prescriptionNo := c.Params("no")

	type PrescriptionDetail struct {
		ID               int       `json:"id"`
		PrescriptionNo   string    `json:"prescription_no"`
		PatientName      string    `json:"patient_name"`
		PatientPhone     string    `json:"patient_phone"`
		Status           string    `json:"status"`
		PickUpTime       string    `json:"pick_up_time"`
		ExpiryDate       string    `json:"expiry_date"`
		QueueNo          *int      `json:"queue_no"`
		WindowID         *int      `json:"window_id"`
		CreatedAt        string    `json:"created_at"`
		IsManualEntry    bool      `json:"is_manual_entry"`
		ManualEntryBy    *string   `json:"manual_entry_by"`
		ManualEntryAt    *string   `json:"manual_entry_at"`
		ManualEntryReason *string  `json:"manual_entry_reason"`
	}

	var p PrescriptionDetail
	var manualEntryBy, manualEntryAt, manualEntryReason sql.NullString
	var queueNo, windowID sql.NullInt64

	err := database.DB.QueryRow(`
		SELECT p.id, p.prescription_no, p.patient_name, p.patient_phone, p.status,
		       p.pick_up_time, p.expiry_date, p.queue_no, p.window_id, p.created_at,
		       p.is_manual_entry, u.name, p.manual_entry_at, p.manual_entry_reason
		FROM prescriptions p
		LEFT JOIN users u ON p.manual_entry_by = u.id
		WHERE p.prescription_no = ?
	`, prescriptionNo).Scan(
		&p.ID, &p.PrescriptionNo, &p.PatientName, &p.PatientPhone, &p.Status,
		&p.PickUpTime, &p.ExpiryDate, &queueNo, &windowID, &p.CreatedAt,
		&p.IsManualEntry, &manualEntryBy, &manualEntryAt, &manualEntryReason,
	)
	if err == sql.ErrNoRows {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "prescription not found"})
	}
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	if queueNo.Valid {
		q := int(queueNo.Int64)
		p.QueueNo = &q
	}
	if windowID.Valid {
		w := int(windowID.Int64)
		p.WindowID = &w
	}
	if manualEntryBy.Valid {
		p.ManualEntryBy = &manualEntryBy.String
	}
	if manualEntryAt.Valid {
		p.ManualEntryAt = &manualEntryAt.String
	}
	if manualEntryReason.Valid {
		p.ManualEntryReason = &manualEntryReason.String
	}

	rows, err := database.DB.Query(`
		SELECT pi.id, m.name, m.code, mb.batch_no, pi.quantity, pi.accept_alternative,
		       alt_mb.batch_no as alternative_batch_no
		FROM prescription_items pi
		JOIN medicines m ON pi.medicine_id = m.id
		LEFT JOIN medicine_batches mb ON pi.batch_id = mb.id
		LEFT JOIN medicine_batches alt_mb ON pi.alternative_batch_id = alt_mb.id
		WHERE pi.prescription_id = ?
	`, p.ID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	type ItemDetail struct {
		ID                 int     `json:"id"`
		MedicineName       string  `json:"medicine_name"`
		MedicineCode       string  `json:"medicine_code"`
		BatchNo            string  `json:"batch_no"`
		Quantity           int     `json:"quantity"`
		AcceptAlternative  bool    `json:"accept_alternative"`
		AlternativeBatchNo *string `json:"alternative_batch_no"`
	}

	var items []ItemDetail
	for rows.Next() {
		var item ItemDetail
		var altBatch sql.NullString
		err := rows.Scan(&item.ID, &item.MedicineName, &item.MedicineCode,
			&item.BatchNo, &item.Quantity, &item.AcceptAlternative, &altBatch)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		if altBatch.Valid {
			item.AlternativeBatchNo = &altBatch.String
		}
		items = append(items, item)
	}

	var aheadCount int
	if p.QueueNo != nil {
		queueDate := time.Now().Format("2006-01-02")
		database.DB.QueryRow(`
			SELECT COUNT(*) FROM queue_records
			WHERE queue_date = ? AND queue_no < ? AND status IN ('waiting', 'called')
		`, queueDate, *p.QueueNo).Scan(&aheadCount)
	}

	return c.JSON(fiber.Map{
		"prescription": p,
		"items":        items,
		"ahead_count":  aheadCount,
	})
}

func ListPrescriptions(c *fiber.Ctx) error {
	status := c.Query("status")
	date := c.Query("date")

	query := `
		SELECT p.id, p.prescription_no, p.patient_name, p.status, p.pick_up_time,
		       p.queue_no, p.is_manual_entry, p.created_at
		FROM prescriptions p
		WHERE 1=1
	`
	var args []interface{}

	if status != "" {
		query += " AND p.status = ?"
		args = append(args, status)
	}
	if date != "" {
		query += " AND DATE(p.pick_up_time) = ?"
		args = append(args, date)
	}
	query += " ORDER BY p.created_at DESC LIMIT 100"

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	type PrescriptionListItem struct {
		ID             int     `json:"id"`
		PrescriptionNo string  `json:"prescription_no"`
		PatientName    string  `json:"patient_name"`
		Status         string  `json:"status"`
		PickUpTime     string  `json:"pick_up_time"`
		QueueNo        *int    `json:"queue_no"`
		IsManualEntry  bool    `json:"is_manual_entry"`
		CreatedAt      string  `json:"created_at"`
	}

	var prescriptions []PrescriptionListItem
	for rows.Next() {
		var p PrescriptionListItem
		var queueNo sql.NullInt64
		err := rows.Scan(&p.ID, &p.PrescriptionNo, &p.PatientName, &p.Status,
			&p.PickUpTime, &queueNo, &p.IsManualEntry, &p.CreatedAt)
		if err != nil {
			continue
		}
		if queueNo.Valid {
			q := int(queueNo.Int64)
			p.QueueNo = &q
		}
		prescriptions = append(prescriptions, p)
	}

	return c.JSON(fiber.Map{"prescriptions": prescriptions})
}

func CancelPrescription(c *fiber.Ctx) error {
	prescriptionID := c.Params("id")

	tx, err := database.DB.Begin()
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to begin transaction"})
	}
	defer tx.Rollback()

	var status string
	var queueNo sql.NullInt64
	err = tx.QueryRow("SELECT status, queue_no FROM prescriptions WHERE id = ?", prescriptionID).Scan(&status, &queueNo)
	if err == sql.ErrNoRows {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "prescription not found"})
	}

	if status == "dispensed" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "cannot cancel dispensed prescription"})
	}

	_, err = tx.Exec("UPDATE prescriptions SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?", prescriptionID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update prescription"})
	}

	if queueNo.Valid {
		queueDate := time.Now().Format("2006-01-02")
		_, err = tx.Exec(`
			UPDATE queue_records SET status = 'cancelled' 
			WHERE prescription_id = ? AND queue_date = ?
		`, prescriptionID, queueDate)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to cancel queue record"})
		}
	}

	if err := tx.Commit(); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to commit transaction"})
	}

	return c.JSON(fiber.Map{"message": "prescription cancelled successfully"})
}

func ReschedulePrescription(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)
	prescriptionID := c.Params("id")

	var req struct {
		NewPickUpTime string `json:"new_pick_up_time"`
		Reason        string `json:"reason"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	newTime, err := time.Parse(time.RFC3339, req.NewPickUpTime)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid datetime format"})
	}

	tx, err := database.DB.Begin()
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to begin transaction"})
	}
	defer tx.Rollback()

	var oldPickUpTime string
	var status string
	err = tx.QueryRow("SELECT pick_up_time, status FROM prescriptions WHERE id = ?", prescriptionID).Scan(&oldPickUpTime, &status)
	if err == sql.ErrNoRows {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "prescription not found"})
	}

	if status == "dispensed" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "cannot reschedule dispensed prescription"})
	}

	_, err = tx.Exec(`
		INSERT INTO reschedule_records (prescription_id, old_pick_up_time, new_pick_up_time, reason, created_by)
		VALUES (?, ?, ?, ?, ?)
	`, prescriptionID, oldPickUpTime, newTime, req.Reason, user.UserID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create reschedule record"})
	}

	_, err = tx.Exec(`
		UPDATE prescriptions SET pick_up_time = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
	`, newTime, prescriptionID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update prescription"})
	}

	if err := tx.Commit(); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to commit transaction"})
	}

	return c.JSON(fiber.Map{"message": "prescription rescheduled successfully"})
}

func GetPrescriptionPublic(c *fiber.Ctx) error {
	prescriptionNo := c.Params("no")

	type PrescriptionDetail struct {
		ID               int       `json:"id"`
		PrescriptionNo   string    `json:"prescription_no"`
		PatientName      string    `json:"patient_name"`
		Status           string    `json:"status"`
		PickUpTime       string    `json:"pick_up_time"`
		ExpiryDate       string    `json:"expiry_date"`
		IsExpired        bool      `json:"is_expired"`
		QueueNo          *int      `json:"queue_no"`
		WindowID         *int      `json:"window_id"`
		IsManualEntry    bool      `json:"is_manual_entry"`
		ManualEntryBy    *string   `json:"manual_entry_by"`
		ManualEntryAt    *string   `json:"manual_entry_at"`
		ManualEntryReason *string  `json:"manual_entry_reason"`
	}

	var p PrescriptionDetail
	var manualEntryBy, manualEntryAt, manualEntryReason sql.NullString
	var queueNo, windowID sql.NullInt64

	err := database.DB.QueryRow(`
		SELECT p.id, p.prescription_no, p.patient_name, p.status,
		       p.pick_up_time, p.expiry_date, p.queue_no, p.window_id,
		       p.is_manual_entry, u.name, p.manual_entry_at, p.manual_entry_reason
		FROM prescriptions p
		LEFT JOIN users u ON p.manual_entry_by = u.id
		WHERE p.prescription_no = ?
	`, prescriptionNo).Scan(
		&p.ID, &p.PrescriptionNo, &p.PatientName, &p.Status,
		&p.PickUpTime, &p.ExpiryDate, &queueNo, &windowID,
		&p.IsManualEntry, &manualEntryBy, &manualEntryAt, &manualEntryReason,
	)
	if err == sql.ErrNoRows {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "prescription not found"})
	}
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	expiryDate, _ := time.Parse("2006-01-02", p.ExpiryDate)
	p.IsExpired = time.Now().After(expiryDate)

	if queueNo.Valid {
		q := int(queueNo.Int64)
		p.QueueNo = &q
	}
	if windowID.Valid {
		w := int(windowID.Int64)
		p.WindowID = &w
	}
	if manualEntryBy.Valid {
		p.ManualEntryBy = &manualEntryBy.String
	}
	if manualEntryAt.Valid {
		p.ManualEntryAt = &manualEntryAt.String
	}
	if manualEntryReason.Valid {
		p.ManualEntryReason = &manualEntryReason.String
	}

	type ItemDetail struct {
		ID                 int      `json:"id"`
		MedicineName       string   `json:"medicine_name"`
		MedicineCode       string   `json:"medicine_code"`
		BatchNo            string   `json:"batch_no"`
		Quantity           int      `json:"quantity"`
		IsStockOut         bool     `json:"is_stock_out"`
		CurrentStock       int      `json:"current_stock"`
		AcceptAlternative  bool     `json:"accept_alternative"`
		AlternativeBatchNo *string  `json:"alternative_batch_no"`
		AlternativeConfirmed bool   `json:"alternative_confirmed"`
		AlternativeBatches []map[string]interface{} `json:"alternative_batches,omitempty"`
	}

	rows, err := database.DB.Query(`
		SELECT pi.id, m.name, m.code, mb.batch_no, pi.quantity,
		       COALESCE(mb.stock, 0) as current_stock,
		       pi.accept_alternative, alt_mb.batch_no,
		       pi.alternative_confirmed_at IS NOT NULL
		FROM prescription_items pi
		JOIN medicines m ON pi.medicine_id = m.id
		LEFT JOIN medicine_batches mb ON pi.batch_id = mb.id
		LEFT JOIN medicine_batches alt_mb ON pi.alternative_batch_id = alt_mb.id
		WHERE pi.prescription_id = ?
	`, p.ID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	var items []ItemDetail
	for rows.Next() {
		var item ItemDetail
		var altBatch sql.NullString
		var altConfirmed bool
		err := rows.Scan(&item.ID, &item.MedicineName, &item.MedicineCode,
			&item.BatchNo, &item.Quantity, &item.CurrentStock,
			&item.AcceptAlternative, &altBatch, &altConfirmed)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		item.IsStockOut = item.CurrentStock < item.Quantity
		item.AlternativeConfirmed = altConfirmed
		if altBatch.Valid {
			item.AlternativeBatchNo = &altBatch.String
		}
		items = append(items, item)
	}

	for i, item := range items {
		if item.IsStockOut {
			altRows, _ := database.DB.Query(`
				SELECT id, batch_no, stock, expiry_date
				FROM medicine_batches
				WHERE medicine_id = (
					SELECT medicine_id FROM medicine_batches WHERE id = (
						SELECT batch_id FROM prescription_items WHERE id = ?
					)
				) AND stock > 0 AND id != (SELECT batch_id FROM prescription_items WHERE id = ?)
				ORDER BY expiry_date ASC
			`, item.ID, item.ID)
			var alternatives []map[string]interface{}
			for altRows.Next() {
				var altID, altStock int
				var altBatchNo, altExpiry string
				altRows.Scan(&altID, &altBatchNo, &altStock, &altExpiry)
				alternatives = append(alternatives, map[string]interface{}{
					"id":          altID,
					"batch_no":    altBatchNo,
					"stock":       altStock,
					"expiry_date": altExpiry,
				})
			}
			altRows.Close()
			items[i].AlternativeBatches = alternatives
		}
	}

	var aheadCount int
	if p.QueueNo != nil {
		queueDate := time.Now().Format("2006-01-02")
		database.DB.QueryRow(`
			SELECT COUNT(*) FROM queue_records
			WHERE queue_date = ? AND queue_no < ? AND status IN ('waiting', 'called')
		`, queueDate, *p.QueueNo).Scan(&aheadCount)
	}

	var rescheduleRecords []map[string]interface{}
	rsRows, _ := database.DB.Query(`
		SELECT r.old_time, r.new_time, r.reason, r.created_at, u.name
		FROM reschedule_records r
		LEFT JOIN users u ON r.created_by = u.id
		WHERE r.prescription_id = ?
		ORDER BY r.created_at DESC
	`, p.ID)
	for rsRows.Next() {
		var oldTime, newTime, reason, createdAt, userName sql.NullString
		rsRows.Scan(&oldTime, &newTime, &reason, &createdAt, &userName)
		rescheduleRecords = append(rescheduleRecords, map[string]interface{}{
			"old_time":   oldTime.String,
			"new_time":   newTime.String,
			"reason":     reason.String,
			"created_at": createdAt.String,
			"user_name":  userName.String,
		})
	}
	rsRows.Close()

	return c.JSON(fiber.Map{
		"prescription":        p,
		"items":               items,
		"ahead_count":         aheadCount,
		"reschedule_records":  rescheduleRecords,
	})
}

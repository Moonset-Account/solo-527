package handlers

import (
	"cold-chain-system/internal/database"
	"cold-chain-system/internal/models"
	"database/sql"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
)

func CreateHandover(c *fiber.Ctx) error {
	var req models.HandoverRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求参数错误"})
	}

	senderID := c.Locals("userID").(int64)
	senderName := c.Locals("userName").(string)

	var batch models.VaccineBatch
	err := database.DB.QueryRow(`SELECT id, batch_no, vaccine_name, quantity, status, temp_min, temp_max 
		FROM vaccine_batches WHERE id = ?`, req.BatchID).Scan(
		&batch.ID, &batch.BatchNo, &batch.VaccineName, &batch.Quantity, &batch.Status, &batch.TempMin, &batch.TempMax,
	)

	if err == sql.ErrNoRows {
		return c.Status(404).JSON(fiber.Map{"error": "批次不存在"})
	}

	if batch.Status != "available" {
		return c.Status(400).JSON(fiber.Map{"error": "批次不可用，当前状态: " + batch.Status})
	}

	if req.Quantity > batch.Quantity {
		return c.Status(400).JSON(fiber.Map{"error": "发放数量超过库存"})
	}

	tempOk := req.CheckTemp >= batch.TempMin && req.CheckTemp <= batch.TempMax
	status := "pending"
	if !tempOk {
		status = "temp_fail"
	}

	var receiverName string
	database.DB.QueryRow("SELECT name FROM users WHERE id = ?", req.ReceiverID).Scan(&receiverName)

	result, err := database.DB.Exec(`INSERT INTO handover_records 
		(batch_id, batch_no, vaccine_name, quantity, check_temp, temp_ok, 
		 sender_id, sender_name, receiver_id, receiver_name, receiver_signature, status)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		req.BatchID, batch.BatchNo, batch.VaccineName, req.Quantity, req.CheckTemp, tempOk,
		senderID, senderName, req.ReceiverID, receiverName, req.Signature, status,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "创建交接记录失败"})
	}

	if tempOk && status == "pending" {
		handoverID, _ := result.LastInsertId()
		_, _ = database.DB.Exec(
			"UPDATE handover_records SET status = 'completed' WHERE id = ?",
			handoverID,
		)

		newQty := batch.Quantity - req.Quantity
		if newQty <= 0 {
			_, _ = database.DB.Exec("UPDATE vaccine_batches SET status = 'used_up', quantity = 0 WHERE id = ?", req.BatchID)
		} else {
			_, _ = database.DB.Exec("UPDATE vaccine_batches SET quantity = ? WHERE id = ?", newQty, req.BatchID)
		}

		var record models.HandoverRecord
		database.DB.QueryRow(`SELECT id, batch_id, batch_no, vaccine_name, quantity, check_temp, temp_ok,
			sender_id, sender_name, receiver_id, receiver_name, receiver_signature, status, handover_at, created_at
			FROM handover_records WHERE id = ?`, handoverID).Scan(
			&record.ID, &record.BatchID, &record.BatchNo, &record.VaccineName, &record.Quantity,
			&record.CheckTemp, &record.TempOk, &record.SenderID, &record.SenderName,
			&record.ReceiverID, &record.ReceiverName, &record.ReceiverSignature, &record.Status,
			&record.HandoverAt, &record.CreatedAt,
		)
		return c.Status(201).JSON(record)
	}

	if !tempOk {
		_, _ = database.DB.Exec(
			"UPDATE vaccine_batches SET status = 'isolated', isolation_reason = ?, temperature_ok = ? WHERE id = ?",
			"发放交接时温度超标", false, req.BatchID,
		)
	}

	handoverID, _ := result.LastInsertId()
	var record models.HandoverRecord
	database.DB.QueryRow(`SELECT id, batch_id, batch_no, vaccine_name, quantity, check_temp, temp_ok,
		sender_id, sender_name, receiver_id, receiver_name, receiver_signature, status, handover_at, created_at
		FROM handover_records WHERE id = ?`, handoverID).Scan(
		&record.ID, &record.BatchID, &record.BatchNo, &record.VaccineName, &record.Quantity,
		&record.CheckTemp, &record.TempOk, &record.SenderID, &record.SenderName,
		&record.ReceiverID, &record.ReceiverName, &record.ReceiverSignature, &record.Status,
		&record.HandoverAt, &record.CreatedAt,
	)

	return c.Status(201).JSON(record)
}

func GetHandoverRecords(c *fiber.Ctx) error {
	date := c.Query("date", "")
	status := c.Query("status", "")

	query := `SELECT id, batch_id, batch_no, vaccine_name, quantity, check_temp, temp_ok,
		sender_id, sender_name, receiver_id, receiver_name, receiver_signature, status,
		failure_reason, handler_id, handler_name, next_review_time, handover_at, created_at
		FROM handover_records WHERE 1=1`
	args := []interface{}{}

	if date != "" {
		query += " AND DATE(handover_at) = ?"
		args = append(args, date)
	}

	if status != "" {
		query += " AND status = ?"
		args = append(args, status)
	}

	query += " ORDER BY handover_at DESC"

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "查询失败"})
	}
	defer rows.Close()

	var records []models.HandoverRecord
	for rows.Next() {
		var r models.HandoverRecord
		var receiverID, handlerID sql.NullInt64
		var receiverName, receiverSig, failureReason, handlerName, nextReview sql.NullString
		err := rows.Scan(&r.ID, &r.BatchID, &r.BatchNo, &r.VaccineName, &r.Quantity,
			&r.CheckTemp, &r.TempOk, &r.SenderID, &r.SenderName,
			&receiverID, &receiverName, &receiverSig, &r.Status,
			&failureReason, &handlerID, &handlerName, &nextReview,
			&r.HandoverAt, &r.CreatedAt)
		if err != nil {
			continue
		}
		if receiverID.Valid {
			r.ReceiverID = receiverID.Int64
			r.ReceiverName = receiverName.String
			r.ReceiverSignature = receiverSig.String
		}
		if failureReason.Valid {
			r.FailureReason = failureReason.String
		}
		if handlerID.Valid {
			r.HandlerID = handlerID.Int64
			r.HandlerName = handlerName.String
			r.NextReviewTime = nextReview.String
		}
		records = append(records, r)
	}

	return c.JSON(records)
}

func GetHandoverRecord(c *fiber.Ctx) error {
	id, _ := strconv.ParseInt(c.Params("id"), 10, 64)

	var r models.HandoverRecord
	var receiverID, handlerID sql.NullInt64
	var receiverName, receiverSig, failureReason, handlerName, nextReview sql.NullString

	err := database.DB.QueryRow(`SELECT id, batch_id, batch_no, vaccine_name, quantity, check_temp, temp_ok,
		sender_id, sender_name, receiver_id, receiver_name, receiver_signature, status,
		failure_reason, handler_id, handler_name, next_review_time, handover_at, created_at
		FROM handover_records WHERE id = ?`, id).Scan(
		&r.ID, &r.BatchID, &r.BatchNo, &r.VaccineName, &r.Quantity,
		&r.CheckTemp, &r.TempOk, &r.SenderID, &r.SenderName,
		&receiverID, &receiverName, &receiverSig, &r.Status,
		&failureReason, &handlerID, &handlerName, &nextReview,
		&r.HandoverAt, &r.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return c.Status(404).JSON(fiber.Map{"error": "记录不存在"})
	}

	if receiverID.Valid {
		r.ReceiverID = receiverID.Int64
		r.ReceiverName = receiverName.String
		r.ReceiverSignature = receiverSig.String
	}
	if failureReason.Valid {
		r.FailureReason = failureReason.String
	}
	if handlerID.Valid {
		r.HandlerID = handlerID.Int64
		r.HandlerName = handlerName.String
		r.NextReviewTime = nextReview.String
	}

	return c.JSON(r)
}

func HandleHandoverFailure(c *fiber.Ctx) error {
	var req models.HandoverFailureRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求参数错误"})
	}

	var handlerName string
	database.DB.QueryRow("SELECT name FROM users WHERE id = ?", req.HandlerID).Scan(&handlerName)

	_, err := database.DB.Exec(`UPDATE handover_records 
		SET status = 'failed', failure_reason = ?, handler_id = ?, handler_name = ?, next_review_time = ?
		WHERE id = ?`,
		req.FailureReason, req.HandlerID, handlerName, req.NextReviewTime, req.HandoverID,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "处理失败"})
	}

	return c.JSON(fiber.Map{"message": "已记录失败处理"})
}

func GetTodayStats(c *fiber.Ctx) error {
	today := time.Now().Format("2006-01-02")

	var receivedCount int
	database.DB.QueryRow("SELECT COUNT(*) FROM vaccine_batches WHERE DATE(received_at) = ?", today).Scan(&receivedCount)

	var handoverCount int
	database.DB.QueryRow("SELECT COUNT(*) FROM handover_records WHERE DATE(handover_at) = ?", today).Scan(&handoverCount)

	var pendingCount int
	database.DB.QueryRow("SELECT COUNT(*) FROM handover_records WHERE status = 'pending'").Scan(&pendingCount)

	var isolatedCount int
	database.DB.QueryRow("SELECT COUNT(*) FROM vaccine_batches WHERE status = 'isolated'").Scan(&isolatedCount)

	return c.JSON(fiber.Map{
		"received_today": receivedCount,
		"handover_today": handoverCount,
		"pending":        pendingCount,
		"isolated":       isolatedCount,
	})
}

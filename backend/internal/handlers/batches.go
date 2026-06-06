package handlers

import (
	"cold-chain-system/internal/database"
	"cold-chain-system/internal/models"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
)

func ReceiveBatch(c *fiber.Ctx) error {
	var req models.ReceiveBatchRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求参数错误"})
	}

	receiverID := c.Locals("userID").(int64)
	receiverName := c.Locals("userName").(string)

	tempOk := req.ReceiveTemp >= req.TempMin && req.ReceiveTemp <= req.TempMax
	status := "available"
	if !tempOk {
		status = "isolated"
	}

	result, err := database.DB.Exec(`INSERT INTO vaccine_batches 
		(batch_no, box_no, vaccine_name, manufacturer, quantity, receive_temp, temp_min, temp_max, 
		 expire_date, receiver_id, receiver_name, signature, status, temperature_ok, isolation_reason)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		req.BatchNo, req.BoxNo, req.VaccineName, req.Manufacturer, req.Quantity,
		req.ReceiveTemp, req.TempMin, req.TempMax, req.ExpireDate,
		receiverID, receiverName, req.Signature, status, tempOk,
		func() string {
			if !tempOk {
				return "接收时温度超标"
			}
			return ""
		}(),
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "入库失败: " + err.Error()})
	}

	id, _ := result.LastInsertId()

	var batch models.VaccineBatch
	database.DB.QueryRow(`SELECT id, batch_no, box_no, vaccine_name, manufacturer, quantity, 
		receive_temp, temp_min, temp_max, expire_date, receiver_id, receiver_name, signature, 
		status, temperature_ok, received_at, created_at FROM vaccine_batches WHERE id = ?`, id).Scan(
		&batch.ID, &batch.BatchNo, &batch.BoxNo, &batch.VaccineName, &batch.Manufacturer, &batch.Quantity,
		&batch.ReceiveTemp, &batch.TempMin, &batch.TempMax, &batch.ExpireDate,
		&batch.ReceiverID, &batch.ReceiverName, &batch.Signature, &batch.Status, &batch.TemperatureOk,
		&batch.ReceivedAt, &batch.CreatedAt,
	)

	return c.Status(201).JSON(batch)
}

func GetBatches(c *fiber.Ctx) error {
	status := c.Query("status", "")
	date := c.Query("date", "")

	query := `SELECT id, batch_no, box_no, vaccine_name, manufacturer, quantity, 
		receive_temp, temp_min, temp_max, expire_date, receiver_id, receiver_name, signature, 
		status, temperature_ok, isolation_reason, received_at, created_at 
		FROM vaccine_batches WHERE 1=1`
	args := []interface{}{}

	if status != "" {
		query += " AND status = ?"
		args = append(args, status)
	}

	if date != "" {
		query += " AND DATE(received_at) = ?"
		args = append(args, date)
	}

	query += " ORDER BY received_at DESC"

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "查询失败"})
	}
	defer rows.Close()

	var batches []models.VaccineBatch
	for rows.Next() {
		var b models.VaccineBatch
		err := rows.Scan(&b.ID, &b.BatchNo, &b.BoxNo, &b.VaccineName, &b.Manufacturer, &b.Quantity,
			&b.ReceiveTemp, &b.TempMin, &b.TempMax, &b.ExpireDate, &b.ReceiverID, &b.ReceiverName,
			&b.Signature, &b.Status, &b.TemperatureOk, &b.IsolationReason, &b.ReceivedAt, &b.CreatedAt)
		if err != nil {
			continue
		}
		batches = append(batches, b)
	}

	return c.JSON(batches)
}

func GetBatch(c *fiber.Ctx) error {
	id, _ := strconv.ParseInt(c.Params("id"), 10, 64)

	var batch models.VaccineBatch
	err := database.DB.QueryRow(`SELECT id, batch_no, box_no, vaccine_name, manufacturer, quantity, 
		receive_temp, temp_min, temp_max, expire_date, receiver_id, receiver_name, signature, 
		status, temperature_ok, isolation_reason, received_at, created_at 
		FROM vaccine_batches WHERE id = ?`, id).Scan(
		&batch.ID, &batch.BatchNo, &batch.BoxNo, &batch.VaccineName, &batch.Manufacturer, &batch.Quantity,
		&batch.ReceiveTemp, &batch.TempMin, &batch.TempMax, &batch.ExpireDate,
		&batch.ReceiverID, &batch.ReceiverName, &batch.Signature, &batch.Status, &batch.TemperatureOk,
		&batch.IsolationReason, &batch.ReceivedAt, &batch.CreatedAt,
	)

	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "批次不存在"})
	}

	return c.JSON(batch)
}

func IsolateBatch(c *fiber.Ctx) error {
	var req models.IsolateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求参数错误"})
	}

	_, err := database.DB.Exec(
		"UPDATE vaccine_batches SET status = 'isolated', isolation_reason = ? WHERE id = ?",
		req.Reason, req.BatchID,
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "隔离失败"})
	}

	return c.JSON(fiber.Map{"message": "已隔离"})
}

func RestoreBatch(c *fiber.Ctx) error {
	userRole := c.Locals("userRole").(string)
	if userRole != "admin" {
		return c.Status(403).JSON(fiber.Map{"error": "只有管理员可以恢复隔离批次"})
	}

	id, _ := strconv.ParseInt(c.Params("id"), 10, 64)

	result, err := database.DB.Exec(
		"UPDATE vaccine_batches SET status = 'available', isolation_reason = '' WHERE id = ? AND status = 'isolated'",
		id,
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "恢复失败"})
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "批次不存在或未处于隔离状态"})
	}

	return c.JSON(fiber.Map{"message": "已恢复"})
}

func GetExpiringBatches(c *fiber.Ctx) error {
	days, _ := strconv.Atoi(c.Query("days", "7"))
	cutoff := time.Now().AddDate(0, 0, days).Format("2006-01-02")

	rows, err := database.DB.Query(`SELECT id, batch_no, box_no, vaccine_name, manufacturer, quantity, 
		expire_date, status, received_at FROM vaccine_batches 
		WHERE expire_date <= ? AND status != 'used_up'
		ORDER BY expire_date ASC`, cutoff)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "查询失败"})
	}
	defer rows.Close()

	var batches []models.VaccineBatch
	for rows.Next() {
		var b models.VaccineBatch
		err := rows.Scan(&b.ID, &b.BatchNo, &b.BoxNo, &b.VaccineName, &b.Manufacturer,
			&b.Quantity, &b.ExpireDate, &b.Status, &b.ReceivedAt)
		if err != nil {
			continue
		}
		batches = append(batches, b)
	}

	return c.JSON(batches)
}

func GetAbnormalBatches(c *fiber.Ctx) error {
	today := time.Now().Format("2006-01-02")
	expireCutoff := time.Now().AddDate(0, 0, 7).Format("2006-01-02")

	result := fiber.Map{
		"temperature_violations": []models.VaccineBatch{},
		"missing_signatures":     []models.VaccineBatch{},
		"expiring_soon":          []models.VaccineBatch{},
	}

	rows1, _ := database.DB.Query(`SELECT id, batch_no, vaccine_name, receive_temp, temp_min, temp_max, 
		status, isolation_reason, received_at FROM vaccine_batches 
		WHERE temperature_ok = 0 OR status = 'isolated'
		ORDER BY received_at DESC`)
	defer rows1.Close()
	var tempViolations []models.VaccineBatch
	for rows1.Next() {
		var b models.VaccineBatch
		rows1.Scan(&b.ID, &b.BatchNo, &b.VaccineName, &b.ReceiveTemp, &b.TempMin, &b.TempMax,
			&b.Status, &b.IsolationReason, &b.ReceivedAt)
		tempViolations = append(tempViolations, b)
	}
	result["temperature_violations"] = tempViolations

	rows2, _ := database.DB.Query(`SELECT id, batch_no, vaccine_name, receiver_name, received_at 
		FROM vaccine_batches WHERE (signature IS NULL OR signature = '') AND DATE(received_at) = ?
		ORDER BY received_at DESC`, today)
	defer rows2.Close()
	var missingSigs []models.VaccineBatch
	for rows2.Next() {
		var b models.VaccineBatch
		rows2.Scan(&b.ID, &b.BatchNo, &b.VaccineName, &b.ReceiverName, &b.ReceivedAt)
		missingSigs = append(missingSigs, b)
	}
	result["missing_signatures"] = missingSigs

	rows3, _ := database.DB.Query(`SELECT id, batch_no, vaccine_name, quantity, expire_date, status 
		FROM vaccine_batches WHERE expire_date <= ? AND status = 'available'
		ORDER BY expire_date ASC`, expireCutoff)
	defer rows3.Close()
	var expiring []models.VaccineBatch
	for rows3.Next() {
		var b models.VaccineBatch
		rows3.Scan(&b.ID, &b.BatchNo, &b.VaccineName, &b.Quantity, &b.ExpireDate, &b.Status)
		expiring = append(expiring, b)
	}
	result["expiring_soon"] = expiring

	return c.JSON(result)
}

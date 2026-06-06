package handlers

import (
	"database/sql"
	"fmt"
	"renovation-system/database"
	"renovation-system/models"
	"time"

	"github.com/gofiber/fiber/v2"
)

func VerifyQRCode(c *fiber.Ctx) error {
	user := GetUserFromContext(c)
	var req models.VerifyQRRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "参数错误"})
	}

	row := database.DB.QueryRow(`
		SELECT a.id, a.application_no, a.owner_name, a.building, a.unit, a.room,
			   a.team_id, ct.name as team_name, a.start_date, a.end_date,
			   a.has_noise_work, a.noise_time_slots, a.status
		FROM applications a
		LEFT JOIN construction_teams ct ON a.team_id = ct.id
		WHERE a.qr_code = ?
	`, req.QRCode)

	var app models.Application
	var teamName sql.NullString
	err := row.Scan(&app.ID, &app.ApplicationNo, &app.OwnerName, &app.Building, &app.Unit, &app.Room,
		&app.TeamID, &teamName, &app.StartDate, &app.EndDate, &app.HasNoiseWork, &app.NoiseTimeSlots, &app.Status)

	if err == sql.ErrNoRows {
		database.DB.Exec(`
			INSERT INTO gate_verifications (application_id, qr_code, verifier_id, result, detail)
			VALUES (0, ?, ?, 'failed', '二维码无效')
		`, req.QRCode, user.ID)
		return c.Status(404).JSON(fiber.Map{"error": "二维码无效", "result": "failed"})
	}

	app.TeamName = teamName.String

	result := "passed"
	detail := "核验通过"

	if app.Status != "approved" {
		statusText := map[string]string{
			"pending":       "待审核",
			"manual_review": "待人工复核",
			"rejected":      "已拒绝",
			"returned":      "已退回修改",
		}[app.Status]
		result = "failed"
		detail = fmt.Sprintf("申请状态：%s", statusText)
	}

	today := time.Now().Format("2006-01-02")
	if today < app.StartDate || today > app.EndDate {
		result = "failed"
		detail = fmt.Sprintf("不在施工有效期内（%s 至 %s）", app.StartDate, app.EndDate)
	}

	database.DB.Exec(`
		INSERT INTO gate_verifications (application_id, qr_code, verifier_id, result, detail)
		VALUES (?, ?, ?, ?, ?)
	`, app.ID, req.QRCode, user.ID, result, detail)

	InsertAuditLog(user.ID, "verify", "gate",
		fmt.Sprintf("核验二维码 %s: %s", app.ApplicationNo, result), c.IP())

	if result == "failed" {
		return c.Status(400).JSON(fiber.Map{
			"result": result,
			"detail": detail,
		})
	}

	return c.JSON(fiber.Map{
		"result":          result,
		"detail":          detail,
		"application_no":  app.ApplicationNo,
		"owner_name":      app.OwnerName,
		"building":        app.Building,
		"unit":            app.Unit,
		"room":            app.Room,
		"team_name":       app.TeamName,
		"start_date":      app.StartDate,
		"end_date":        app.EndDate,
		"has_noise_work":  app.HasNoiseWork,
		"noise_time_slots": app.NoiseTimeSlots,
		"allowed_areas":   fmt.Sprintf("%s栋%s单元%s室", app.Building, app.Unit, app.Room),
	})
}

func GetVerificationRecords(c *fiber.Ctx) error {
	page := c.QueryInt("page", 1)
	pageSize := c.QueryInt("page_size", 20)
	offset := (page - 1) * pageSize

	rows, err := database.DB.Query(`
		SELECT gv.id, gv.qr_code, a.application_no, gv.result, gv.detail,
			   u.name as verifier_name, gv.verified_at
		FROM gate_verifications gv
		LEFT JOIN applications a ON gv.application_id = a.id
		LEFT JOIN users u ON gv.verifier_id = u.id
		ORDER BY gv.verified_at DESC LIMIT ? OFFSET ?
	`, pageSize, offset)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	var records []map[string]interface{}
	for rows.Next() {
		var id int
		var qrCode, appNo, result, detail, verifierName sql.NullString
		var verifiedAt time.Time
		rows.Scan(&id, &qrCode, &appNo, &result, &detail, &verifierName, &verifiedAt)
		records = append(records, map[string]interface{}{
			"id":             id,
			"qr_code":        qrCode.String,
			"application_no": appNo.String,
			"result":         result.String,
			"detail":         detail.String,
			"verifier_name":  verifierName.String,
			"verified_at":    verifiedAt,
		})
	}

	var total int
	database.DB.QueryRow("SELECT COUNT(*) FROM gate_verifications").Scan(&total)

	return c.JSON(fiber.Map{
		"list":     records,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

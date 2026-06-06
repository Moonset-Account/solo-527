package handlers

import (
	"database/sql"
	"fmt"
	"renovation-system/database"
	"renovation-system/models"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func CreateApplication(c *fiber.Ctx) error {
	user := GetUserFromContext(c)
	var app models.Application
	if err := c.BodyParser(&app); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "参数错误: " + err.Error()})
	}

	if app.HasNoiseWork {
		hasHoliday, holidayInfo := database.HasHolidayInRange(app.StartDate, app.EndDate)
		if hasHoliday {
			return c.Status(400).JSON(fiber.Map{"error": "施工日期范围内包含节假日 " + holidayInfo + "，节假日禁止噪音作业，请调整施工日期"})
		}
	}

	var team models.ConstructionTeam
	if app.TeamID > 0 {
		database.DB.QueryRow("SELECT id, needs_manual_review FROM construction_teams WHERE id = ?", app.TeamID).Scan(&team.ID, &team.NeedsManualReview)
	}

	if app.HasNoiseWork && app.TeamID > 0 {
		var openViolations int
		database.DB.QueryRow("SELECT COUNT(*) FROM violations WHERE team_id = ? AND status = 'open'", app.TeamID).Scan(&openViolations)
		if openViolations > 0 {
			return c.Status(400).JSON(fiber.Map{"error": "该施工队存在未处理的违规记录，不能申请噪音作业"})
		}
	}

	appNo := fmt.Sprintf("SQ%s%04d", time.Now().Format("20060102"), time.Now().Unix()%10000)
	status := "pending"
	if team.NeedsManualReview {
		status = "manual_review"
	}

	qrCode := uuid.New().String()

	var materialEntryTime interface{}
	if app.MaterialEntryTime != nil && !app.MaterialEntryTime.IsZero() {
		materialEntryTime = app.MaterialEntryTime
	} else {
		materialEntryTime = nil
	}

	result, err := database.DB.Exec(`
		INSERT INTO applications (
			application_no, owner_name, owner_phone, building, unit, room,
			team_id, work_types, material_entry_time, start_date, end_date,
			has_noise_work, noise_time_slots, status, qr_code, created_by
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, appNo, app.OwnerName, app.OwnerPhone, app.Building, app.Unit, app.Room,
		app.TeamID, app.WorkTypes, materialEntryTime, app.StartDate, app.EndDate,
		app.HasNoiseWork, app.NoiseTimeSlots, status, qrCode, user.ID)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "创建申请失败: " + err.Error()})
	}

	id, _ := result.LastInsertId()

	InsertAuditLog(user.ID, "create", "application", fmt.Sprintf("创建申请 %s", appNo), c.IP())

	var engineerID int
	database.DB.QueryRow("SELECT id FROM users WHERE role = 'engineer' LIMIT 1").Scan(&engineerID)
	if engineerID > 0 {
		statusText := map[bool]string{true: "需要人工复核", false: "待审核"}[team.NeedsManualReview]
		SendNotification(engineerID, "新的施工申请",
			fmt.Sprintf("有新的施工申请 %s，%s", appNo, statusText),
			"application", int(id))
	}

	return c.JSON(fiber.Map{
		"id":             id,
		"application_no": appNo,
		"status":         status,
		"qr_code":        qrCode,
	})
}

func GetApplications(c *fiber.Ctx) error {
	status := c.Query("status", "")
	building := c.Query("building", "")
	keyword := c.Query("keyword", "")
	page := c.QueryInt("page", 1)
	pageSize := c.QueryInt("page_size", 10)

	offset := (page - 1) * pageSize

	query := `
		SELECT a.id, a.application_no, a.owner_name, a.building, a.unit, a.room,
			   a.status, a.start_date, a.end_date, a.has_noise_work, a.created_at,
			   ct.name as team_name
		FROM applications a
		LEFT JOIN construction_teams ct ON a.team_id = ct.id
		WHERE 1=1
	`
	args := []interface{}{}

	if status != "" {
		query += " AND a.status = ?"
		args = append(args, status)
	}
	if building != "" {
		query += " AND a.building = ?"
		args = append(args, building)
	}
	if keyword != "" {
		query += " AND (a.application_no LIKE ? OR a.owner_name LIKE ? OR ct.name LIKE ?)"
		kw := "%" + keyword + "%"
		args = append(args, kw, kw, kw)
	}

	query += " ORDER BY a.created_at DESC LIMIT ? OFFSET ?"
	args = append(args, pageSize, offset)

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	var apps []map[string]interface{}
	for rows.Next() {
		var id int
		var appNo, ownerName, building, unit, room, status, startDate, endDate, teamName sql.NullString
		var hasNoiseWork bool
		var createdAt time.Time
		rows.Scan(&id, &appNo, &ownerName, &building, &unit, &room, &status, &startDate, &endDate, &hasNoiseWork, &createdAt, &teamName)
		apps = append(apps, map[string]interface{}{
			"id":             id,
			"application_no": appNo.String,
			"owner_name":     ownerName.String,
			"building":       building.String,
			"unit":           unit.String,
			"room":           room.String,
			"status":         status.String,
			"start_date":     startDate.String,
			"end_date":       endDate.String,
			"has_noise_work": hasNoiseWork,
			"team_name":      teamName.String,
			"created_at":     createdAt,
		})
	}

	countQuery := "SELECT COUNT(*) FROM applications a LEFT JOIN construction_teams ct ON a.team_id = ct.id WHERE 1=1"
	countArgs := []interface{}{}
	if status != "" {
		countQuery += " AND a.status = ?"
		countArgs = append(countArgs, status)
	}
	if building != "" {
		countQuery += " AND a.building = ?"
		countArgs = append(countArgs, building)
	}
	if keyword != "" {
		countQuery += " AND (a.application_no LIKE ? OR a.owner_name LIKE ? OR ct.name LIKE ?)"
		kw := "%" + keyword + "%"
		countArgs = append(countArgs, kw, kw, kw)
	}

	var total int
	database.DB.QueryRow(countQuery, countArgs...).Scan(&total)

	return c.JSON(fiber.Map{
		"list":     apps,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

func GetApplication(c *fiber.Ctx) error {
	id := c.Params("id")
	row := database.DB.QueryRow(`
		SELECT a.id, a.application_no, a.owner_name, a.owner_phone, a.building, a.unit, a.room,
			   a.team_id, ct.name as team_name, a.work_types, a.material_entry_time,
			   a.start_date, a.end_date, a.has_noise_work, a.noise_time_slots,
			   a.status, a.reviewer_id, u.name as reviewer_name, a.review_comment,
			   a.reviewed_at, a.qr_code, a.created_at, a.updated_at
		FROM applications a
		LEFT JOIN construction_teams ct ON a.team_id = ct.id
		LEFT JOIN users u ON a.reviewer_id = u.id
		WHERE a.id = ?
	`, id)

	var app models.Application
	var teamName, reviewerName sql.NullString
	var reviewerID sql.NullInt64
	var reviewedAt, materialEntryTime sql.NullTime
	err := row.Scan(&app.ID, &app.ApplicationNo, &app.OwnerName, &app.OwnerPhone,
		&app.Building, &app.Unit, &app.Room, &app.TeamID, &teamName, &app.WorkTypes,
		&materialEntryTime, &app.StartDate, &app.EndDate, &app.HasNoiseWork,
		&app.NoiseTimeSlots, &app.Status, &reviewerID, &reviewerName, &app.ReviewComment,
		&reviewedAt, &app.QRCode, &app.CreatedAt, &app.UpdatedAt)

	if err == sql.ErrNoRows {
		return c.Status(404).JSON(fiber.Map{"error": "申请不存在"})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	app.TeamName = teamName.String
	app.ReviewerName = reviewerName.String
	if reviewerID.Valid {
		app.ReviewerID = int(reviewerID.Int64)
	}
	if reviewedAt.Valid {
		app.ReviewedAt = &reviewedAt.Time
	}
	if materialEntryTime.Valid {
		app.MaterialEntryTime = &materialEntryTime.Time
	}

	return c.JSON(app)
}

func ReviewApplication(c *fiber.Ctx) error {
	user := GetUserFromContext(c)
	id := c.Params("id")

	var req models.ReviewRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "参数错误"})
	}

	if req.Status != "approved" && req.Status != "rejected" && req.Status != "returned" {
		return c.Status(400).JSON(fiber.Map{"error": "无效的审核状态"})
	}

	var app models.Application
	err := database.DB.QueryRow("SELECT id, application_no, status, created_by FROM applications WHERE id = ?", id).
		Scan(&app.ID, &app.ApplicationNo, &app.Status, &app.CreatedBy)
	if err == sql.ErrNoRows {
		return c.Status(404).JSON(fiber.Map{"error": "申请不存在"})
	}

	if app.Status != "pending" && app.Status != "manual_review" {
		return c.Status(400).JSON(fiber.Map{"error": "该申请状态不允许审核"})
	}

	_, err = database.DB.Exec(`
		UPDATE applications SET status = ?, reviewer_id = ?, review_comment = ?, reviewed_at = ?, updated_at = ?
		WHERE id = ?
	`, req.Status, user.ID, req.Comment, time.Now(), time.Now(), id)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "审核失败"})
	}

	InsertAuditLog(user.ID, "review", "application",
		fmt.Sprintf("审核申请 %s: %s", app.ApplicationNo, req.Status), c.IP())

	statusText := map[string]string{
		"approved": "已通过",
		"rejected": "已拒绝",
		"returned": "已退回修改",
	}[req.Status]

	SendNotification(app.CreatedBy, "施工申请审核结果",
		fmt.Sprintf("您的施工申请 %s %s，审核意见：%s", app.ApplicationNo, statusText, req.Comment),
		"application", app.ID)

	return c.JSON(fiber.Map{"message": "审核成功", "status": req.Status})
}

func UpdateApplication(c *fiber.Ctx) error {
	user := GetUserFromContext(c)
	id := c.Params("id")

	var app models.Application
	if err := c.BodyParser(&app); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "参数错误"})
	}

	var existingStatus string
	database.DB.QueryRow("SELECT status FROM applications WHERE id = ?", id).Scan(&existingStatus)
	if existingStatus != "returned" && existingStatus != "pending" {
		return c.Status(400).JSON(fiber.Map{"error": "只有退回或待审核的申请可以修改"})
	}

	var updateMaterialEntryTime interface{}
	if app.MaterialEntryTime != nil && !app.MaterialEntryTime.IsZero() {
		updateMaterialEntryTime = app.MaterialEntryTime
	} else {
		updateMaterialEntryTime = nil
	}

	_, err := database.DB.Exec(`
		UPDATE applications SET owner_name = ?, owner_phone = ?, building = ?, unit = ?, room = ?,
		team_id = ?, work_types = ?, material_entry_time = ?, start_date = ?, end_date = ?,
		has_noise_work = ?, noise_time_slots = ?, status = 'pending', updated_at = ?
		WHERE id = ?
	`, app.OwnerName, app.OwnerPhone, app.Building, app.Unit, app.Room,
		app.TeamID, app.WorkTypes, updateMaterialEntryTime, app.StartDate, app.EndDate,
		app.HasNoiseWork, app.NoiseTimeSlots, time.Now(), id)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "更新失败"})
	}

	InsertAuditLog(user.ID, "update", "application", fmt.Sprintf("修改申请 ID:%s", id), c.IP())

	return c.JSON(fiber.Map{"message": "更新成功"})
}

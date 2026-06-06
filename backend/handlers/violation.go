package handlers

import (
	"database/sql"
	"fmt"
	"renovation-system/database"
	"renovation-system/models"
	"time"

	"github.com/gofiber/fiber/v2"
)

func CreateViolation(c *fiber.Ctx) error {
	user := GetUserFromContext(c)
	var v models.Violation
	if err := c.BodyParser(&v); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "参数错误"})
	}

	var appNo string
	var teamID int
	database.DB.QueryRow("SELECT application_no, team_id FROM applications WHERE id = ?", v.ApplicationID).
		Scan(&appNo, &teamID)

	v.TeamID = teamID
	v.ReportedBy = user.ID

	result, err := database.DB.Exec(`
		INSERT INTO violations (application_id, team_id, violation_type, description, reported_by, status)
		VALUES (?, ?, ?, ?, ?, 'open')
	`, v.ApplicationID, v.TeamID, v.ViolationType, v.Description, v.ReportedBy)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "创建违规记录失败"})
	}

	id, _ := result.LastInsertId()

	database.DB.Exec(`
		UPDATE construction_teams SET violation_count = violation_count + 1, needs_manual_review = 1
		WHERE id = ?
	`, v.TeamID)

	InsertAuditLog(user.ID, "create", "violation",
		fmt.Sprintf("记录违规: %s, 申请: %s", v.ViolationType, appNo), c.IP())

	var engineerID int
	database.DB.QueryRow("SELECT id FROM users WHERE role = 'engineer' LIMIT 1").Scan(&engineerID)
	if engineerID > 0 {
		SendNotification(engineerID, "新的违规记录",
			fmt.Sprintf("申请 %s 有新的违规记录：%s", appNo, v.ViolationType),
			"violation", int(id))
	}

	return c.JSON(fiber.Map{"id": id, "message": "违规记录已创建"})
}

func GetViolations(c *fiber.Ctx) error {
	status := c.Query("status", "")
	teamID := c.QueryInt("team_id", 0)
	page := c.QueryInt("page", 1)
	pageSize := c.QueryInt("page_size", 10)
	offset := (page - 1) * pageSize

	query := `
		SELECT v.id, v.application_id, a.application_no, v.team_id, ct.name as team_name,
			   v.violation_type, v.description, v.violation_time, v.status,
			   u.name as reported_by_name, v.handled_at
		FROM violations v
		LEFT JOIN applications a ON v.application_id = a.id
		LEFT JOIN construction_teams ct ON v.team_id = ct.id
		LEFT JOIN users u ON v.reported_by = u.id
		WHERE 1=1
	`
	args := []interface{}{}

	if status != "" {
		query += " AND v.status = ?"
		args = append(args, status)
	}
	if teamID > 0 {
		query += " AND v.team_id = ?"
		args = append(args, teamID)
	}

	query += " ORDER BY v.violation_time DESC LIMIT ? OFFSET ?"
	args = append(args, pageSize, offset)

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	var violations []map[string]interface{}
	for rows.Next() {
		var id, appID, teamID int
		var appNo, teamName, vType, desc, status, reportedByName sql.NullString
		var vTime, handledAt sql.NullTime
		rows.Scan(&id, &appID, &appNo, &teamID, &teamName, &vType, &desc, &vTime, &status, &reportedByName, &handledAt)
		violations = append(violations, map[string]interface{}{
			"id":               id,
			"application_id":   appID,
			"application_no":   appNo.String,
			"team_id":          teamID,
			"team_name":        teamName.String,
			"violation_type":   vType.String,
			"description":      desc.String,
			"violation_time":   vTime.Time,
			"status":           status.String,
			"reported_by_name": reportedByName.String,
			"handled_at":       handledAt.Time,
		})
	}

	countQuery := "SELECT COUNT(*) FROM violations WHERE 1=1"
	countArgs := []interface{}{}
	if status != "" {
		countQuery += " AND status = ?"
		countArgs = append(countArgs, status)
	}
	if teamID > 0 {
		countQuery += " AND team_id = ?"
		countArgs = append(countArgs, teamID)
	}

	var total int
	database.DB.QueryRow(countQuery, countArgs...).Scan(&total)

	return c.JSON(fiber.Map{
		"list":     violations,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

func HandleViolation(c *fiber.Ctx) error {
	user := GetUserFromContext(c)
	id := c.Params("id")

	var req models.ViolationHandleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "参数错误"})
	}

	var v models.Violation
	err := database.DB.QueryRow("SELECT id, team_id FROM violations WHERE id = ?", id).
		Scan(&v.ID, &v.TeamID)
	if err == sql.ErrNoRows {
		return c.Status(404).JSON(fiber.Map{"error": "违规记录不存在"})
	}

	_, err = database.DB.Exec(`
		UPDATE violations SET status = 'closed', handled_by = ?, handle_comment = ?, handled_at = ?
		WHERE id = ?
	`, user.ID, req.Comment, time.Now(), id)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "处理失败"})
	}

	InsertAuditLog(user.ID, "handle", "violation",
		fmt.Sprintf("处理违规 ID:%s", id), c.IP())

	return c.JSON(fiber.Map{"message": "违规已处理"})
}

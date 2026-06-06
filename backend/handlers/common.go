package handlers

import (
	"database/sql"
	"renovation-system/database"
	"time"

	"github.com/gofiber/fiber/v2"
)

func GetTeams(c *fiber.Ctx) error {
	rows, err := database.DB.Query(`
		SELECT id, name, leader_name, leader_phone, license_number,
			   violation_count, needs_manual_review
		FROM construction_teams ORDER BY name
	`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	var teams []map[string]interface{}
	for rows.Next() {
		var id, violationCount int
		var name, leaderName, leaderPhone, license string
		var needsReview bool
		rows.Scan(&id, &name, &leaderName, &leaderPhone, &license, &violationCount, &needsReview)
		teams = append(teams, map[string]interface{}{
			"id":                  id,
			"name":                name,
			"leader_name":         leaderName,
			"leader_phone":        leaderPhone,
			"license_number":      license,
			"violation_count":     violationCount,
			"needs_manual_review": needsReview,
		})
	}

	return c.JSON(teams)
}

func GetHolidays(c *fiber.Ctx) error {
	year := c.Query("year", time.Now().Format("2006"))
	rows, err := database.DB.Query(`
		SELECT id, name, date, is_noise_prohibited FROM holidays
		WHERE strftime('%Y', date) = ? ORDER BY date
	`, year)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	var holidays []map[string]interface{}
	for rows.Next() {
		var id int
		var name, date string
		var isProhibited bool
		rows.Scan(&id, &name, &date, &isProhibited)
		holidays = append(holidays, map[string]interface{}{
			"id":                  id,
			"name":                name,
			"date":                date,
			"is_noise_prohibited": isProhibited,
		})
	}

	return c.JSON(holidays)
}

func GetTimeSlotsAPI(c *fiber.Ctx) error {
	dayType := c.Query("day_type", "workday")
	isNoise := c.QueryInt("is_noise", 0)

	slots := database.GetTimeSlots(dayType, isNoise == 1)
	return c.JSON(slots)
}

func GetNotifications(c *fiber.Ctx) error {
	user := GetUserFromContext(c)
	page := c.QueryInt("page", 1)
	pageSize := c.QueryInt("page_size", 20)
	offset := (page - 1) * pageSize

	rows, err := database.DB.Query(`
		SELECT id, title, content, type, is_read, related_id, related_type, created_at
		FROM notifications WHERE user_id = ? OR user_id IS NULL
		ORDER BY created_at DESC LIMIT ? OFFSET ?
	`, user.ID, pageSize, offset)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	var notifications []map[string]interface{}
	for rows.Next() {
		var id, relatedID int
		var title, content, nType, relatedType sql.NullString
		var isRead bool
		var createdAt time.Time
		rows.Scan(&id, &title, &content, &nType, &isRead, &relatedID, &relatedType, &createdAt)
		notifications = append(notifications, map[string]interface{}{
			"id":           id,
			"title":        title.String,
			"content":      content.String,
			"type":         nType.String,
			"is_read":      isRead,
			"related_id":   relatedID,
			"related_type": relatedType.String,
			"created_at":   createdAt,
		})
	}

	var total int
	database.DB.QueryRow("SELECT COUNT(*) FROM notifications WHERE user_id = ? OR user_id IS NULL", user.ID).Scan(&total)

	return c.JSON(fiber.Map{
		"list":     notifications,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

func MarkNotificationRead(c *fiber.Ctx) error {
	user := GetUserFromContext(c)
	id := c.Params("id")

	_, err := database.DB.Exec("UPDATE notifications SET is_read = 1 WHERE id = ? AND (user_id = ? OR user_id IS NULL)",
		id, user.ID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "标记失败"})
	}

	return c.JSON(fiber.Map{"message": "已标记为已读"})
}

func GetAuditLogs(c *fiber.Ctx) error {
	module := c.Query("module", "")
	keyword := c.Query("keyword", "")
	startDate := c.Query("start_date", "")
	endDate := c.Query("end_date", "")
	page := c.QueryInt("page", 1)
	pageSize := c.QueryInt("page_size", 20)
	offset := (page - 1) * pageSize

	query := `
		SELECT al.id, al.user_id, u.name as user_name, al.action, al.module,
			   al.detail, al.ip_address, al.created_at
		FROM audit_logs al
		LEFT JOIN users u ON al.user_id = u.id
		WHERE 1=1
	`
	args := []interface{}{}

	if module != "" {
		query += " AND al.module = ?"
		args = append(args, module)
	}
	if keyword != "" {
		query += " AND (al.detail LIKE ? OR u.name LIKE ?)"
		kw := "%" + keyword + "%"
		args = append(args, kw, kw)
	}
	if startDate != "" {
		query += " AND date(al.created_at) >= ?"
		args = append(args, startDate)
	}
	if endDate != "" {
		query += " AND date(al.created_at) <= ?"
		args = append(args, endDate)
	}

	query += " ORDER BY al.created_at DESC LIMIT ? OFFSET ?"
	args = append(args, pageSize, offset)

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	var logs []map[string]interface{}
	for rows.Next() {
		var id, userID int
		var userName, action, module, detail, ip sql.NullString
		var createdAt time.Time
		rows.Scan(&id, &userID, &userName, &action, &module, &detail, &ip, &createdAt)
		logs = append(logs, map[string]interface{}{
			"id":         id,
			"user_id":    userID,
			"user_name":  userName.String,
			"action":     action.String,
			"module":     module.String,
			"detail":     detail.String,
			"ip_address": ip.String,
			"created_at": createdAt,
		})
	}

	countQuery := `
		SELECT COUNT(*) FROM audit_logs al
		LEFT JOIN users u ON al.user_id = u.id
		WHERE 1=1
	`
	countArgs := []interface{}{}
	if module != "" {
		countQuery += " AND al.module = ?"
		countArgs = append(countArgs, module)
	}
	if keyword != "" {
		countQuery += " AND (al.detail LIKE ? OR u.name LIKE ?)"
		kw := "%" + keyword + "%"
		countArgs = append(countArgs, kw, kw)
	}
	if startDate != "" {
		countQuery += " AND date(al.created_at) >= ?"
		countArgs = append(countArgs, startDate)
	}
	if endDate != "" {
		countQuery += " AND date(al.created_at) <= ?"
		countArgs = append(countArgs, endDate)
	}

	var total int
	database.DB.QueryRow(countQuery, countArgs...).Scan(&total)

	return c.JSON(fiber.Map{
		"list":     logs,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

func CheckDateNoiseAllowed(c *fiber.Ctx) error {
	date := c.Query("date", time.Now().Format("2006-01-02"))
	isHoliday := database.IsHoliday(date)
	return c.JSON(fiber.Map{
		"date":                date,
		"is_holiday":          isHoliday,
		"noise_allowed":       !isHoliday,
		"message":             map[bool]string{true: "节假日禁止噪音作业", false: "可以安排噪音作业"}[isHoliday],
	})
}

func CheckDateRangeNoiseAllowed(c *fiber.Ctx) error {
	startDate := c.Query("start_date", "")
	endDate := c.Query("end_date", "")
	if startDate == "" || endDate == "" {
		return c.Status(400).JSON(fiber.Map{"error": "请提供开始和结束日期"})
	}
	hasHoliday, holidayInfo := database.HasHolidayInRange(startDate, endDate)
	return c.JSON(fiber.Map{
		"start_date":    startDate,
		"end_date":      endDate,
		"has_holiday":   hasHoliday,
		"holiday_info":  holidayInfo,
		"noise_allowed": !hasHoliday,
		"message":       map[bool]string{true: "日期范围内包含节假日 " + holidayInfo + "，节假日禁止噪音作业", false: "日期范围内无节假日，可以安排噪音作业"}[hasHoliday],
	})
}

package handlers

import (
	"cold-chain-system/internal/database"
	"cold-chain-system/internal/middleware"
	"cold-chain-system/internal/models"
	"cold-chain-system/internal/sms"
	"cold-chain-system/internal/utils"
	"database/sql"
	"encoding/csv"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func CreateTask(c *fiber.Ctx) error {
	var req models.CreateTaskRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "请求参数错误: " + err.Error(),
		})
	}

	dispatcherID := middleware.GetUserID(c)
	dispatcherName := middleware.GetUserName(c)

	var boxID, boxStatus, thermometerID string
	err := database.DB.QueryRow(
		"SELECT id, status, thermometer_id FROM boxes WHERE box_number = ?",
		req.BoxNumber,
	).Scan(&boxID, &boxStatus, &thermometerID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "箱子不存在",
		})
	}

	if boxStatus != string(models.BoxStatusIdle) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "箱子当前状态不可用，无法创建任务",
		})
	}

	if thermometerID != req.ThermometerID {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "温度计编号与箱子不匹配",
		})
	}

	var routeName string
	var routeSiteIDsJSON string
	err = database.DB.QueryRow(
		"SELECT name, site_ids FROM routes WHERE id = ?",
		req.RouteID,
	).Scan(&routeName, &routeSiteIDsJSON)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "路线不存在",
		})
	}

	routeSiteIDs := utils.ParseJSONStringArray(routeSiteIDsJSON)
	siteFound := false
	for _, sid := range routeSiteIDs {
		if sid == req.SiteID {
			siteFound = true
			break
		}
	}
	if !siteFound {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "站点不在所选路线中",
		})
	}

	var siteName string
	err = database.DB.QueryRow(
		"SELECT name FROM sites WHERE id = ?",
		req.SiteID,
	).Scan(&siteName)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "站点不存在",
		})
	}

	taskID := uuid.New().String()
	now := time.Now()

	tx, err := database.DB.Begin()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "创建事务失败",
		})
	}
	defer tx.Rollback()

	_, err = tx.Exec(
		`INSERT INTO tasks (id, box_id, box_number, route_id, route_name, site_id, site_name, 
		 dispatcher_id, dispatcher_name, status, expected_arrival, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		taskID, boxID, req.BoxNumber, req.RouteID, routeName, req.SiteID, siteName,
		dispatcherID, dispatcherName, models.TaskStatusInTransit, req.ExpectedArrival, now, now,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "创建任务失败: " + err.Error(),
		})
	}

	_, err = tx.Exec(
		`UPDATE boxes SET status = ?, vaccine_type = ?, vaccine_count = ?, 
		 current_task_id = ?, updated_at = ? WHERE id = ?`,
		models.BoxStatusInTransit, req.VaccineType, req.VaccineCount, taskID, now, boxID,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "更新箱子状态失败",
		})
	}

	if err = tx.Commit(); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "提交事务失败",
		})
	}

	task := models.Task{
		ID:              taskID,
		BoxID:           boxID,
		BoxNumber:       req.BoxNumber,
		RouteID:         req.RouteID,
		RouteName:       routeName,
		SiteID:          req.SiteID,
		SiteName:        siteName,
		DispatcherID:    dispatcherID,
		DispatcherName:  dispatcherName,
		Status:          models.TaskStatusInTransit,
		ExpectedArrival: req.ExpectedArrival,
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	var dispatcherPhone string
	database.DB.QueryRow("SELECT phone FROM users WHERE id = ?", dispatcherID).Scan(&dispatcherPhone)
	go sms.NotifyTaskCreated(&task, dispatcherPhone)

	return c.JSON(task)
}

func GetTasks(c *fiber.Ctx) error {
	userRole := middleware.GetUserRole(c)
	userSiteID := middleware.GetUserSiteID(c)

	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	status := c.Query("status")
	siteID := c.Query("site_id")
	boxNumber := c.Query("box_number")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	query := `SELECT id, box_id, box_number, route_id, route_name, site_id, site_name, 
		dispatcher_id, dispatcher_name, nurse_id, nurse_name, status, 
		expected_arrival, actual_arrival, signed_at, return_reason, exception_note, 
		temperature_ok, reviewed, reviewed_by, reviewed_at, created_at, updated_at 
		FROM tasks WHERE 1=1`
	countQuery := "SELECT COUNT(*) FROM tasks WHERE 1=1"
	var args []interface{}

	if userRole == "nurse" && userSiteID != "" {
		query += " AND site_id = ?"
		countQuery += " AND site_id = ?"
		args = append(args, userSiteID)
	}

	if status != "" {
		query += " AND status = ?"
		countQuery += " AND status = ?"
		args = append(args, status)
	}

	if siteID != "" {
		query += " AND site_id = ?"
		countQuery += " AND site_id = ?"
		args = append(args, siteID)
	}

	if boxNumber != "" {
		query += " AND box_number LIKE ?"
		countQuery += " AND box_number LIKE ?"
		args = append(args, "%"+boxNumber+"%")
	}

	if startDate != "" {
		query += " AND created_at >= ?"
		countQuery += " AND created_at >= ?"
		args = append(args, startDate)
	}

	if endDate != "" {
		query += " AND created_at <= ?"
		countQuery += " AND created_at <= ?"
		args = append(args, endDate+" 23:59:59")
	}

	query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
	queryArgs := append([]interface{}{}, args...)
	queryArgs = append(queryArgs, pageSize, offset)

	rows, err := database.DB.Query(query, queryArgs...)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "查询任务失败: " + err.Error(),
		})
	}
	defer rows.Close()

	var tasks []models.Task
	for rows.Next() {
		var t models.Task
		var nurseID, nurseName, returnReason, exceptionNote, reviewedBy sql.NullString
		var expectedArrival, actualArrival, signedAt, reviewedAt sql.NullTime
		var temperatureOK, reviewed sql.NullInt64

		err := rows.Scan(&t.ID, &t.BoxID, &t.BoxNumber, &t.RouteID, &t.RouteName,
			&t.SiteID, &t.SiteName, &t.DispatcherID, &t.DispatcherName,
			&nurseID, &nurseName, &t.Status, &expectedArrival, &actualArrival,
			&signedAt, &returnReason, &exceptionNote, &temperatureOK, &reviewed,
			&reviewedBy, &reviewedAt, &t.CreatedAt, &t.UpdatedAt)
		if err != nil {
			continue
		}

		if nurseID.Valid {
			t.NurseID = &nurseID.String
		}
		if nurseName.Valid {
			t.NurseName = &nurseName.String
		}
		if expectedArrival.Valid {
			t.ExpectedArrival = &expectedArrival.Time
		}
		if actualArrival.Valid {
			t.ActualArrival = &actualArrival.Time
		}
		if signedAt.Valid {
			t.SignedAt = &signedAt.Time
		}
		if returnReason.Valid {
			t.ReturnReason = &returnReason.String
		}
		if exceptionNote.Valid {
			t.ExceptionNote = &exceptionNote.String
		}
		if temperatureOK.Valid {
			val := temperatureOK.Int64 == 1
			t.TemperatureOK = &val
		}
		t.Reviewed = reviewed.Int64 == 1
		if reviewedBy.Valid {
			t.ReviewedBy = &reviewedBy.String
		}
		if reviewedAt.Valid {
			t.ReviewedAt = &reviewedAt.Time
		}

		tasks = append(tasks, t)
	}

	var total int64
	countArgs := append([]interface{}{}, args...)
	database.DB.QueryRow(countQuery, countArgs...).Scan(&total)

	return c.JSON(models.PagedResponse{
		Data:     tasks,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	})
}

func GetTask(c *fiber.Ctx) error {
	taskID := c.Params("id")

	var t models.Task
	var nurseID, nurseName, returnReason, exceptionNote, reviewedBy sql.NullString
	var expectedArrival, actualArrival, signedAt, reviewedAt sql.NullTime
	var temperatureOK, reviewed sql.NullInt64

	err := database.DB.QueryRow(
		`SELECT id, box_id, box_number, route_id, route_name, site_id, site_name, 
		dispatcher_id, dispatcher_name, nurse_id, nurse_name, status, 
		expected_arrival, actual_arrival, signed_at, return_reason, exception_note, 
		temperature_ok, reviewed, reviewed_by, reviewed_at, created_at, updated_at 
		FROM tasks WHERE id = ?`,
		taskID,
	).Scan(&t.ID, &t.BoxID, &t.BoxNumber, &t.RouteID, &t.RouteName,
		&t.SiteID, &t.SiteName, &t.DispatcherID, &t.DispatcherName,
		&nurseID, &nurseName, &t.Status, &expectedArrival, &actualArrival,
		&signedAt, &returnReason, &exceptionNote, &temperatureOK, &reviewed,
		&reviewedBy, &reviewedAt, &t.CreatedAt, &t.UpdatedAt)

	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "任务不存在",
		})
	}

	if nurseID.Valid {
		t.NurseID = &nurseID.String
	}
	if nurseName.Valid {
		t.NurseName = &nurseName.String
	}
	if expectedArrival.Valid {
		t.ExpectedArrival = &expectedArrival.Time
	}
	if actualArrival.Valid {
		t.ActualArrival = &actualArrival.Time
	}
	if signedAt.Valid {
		t.SignedAt = &signedAt.Time
	}
	if returnReason.Valid {
		t.ReturnReason = &returnReason.String
	}
	if exceptionNote.Valid {
		t.ExceptionNote = &exceptionNote.String
	}
	if temperatureOK.Valid {
		val := temperatureOK.Int64 == 1
		t.TemperatureOK = &val
	}
	t.Reviewed = reviewed.Int64 == 1
	if reviewedBy.Valid {
		t.ReviewedBy = &reviewedBy.String
	}
	if reviewedAt.Valid {
		t.ReviewedAt = &reviewedAt.Time
	}

	tempRows, _ := database.DB.Query(
		`SELECT id, box_id, task_id, temperature, recorded_at, recorded_by, attachment, is_normal, note, created_at 
		 FROM temperature_records WHERE task_id = ? ORDER BY created_at DESC`,
		taskID,
	)
	var tempRecords []models.TemperatureRecord
	if tempRows != nil {
		defer tempRows.Close()
		for tempRows.Next() {
			var tr models.TemperatureRecord
			var attachment, note sql.NullString
			var isNormal sql.NullInt64
			tempRows.Scan(&tr.ID, &tr.BoxID, &tr.TaskID, &tr.Temperature, &tr.RecordedAt,
				&tr.RecordedBy, &attachment, &isNormal, &note, &tr.CreatedAt)
			if attachment.Valid {
				tr.Attachment = &attachment.String
			}
			tr.IsNormal = isNormal.Int64 == 1
			if note.Valid {
				tr.Note = &note.String
			}
			tempRecords = append(tempRecords, tr)
		}
	}

	exRows, _ := database.DB.Query(
		`SELECT id, task_id, box_id, type, description, temperature, reported_by, resolved, 
		 resolved_by, resolved_at, resolution, created_at 
		 FROM exception_records WHERE task_id = ? ORDER BY created_at DESC`,
		taskID,
	)
	var exceptions []models.ExceptionRecord
	if exRows != nil {
		defer exRows.Close()
		for exRows.Next() {
			var er models.ExceptionRecord
			var temperature sql.NullFloat64
			var resolvedBy, resolvedAt, resolution sql.NullString
			var resolved sql.NullInt64
			exRows.Scan(&er.ID, &er.TaskID, &er.BoxID, &er.Type, &er.Description,
				&temperature, &er.ReportedBy, &resolved, &resolvedBy, &resolvedAt,
				&resolution, &er.CreatedAt)
			if temperature.Valid {
				er.Temperature = &temperature.Float64
			}
			er.Resolved = resolved.Int64 == 1
			if resolvedBy.Valid {
				er.ResolvedBy = &resolvedBy.String
			}
			if resolution.Valid {
				er.Resolution = &resolution.String
			}
			exceptions = append(exceptions, er)
		}
	}

	return c.JSON(fiber.Map{
		"task":               t,
		"temperatureRecords": tempRecords,
		"exceptions":         exceptions,
	})
}

func SignTask(c *fiber.Ctx) error {
	taskID := c.Params("id")
	userID := middleware.GetUserID(c)
	userName := middleware.GetUserName(c)
	userRole := middleware.GetUserRole(c)
	userSiteID := middleware.GetUserSiteID(c)

	if userRole != "nurse" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "只有护士可以签收任务",
		})
	}

	var req models.SignTaskRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "请求参数错误",
		})
	}

	var t models.Task
	var boxID string
	var currentStatus string
	var taskSiteID string
	err := database.DB.QueryRow(
		"SELECT id, box_id, status, site_id FROM tasks WHERE id = ?",
		taskID,
	).Scan(&t.ID, &boxID, &currentStatus, &taskSiteID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "任务不存在",
		})
	}

	if userSiteID != taskSiteID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "您无权签收该站点的任务",
		})
	}

	if currentStatus != string(models.TaskStatusInTransit) && currentStatus != string(models.TaskStatusReturned) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "当前任务状态不允许签收",
		})
	}

	isNormal := utils.IsTemperatureNormal(req.Temperature)
	now := time.Now()
	tempRecordID := uuid.New().String()

	tx, err := database.DB.Begin()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "创建事务失败",
		})
	}
	defer tx.Rollback()

	var notePtr *string
	if req.Note != "" {
		notePtr = &req.Note
	}

	_, err = tx.Exec(
		`INSERT INTO temperature_records (id, box_id, task_id, temperature, recorded_at, recorded_by, attachment, is_normal, note, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		tempRecordID, boxID, taskID, req.Temperature, now, userID, req.Attachment, isNormal, notePtr, now,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "保存温度记录失败",
		})
	}

	newStatus := models.TaskStatusSigned
	newBoxStatus := models.BoxStatusSigned
	if !isNormal {
		newStatus = models.TaskStatusException
		newBoxStatus = models.BoxStatusException
	}

	_, err = tx.Exec(
		`UPDATE tasks SET status = ?, nurse_id = ?, nurse_name = ?, actual_arrival = ?, 
		 signed_at = ?, temperature_ok = ?, updated_at = ? WHERE id = ?`,
		newStatus, userID, userName, now, now, isNormal, now, taskID,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "更新任务状态失败",
		})
	}

	var tempPtr *float64
	tempVal := req.Temperature
	tempPtr = &tempVal
	_, err = tx.Exec(
		`UPDATE boxes SET status = ?, temperature = ?, updated_at = ? WHERE id = ?`,
		newBoxStatus, tempPtr, now, boxID,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "更新箱子状态失败",
		})
	}

	if !isNormal {
		exceptionID := uuid.New().String()
		_, err = tx.Exec(
			`INSERT INTO exception_records (id, task_id, box_id, type, description, temperature, reported_by, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			exceptionID, taskID, boxID, "temperature",
			"温度超标，当前温度："+strconv.FormatFloat(req.Temperature, 'f', 2, 64)+"℃，正常范围：2-8℃",
			req.Temperature, userID, now,
		)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "创建异常记录失败",
			})
		}
	}

	if err = tx.Commit(); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "提交事务失败",
		})
	}

	var dispatcherID string
	var dispatcherPhone string
	database.DB.QueryRow("SELECT dispatcher_id FROM tasks WHERE id = ?", taskID).Scan(&dispatcherID)
	database.DB.QueryRow("SELECT phone FROM users WHERE id = ?", dispatcherID).Scan(&dispatcherPhone)

	task := models.Task{
		ID:            taskID,
		Status:        newStatus,
		BoxNumber:     t.BoxNumber,
		SiteName:      t.SiteName,
	}
	nurseNameVal := userName
	task.NurseName = &nurseNameVal

	go sms.NotifyTaskSigned(&task, dispatcherPhone)

	if !isNormal {
		var adminPhone string
		database.DB.QueryRow("SELECT phone FROM users WHERE role = 'admin' LIMIT 1").Scan(&adminPhone)
		go sms.NotifyTemperatureException(&task, adminPhone)
	}

	return c.JSON(fiber.Map{
		"success":       true,
		"status":        newStatus,
		"isNormal":      isNormal,
		"tempRecordID":  tempRecordID,
	})
}

func ReturnTask(c *fiber.Ctx) error {
	taskID := c.Params("id")
	_ = middleware.GetUserID(c)
	userRole := middleware.GetUserRole(c)
	userSiteID := middleware.GetUserSiteID(c)

	if userRole != "nurse" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "只有护士可以退回任务",
		})
	}

	var req models.ReturnTaskRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "请求参数错误",
		})
	}

	if req.Reason == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "请填写退回原因",
		})
	}

	var boxID string
	var currentStatus string
	var taskSiteID string
	var boxNumber string
	var siteName string
	var boxStatus string
	err := database.DB.QueryRow(
		"SELECT t.box_id, t.status, t.site_id, t.box_number, t.site_name, b.status FROM tasks t JOIN boxes b ON t.box_id = b.id WHERE t.id = ?",
		taskID,
	).Scan(&boxID, &currentStatus, &taskSiteID, &boxNumber, &siteName, &boxStatus)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "任务不存在",
		})
	}

	if userSiteID != taskSiteID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "您无权操作该站点的任务",
		})
	}

	if currentStatus != string(models.TaskStatusInTransit) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "当前任务状态不允许退回",
		})
	}

	now := time.Now()

	tx, err := database.DB.Begin()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "创建事务失败",
		})
	}
	defer tx.Rollback()

	_, err = tx.Exec(
		`UPDATE tasks SET status = ?, return_reason = ?, updated_at = ? WHERE id = ?`,
		models.TaskStatusReturned, req.Reason, now, taskID,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "更新任务状态失败",
		})
	}

	_, err = tx.Exec(
		`UPDATE boxes SET status = ?, updated_at = ? WHERE id = ?`,
		models.BoxStatusLocked, now, boxID,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "更新箱子状态失败",
		})
	}

	if err = tx.Commit(); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "提交事务失败",
		})
	}

	var dispatcherID string
	var dispatcherPhone string
	database.DB.QueryRow("SELECT dispatcher_id FROM tasks WHERE id = ?", taskID).Scan(&dispatcherID)
	database.DB.QueryRow("SELECT phone FROM users WHERE id = ?", dispatcherID).Scan(&dispatcherPhone)

	task := models.Task{
		ID:           taskID,
		BoxNumber:    boxNumber,
		SiteName:     siteName,
		ReturnReason: &req.Reason,
	}
	go sms.NotifyTaskReturned(&task, dispatcherPhone)

	return c.JSON(fiber.Map{
		"success": true,
		"message": "任务已退回，箱内库存已锁定",
	})
}

func ResendTask(c *fiber.Ctx) error {
	taskID := c.Params("id")
	userRole := middleware.GetUserRole(c)

	if userRole != "dispatcher" && userRole != "admin" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "只有调度员可以重新派送",
		})
	}

	var boxID string
	var currentStatus string
	err := database.DB.QueryRow(
		"SELECT box_id, status FROM tasks WHERE id = ?",
		taskID,
	).Scan(&boxID, &currentStatus)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "任务不存在",
		})
	}

	if currentStatus != string(models.TaskStatusReturned) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "只有退回的任务可以重新派送",
		})
	}

	now := time.Now()

	tx, err := database.DB.Begin()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "创建事务失败",
		})
	}
	defer tx.Rollback()

	_, err = tx.Exec(
		`UPDATE tasks SET status = ?, return_reason = NULL, updated_at = ? WHERE id = ?`,
		models.TaskStatusInTransit, now, taskID,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "更新任务状态失败",
		})
	}

	_, err = tx.Exec(
		`UPDATE boxes SET status = ?, updated_at = ? WHERE id = ?`,
		models.BoxStatusInTransit, now, boxID,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "更新箱子状态失败",
		})
	}

	if err = tx.Commit(); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "提交事务失败",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "任务已重新派送",
	})
}

func ReviewTask(c *fiber.Ctx) error {
	taskID := c.Params("id")
	userID := middleware.GetUserID(c)
	userName := middleware.GetUserName(c)
	userRole := middleware.GetUserRole(c)

	if userRole != "admin" && userRole != "dispatcher" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "只有管理员或调度员可以复核",
		})
	}

	var req models.ReviewTaskRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "请求参数错误",
		})
	}

	var boxID string
	var currentStatus string
	var nurseID *string
	err := database.DB.QueryRow(
		"SELECT box_id, status, nurse_id FROM tasks WHERE id = ?",
		taskID,
	).Scan(&boxID, &currentStatus, &nurseID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "任务不存在",
		})
	}

	if currentStatus != string(models.TaskStatusException) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "只有异常状态的任务需要复核",
		})
	}

	now := time.Now()

	tx, err := database.DB.Begin()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "创建事务失败",
		})
	}
	defer tx.Rollback()

	var newTaskStatus models.TaskStatus
	var newBoxStatus models.BoxStatus

	if req.Approved {
		newTaskStatus = models.TaskStatusCompleted
		newBoxStatus = models.BoxStatusIdle
	} else {
		newTaskStatus = models.TaskStatusException
		newBoxStatus = models.BoxStatusException
	}

	_, err = tx.Exec(
		`UPDATE tasks SET status = ?, reviewed = 1, reviewed_by = ?, reviewed_at = ?, updated_at = ? WHERE id = ?`,
		newTaskStatus, userName, now, now, taskID,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "更新任务状态失败",
		})
	}

	if req.Approved {
		_, err = tx.Exec(
			`UPDATE boxes SET status = ?, current_task_id = NULL, vaccine_type = '', vaccine_count = 0, updated_at = ? WHERE id = ?`,
			newBoxStatus, now, boxID,
		)
	} else {
		_, err = tx.Exec(
			`UPDATE boxes SET status = ?, updated_at = ? WHERE id = ?`,
			newBoxStatus, now, boxID,
		)
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "更新箱子状态失败",
		})
	}

	exceptionID := uuid.New().String()
	resolved := req.Approved
	resolution := req.Note
	if resolution == "" {
		if req.Approved {
			resolution = "复核通过，库存已释放"
		} else {
			resolution = "复核不通过，继续保持异常隔离"
		}
	}
	description := "复核通过"
	if !req.Approved {
		description = "复核不通过"
	}
	_, err = tx.Exec(
		`INSERT INTO exception_records (id, task_id, box_id, type, description, reported_by, resolved, resolved_by, resolved_at, resolution, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		exceptionID, taskID, boxID, "review", description,
		userID, resolved, userName, now, resolution, now,
	)

	if err = tx.Commit(); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "提交事务失败",
		})
	}

	if nurseID != nil {
		var nursePhone string
		database.DB.QueryRow("SELECT phone FROM users WHERE id = ?", *nurseID).Scan(&nursePhone)
		var boxNumber, siteName string
		database.DB.QueryRow("SELECT box_number, site_name FROM tasks WHERE id = ?", taskID).Scan(&boxNumber, &siteName)
		task := models.Task{
			ID:        taskID,
			BoxNumber: boxNumber,
			SiteName:  siteName,
			Reviewed:  req.Approved,
		}
		go sms.NotifyTaskReviewed(&task, nursePhone)
	}

	return c.JSON(fiber.Map{
		"success":  true,
		"approved": req.Approved,
		"message":  "复核完成",
	})
}

func ExportTasks(c *fiber.Ctx) error {
	userRole := middleware.GetUserRole(c)
	userSiteID := middleware.GetUserSiteID(c)

	status := c.Query("status")
	siteID := c.Query("site_id")
	boxNumber := c.Query("box_number")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	query := `SELECT id, box_number, route_name, site_name, dispatcher_name, nurse_name, status, 
		expected_arrival, actual_arrival, signed_at, temperature_ok, reviewed, created_at 
		FROM tasks WHERE 1=1`
	var args []interface{}

	if userRole == "nurse" && userSiteID != "" {
		query += " AND site_id = ?"
		args = append(args, userSiteID)
	}

	if status != "" {
		query += " AND status = ?"
		args = append(args, status)
	}

	if siteID != "" {
		query += " AND site_id = ?"
		args = append(args, siteID)
	}

	if boxNumber != "" {
		query += " AND box_number LIKE ?"
		args = append(args, "%"+boxNumber+"%")
	}

	if startDate != "" {
		query += " AND created_at >= ?"
		args = append(args, startDate)
	}

	if endDate != "" {
		query += " AND created_at <= ?"
		args = append(args, endDate+" 23:59:59")
	}

	query += " ORDER BY created_at DESC"

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "查询数据失败",
		})
	}
	defer rows.Close()

	c.Set("Content-Type", "text/csv; charset=utf-8")
	c.Set("Content-Disposition", "attachment; filename=cold_chain_tasks_"+time.Now().Format("20060102")+".csv")

	writer := csv.NewWriter(c.Context().Response.BodyWriter())
	defer writer.Flush()

	writer.Write([]string{"\uFEFF任务ID", "箱号", "路线", "站点", "调度员", "签收护士", "状态", "预计到达", "实际到达", "签收时间", "温度正常", "已复核", "创建时间"})

	statusMap := map[string]string{
		"pending":     "待处理",
		"in_transit":  "配送中",
		"arrived":     "已到达",
		"signed":      "已签收",
		"returned":    "已退回",
		"exception":   "异常",
		"reviewing":   "复核中",
		"completed":   "已完成",
	}

	for rows.Next() {
		var id, boxNumber, routeName, siteName, dispatcherName string
		var nurseName, expectedArrival, actualArrival, signedAt sql.NullString
		var status string
		var temperatureOK, reviewed sql.NullInt64
		var createdAt string

		rows.Scan(&id, &boxNumber, &routeName, &siteName, &dispatcherName, &nurseName,
			&status, &expectedArrival, &actualArrival, &signedAt, &temperatureOK, &reviewed, &createdAt)

		statusCN := statusMap[status]
		if statusCN == "" {
			statusCN = status
		}

		nurseNameVal := ""
		if nurseName.Valid {
			nurseNameVal = nurseName.String
		}

		tempOK := ""
		if temperatureOK.Valid {
			if temperatureOK.Int64 == 1 {
				tempOK = "是"
			} else {
				tempOK = "否"
			}
		}

		reviewedVal := "否"
		if reviewed.Int64 == 1 {
			reviewedVal = "是"
		}

		writer.Write([]string{
			id, boxNumber, routeName, siteName, dispatcherName, nurseNameVal, statusCN,
			nullString(expectedArrival), nullString(actualArrival), nullString(signedAt),
			tempOK, reviewedVal, strings.Split(createdAt, "T")[0],
		})
	}

	return nil
}

func nullString(s sql.NullString) string {
	if s.Valid {
		return strings.Split(s.String, "T")[0]
	}
	return ""
}

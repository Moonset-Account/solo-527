package sms

import (
	"log"
	"time"

	"cold-chain-system/internal/database"
	"cold-chain-system/internal/models"

	"github.com/google/uuid"
)

func SendNotification(taskID, phone, message, notificationType string) error {
	id := uuid.New().String()
	now := time.Now()

	_, err := database.DB.Exec(
		`INSERT INTO sms_notifications (id, task_id, phone, message, type, sent_at, status, created_at) 
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		id, taskID, phone, message, notificationType, now, "sent", now,
	)

	if err != nil {
		return err
	}

	log.Printf("[SMS Mock] 发送短信到 %s: %s (任务ID: %s)", phone, message, taskID)
	return nil
}

func NotifyTaskCreated(task *models.Task, dispatcherPhone string) error {
	message := "【冷链系统】新配送任务已创建：箱号" + task.BoxNumber + "，路线：" + task.RouteName + "，站点：" + task.SiteName
	return SendNotification(task.ID, dispatcherPhone, message, "task_created")
}

func NotifyTaskArrived(task *models.Task, nursePhone string) error {
	message := "【冷链系统】冷链箱已到达：箱号" + task.BoxNumber + "，请及时签收并上传温度记录"
	return SendNotification(task.ID, nursePhone, message, "task_arrived")
}

func NotifyTaskSigned(task *models.Task, dispatcherPhone string) error {
	message := "【冷链系统】任务已签收：箱号" + task.BoxNumber + "，站点：" + task.SiteName + "，签收人：" + *task.NurseName
	return SendNotification(task.ID, dispatcherPhone, message, "task_signed")
}

func NotifyTaskReturned(task *models.Task, dispatcherPhone string) error {
	message := "【冷链系统】任务被退回：箱号" + task.BoxNumber + "，站点：" + task.SiteName + "，原因：" + *task.ReturnReason
	return SendNotification(task.ID, dispatcherPhone, message, "task_returned")
}

func NotifyTemperatureException(task *models.Task, adminPhone string) error {
	message := "【冷链系统】温度异常警报：箱号" + task.BoxNumber + "，站点：" + task.SiteName + "，请立即处理"
	return SendNotification(task.ID, adminPhone, message, "temp_exception")
}

func NotifyTaskReviewed(task *models.Task, nursePhone string) error {
	status := "通过"
	if !task.Reviewed {
		status = "未通过"
	}
	message := "【冷链系统】任务复核" + status + "：箱号" + task.BoxNumber + "，站点：" + task.SiteName
	return SendNotification(task.ID, nursePhone, message, "task_reviewed")
}

package handlers

import (
	"cold-chain-system/internal/database"
	"cold-chain-system/internal/models"
	"io"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

func UploadTempAttachment(c *fiber.Ctx) error {
	batchID, _ := strconv.ParseInt(c.FormValue("batch_id"), 10, 64)
	uploadedBy := c.Locals("userID").(int64)

	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请选择文件"})
	}

	f, err := file.Open()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "文件读取失败"})
	}
	defer f.Close()

	fileData, err := io.ReadAll(f)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "文件读取失败"})
	}

	result, err := database.DB.Exec(`INSERT INTO temp_attachments 
		(batch_id, file_name, file_type, file_data, uploaded_by)
		VALUES (?, ?, ?, ?, ?)`,
		batchID, file.Filename, file.Header.Get("Content-Type"), fileData, uploadedBy,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "上传失败"})
	}

	id, _ := result.LastInsertId()
	return c.Status(201).JSON(fiber.Map{
		"id":         id,
		"batch_id":   batchID,
		"file_name":  file.Filename,
		"uploaded_by": uploadedBy,
	})
}

func GetBatchAttachments(c *fiber.Ctx) error {
	batchID, _ := strconv.ParseInt(c.Params("batchId"), 10, 64)

	rows, err := database.DB.Query(`SELECT id, batch_id, file_name, file_type, uploaded_by, created_at 
		FROM temp_attachments WHERE batch_id = ? ORDER BY created_at DESC`, batchID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "查询失败"})
	}
	defer rows.Close()

	var attachments []models.TempAttachment
	for rows.Next() {
		var a models.TempAttachment
		err := rows.Scan(&a.ID, &a.BatchID, &a.FileName, &a.FileType, &a.UploadedBy, &a.CreatedAt)
		if err != nil {
			continue
		}
		attachments = append(attachments, a)
	}

	return c.JSON(attachments)
}

func DownloadAttachment(c *fiber.Ctx) error {
	id, _ := strconv.ParseInt(c.Params("id"), 10, 64)

	var att models.TempAttachment
	err := database.DB.QueryRow(`SELECT id, file_name, file_type, file_data FROM temp_attachments WHERE id = ?`, id).Scan(
		&att.ID, &att.FileName, &att.FileType, &att.FileData,
	)

	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "文件不存在"})
	}

	c.Set("Content-Disposition", "attachment; filename="+att.FileName)
	c.Set("Content-Type", att.FileType)
	return c.Send(att.FileData)
}

package handlers

import (
	"cold-chain-system/internal/database"
	"cold-chain-system/internal/middleware"
	"cold-chain-system/internal/models"
	"cold-chain-system/internal/utils"
	"database/sql"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
)

func parseJSONStringArray(s string) []string {
	return utils.ParseJSONStringArray(s)
}

func Login(c *fiber.Ctx) error {
	var req models.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "请求参数错误",
		})
	}

	var user models.User
	var siteID sql.NullString
	err := database.DB.QueryRow(
		"SELECT id, username, password, role, name, phone, site_id FROM users WHERE username = ?",
		req.Username,
	).Scan(&user.ID, &user.Username, &user.Password, &user.Role, &user.Name, &user.Phone, &siteID)

	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "用户名或密码错误",
		})
	}

	if siteID.Valid {
		user.SiteID = &siteID.String
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "用户名或密码错误",
		})
	}

	siteIDStr := ""
	if user.SiteID != nil {
		siteIDStr = *user.SiteID
	}

	token, err := middleware.GenerateToken(user.ID, user.Username, string(user.Role), user.Name, siteIDStr)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "生成令牌失败",
		})
	}

	return c.JSON(models.LoginResponse{
		Token: token,
		User:  user,
	})
}

func GetCurrentUser(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)
	role := middleware.GetUserRole(c)
	name := middleware.GetUserName(c)
	siteID := middleware.GetUserSiteID(c)

	user := models.User{
		ID:       userID,
		Role:     models.UserRole(role),
		Name:     name,
	}
	if siteID != "" {
		user.SiteID = &siteID
	}

	return c.JSON(user)
}

func GetSites(c *fiber.Ctx) error {
	rows, err := database.DB.Query("SELECT id, name, address, phone, contact, created_at FROM sites ORDER BY name")
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "查询站点失败",
		})
	}
	defer rows.Close()

	var sites []models.Site
	for rows.Next() {
		var s models.Site
		err := rows.Scan(&s.ID, &s.Name, &s.Address, &s.Phone, &s.Contact, &s.CreatedAt)
		if err != nil {
			continue
		}
		sites = append(sites, s)
	}

	return c.JSON(sites)
}

func GetRoutes(c *fiber.Ctx) error {
	rows, err := database.DB.Query("SELECT id, name, site_ids, order_num, created_at FROM routes ORDER BY order_num")
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "查询路线失败",
		})
	}
	defer rows.Close()

	var routes []models.Route
	for rows.Next() {
		var r models.Route
		var siteIDsJSON string
		err := rows.Scan(&r.ID, &r.Name, &siteIDsJSON, &r.Order, &r.CreatedAt)
		if err != nil {
			continue
		}
		r.SiteIDs = parseJSONStringArray(siteIDsJSON)
		routes = append(routes, r)
	}

	return c.JSON(routes)
}

func GetBoxes(c *fiber.Ctx) error {
	status := c.Query("status")
	query := "SELECT id, box_number, thermometer_id, status, vaccine_type, vaccine_count, current_task_id, temperature, created_at, updated_at FROM boxes WHERE 1=1"
	var args []interface{}

	if status != "" {
		query += " AND status = ?"
		args = append(args, status)
	}

	query += " ORDER BY box_number"

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "查询箱子失败",
		})
	}
	defer rows.Close()

	var boxes []models.Box
	for rows.Next() {
		var b models.Box
		var temp sql.NullFloat64
		var currentTaskIDStr sql.NullString
		err := rows.Scan(&b.ID, &b.BoxNumber, &b.ThermometerID, &b.Status, &b.VaccineType,
			&b.VaccineCount, &currentTaskIDStr, &temp, &b.CreatedAt, &b.UpdatedAt)
		if err != nil {
			continue
		}
		if currentTaskIDStr.Valid {
			b.CurrentTaskID = &currentTaskIDStr.String
		}
		if temp.Valid {
			val := temp.Float64
			b.Temperature = &val
		}
		boxes = append(boxes, b)
	}

	return c.JSON(boxes)
}

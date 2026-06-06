package handlers

import (
	"database/sql"
	"renovation-system/database"
	"renovation-system/models"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

var sessions = map[string]models.User{}

func Login(c *fiber.Ctx) error {
	var req models.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "参数错误"})
	}

	var user models.User
	err := database.DB.QueryRow("SELECT id, username, password, role, name, phone FROM users WHERE username = ?",
		req.Username).Scan(&user.ID, &user.Username, &user.Password, &user.Role, &user.Name, &user.Phone)

	if err == sql.ErrNoRows {
		return c.Status(401).JSON(fiber.Map{"error": "用户名或密码错误"})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "数据库错误"})
	}

	if user.Password != req.Password {
		return c.Status(401).JSON(fiber.Map{"error": "用户名或密码错误"})
	}

	sessionID := uuid.New().String()
	sessions[sessionID] = user

	InsertAuditLog(user.ID, "login", "auth", "用户登录", c.IP())

	return c.JSON(fiber.Map{
		"token": sessionID,
		"user": fiber.Map{
			"id":       user.ID,
			"username": user.Username,
			"role":     user.Role,
			"name":     user.Name,
			"phone":    user.Phone,
		},
	})
}

func Logout(c *fiber.Ctx) error {
	token := c.Get("Authorization")
	delete(sessions, token)
	return c.JSON(fiber.Map{"message": "退出成功"})
}

func GetCurrentUser(c *fiber.Ctx) error {
	user := GetUserFromContext(c)
	if user == nil {
		return c.Status(401).JSON(fiber.Map{"error": "未登录"})
	}
	return c.JSON(fiber.Map{
		"id":       user.ID,
		"username": user.Username,
		"role":     user.Role,
		"name":     user.Name,
		"phone":    user.Phone,
	})
}

func GetUserFromContext(c *fiber.Ctx) *models.User {
	token := c.Get("Authorization")
	if user, ok := sessions[token]; ok {
		return &user
	}
	return nil
}

func RequireRole(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		user := GetUserFromContext(c)
		if user == nil {
			return c.Status(401).JSON(fiber.Map{"error": "未登录"})
		}
		for _, role := range roles {
			if user.Role == role {
				return c.Next()
			}
		}
		return c.Status(403).JSON(fiber.Map{"error": "权限不足"})
	}
}

func InsertAuditLog(userID int, action, module, detail, ip string) {
	database.DB.Exec("INSERT INTO audit_logs (user_id, action, module, detail, ip_address) VALUES (?, ?, ?, ?, ?)",
		userID, action, module, detail, ip)
}

func SendNotification(userID int, title, content, relatedType string, relatedID int) {
	database.DB.Exec("INSERT INTO notifications (user_id, title, content, type, related_id, related_type) VALUES (?, ?, ?, ?, ?, ?)",
		userID, title, content, "system", relatedID, relatedType)
}

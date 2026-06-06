package handlers

import (
	"cold-chain-system/internal/database"
	"cold-chain-system/internal/middleware"
	"cold-chain-system/internal/models"
	"database/sql"

	"github.com/gofiber/fiber/v2"
)

func Login(c *fiber.Ctx) error {
	var req models.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "请求参数错误"})
	}

	var user models.User
	err := database.DB.QueryRow(
		"SELECT id, username, password, role, name FROM users WHERE username = ?",
		req.Username,
	).Scan(&user.ID, &user.Username, &user.Password, &user.Role, &user.Name)

	if err == sql.ErrNoRows {
		return c.Status(401).JSON(fiber.Map{"error": "用户名或密码错误"})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "数据库错误"})
	}

	if user.Password != req.Password {
		return c.Status(401).JSON(fiber.Map{"error": "用户名或密码错误"})
	}

	token, err := middleware.GenerateToken(user.ID, user.Username, user.Role, user.Name)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "生成令牌失败"})
	}

	return c.JSON(models.LoginResponse{
		Token: token,
		User:  user,
	})
}

func GetCurrentUser(c *fiber.Ctx) error {
	userID := c.Locals("userID").(int64)
	username := c.Locals("username").(string)
	role := c.Locals("userRole").(string)
	name := c.Locals("userName").(string)

	return c.JSON(models.User{
		ID:       userID,
		Username: username,
		Role:     role,
		Name:     name,
	})
}

func GetUsers(c *fiber.Ctx) error {
	rows, err := database.DB.Query("SELECT id, username, role, name, created_at FROM users ORDER BY id")
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "查询失败"})
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		err := rows.Scan(&u.ID, &u.Username, &u.Role, &u.Name, &u.CreatedAt)
		if err != nil {
			continue
		}
		users = append(users, u)
	}

	return c.JSON(users)
}

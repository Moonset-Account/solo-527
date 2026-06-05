package handlers

import (
	"database/sql"
	"net/http"

	"pharmacy-queue/database"
	"pharmacy-queue/middleware"

	"github.com/gofiber/fiber/v2"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string      `json:"token"`
	User  interface{} `json:"user"`
}

func Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	var user struct {
		ID       int    `db:"id"`
		Username string `db:"username"`
		Password string `db:"password"`
		Role     string `db:"role"`
		Name     string `db:"name"`
	}

	err := database.DB.QueryRow(
		"SELECT id, username, password, role, name FROM users WHERE username = ?",
		req.Username,
	).Scan(&user.ID, &user.Username, &user.Password, &user.Role, &user.Name)

	if err == sql.ErrNoRows {
		return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
			"error": "invalid username or password",
		})
	}
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "database error",
		})
	}

	if user.Password != req.Password {
		return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
			"error": "invalid username or password",
		})
	}

	token, err := middleware.GenerateToken(user.ID, user.Username, user.Role, user.Name)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to generate token",
		})
	}

	return c.JSON(LoginResponse{
		Token: token,
		User: fiber.Map{
			"id":       user.ID,
			"username": user.Username,
			"role":     user.Role,
			"name":     user.Name,
		},
	})
}

func GetCurrentUserInfo(c *fiber.Ctx) error {
	user := middleware.GetCurrentUser(c)
	return c.JSON(fiber.Map{
		"id":       user.UserID,
		"username": user.Username,
		"role":     user.Role,
		"name":     user.Name,
	})
}

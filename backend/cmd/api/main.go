package main

import (
	"cold-chain-system/internal/database"
	"cold-chain-system/internal/handlers"
	"cold-chain-system/internal/middleware"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	dbPath := "./cold_chain.db"
	if envPath := os.Getenv("DB_PATH"); envPath != "" {
		dbPath = envPath
	}

	if err := database.InitDB(dbPath); err != nil {
		log.Fatalf("初始化数据库失败: %v", err)
	}
	defer database.Close()

	app := fiber.New(fiber.Config{
		AppName:      "冷链箱周转管理系统 API",
		ReadTimeout:  30 * 1000000000,
		WriteTimeout: 30 * 1000000000,
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	app.Use(logger.New())

	api := app.Group("/api")

	api.Post("/login", handlers.Login)

	auth := api.Group("", middleware.JWTAuth())

	auth.Get("/me", handlers.GetCurrentUser)
	auth.Get("/sites", handlers.GetSites)
	auth.Get("/routes", handlers.GetRoutes)
	auth.Get("/boxes", handlers.GetBoxes)

	auth.Post("/tasks", middleware.RequireRole("dispatcher", "admin"), handlers.CreateTask)
	auth.Get("/tasks", handlers.GetTasks)
	auth.Get("/tasks/:id", handlers.GetTask)
	auth.Post("/tasks/:id/sign", middleware.RequireRole("nurse"), handlers.SignTask)
	auth.Post("/tasks/:id/return", middleware.RequireRole("nurse"), handlers.ReturnTask)
	auth.Post("/tasks/:id/resend", middleware.RequireRole("dispatcher", "admin"), handlers.ResendTask)
	auth.Post("/tasks/:id/review", middleware.RequireRole("admin", "dispatcher"), handlers.ReviewTask)
	auth.Get("/tasks/export/csv", handlers.ExportTasks)

	port := ":8080"
	if envPort := os.Getenv("PORT"); envPort != "" {
		port = ":" + envPort
	}

	log.Printf("服务器启动在 %s", port)
	log.Printf("默认账号:")
	log.Printf("  管理员: admin / password123")
	log.Printf("  调度员: dispatcher1 / password123")
	log.Printf("  护士: nurse1 / password123")

	if err := app.Listen(port); err != nil {
		log.Fatalf("启动服务器失败: %v", err)
	}
}

package main

import (
	"cold-chain-system/internal/database"
	"cold-chain-system/internal/handlers"
	"cold-chain-system/internal/middleware"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	database.InitDB()
	defer database.DB.Close()

	app := fiber.New(fiber.Config{
		BodyLimit: 10 * 1024 * 1024,
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:5173,http://localhost:3000",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: true,
	}))

	app.Use(logger.New())

	api := app.Group("/api")

	api.Post("/auth/login", handlers.Login)

	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware())

	protected.Get("/auth/me", handlers.GetCurrentUser)
	protected.Get("/users", handlers.GetUsers)

	batches := protected.Group("/batches")
	batches.Post("/receive", handlers.ReceiveBatch)
	batches.Get("", handlers.GetBatches)
	batches.Get("/:id", handlers.GetBatch)
	batches.Post("/isolate", handlers.IsolateBatch)
	batches.Post("/:id/restore", handlers.RestoreBatch)
	batches.Get("/expiring", handlers.GetExpiringBatches)
	batches.Get("/abnormal", handlers.GetAbnormalBatches)
	batches.Post("/attachments", handlers.UploadTempAttachment)
	batches.Get("/:batchId/attachments", handlers.GetBatchAttachments)

	attachments := protected.Group("/attachments")
	attachments.Get("/:id/download", handlers.DownloadAttachment)

	handover := protected.Group("/handover")
	handover.Post("", handlers.CreateHandover)
	handover.Get("", handlers.GetHandoverRecords)
	handover.Get("/:id", handlers.GetHandoverRecord)
	handover.Post("/failure", handlers.HandleHandoverFailure)

	protected.Get("/stats/today", handlers.GetTodayStats)

	log.Println("Server starting on :3001")
	log.Fatal(app.Listen(":3001"))
}

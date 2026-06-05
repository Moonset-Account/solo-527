package main

import (
	"log"

	"pharmacy-queue/database"
	"pharmacy-queue/handlers"
	"pharmacy-queue/middleware"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	if err := database.InitDB(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.CloseDB()

	app := fiber.New(fiber.Config{
		AppName: "Pharmacy Queue System API",
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	app.Use(logger.New())

	api := app.Group("/api")

	api.Post("/auth/login", handlers.Login)

	api.Get("/public/prescriptions/:no", handlers.GetPrescriptionPublic)
	api.Get("/public/queue/status", handlers.GetQueueStatusPublic)
	api.Get("/public/windows", handlers.GetWindows)
	api.Post("/public/prescription-items/:item_id/confirm-alternative", handlers.ConfirmAlternativePublic)
	api.Post("/public/prescriptions/:no/cancel", handlers.CancelPrescriptionPublic)

	auth := api.Group("")
	auth.Use(middleware.AuthRequired())

	auth.Get("/auth/me", handlers.GetCurrentUserInfo)

	auth.Post("/prescriptions", middleware.RoleRequired("pharmacist", "admin"), handlers.CreatePrescription)
	auth.Get("/prescriptions", handlers.ListPrescriptions)
	auth.Get("/prescriptions/:no", handlers.GetPrescription)
	auth.Post("/prescriptions/:id/enqueue", middleware.RoleRequired("pharmacist", "admin"), handlers.EnqueuePrescription)
	auth.Post("/prescriptions/:id/cancel", handlers.CancelPrescription)
	auth.Post("/prescriptions/:id/reschedule", handlers.ReschedulePrescription)
	auth.Post("/prescription-items/:item_id/confirm-alternative", middleware.RoleRequired("pharmacist", "admin"), handlers.ConfirmAlternative)

	auth.Post("/window/call-next", middleware.RoleRequired("window", "admin"), handlers.CallNext)
	auth.Post("/window/dispense", middleware.RoleRequired("window", "admin"), handlers.DispensePrescription)
	auth.Get("/queue/status", handlers.GetQueueStatus)
	auth.Get("/windows", handlers.GetWindows)

	auth.Get("/medicines", handlers.GetMedicines)
	auth.Get("/medicines/:medicine_id/batches", handlers.GetMedicineBatches)
	auth.Get("/batches", handlers.GetAllBatches)

	auth.Get("/restock-todos", handlers.GetRestockTodos)
	auth.Post("/restock-todos/:id/complete", middleware.RoleRequired("pharmacist", "admin"), handlers.CompleteRestockTodo)

	auth.Post("/backups", middleware.RoleRequired("admin"), handlers.CreateBackup)
	auth.Get("/backups", middleware.RoleRequired("admin"), handlers.GetBackupRecords)

	auth.Get("/sms-notifications", middleware.RoleRequired("admin"), handlers.GetSmsNotifications)

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"message": "Pharmacy Queue System API is running",
		})
	})

	log.Println("Server starting on :8081")
	log.Fatal(app.Listen(":8081"))
}

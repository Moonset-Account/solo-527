package routes

import (
	"renovation-system/handlers"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	api := app.Group("/api")

	api.Post("/auth/login", handlers.Login)
	api.Post("/auth/logout", handlers.Logout)
	api.Get("/auth/me", handlers.GetCurrentUser)

	api.Get("/teams", handlers.GetTeams)
	api.Get("/holidays", handlers.GetHolidays)
	api.Get("/time-slots", handlers.GetTimeSlotsAPI)
	api.Get("/check-noise-date", handlers.CheckDateNoiseAllowed)
	api.Get("/check-noise-range", handlers.CheckDateRangeNoiseAllowed)

	applications := api.Group("/applications")
	applications.Post("", handlers.CreateApplication)
	applications.Get("", handlers.GetApplications)
	applications.Get("/:id", handlers.GetApplication)
	applications.Put("/:id", handlers.UpdateApplication)
	applications.Post("/:id/review", handlers.RequireRole("admin", "engineer"), handlers.ReviewApplication)

	violations := api.Group("/violations")
	violations.Post("", handlers.RequireRole("admin", "engineer", "gate"), handlers.CreateViolation)
	violations.Get("", handlers.GetViolations)
	violations.Post("/:id/handle", handlers.RequireRole("admin", "engineer"), handlers.HandleViolation)

	gate := api.Group("/gate")
	gate.Post("/verify", handlers.RequireRole("admin", "gate", "engineer"), handlers.VerifyQRCode)
	gate.Get("/records", handlers.RequireRole("admin", "gate"), handlers.GetVerificationRecords)

	notifications := api.Group("/notifications")
	notifications.Get("", handlers.GetNotifications)
	notifications.Post("/:id/read", handlers.MarkNotificationRead)

	audit := api.Group("/audit")
	audit.Get("/logs", handlers.RequireRole("admin"), handlers.GetAuditLogs)
}

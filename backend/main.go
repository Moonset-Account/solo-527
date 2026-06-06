package main

import (
	"log"
	"renovation-system/database"
	"renovation-system/routes"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	app := fiber.New(fiber.Config{
		BodyLimit: 10 * 1024 * 1024,
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	database.InitDB()
	defer database.DB.Close()

	routes.SetupRoutes(app)

	log.Println("Server starting on :3001")
	log.Fatal(app.Listen(":3001"))
}

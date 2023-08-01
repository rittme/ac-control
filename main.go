package main

import (
	"context"
	"time"
	"golang.org/x/exp/slices"
	"github.com/rittme/clim-control/internal/sensor"
	"github.com/rittme/clim-control/internal/command"
	"github.com/rittme/clim-control/internal/scheduler"
  "github.com/gofiber/fiber/v2"
	"github.com/gofiber/template/mustache/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

var VALID_COMMANDS = []string{
	"23C_STRONG", 
	"28C", 
	"smart", 
	"dry", 
	"off",
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	scheduler.Scheduler()
	scheduler.Init(ctx)
	defer scheduler.Stop()

	engine := mustache.New("./web/views", ".mustache")
	app := fiber.New(fiber.Config{
		Views: engine,
	})

	app.Use(recover.New())

	app.Static("/", "./web/public")
	
	app.Get("/", func(c *fiber.Ctx) error {
		readings, _ := sensor.Read()
		
		return c.Render("index", fiber.Map{
			"temperature": readings.Temperature,
			"humidity": readings.Humidity,
		})
	})

	app.Get("/temp", func(c *fiber.Ctx) error {
		readings, err := sensor.Read()
		if err != nil {
			c.Status(fiber.StatusInternalServerError)
			return c.JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		c.Status(fiber.StatusOK)
		return c.JSON(readings)
	})


	type CommandParam struct {
		Command string `json:"command"`
	}
	app.Post("/command", func(c *fiber.Ctx) error {
		body := new(CommandParam)

		if err := c.BodyParser(body); err != nil {
			c.Status(fiber.StatusBadRequest)
			return c.JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		if !slices.Contains(VALID_COMMANDS, body.Command) {
			c.Status(fiber.StatusBadRequest)
			return c.JSON(fiber.Map{
				"error": "Invalid command",
			})
		}

		if command.Exec(body.Command) {
			c.Status(fiber.StatusOK)
			return c.JSON(fiber.Map{
				"message": "Command sent",
			})
		} else {
			c.Status(fiber.StatusInternalServerError)
			return c.JSON(fiber.Map{
				"error": "Failed sending command",
			})
		}
	})

	type ScheduleParam struct {
		Minutes string `json:"minutes"`
	}

	app.Post("/schedule", func(c *fiber.Ctx) error {
		body := new(ScheduleParam)

		if err := c.BodyParser(body); err != nil {
			c.Status(fiber.StatusBadRequest)
			return c.JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		duration, err := time.ParseDuration(body.Minutes + "m")

		if err != nil {
			c.Status(fiber.StatusBadRequest)
			return c.JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		if duration == time.Duration(-1) * time.Minute {
			scheduler.Clear()
			c.Status(fiber.StatusOK)
			return c.JSON(fiber.Map{
				"message": "Done",
			})
		}

		jobDescription, err := scheduler.Schedule(duration, "off")
		if err != nil {
			c.Status(fiber.StatusInternalServerError)
			return c.JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.JSON(fiber.Map{
			"run_at": jobDescription.Run_at.Format(time.RFC3339),
		})
	})

	app.Get("/getschedule", func(c *fiber.Ctx) error {
		jobDescription := scheduler.GetJob()
		return c.JSON(fiber.Map{
			"run_at": jobDescription.Run_at.Format(time.RFC3339),
		})
	})

	app.Listen(":8080")
}



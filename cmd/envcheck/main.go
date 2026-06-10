package main

import "github.com/devops/envcheck/internal/cli"

func main() {
	app := cli.New()
	app.Execute()
}

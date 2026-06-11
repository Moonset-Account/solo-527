package main

import (
	"flag"
	"fmt"
	"os"
	"strings"

	"github.com/envcheck/envcheck/internal/checker"
	"github.com/envcheck/envcheck/internal/config"
	"github.com/envcheck/envcheck/internal/envfile"
	"github.com/envcheck/envcheck/internal/mask"
	"github.com/envcheck/envcheck/internal/report"
)

var version = "1.0.0"

func main() {
	os.Exit(run())
}

func run() int {
	fs := flag.NewFlagSet("envcheck", flag.ExitOnError)

	envFiles := fs.String("env", "", "comma-separated env file paths (e.g. .env,.env.production)")
	exampleFiles := fs.String("example", "", "comma-separated example file paths (e.g. .env.example)")
	maskPatterns := fs.String("mask", "", "comma-separated key patterns for masking sensitive values")
	required := fs.String("required", "", "comma-separated required variable names")
	configFile := fs.String("config", "", "path to config file (JSON)")
	format := fs.String("format", "", "output format: text, json, ci")
	ci := fs.Bool("ci", false, "CI mode: machine-readable output with GitHub Actions annotation format")
	strict := fs.Bool("strict", false, "strict mode: flag variables in env but not in example")
	quiet := fs.Bool("quiet", false, "quiet mode: show only errors and warnings")
	verbose := fs.Bool("verbose", false, "verbose mode: show detailed information")
	showVersion := fs.Bool("version", false, "print version information")
	stdin := fs.Bool("stdin", false, "read env vars from stdin instead of file")

	fs.Usage = func() {
		fmt.Fprintf(os.Stderr, "envcheck - Environment Variable Consistency Checker v%s\n\n", version)
		fmt.Fprintf(os.Stderr, "USAGE:\n")
		fmt.Fprintf(os.Stderr, "  envcheck [OPTIONS]\n\n")
		fmt.Fprintf(os.Stderr, "OPTIONS:\n")
		fs.PrintDefaults()
		fmt.Fprintf(os.Stderr, "\nEXAMPLES:\n")
		fmt.Fprintf(os.Stderr, "  envcheck --env .env --example .env.example\n")
		fmt.Fprintf(os.Stderr, "  envcheck --env .env,.env.prod --required DATABASE_URL,REDIS_URL\n")
		fmt.Fprintf(os.Stderr, "  envcheck --config envcheck.json --ci\n")
		fmt.Fprintf(os.Stderr, "  envcheck --config envcheck.json --format json\n")
		fmt.Fprintf(os.Stderr, "  envcheck --ci --format json  # explicit --format overrides --ci default\n")
		fmt.Fprintf(os.Stderr, "  cat .env | envcheck --stdin --example .env.example\n")
		fmt.Fprintf(os.Stderr, "\nEXIT CODES:\n")
		fmt.Fprintf(os.Stderr, "  0 - All checks passed\n")
		fmt.Fprintf(os.Stderr, "  1 - Errors found (missing required, etc.)\n")
		fmt.Fprintf(os.Stderr, "  2 - Warnings found (no errors)\n")
		fmt.Fprintf(os.Stderr, "  3 - Configuration or runtime error\n")
	}

	fs.Parse(os.Args[1:])

	if *showVersion {
		fmt.Printf("envcheck v%s\n", version)
		return 0
	}

	cfg, err := loadConfig(*configFile)
	if err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		return 3
	}

	ov := config.Override{
		EnvFiles:     splitCSV(*envFiles),
		ExampleFiles: splitCSV(*exampleFiles),
		MaskPatterns: splitCSV(*maskPatterns),
		Required:     splitCSV(*required),
	}
	if *ci {
		ov.CI = ci
		if *format == "" {
			ov.Format = "ci"
		} else {
			ov.Format = *format
		}
	} else {
		if *format != "" {
			ov.Format = *format
		}
	}
	if *strict {
		ov.Strict = strict
	}
	if *quiet {
		ov.Quiet = quiet
	}
	if *verbose {
		ov.Verbose = verbose
	}

	cfg = config.Merge(cfg, ov)

	if err := config.Validate(cfg); err != nil {
		fmt.Fprintf(os.Stderr, "configuration error: %v\n", err)
		return 3
	}

	m := mask.New(cfg.MaskPatterns)
	chk := checker.New(m, cfg.Required, cfg.Strict)

	if *stdin {
		ef, err := envfile.ParseStdin()
		if err != nil {
			fmt.Fprintf(os.Stderr, "error reading stdin: %v\n", err)
			return 3
		}
		chk.AddEnvFile(ef)
	} else {
		for _, path := range cfg.EnvFiles {
			ef, err := envfile.ParseFile(path)
			if err != nil {
				fmt.Fprintf(os.Stderr, "error: %v\n", err)
				return 3
			}
			chk.AddEnvFile(ef)
		}
	}

	for _, path := range cfg.ExampleFiles {
		ef, err := envfile.ParseFile(path)
		if err != nil {
			fmt.Fprintf(os.Stderr, "error: %v\n", err)
			return 3
		}
		chk.AddExampleFile(ef)
	}

	result := chk.Check()

	formatter := report.NewFormatter(cfg.Format, cfg.Quiet, cfg.Verbose)
	if err := formatter.Format(os.Stdout, result); err != nil {
		fmt.Fprintf(os.Stderr, "error formatting output: %v\n", err)
		return 3
	}

	if result.HasErrors {
		return 1
	}
	if result.HasWarnings {
		return 2
	}
	return 0
}

func loadConfig(path string) (*config.Config, error) {
	if path == "" {
		return config.Default(), nil
	}
	return config.LoadFile(path)
}

func splitCSV(s string) []string {
	if s == "" {
		return nil
	}
	parts := strings.Split(s, ",")
	result := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			result = append(result, p)
		}
	}
	if len(result) == 0 {
		return nil
	}
	return result
}

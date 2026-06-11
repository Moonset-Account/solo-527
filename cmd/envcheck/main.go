package main

import (
	"flag"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/envcheck/envcheck/internal/checker"
	"github.com/envcheck/envcheck/internal/config"
	"github.com/envcheck/envcheck/internal/envfile"
	"github.com/envcheck/envcheck/internal/mask"
	"github.com/envcheck/envcheck/internal/report"
)

var version = "1.0.0"

type BoolFlag struct {
	value *bool
}

func NewBoolFlag() *BoolFlag {
	return &BoolFlag{value: nil}
}

func (b *BoolFlag) String() string {
	if b.value == nil {
		return "false"
	}
	return strconv.FormatBool(*b.value)
}

func (b *BoolFlag) Set(s string) error {
	v, err := strconv.ParseBool(s)
	if err != nil {
		return err
	}
	b.value = &v
	return nil
}

func (b *BoolFlag) IsBoolFlag() bool {
	return true
}

func (b *BoolFlag) Get() *bool {
	return b.value
}

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
	ci := NewBoolFlag()
	fs.Var(ci, "ci", "CI mode: machine-readable output with GitHub Actions annotation format")
	strict := NewBoolFlag()
	fs.Var(strict, "strict", "strict mode: flag variables in env but not in example")
	quiet := NewBoolFlag()
	fs.Var(quiet, "quiet", "quiet mode: show only errors and warnings")
	verbose := NewBoolFlag()
	fs.Var(verbose, "verbose", "verbose mode: show detailed information")
	showVersion := NewBoolFlag()
	fs.Var(showVersion, "version", "print version information")
	stdin := NewBoolFlag()
	fs.Var(stdin, "stdin", "read env vars from stdin instead of file")

	fs.Usage = func() {
		fmt.Fprintf(os.Stderr, "envcheck - Environment Variable Consistency Checker v%s\n\n", version)
		fmt.Fprintf(os.Stderr, "USAGE:\n")
		fmt.Fprintf(os.Stderr, "  envcheck [OPTIONS]\n\n")
		fmt.Fprintf(os.Stderr, "OPTIONS:\n")
		fs.PrintDefaults()
		fmt.Fprintf(os.Stderr, "\nEXAMPLES:\n")
		fmt.Fprintf(os.Stderr, "  envcheck --env .env --example .env.example\n")
		fmt.Fprintf(os.Stderr, "  envcheck --env .env,.env.production --required DATABASE_URL,REDIS_URL\n")
		fmt.Fprintf(os.Stderr, "  envcheck --config envcheck.json --ci\n")
		fmt.Fprintf(os.Stderr, "  envcheck --config envcheck.json --ci=false    # override config's ci=true with false\n")
		fmt.Fprintf(os.Stderr, "  envcheck --config envcheck.json --format json\n")
		fmt.Fprintf(os.Stderr, "  envcheck --ci --format json    # --format overrides --ci default output\n")
		fmt.Fprintf(os.Stderr, "  cat .env | envcheck --stdin --example .env.example\n")
		fmt.Fprintf(os.Stderr, "\nPRIORITY:\n")
		fmt.Fprintf(os.Stderr, "  CLI flags > config file > defaults\n")
		fmt.Fprintf(os.Stderr, "  Boolean flags can be set to false: --ci=false, --strict=false, etc.\n")
		fmt.Fprintf(os.Stderr, "  Explicit --format always wins; --ci without --format defaults to ci output\n")
		fmt.Fprintf(os.Stderr, "\nEXIT CODES:\n")
		fmt.Fprintf(os.Stderr, "  0 - All checks passed\n")
		fmt.Fprintf(os.Stderr, "  1 - Errors found (missing required, etc.)\n")
		fmt.Fprintf(os.Stderr, "  2 - Warnings found (no errors)\n")
		fmt.Fprintf(os.Stderr, "  3 - Configuration or runtime error\n")
	}

	fs.Parse(os.Args[1:])

	showVersionVal := showVersion.Get()
	if showVersionVal != nil && *showVersionVal {
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
		CI:           ci.Get(),
		Strict:       strict.Get(),
		Quiet:        quiet.Get(),
		Verbose:      verbose.Get(),
	}
	if *format != "" {
		ov.Format = *format
	}

	cfg = config.Merge(cfg, ov)
	config.Resolve(cfg)

	if err := config.Validate(cfg); err != nil {
		fmt.Fprintf(os.Stderr, "configuration error: %v\n", err)
		return 3
	}

	m := mask.New(cfg.MaskPatterns)
	chk := checker.New(m, cfg.Required, cfg.Strict)

	stdinVal := stdin.Get()
	if stdinVal != nil && *stdinVal {
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

package cli

import (
	"flag"
	"fmt"
	"io"
	"strconv"
	"strings"
	"time"
)

var (
	Version = "0.1.0"
	Build   = "dev"
)

func ParseDuration(s string) (time.Duration, error) {
	s = strings.TrimSpace(strings.ToLower(s))
	if s == "" {
		return 0, nil
	}
	if d, err := time.ParseDuration(s); err == nil {
		return d, nil
	}
	multipliers := map[byte]time.Duration{
		's': time.Second,
		'm': time.Minute,
		'h': time.Hour,
		'd': 24 * time.Hour,
		'w': 7 * 24 * time.Hour,
	}
	for suf, mult := range multipliers {
		if strings.HasSuffix(s, string(suf)) {
			numStr := s[:len(s)-1]
			n, err := strconv.ParseFloat(numStr, 64)
			if err == nil {
				return time.Duration(float64(mult) * n), nil
			}
		}
	}
	return 0, fmt.Errorf("invalid duration %q; use values like 30m, 2h, 1d, 1w", s)
}

func ParseTime(s string) (time.Time, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return time.Time{}, nil
	}
	layouts := []string{
		time.RFC3339,
		time.RFC3339Nano,
		"2006-01-02T15:04:05",
		"2006-01-02 15:04:05",
		"2006-01-02",
		"2006/01/02 15:04:05",
		"2006/01/02",
	}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, s); err == nil {
			return t, nil
		}
		if t, err := time.ParseInLocation(layout, s, time.Local); err == nil {
			return t, nil
		}
	}
	return time.Time{}, fmt.Errorf("invalid time %q; use RFC3339, YYYY-MM-DD HH:MM:SS, or YYYY-MM-DD", s)
}

type Parser struct {
	flagSet   *flag.FlagSet
	cfg       *Config
	errOut    io.Writer
	sinceStr  *string
	untilStr  *string
	formatStr *string
}

func NewParser(name string, errOut io.Writer) *Parser {
	p := &Parser{
		flagSet:   flag.NewFlagSet(name, flag.ContinueOnError),
		cfg:       DefaultConfig(),
		errOut:    errOut,
		sinceStr:  new(string),
		untilStr:  new(string),
		formatStr: new(string),
	}
	p.flagSet.SetOutput(errOut)
	p.registerFlags()
	return p
}

func (p *Parser) registerFlags() {
	fs := p.flagSet
	cfg := p.cfg

	fs.BoolVar(&cfg.HelpFlag, "help", false, "Show help message")
	fs.BoolVar(&cfg.HelpFlag, "h", false, "Show help message (shorthand)")
	fs.BoolVar(&cfg.VersionFlag, "version", false, "Show version information")
	fs.BoolVar(&cfg.VersionFlag, "v", false, "Show version information (shorthand)")

	fs.Var((*commaList)(&cfg.Services), "service", "Filter by service name (comma-separated, repeatable). Example: --service api-gateway,user-svc")
	fs.Var((*commaList)(&cfg.Services), "s", "Filter by service name (shorthand)")

	fs.Var(durationValue{&cfg.Since}, "since", "Look back duration. Examples: 30m, 2h, 1d, 1w")

	fs.StringVar(p.sinceStr, "since-time", "", "Absolute start time (RFC3339 or YYYY-MM-DD HH:MM:SS)")
	fs.StringVar(p.untilStr, "until", "", "Absolute end time (RFC3339 or YYYY-MM-DD HH:MM:SS)")

	fs.Var((*commaList)(&cfg.Levels), "level", "Filter by log level (comma-separated): DEBUG,INFO,WARN,ERROR,FATAL")
	fs.Var((*commaList)(&cfg.Environments), "env", "Filter by environment (comma-separated): prod,staging,dev")
	fs.Var((*commaList)(&cfg.RequestIDs), "request-id", "Filter by request ID or trace ID (comma-separated)")

	fs.StringVar(p.formatStr, "format", "text", "Output format: text or json")
	fs.StringVar(p.formatStr, "f", "text", "Output format (shorthand)")
	fs.BoolVar(&cfg.JSONFlag, "json", false, "Shorthand for --format json")
	fs.BoolVar(&cfg.JSONFlag, "j", false, "Shorthand for --format json (shorthand)")

	fs.StringVar(&cfg.Output, "output", "", "Write output to file instead of stdout")
	fs.StringVar(&cfg.Output, "o", "", "Write output to file (shorthand)")

	fs.IntVar(&cfg.TopN, "top", 10, "Show top N error clusters (default 10)")
	fs.IntVar(&cfg.TopN, "n", 10, "Show top N error clusters (shorthand)")

	fs.IntVar(&cfg.Context, "context", 2, "Lines of context before/after each match")
	fs.IntVar(&cfg.Context, "C", 2, "Lines of context (shorthand)")

	fs.BoolVar(&cfg.Clusters, "clusters", true, "Enable error clustering")
	fs.BoolVar(&cfg.OnlyErrors, "errors-only", true, "Only report entries at ERROR or FATAL level")
	fs.BoolVar(&cfg.OnlyErrors, "e", true, "Only report errors (shorthand)")

	fs.BoolVar(&cfg.Verbose, "verbose", false, "Enable verbose output (debug logs)")
	fs.BoolVar(&cfg.Quiet, "quiet", false, "Suppress all non-essential output")
	fs.BoolVar(&cfg.Quiet, "q", false, "Suppress all non-essential output (shorthand)")

	fs.BoolVar(&cfg.FailOnError, "fail-on-errors", false, "Exit with code 99 if any errors are found")

	fs.Usage = func() {
		io.WriteString(p.errOut, FullHelpText())
	}
}

func (p *Parser) Parse(args []string) (*Config, error) {
	cleanArgs, stdinTokens := preprocessArgs(args)
	if err := p.flagSet.Parse(cleanArgs); err != nil {
		return nil, err
	}
	cfg := p.cfg
	cfg.Inputs = append(p.flagSet.Args(), stdinTokens...)

	if *p.formatStr != "" {
		cfg.Format = OutputFormat(strings.ToLower(*p.formatStr))
	} else {
		cfg.Format = FormatText
	}
	if cfg.JSONFlag {
		cfg.Format = FormatJSON
	}
	if *p.sinceStr != "" {
		t, err := ParseTime(*p.sinceStr)
		if err != nil {
			return cfg, &ArgumentError{Flag: "since-time", Message: err.Error(), Err: err}
		}
		cfg.SinceTime = t
	}
	if *p.untilStr != "" {
		t, err := ParseTime(*p.untilStr)
		if err != nil {
			return cfg, &ArgumentError{Flag: "until", Message: err.Error(), Err: err}
		}
		cfg.UntilTime = t
	}

	return cfg, nil
}

func preprocessArgs(args []string) ([]string, []string) {
	stdin := make([]string, 0, 1)
	clean := make([]string, 0, len(args))
	for _, a := range args {
		if a == "-" {
			stdin = append(stdin, a)
		} else {
			clean = append(clean, a)
		}
	}
	return clean, stdin
}

func ParseArgs(args []string, errOut io.Writer) (*Config, error) {
	p := NewParser("logsum", errOut)
	cfg, err := p.Parse(args)
	if err != nil {
		return nil, err
	}
	if err := cfg.Validate(); err != nil && !cfg.HelpFlag && !cfg.VersionFlag {
		return cfg, err
	}
	return cfg, nil
}

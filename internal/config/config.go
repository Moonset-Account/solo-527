package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"logsum/internal/types"

	"github.com/spf13/pflag"
)

type Config struct {
	InputPaths     []string
	Since          time.Time
	Until          time.Time
	Services       []string
	Levels         []types.LogLevel
	RequestIDs     []string
	Environment    string
	TopN           int
	OutputJSON     bool
	NoColor        bool
	Verbose        bool
	ConfigFile     string
	ContextLines   int
	MinClusterSize int
	OutputPath     string
	CIOutput       bool
}

type fileConfig struct {
	InputPaths     []string `json:"input_paths"`
	Since          string   `json:"since"`
	Until          string   `json:"until"`
	Services       []string `json:"services"`
	Levels         []string `json:"levels"`
	RequestIDs     []string `json:"request_ids"`
	Environment    string   `json:"environment"`
	TopN           int      `json:"top_n"`
	ContextLines   int      `json:"context_lines"`
	MinClusterSize int      `json:"min_cluster_size"`
	Color          *bool    `json:"color"`
	Verbose        *bool    `json:"verbose"`
}

func Load() (*Config, error) {
	cfg := &Config{
		TopN:           10,
		ContextLines:   3,
		MinClusterSize: 1,
	}

	fs := pflag.NewFlagSet("logsum", pflag.ContinueOnError)
	fs.StringSliceVar(&cfg.InputPaths, "input", nil, "Log file paths or directories (comma-separated)")
	fs.String("since", "", "Time range start (e.g., 1h, 24h, 2024-01-01T00:00:00Z)")
	fs.String("until", "", "Time range end (e.g., now, 2024-01-02T00:00:00Z)")
	fs.StringSliceVar(&cfg.Services, "service", nil, "Filter by service name (comma-separated)")
	fs.StringSliceVar(&cfg.RequestIDs, "request-id", nil, "Filter by request ID (comma-separated)")
	fs.StringVar(&cfg.Environment, "env", "", "Filter by environment")
	fs.IntVar(&cfg.TopN, "top", 10, "Show top N error clusters")
	fs.BoolVar(&cfg.OutputJSON, "json", false, "Output in JSON format")
	fs.BoolVar(&cfg.NoColor, "no-color", false, "Disable colored output")
	fs.BoolVar(&cfg.Verbose, "verbose", false, "Enable verbose output")
	fs.StringVar(&cfg.ConfigFile, "config", "", "Path to config file")
	fs.IntVar(&cfg.ContextLines, "context", 3, "Number of context lines around errors")
	fs.IntVar(&cfg.MinClusterSize, "min-cluster", 1, "Minimum cluster size to include")
	fs.StringVar(&cfg.OutputPath, "output", "", "Write output to file")
	fs.BoolVar(&cfg.CIOutput, "ci", false, "CI-friendly output with stable exit codes")

	fs.ParseErrorsWhitelist.UnknownFlags = false
	fs.SetInterspersed(false)

	if err := fs.Parse(os.Args[1:]); err != nil {
		return nil, &types.ProcessError{
			Code:       "CONFIG_PARSE_FAILED",
			Message:    fmt.Sprintf("Failed to parse command line arguments: %v", err),
			Suggestion: "Check command line arguments for typos or use --help",
		}
	}

	if cfg.ConfigFile != "" {
		if err := loadConfigFile(cfg, cfg.ConfigFile); err != nil {
			return nil, err
		}
	} else if defPath := defaultConfigPath(); defPath != "" {
		if _, err := os.Stat(defPath); err == nil {
			if err := loadConfigFile(cfg, defPath); err != nil {
				return nil, err
			}
		}
	}

	loadEnvVars(cfg)

	var err error
	cfg.Since, err = parseTimeFlag(fs, "since")
	if err != nil {
		return nil, err
	}
	cfg.Until, err = parseTimeFlag(fs, "until")
	if err != nil {
		return nil, err
	}

	if cfg.Until.IsZero() {
		cfg.Until = time.Now()
	}

	levelsStr, _ := fs.GetStringSlice("level")
	for _, l := range levelsStr {
		cfg.Levels = append(cfg.Levels, types.LogLevel(strings.ToUpper(l)))
	}
	if len(cfg.Levels) == 0 {
		cfg.Levels = []types.LogLevel{types.LevelError, types.LevelFatal, types.LevelWarn}
	}

	if err := validateConfig(cfg); err != nil {
		return nil, err
	}

	return cfg, nil
}

func defaultConfigPath() string {
	if home, err := os.UserHomeDir(); err == nil {
		return filepath.Join(home, ".logsum", "config.json")
	}
	return ""
}

func loadConfigFile(cfg *Config, path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return &types.ProcessError{
			Code:       "CONFIG_READ_FAILED",
			Message:    fmt.Sprintf("Failed to read config file %s: %v", path, err),
			Suggestion: "Ensure the config file exists and is readable",
			Details:    map[string]interface{}{"path": path},
		}
	}

	var fc fileConfig
	if err := json.Unmarshal(data, &fc); err != nil {
		return &types.ProcessError{
			Code:       "CONFIG_PARSE_ERROR",
			Message:    fmt.Sprintf("Failed to parse config file %s: %v", path, err),
			Suggestion: "Check that the config file contains valid JSON",
			Details:    map[string]interface{}{"path": path},
		}
	}

	if len(fc.InputPaths) > 0 && len(cfg.InputPaths) == 0 {
		cfg.InputPaths = fc.InputPaths
	}
	if fc.Since != "" && cfg.Since.IsZero() {
		if t, err := parseTimeString(fc.Since); err == nil {
			cfg.Since = t
		}
	}
	if fc.Until != "" && cfg.Until.IsZero() {
		if t, err := parseTimeString(fc.Until); err == nil {
			cfg.Until = t
		}
	}
	if len(fc.Services) > 0 && len(cfg.Services) == 0 {
		cfg.Services = fc.Services
	}
	if len(fc.Levels) > 0 && len(cfg.Levels) == 0 {
		for _, l := range fc.Levels {
			cfg.Levels = append(cfg.Levels, types.LogLevel(strings.ToUpper(l)))
		}
	}
	if len(fc.RequestIDs) > 0 && len(cfg.RequestIDs) == 0 {
		cfg.RequestIDs = fc.RequestIDs
	}
	if fc.Environment != "" && cfg.Environment == "" {
		cfg.Environment = fc.Environment
	}
	if fc.TopN > 0 && cfg.TopN == 10 {
		cfg.TopN = fc.TopN
	}
	if fc.ContextLines > 0 && cfg.ContextLines == 3 {
		cfg.ContextLines = fc.ContextLines
	}
	if fc.MinClusterSize > 0 && cfg.MinClusterSize == 1 {
		cfg.MinClusterSize = fc.MinClusterSize
	}
	if fc.Color != nil && !cfg.NoColor {
		cfg.NoColor = !*fc.Color
	}
	if fc.Verbose != nil && !cfg.Verbose {
		cfg.Verbose = *fc.Verbose
	}

	return nil
}

func loadEnvVars(cfg *Config) {
	if v := os.Getenv("LOGSUM_SINCE"); v != "" && cfg.Since.IsZero() {
		if t, err := parseTimeString(v); err == nil {
			cfg.Since = t
		}
	}
	if v := os.Getenv("LOGSUM_UNTIL"); v != "" && cfg.Until.IsZero() {
		if t, err := parseTimeString(v); err == nil {
			cfg.Until = t
		}
	}
	if v := os.Getenv("LOGSUM_SERVICES"); v != "" && len(cfg.Services) == 0 {
		cfg.Services = strings.Split(v, ",")
	}
	if v := os.Getenv("LOGSUM_ENV"); v != "" && cfg.Environment == "" {
		cfg.Environment = v
	}
	if v := os.Getenv("LOGSUM_NO_COLOR"); v != "" {
		cfg.NoColor = true
	}
	if v := os.Getenv("LOGSUM_CI"); v != "" {
		cfg.CIOutput = true
	}
}

func parseTimeFlag(fs *pflag.FlagSet, name string) (time.Time, error) {
	val, err := fs.GetString(name)
	if err != nil || val == "" {
		return time.Time{}, nil
	}
	return parseTimeString(val)
}

func parseTimeString(s string) (time.Time, error) {
	if t, err := time.Parse(time.RFC3339, s); err == nil {
		return t, nil
	}
	if t, err := time.Parse("2006-01-02", s); err == nil {
		return t, nil
	}

	if strings.HasSuffix(s, "h") {
		d, err := time.ParseDuration(s)
		if err == nil {
			return time.Now().Add(-d), nil
		}
	}
	if strings.HasSuffix(s, "m") {
		d, err := time.ParseDuration(s)
		if err == nil {
			return time.Now().Add(-d), nil
		}
	}
	if strings.HasSuffix(s, "d") {
		daysStr := strings.TrimSuffix(s, "d")
		days := 0
		fmt.Sscanf(daysStr, "%d", &days)
		if days > 0 {
			return time.Now().AddDate(0, 0, -days), nil
		}
	}
	if s == "now" {
		return time.Now(), nil
	}

	return time.Time{}, &types.ProcessError{
		Code:       "INVALID_TIME_FORMAT",
		Message:    fmt.Sprintf("Invalid time format: %s", s),
		Suggestion: "Use RFC3339 format (2024-01-01T00:00:00Z), duration (1h, 30m, 7d), or 'now'",
		Details:    map[string]interface{}{"value": s},
	}
}

func validateConfig(cfg *Config) error {
	if len(cfg.InputPaths) == 0 {
		cwd, _ := os.Getwd()
		cfg.InputPaths = []string{cwd}
	}

	if !cfg.Since.IsZero() && !cfg.Until.IsZero() && cfg.Since.After(cfg.Until) {
		return &types.ProcessError{
			Code:       "INVALID_TIME_RANGE",
			Message:    "Start time is after end time",
			Suggestion: "Swap --since and --until values, or check the time range",
			Details: map[string]interface{}{
				"since": cfg.Since.Format(time.RFC3339),
				"until": cfg.Until.Format(time.RFC3339),
			},
		}
	}

	if cfg.TopN <= 0 {
		return &types.ProcessError{
			Code:       "INVALID_TOP_N",
			Message:    fmt.Sprintf("Top N must be positive, got %d", cfg.TopN),
			Suggestion: "Set --top to a positive integer value",
		}
	}

	if cfg.ContextLines < 0 {
		return &types.ProcessError{
			Code:       "INVALID_CONTEXT",
			Message:    fmt.Sprintf("Context lines must be non-negative, got %d", cfg.ContextLines),
			Suggestion: "Set --context to a non-negative integer value",
		}
	}

	return nil
}

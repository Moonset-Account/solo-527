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
	TopN           *int     `json:"top_n"`
	ContextLines   *int     `json:"context_lines"`
	MinClusterSize *int     `json:"min_cluster_size"`
	Color          *bool    `json:"color"`
	Verbose        *bool    `json:"verbose"`
}

type cliArgs struct {
	inputPaths     []string
	since          string
	until          string
	services       []string
	requestIDs     []string
	environment    string
	topN           int
	outputJSON     bool
	noColor        bool
	verbose        bool
	configFile     string
	contextLines   int
	minClusterSize int
	outputPath     string
	ciOutput       bool
	levels         []string
}

func Load() (*Config, error) {
	cfg := &Config{
		TopN:           10,
		ContextLines:   3,
		MinClusterSize: 1,
	}

	configFile, err := parseConfigFileArg()
	if err != nil {
		return nil, err
	}
	cfg.ConfigFile = configFile

	loadedFromFile, err := applyConfigFile(cfg, configFile)
	if err != nil {
		return nil, err
	}

	loadedFromEnv, err := applyEnvVars(cfg)
	if err != nil {
		return nil, err
	}

	cli, err := parseCLIArgs()
	if err != nil {
		return nil, err
	}

	if err := applyCLIArgs(cfg, cli); err != nil {
		return nil, err
	}

	if cfg.Until.IsZero() {
		cfg.Until = time.Now()
	}

	if len(cfg.Levels) == 0 {
		cfg.Levels = []types.LogLevel{types.LevelError, types.LevelFatal, types.LevelWarn}
	}

	if err := validateConfig(cfg); err != nil {
		return nil, err
	}

	if cfg.Verbose {
		fmt.Fprintf(os.Stderr, "[DEBUG] Config loaded:\n")
		fmt.Fprintf(os.Stderr, "  Config file: %s (loaded: %v)\n", cfg.ConfigFile, loadedFromFile)
		fmt.Fprintf(os.Stderr, "  Env vars applied: %v\n", loadedFromEnv)
		fmt.Fprintf(os.Stderr, "  Input paths: %v\n", cfg.InputPaths)
		fmt.Fprintf(os.Stderr, "  Since: %v\n", cfg.Since)
		fmt.Fprintf(os.Stderr, "  Until: %v\n", cfg.Until)
		fmt.Fprintf(os.Stderr, "  Services: %v\n", cfg.Services)
	}

	return cfg, nil
}

func parseConfigFileArg() (string, error) {
	for i, arg := range os.Args[1:] {
		if arg == "--config" {
			if i+2 <= len(os.Args[1:]) {
				return os.Args[i+2], nil
			}
			return "", &types.ProcessError{
				Code:       "CONFIG_MISSING_VALUE",
				Message:    "--config requires a value",
				Suggestion: "Provide a path to the config file: --config /path/to/config.json",
			}
		}
		if strings.HasPrefix(arg, "--config=") {
			return strings.TrimPrefix(arg, "--config="), nil
		}
	}
	return "", nil
}

func applyConfigFile(cfg *Config, configFile string) (bool, error) {
	path := configFile
	if path == "" {
		defPath := defaultConfigPath()
		if defPath == "" {
			return false, nil
		}
		if _, err := os.Stat(defPath); err != nil {
			return false, nil
		}
		path = defPath
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return false, &types.ProcessError{
			Code:       "CONFIG_READ_FAILED",
			Message:    fmt.Sprintf("Failed to read config file %s: %v", path, err),
			Suggestion: "Ensure the config file exists and is readable",
			Details:    map[string]interface{}{"path": path},
		}
	}

	var fc fileConfig
	if err := json.Unmarshal(data, &fc); err != nil {
		return false, &types.ProcessError{
			Code:       "CONFIG_PARSE_ERROR",
			Message:    fmt.Sprintf("Failed to parse config file %s: %v", path, err),
			Suggestion: "Check that the config file contains valid JSON",
			Details:    map[string]interface{}{"path": path},
		}
	}

	if len(fc.InputPaths) > 0 {
		cfg.InputPaths = fc.InputPaths
	}
	if fc.Since != "" {
		if t, err := parseTimeString(fc.Since); err == nil {
			cfg.Since = t
		} else {
			return false, &types.ProcessError{
				Code:       "INVALID_TIME_FORMAT",
				Message:    fmt.Sprintf("Invalid 'since' value in config file: %v", err),
				Suggestion: "Use RFC3339 format (2024-01-01T00:00:00Z), duration (1h, 30m, 7d), or 'now'",
				Details:    map[string]interface{}{"value": fc.Since, "source": "config_file"},
			}
		}
	}
	if fc.Until != "" {
		if t, err := parseTimeString(fc.Until); err == nil {
			cfg.Until = t
		} else {
			return false, &types.ProcessError{
				Code:       "INVALID_TIME_FORMAT",
				Message:    fmt.Sprintf("Invalid 'until' value in config file: %v", err),
				Suggestion: "Use RFC3339 format (2024-01-01T00:00:00Z), duration (1h, 30m, 7d), or 'now'",
				Details:    map[string]interface{}{"value": fc.Until, "source": "config_file"},
			}
		}
	}
	if len(fc.Services) > 0 {
		cfg.Services = fc.Services
	}
	if len(fc.Levels) > 0 {
		cfg.Levels = nil
		for _, l := range fc.Levels {
			cfg.Levels = append(cfg.Levels, types.LogLevel(strings.ToUpper(l)))
		}
	}
	if len(fc.RequestIDs) > 0 {
		cfg.RequestIDs = fc.RequestIDs
	}
	if fc.Environment != "" {
		cfg.Environment = fc.Environment
	}
	if fc.TopN != nil && *fc.TopN > 0 {
		cfg.TopN = *fc.TopN
	}
	if fc.ContextLines != nil && *fc.ContextLines >= 0 {
		cfg.ContextLines = *fc.ContextLines
	}
	if fc.MinClusterSize != nil && *fc.MinClusterSize > 0 {
		cfg.MinClusterSize = *fc.MinClusterSize
	}
	if fc.Color != nil {
		cfg.NoColor = !*fc.Color
	}
	if fc.Verbose != nil {
		cfg.Verbose = *fc.Verbose
	}

	return true, nil
}

func applyEnvVars(cfg *Config) (bool, error) {
	applied := false

	if v := os.Getenv("LOGSUM_INPUT"); v != "" {
		cfg.InputPaths = strings.Split(v, ",")
		applied = true
	}
	if v := os.Getenv("LOGSUM_SINCE"); v != "" {
		if t, err := parseTimeString(v); err == nil {
			cfg.Since = t
			applied = true
		} else {
			return applied, &types.ProcessError{
				Code:       "INVALID_TIME_FORMAT",
				Message:    fmt.Sprintf("Invalid LOGSUM_SINCE value: %v", err),
				Suggestion: "Use RFC3339 format (2024-01-01T00:00:00Z), duration (1h, 30m, 7d), or 'now'",
				Details:    map[string]interface{}{"value": v, "source": "environment"},
			}
		}
	}
	if v := os.Getenv("LOGSUM_UNTIL"); v != "" {
		if t, err := parseTimeString(v); err == nil {
			cfg.Until = t
			applied = true
		} else {
			return applied, &types.ProcessError{
				Code:       "INVALID_TIME_FORMAT",
				Message:    fmt.Sprintf("Invalid LOGSUM_UNTIL value: %v", err),
				Suggestion: "Use RFC3339 format (2024-01-01T00:00:00Z), duration (1h, 30m, 7d), or 'now'",
				Details:    map[string]interface{}{"value": v, "source": "environment"},
			}
		}
	}
	if v := os.Getenv("LOGSUM_SERVICES"); v != "" {
		cfg.Services = strings.Split(v, ",")
		applied = true
	}
	if v := os.Getenv("LOGSUM_REQUEST_IDS"); v != "" {
		cfg.RequestIDs = strings.Split(v, ",")
		applied = true
	}
	if v := os.Getenv("LOGSUM_ENV"); v != "" {
		cfg.Environment = v
		applied = true
	}
	if v := os.Getenv("LOGSUM_TOP"); v != "" {
		var n int
		if _, err := fmt.Sscanf(v, "%d", &n); err == nil && n > 0 {
			cfg.TopN = n
			applied = true
		}
	}
	if v := os.Getenv("LOGSUM_CONTEXT"); v != "" {
		var n int
		if _, err := fmt.Sscanf(v, "%d", &n); err == nil && n >= 0 {
			cfg.ContextLines = n
			applied = true
		}
	}
	if v := os.Getenv("LOGSUM_MIN_CLUSTER"); v != "" {
		var n int
		if _, err := fmt.Sscanf(v, "%d", &n); err == nil && n > 0 {
			cfg.MinClusterSize = n
			applied = true
		}
	}
	if os.Getenv("LOGSUM_OUTPUT_JSON") != "" || os.Getenv("LOGSUM_JSON") != "" {
		cfg.OutputJSON = true
		applied = true
	}
	if os.Getenv("LOGSUM_NO_COLOR") != "" {
		cfg.NoColor = true
		applied = true
	}
	if os.Getenv("LOGSUM_VERBOSE") != "" {
		cfg.Verbose = true
		applied = true
	}
	if os.Getenv("LOGSUM_CI") != "" {
		cfg.CIOutput = true
		applied = true
	}
	if v := os.Getenv("LOGSUM_OUTPUT"); v != "" {
		cfg.OutputPath = v
		applied = true
	}

	return applied, nil
}

func parseCLIArgs() (*cliArgs, error) {
	cli := &cliArgs{
		topN:           -1,
		contextLines:   -1,
		minClusterSize: -1,
	}

	fs := pflag.NewFlagSet("logsum", pflag.ContinueOnError)
	fs.StringSliceVar(&cli.inputPaths, "input", nil, "")
	fs.StringVar(&cli.since, "since", "", "")
	fs.StringVar(&cli.until, "until", "", "")
	fs.StringSliceVar(&cli.services, "service", nil, "")
	fs.StringSliceVar(&cli.requestIDs, "request-id", nil, "")
	fs.StringVar(&cli.environment, "env", "", "")
	fs.IntVar(&cli.topN, "top", -1, "")
	fs.BoolVar(&cli.outputJSON, "json", false, "")
	fs.BoolVar(&cli.noColor, "no-color", false, "")
	fs.BoolVar(&cli.verbose, "verbose", false, "")
	fs.StringVar(&cli.configFile, "config", "", "")
	fs.IntVar(&cli.contextLines, "context", -1, "")
	fs.IntVar(&cli.minClusterSize, "min-cluster", -1, "")
	fs.StringVar(&cli.outputPath, "output", "", "")
	fs.BoolVar(&cli.ciOutput, "ci", false, "")
	fs.StringSliceVar(&cli.levels, "level", nil, "")

	fs.ParseErrorsWhitelist.UnknownFlags = false
	fs.SetInterspersed(false)

	if err := fs.Parse(os.Args[1:]); err != nil {
		return nil, &types.ProcessError{
			Code:       "CONFIG_PARSE_FAILED",
			Message:    fmt.Sprintf("Failed to parse command line arguments: %v", err),
			Suggestion: "Check command line arguments for typos or use --help",
		}
	}

	return cli, nil
}

func applyCLIArgs(cfg *Config, cli *cliArgs) error {
	if len(cli.inputPaths) > 0 {
		cfg.InputPaths = cli.inputPaths
	}
	if cli.since != "" {
		if t, err := parseTimeString(cli.since); err == nil {
			cfg.Since = t
		} else {
			return &types.ProcessError{
				Code:       "INVALID_TIME_FORMAT",
				Message:    fmt.Sprintf("Invalid --since value: %v", err),
				Suggestion: "Use RFC3339 format (2024-01-01T00:00:00Z), duration (1h, 30m, 7d), or 'now'",
				Details:    map[string]interface{}{"value": cli.since, "source": "cli"},
			}
		}
	}
	if cli.until != "" {
		if t, err := parseTimeString(cli.until); err == nil {
			cfg.Until = t
		} else {
			return &types.ProcessError{
				Code:       "INVALID_TIME_FORMAT",
				Message:    fmt.Sprintf("Invalid --until value: %v", err),
				Suggestion: "Use RFC3339 format (2024-01-01T00:00:00Z), duration (1h, 30m, 7d), or 'now'",
				Details:    map[string]interface{}{"value": cli.until, "source": "cli"},
			}
		}
	}
	if len(cli.services) > 0 {
		cfg.Services = cli.services
	}
	if len(cli.requestIDs) > 0 {
		cfg.RequestIDs = cli.requestIDs
	}
	if cli.environment != "" {
		cfg.Environment = cli.environment
	}
	if cli.topN > 0 {
		cfg.TopN = cli.topN
	}
	if cli.outputJSON {
		cfg.OutputJSON = true
	}
	if cli.noColor {
		cfg.NoColor = true
	}
	if cli.verbose {
		cfg.Verbose = true
	}
	if cli.contextLines >= 0 {
		cfg.ContextLines = cli.contextLines
	}
	if cli.minClusterSize > 0 {
		cfg.MinClusterSize = cli.minClusterSize
	}
	if cli.outputPath != "" {
		cfg.OutputPath = cli.outputPath
	}
	if cli.ciOutput {
		cfg.CIOutput = true
	}
	if len(cli.levels) > 0 {
		cfg.Levels = nil
		for _, l := range cli.levels {
			cfg.Levels = append(cfg.Levels, types.LogLevel(strings.ToUpper(l)))
		}
	}
	return nil
}

func defaultConfigPath() string {
	if home, err := os.UserHomeDir(); err == nil {
		return filepath.Join(home, ".logsum", "config.json")
	}
	return ""
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

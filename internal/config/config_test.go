package config

import (
	"os"
	"testing"
	"time"

	"logsum/internal/types"
)

func TestParseTimeString(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantErr bool
		check   func(t *testing.T, result time.Time)
	}{
		{
			name:    "RFC3339 format",
			input:   "2024-01-15T10:30:00Z",
			wantErr: false,
			check: func(t *testing.T, result time.Time) {
				expected, _ := time.Parse(time.RFC3339, "2024-01-15T10:30:00Z")
				if !result.Equal(expected) {
					t.Errorf("got %v, want %v", result, expected)
				}
			},
		},
		{
			name:    "date only format",
			input:   "2024-01-15",
			wantErr: false,
			check: func(t *testing.T, result time.Time) {
				expected, _ := time.Parse("2006-01-02", "2024-01-15")
				if !result.Equal(expected) {
					t.Errorf("got %v, want %v", result, expected)
				}
			},
		},
		{
			name:    "hours duration",
			input:   "2h",
			wantErr: false,
			check: func(t *testing.T, result time.Time) {
				expected := time.Now().Add(-2 * time.Hour)
				diff := result.Sub(expected)
				if diff.Abs() > time.Minute {
					t.Errorf("got %v, expected close to %v", result, expected)
				}
			},
		},
		{
			name:    "minutes duration",
			input:   "30m",
			wantErr: false,
			check: func(t *testing.T, result time.Time) {
				expected := time.Now().Add(-30 * time.Minute)
				diff := result.Sub(expected)
				if diff.Abs() > time.Minute {
					t.Errorf("got %v, expected close to %v", result, expected)
				}
			},
		},
		{
			name:    "days duration",
			input:   "7d",
			wantErr: false,
			check: func(t *testing.T, result time.Time) {
				expected := time.Now().AddDate(0, 0, -7)
				diff := result.Sub(expected)
				if diff.Abs() > 24*time.Hour {
					t.Errorf("got %v, expected close to %v", result, expected)
				}
			},
		},
		{
			name:    "now keyword",
			input:   "now",
			wantErr: false,
			check: func(t *testing.T, result time.Time) {
				diff := result.Sub(time.Now())
				if diff.Abs() > time.Minute {
					t.Errorf("got %v, expected close to now", result)
				}
			},
		},
		{
			name:    "invalid format",
			input:   "not-a-time",
			wantErr: true,
		},
		{
			name:    "invalid duration",
			input:   "5x",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := parseTimeString(tt.input)
			if tt.wantErr {
				if err == nil {
					t.Error("expected error, got nil")
				}
				if _, ok := err.(*types.ProcessError); !ok {
					t.Error("expected ProcessError type")
				}
			} else {
				if err != nil {
					t.Fatalf("unexpected error: %v", err)
				}
				tt.check(t, result)
			}
		})
	}
}

func TestValidateConfig(t *testing.T) {
	now := time.Now()

	tests := []struct {
		name    string
		cfg     *Config
		wantErr bool
	}{
		{
			name: "valid config",
			cfg: &Config{
				InputPaths:   []string{"/tmp"},
				Since:        now.Add(-1 * time.Hour),
				Until:        now,
				TopN:         10,
				ContextLines: 3,
			},
			wantErr: false,
		},
		{
			name: "invalid time range",
			cfg: &Config{
				InputPaths:   []string{"/tmp"},
				Since:        now,
				Until:        now.Add(-1 * time.Hour),
				TopN:         10,
				ContextLines: 3,
			},
			wantErr: true,
		},
		{
			name: "invalid top N",
			cfg: &Config{
				InputPaths:   []string{"/tmp"},
				TopN:         -1,
				ContextLines: 3,
			},
			wantErr: true,
		},
		{
			name: "zero top N",
			cfg: &Config{
				InputPaths:   []string{"/tmp"},
				TopN:         0,
				ContextLines: 3,
			},
			wantErr: true,
		},
		{
			name: "invalid context lines",
			cfg: &Config{
				InputPaths:   []string{"/tmp"},
				TopN:         10,
				ContextLines: -1,
			},
			wantErr: true,
		},
		{
			name: "empty input paths uses cwd",
			cfg: &Config{
				InputPaths:   []string{},
				TopN:         10,
				ContextLines: 3,
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateConfig(tt.cfg)
			if tt.wantErr {
				if err == nil {
					t.Error("expected error, got nil")
				}
			} else {
				if err != nil {
					t.Errorf("unexpected error: %v", err)
				}
			}
		})
	}
}

func TestApplyConfigFile(t *testing.T) {
	tmpfile, err := os.CreateTemp("", "config-*.json")
	if err != nil {
		t.Fatal(err)
	}
	defer os.Remove(tmpfile.Name())

	configContent := `{
		"input_paths": ["/var/log"],
		"since": "24h",
		"services": ["api", "web"],
		"levels": ["error", "warn"],
		"environment": "production",
		"top_n": 20,
		"context_lines": 5,
		"min_cluster_size": 2,
		"color": false,
		"verbose": true
	}`

	if _, err := tmpfile.WriteString(configContent); err != nil {
		t.Fatal(err)
	}
	tmpfile.Close()

	cfg := &Config{
		TopN:           10,
		ContextLines:   3,
		MinClusterSize: 1,
	}

	loaded, err := applyConfigFile(cfg, tmpfile.Name())
	if err != nil {
		t.Fatalf("applyConfigFile failed: %v", err)
	}
	if !loaded {
		t.Error("expected loaded=true")
	}

	if len(cfg.InputPaths) != 1 || cfg.InputPaths[0] != "/var/log" {
		t.Errorf("InputPaths = %v, want [/var/log]", cfg.InputPaths)
	}
	if cfg.Since.IsZero() {
		t.Error("Since should be set from config file")
	}
	if cfg.TopN != 20 {
		t.Errorf("TopN = %d, want 20", cfg.TopN)
	}
	if cfg.ContextLines != 5 {
		t.Errorf("ContextLines = %d, want 5", cfg.ContextLines)
	}
	if cfg.MinClusterSize != 2 {
		t.Errorf("MinClusterSize = %d, want 2", cfg.MinClusterSize)
	}
	if !cfg.NoColor {
		t.Error("NoColor should be true (color=false)")
	}
	if !cfg.Verbose {
		t.Error("Verbose should be true")
	}
	if cfg.Environment != "production" {
		t.Errorf("Environment = %s, want production", cfg.Environment)
	}
}

func TestApplyConfigFile_NotFound(t *testing.T) {
	cfg := &Config{}
	loaded, err := applyConfigFile(cfg, "/nonexistent/path/config.json")
	if err == nil {
		t.Error("expected error for nonexistent file")
	}
	if loaded {
		t.Error("expected loaded=false")
	}
	if procErr, ok := err.(*types.ProcessError); ok {
		if procErr.Code != "CONFIG_READ_FAILED" {
			t.Errorf("code = %s, want CONFIG_READ_FAILED", procErr.Code)
		}
	}
}

func TestApplyConfigFile_InvalidJSON(t *testing.T) {
	tmpfile, err := os.CreateTemp("", "config-*.json")
	if err != nil {
		t.Fatal(err)
	}
	defer os.Remove(tmpfile.Name())

	if _, err := tmpfile.WriteString("this is not json"); err != nil {
		t.Fatal(err)
	}
	tmpfile.Close()

	cfg := &Config{}
	_, err = applyConfigFile(cfg, tmpfile.Name())
	if err == nil {
		t.Error("expected error for invalid JSON")
	}
	if procErr, ok := err.(*types.ProcessError); ok {
		if procErr.Code != "CONFIG_PARSE_ERROR" {
			t.Errorf("code = %s, want CONFIG_PARSE_ERROR", procErr.Code)
		}
	}
}

func TestApplyEnvVars(t *testing.T) {
	tests := []struct {
		name     string
		envVars  map[string]string
		checkCfg func(t *testing.T, cfg *Config)
	}{
		{
			name: "load all env vars",
			envVars: map[string]string{
				"LOGSUM_INPUT":        "/var/log,/tmp/logs",
				"LOGSUM_SINCE":        "1h",
				"LOGSUM_UNTIL":        "now",
				"LOGSUM_SERVICES":     "api,web,db",
				"LOGSUM_REQUEST_IDS":  "r1,r2",
				"LOGSUM_ENV":          "staging",
				"LOGSUM_TOP":          "15",
				"LOGSUM_CONTEXT":      "7",
				"LOGSUM_MIN_CLUSTER":  "3",
				"LOGSUM_JSON":         "1",
				"LOGSUM_NO_COLOR":     "1",
				"LOGSUM_VERBOSE":      "true",
				"LOGSUM_CI":           "true",
				"LOGSUM_OUTPUT":       "/tmp/out.json",
			},
			checkCfg: func(t *testing.T, cfg *Config) {
				if len(cfg.InputPaths) != 2 {
					t.Errorf("InputPaths count = %d, want 2", len(cfg.InputPaths))
				}
				if cfg.Since.IsZero() {
					t.Error("Since should be set")
				}
				if cfg.Until.IsZero() {
					t.Error("Until should be set")
				}
				if len(cfg.Services) != 3 {
					t.Errorf("Services count = %d, want 3", len(cfg.Services))
				}
				if len(cfg.RequestIDs) != 2 {
					t.Errorf("RequestIDs count = %d, want 2", len(cfg.RequestIDs))
				}
				if cfg.Environment != "staging" {
					t.Errorf("Environment = %s, want staging", cfg.Environment)
				}
				if cfg.TopN != 15 {
					t.Errorf("TopN = %d, want 15", cfg.TopN)
				}
				if cfg.ContextLines != 7 {
					t.Errorf("ContextLines = %d, want 7", cfg.ContextLines)
				}
				if cfg.MinClusterSize != 3 {
					t.Errorf("MinClusterSize = %d, want 3", cfg.MinClusterSize)
				}
				if !cfg.OutputJSON {
					t.Error("OutputJSON should be true")
				}
				if !cfg.NoColor {
					t.Error("NoColor should be true")
				}
				if !cfg.Verbose {
					t.Error("Verbose should be true")
				}
				if !cfg.CIOutput {
					t.Error("CIOutput should be true")
				}
				if cfg.OutputPath != "/tmp/out.json" {
					t.Errorf("OutputPath = %s, want /tmp/out.json", cfg.OutputPath)
				}
			},
		},
		{
			name:    "no env vars set",
			envVars: map[string]string{},
			checkCfg: func(t *testing.T, cfg *Config) {
				if len(cfg.InputPaths) != 0 {
					t.Errorf("InputPaths count = %d, want 0", len(cfg.InputPaths))
				}
				if !cfg.Since.IsZero() {
					t.Error("Since should be zero")
				}
				if !cfg.Until.IsZero() {
					t.Error("Until should be zero")
				}
				if len(cfg.Services) != 0 {
					t.Errorf("Services count = %d, want 0", len(cfg.Services))
				}
				if cfg.Environment != "" {
					t.Errorf("Environment = %s, want empty", cfg.Environment)
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			envKeys := []string{
				"LOGSUM_INPUT", "LOGSUM_SINCE", "LOGSUM_UNTIL",
				"LOGSUM_SERVICES", "LOGSUM_REQUEST_IDS", "LOGSUM_ENV",
				"LOGSUM_TOP", "LOGSUM_CONTEXT", "LOGSUM_MIN_CLUSTER",
				"LOGSUM_JSON", "LOGSUM_OUTPUT_JSON", "LOGSUM_NO_COLOR",
				"LOGSUM_VERBOSE", "LOGSUM_CI", "LOGSUM_OUTPUT",
			}
			for _, k := range envKeys {
				os.Unsetenv(k)
			}

			for k, v := range tt.envVars {
				os.Setenv(k, v)
				defer os.Unsetenv(k)
			}

			cfg := &Config{}
			applyEnvVars(cfg)
			tt.checkCfg(t, cfg)
		})
	}
}

func TestConfigOverrideOrder(t *testing.T) {
	envKeys := []string{
		"LOGSUM_INPUT", "LOGSUM_SINCE", "LOGSUM_UNTIL",
		"LOGSUM_SERVICES", "LOGSUM_ENV", "LOGSUM_TOP",
	}
	for _, k := range envKeys {
		os.Unsetenv(k)
	}

	tmpfile, err := os.CreateTemp("", "config-*.json")
	if err != nil {
		t.Fatal(err)
	}
	defer os.Remove(tmpfile.Name())

	configContent := `{
		"services": ["from-config"],
		"environment": "from-config",
		"top_n": 5
	}`
	if _, err := tmpfile.WriteString(configContent); err != nil {
		t.Fatal(err)
	}
	tmpfile.Close()

	cfg := &Config{TopN: 10}

	loaded, err := applyConfigFile(cfg, tmpfile.Name())
	if err != nil || !loaded {
		t.Fatalf("applyConfigFile failed: %v", err)
	}

	if cfg.Services[0] != "from-config" {
		t.Errorf("after config file: Services[0] = %s, want from-config", cfg.Services[0])
	}
	if cfg.Environment != "from-config" {
		t.Errorf("after config file: Environment = %s, want from-config", cfg.Environment)
	}
	if cfg.TopN != 5 {
		t.Errorf("after config file: TopN = %d, want 5", cfg.TopN)
	}

	os.Setenv("LOGSUM_SERVICES", "from-env")
	os.Setenv("LOGSUM_ENV", "from-env")
	os.Setenv("LOGSUM_TOP", "15")
	defer func() {
		os.Unsetenv("LOGSUM_SERVICES")
		os.Unsetenv("LOGSUM_ENV")
		os.Unsetenv("LOGSUM_TOP")
	}()

	applyEnvVars(cfg)

	if cfg.Services[0] != "from-env" {
		t.Errorf("after env vars: Services[0] = %s, want from-env", cfg.Services[0])
	}
	if cfg.Environment != "from-env" {
		t.Errorf("after env vars: Environment = %s, want from-env", cfg.Environment)
	}
	if cfg.TopN != 15 {
		t.Errorf("after env vars: TopN = %d, want 15", cfg.TopN)
	}

	cli := &cliArgs{
		services:    []string{"from-cli"},
		environment: "from-cli",
		topN:        25,
	}
	applyCLIArgs(cfg, cli)

	if cfg.Services[0] != "from-cli" {
		t.Errorf("after CLI args: Services[0] = %s, want from-cli", cfg.Services[0])
	}
	if cfg.Environment != "from-cli" {
		t.Errorf("after CLI args: Environment = %s, want from-cli", cfg.Environment)
	}
	if cfg.TopN != 25 {
		t.Errorf("after CLI args: TopN = %d, want 25", cfg.TopN)
	}
}

func TestSinceUntilPreservedFromConfigAndEnv(t *testing.T) {
	for _, k := range []string{"LOGSUM_SINCE", "LOGSUM_UNTIL"} {
		os.Unsetenv(k)
	}

	tmpfile, err := os.CreateTemp("", "config-*.json")
	if err != nil {
		t.Fatal(err)
	}
	defer os.Remove(tmpfile.Name())

	configContent := `{
		"since": "24h",
		"until": "1h"
	}`
	if _, err := tmpfile.WriteString(configContent); err != nil {
		t.Fatal(err)
	}
	tmpfile.Close()

	cfg := &Config{}
	_, err = applyConfigFile(cfg, tmpfile.Name())
	if err != nil {
		t.Fatalf("applyConfigFile failed: %v", err)
	}

	if cfg.Since.IsZero() {
		t.Error("Since from config file should be preserved")
	}
	if cfg.Until.IsZero() {
		t.Error("Until from config file should be preserved")
	}

	configSince := cfg.Since
	configUntil := cfg.Until

	os.Setenv("LOGSUM_SERVICES", "api")
	defer os.Unsetenv("LOGSUM_SERVICES")
	applyEnvVars(cfg)

	if !cfg.Since.Equal(configSince) {
		t.Error("Since should not be changed by env vars without LOGSUM_SINCE")
	}
	if !cfg.Until.Equal(configUntil) {
		t.Error("Until should not be changed by env vars without LOGSUM_UNTIL")
	}

	cli := &cliArgs{services: []string{"web"}}
	applyCLIArgs(cfg, cli)

	if !cfg.Since.Equal(configSince) {
		t.Error("Since should not be changed by CLI without --since")
	}
	if !cfg.Until.Equal(configUntil) {
		t.Error("Until should not be changed by CLI without --until")
	}
}

func TestParseConfigFileArg(t *testing.T) {
	origArgs := os.Args
	defer func() { os.Args = origArgs }()

	tests := []struct {
		name     string
		args     []string
		want     string
		wantErr  bool
	}{
		{"no config arg", []string{"logsum"}, "", false},
		{"config with space", []string{"logsum", "--config", "/path/to/config.json"}, "/path/to/config.json", false},
		{"config with equals", []string{"logsum", "--config=/path/to/config.json"}, "/path/to/config.json", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			os.Args = tt.args
			got, err := parseConfigFileArg()
			if tt.wantErr {
				if err == nil {
					t.Error("expected error")
				}
			} else {
				if err != nil {
					t.Errorf("unexpected error: %v", err)
				}
				if got != tt.want {
					t.Errorf("got %q, want %q", got, tt.want)
				}
			}
		})
	}
}

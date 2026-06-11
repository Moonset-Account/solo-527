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

func TestLoadConfigFile(t *testing.T) {
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

	if err := loadConfigFile(cfg, tmpfile.Name()); err != nil {
		t.Fatalf("loadConfigFile failed: %v", err)
	}

	if len(cfg.InputPaths) != 1 || cfg.InputPaths[0] != "/var/log" {
		t.Errorf("InputPaths = %v, want [/var/log]", cfg.InputPaths)
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
		t.Error("NoColor should be true")
	}
	if !cfg.Verbose {
		t.Error("Verbose should be true")
	}
	if cfg.Environment != "production" {
		t.Errorf("Environment = %s, want production", cfg.Environment)
	}
}

func TestLoadConfigFile_NotFound(t *testing.T) {
	cfg := &Config{}
	err := loadConfigFile(cfg, "/nonexistent/path/config.json")
	if err == nil {
		t.Error("expected error for nonexistent file")
	}
	if procErr, ok := err.(*types.ProcessError); ok {
		if procErr.Code != "CONFIG_READ_FAILED" {
			t.Errorf("code = %s, want CONFIG_READ_FAILED", procErr.Code)
		}
	}
}

func TestLoadConfigFile_InvalidJSON(t *testing.T) {
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
	err = loadConfigFile(cfg, tmpfile.Name())
	if err == nil {
		t.Error("expected error for invalid JSON")
	}
	if procErr, ok := err.(*types.ProcessError); ok {
		if procErr.Code != "CONFIG_PARSE_ERROR" {
			t.Errorf("code = %s, want CONFIG_PARSE_ERROR", procErr.Code)
		}
	}
}

func TestLoadEnvVars(t *testing.T) {
	tests := []struct {
		name     string
		envVars  map[string]string
		checkCfg func(t *testing.T, cfg *Config)
	}{
		{
			name: "load all env vars",
			envVars: map[string]string{
				"LOGSUM_SINCE":     "1h",
				"LOGSUM_UNTIL":     "now",
				"LOGSUM_SERVICES":  "api,web,db",
				"LOGSUM_ENV":       "staging",
				"LOGSUM_NO_COLOR":  "1",
				"LOGSUM_CI":        "true",
			},
			checkCfg: func(t *testing.T, cfg *Config) {
				if cfg.Since.IsZero() {
					t.Error("Since should be set")
				}
				if cfg.Until.IsZero() {
					t.Error("Until should be set")
				}
				if len(cfg.Services) != 3 {
					t.Errorf("Services count = %d, want 3", len(cfg.Services))
				}
				if cfg.Environment != "staging" {
					t.Errorf("Environment = %s, want staging", cfg.Environment)
				}
				if !cfg.NoColor {
					t.Error("NoColor should be true")
				}
				if !cfg.CIOutput {
					t.Error("CIOutput should be true")
				}
			},
		},
		{
			name:    "no env vars set",
			envVars: map[string]string{},
			checkCfg: func(t *testing.T, cfg *Config) {
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
			for k := range map[string]string{
				"LOGSUM_SINCE":     "",
				"LOGSUM_UNTIL":     "",
				"LOGSUM_SERVICES":  "",
				"LOGSUM_ENV":       "",
				"LOGSUM_NO_COLOR":  "",
				"LOGSUM_CI":        "",
			} {
				os.Unsetenv(k)
			}

			for k, v := range tt.envVars {
				os.Setenv(k, v)
				defer os.Unsetenv(k)
			}

			cfg := &Config{}
			loadEnvVars(cfg)
			tt.checkCfg(t, cfg)
		})
	}
}

func TestLoadEnvVars_NoOverride(t *testing.T) {
	os.Setenv("LOGSUM_SERVICES", "api,web")
	defer os.Unsetenv("LOGSUM_SERVICES")
	os.Setenv("LOGSUM_ENV", "staging")
	defer os.Unsetenv("LOGSUM_ENV")

	cfg := &Config{
		Services:    []string{"existing"},
		Environment: "production",
	}

	loadEnvVars(cfg)

	if len(cfg.Services) != 1 || cfg.Services[0] != "existing" {
		t.Errorf("Services should not be overridden, got %v", cfg.Services)
	}
	if cfg.Environment != "production" {
		t.Errorf("Environment should not be overridden, got %s", cfg.Environment)
	}
}

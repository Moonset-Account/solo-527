package config

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestDefault(t *testing.T) {
	cfg := Default()
	if len(cfg.EnvFiles) != 1 || cfg.EnvFiles[0] != ".env" {
		t.Errorf("default env files should be [.env], got %v", cfg.EnvFiles)
	}
	if cfg.Format != "" {
		t.Errorf("default format should be empty (unresolved), got %q", cfg.Format)
	}
	if cfg.CI {
		t.Error("default CI should be false")
	}
}

func TestResolve_FormatEmpty_CIFalse(t *testing.T) {
	cfg := Default()
	Resolve(cfg)
	if cfg.Format != "text" {
		t.Errorf("Resolve should set format to text when ci=false and format is empty, got %q", cfg.Format)
	}
}

func TestResolve_FormatEmpty_CITrue(t *testing.T) {
	cfg := Default()
	cfg.CI = true
	Resolve(cfg)
	if cfg.Format != "ci" {
		t.Errorf("Resolve should set format to ci when ci=true and format is empty, got %q", cfg.Format)
	}
}

func TestResolve_FormatExplicit_CITrue(t *testing.T) {
	cfg := Default()
	cfg.CI = true
	cfg.Format = "json"
	Resolve(cfg)
	if cfg.Format != "json" {
		t.Errorf("Resolve should keep explicit format json when ci=true, got %q", cfg.Format)
	}
}

func TestResolve_FormatExplicit_CIFalse(t *testing.T) {
	cfg := Default()
	cfg.CI = false
	cfg.Format = "json"
	Resolve(cfg)
	if cfg.Format != "json" {
		t.Errorf("Resolve should keep explicit format json when ci=false, got %q", cfg.Format)
	}
}

func TestLoadFile(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "envcheck.json")
	data := Config{
		EnvFiles:     []string{".env", ".env.prod"},
		ExampleFiles: []string{".env.example"},
		Required:     []string{"DATABASE_URL"},
		Format:       "json",
		CI:           true,
	}
	content, _ := json.Marshal(data)
	if err := os.WriteFile(path, content, 0644); err != nil {
		t.Fatal(err)
	}

	cfg, err := LoadFile(path)
	if err != nil {
		t.Fatalf("LoadFile error: %v", err)
	}
	if len(cfg.EnvFiles) != 2 {
		t.Errorf("expected 2 env files, got %d", len(cfg.EnvFiles))
	}
	if cfg.CI != true {
		t.Error("CI should be true from config file")
	}
	if cfg.Format != "json" {
		t.Errorf("Format should be json from config file, got %q", cfg.Format)
	}
}

func TestLoadFile_CIWithoutFormat(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "envcheck.json")
	data := Config{
		EnvFiles: []string{".env"},
		CI:       true,
	}
	content, _ := json.Marshal(data)
	if err := os.WriteFile(path, content, 0644); err != nil {
		t.Fatal(err)
	}

	cfg, err := LoadFile(path)
	if err != nil {
		t.Fatalf("LoadFile error: %v", err)
	}
	if cfg.Format != "" {
		t.Errorf("Format should be empty when not set in config file, got %q", cfg.Format)
	}
	Resolve(cfg)
	if cfg.Format != "ci" {
		t.Errorf("Resolve should set format to ci when ci=true and format was empty, got %q", cfg.Format)
	}
}

func TestLoadFileNotFound(t *testing.T) {
	_, err := LoadFile("/nonexistent/config.json")
	if err == nil {
		t.Fatal("expected error for nonexistent config file")
	}
}

func TestMerge_CLIOverridesConfig(t *testing.T) {
	base := Default()
	base.EnvFiles = []string{".env"}
	base.Format = ""
	base.CI = false

	ci := true
	ov := Override{
		EnvFiles: []string{".env", ".env.staging"},
		CI:       &ci,
		Format:   "json",
	}

	result := Merge(base, ov)
	if len(result.EnvFiles) != 2 {
		t.Errorf("expected 2 env files after merge, got %d", len(result.EnvFiles))
	}
	if !result.CI {
		t.Error("CI should be overridden to true")
	}
	if result.Format != "json" {
		t.Errorf("format should be json, got %s", result.Format)
	}
}

func TestMerge_CIWithNoFormatOverrides(t *testing.T) {
	base := Default()
	base.EnvFiles = []string{".env"}
	base.Format = ""
	base.CI = false

	ci := true
	ov := Override{
		CI: &ci,
	}

	result := Merge(base, ov)
	if result.Format != "" {
		t.Errorf("Merge should not change format when only ci is set, got %q", result.Format)
	}
	Resolve(result)
	if result.Format != "ci" {
		t.Errorf("Resolve should set format to ci, got %q", result.Format)
	}
}

func TestMerge_CIWithExplicitFormat(t *testing.T) {
	base := Default()
	base.EnvFiles = []string{".env"}
	base.CI = true

	ov := Override{
		Format: "json",
	}

	result := Merge(base, ov)
	if !result.CI {
		t.Error("CI should remain true from base")
	}
	if result.Format != "json" {
		t.Errorf("explicit format should override, got %q", result.Format)
	}
	Resolve(result)
	if result.Format != "json" {
		t.Errorf("Resolve should keep explicit format, got %q", result.Format)
	}
}

func TestMerge_PartialOverride(t *testing.T) {
	base := Default()
	base.Required = []string{"DB_URL"}
	base.EnvFiles = []string{".env"}

	ov := Override{
		Required: []string{"DB_URL", "REDIS_URL"},
	}

	result := Merge(base, ov)
	if len(result.Required) != 2 {
		t.Errorf("expected 2 required vars, got %d", len(result.Required))
	}
	if len(result.EnvFiles) != 1 {
		t.Errorf("env files should remain from base, got %d", len(result.EnvFiles))
	}
}

func TestMerge_NoOverride(t *testing.T) {
	base := Default()
	base.Strict = true

	ov := Override{}
	result := Merge(base, ov)
	if !result.Strict {
		t.Error("strict should remain true from base when not overridden")
	}
}

func TestValidate_Valid(t *testing.T) {
	cfg := Default()
	Resolve(cfg)
	if err := Validate(cfg); err != nil {
		t.Errorf("default config should be valid after resolve: %v", err)
	}
}

func TestValidate_InvalidFormat(t *testing.T) {
	cfg := Default()
	cfg.Format = "xml"
	if err := Validate(cfg); err == nil {
		t.Error("expected error for invalid format")
	}
}

func TestValidate_EmptyFormatAfterResolve(t *testing.T) {
	cfg := Default()
	if err := Validate(cfg); err == nil {
		t.Error("expected error for empty format before Resolve is called")
	}
}

func TestValidate_EmptyEnvPath(t *testing.T) {
	cfg := Default()
	cfg.Format = "text"
	cfg.EnvFiles = []string{""}
	if err := Validate(cfg); err == nil {
		t.Error("expected error for empty env file path")
	}
}

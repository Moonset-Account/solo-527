package config

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

type Config struct {
	EnvFiles     []string `json:"env_files"`
	ExampleFiles []string `json:"example_files"`
	Required     []string `json:"required"`
	MaskPatterns []string `json:"mask_patterns"`
	CI           bool     `json:"ci"`
	Format       string   `json:"format"`
	Strict       bool     `json:"strict"`
	Quiet        bool     `json:"quiet"`
	Verbose      bool     `json:"verbose"`
}

type Override struct {
	EnvFiles     []string
	ExampleFiles []string
	Required     []string
	MaskPatterns []string
	CI           *bool
	Format       string
	Strict       *bool
	Quiet        *bool
	Verbose      *bool
}

func Default() *Config {
	return &Config{
		EnvFiles:     []string{".env"},
		ExampleFiles: []string{},
		Required:     []string{},
		MaskPatterns: []string{"PASSWORD", "SECRET", "TOKEN", "KEY", "PRIVATE", "CREDENTIAL", "API_KEY"},
		CI:           false,
		Format:       "text",
		Strict:       false,
		Quiet:        false,
		Verbose:      false,
	}
}

func LoadFile(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read config file %s: %w", path, err)
	}
	cfg := Default()
	if err := json.Unmarshal(data, cfg); err != nil {
		return nil, fmt.Errorf("parse config file %s: %w", path, err)
	}
	return cfg, nil
}

func Merge(base *Config, ov Override) *Config {
	result := *base
	if len(ov.EnvFiles) > 0 {
		result.EnvFiles = ov.EnvFiles
	}
	if len(ov.ExampleFiles) > 0 {
		result.ExampleFiles = ov.ExampleFiles
	}
	if len(ov.Required) > 0 {
		result.Required = ov.Required
	}
	if len(ov.MaskPatterns) > 0 {
		result.MaskPatterns = ov.MaskPatterns
	}
	if ov.CI != nil {
		result.CI = *ov.CI
	}
	if ov.Format != "" {
		result.Format = ov.Format
	}
	if ov.Strict != nil {
		result.Strict = *ov.Strict
	}
	if ov.Quiet != nil {
		result.Quiet = *ov.Quiet
	}
	if ov.Verbose != nil {
		result.Verbose = *ov.Verbose
	}
	return &result
}

func Validate(cfg *Config) error {
	validFormats := map[string]bool{"text": true, "json": true, "ci": true}
	if !validFormats[cfg.Format] {
		return fmt.Errorf("invalid format %q: must be one of text, json, ci", cfg.Format)
	}
	for _, f := range cfg.EnvFiles {
		if strings.TrimSpace(f) == "" {
			return fmt.Errorf("env file path cannot be empty")
		}
	}
	for _, f := range cfg.ExampleFiles {
		if strings.TrimSpace(f) == "" {
			return fmt.Errorf("example file path cannot be empty")
		}
	}
	return nil
}

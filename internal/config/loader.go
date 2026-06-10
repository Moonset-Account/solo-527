package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/devops/envcheck/internal/types"
	"github.com/joho/godotenv"
	"github.com/spf13/viper"
)

const (
	EnvPrefix       = "ENVCHECK"
	DefaultMaskChar = "*"
)

var DefaultConfig = types.CheckConfig{
	MaskChar:       DefaultMaskChar,
	MaskKeepStart:  2,
	MaskKeepEnd:    2,
	Strict:         false,
	WarnOnExtra:    true,
	FailOnMismatch: true,
	FailOnMissing:  true,
	LogLevel:       "info",
	MaskPatterns:   []string{"PASSWORD", "SECRET", "TOKEN", "KEY", "CREDENTIAL"},
}

type Loader struct {
	v              *viper.Viper
	configPath     string
	profile        string
	sources        []string
	cliDefaults    types.CheckConfig
	SkipValidation bool
}

func NewLoader(configPath string, profile string) *Loader {
	return &Loader{
		v:              viper.New(),
		configPath:     configPath,
		profile:        profile,
		sources:        []string{},
		cliDefaults:    DefaultConfig,
		SkipValidation: false,
	}
}

func (l *Loader) SetCLIDefaults(cfg types.CheckConfig) {
	l.cliDefaults = cfg
}

func (l *Loader) SetSkipValidation(skip bool) {
	l.SkipValidation = skip
}

func (l *Loader) Load() (*types.CheckConfig, []string, error) {
	if err := l.setupViper(); err != nil {
		return nil, l.sources, err
	}
	if err := l.loadConfigFile(); err != nil {
		return nil, l.sources, err
	}
	cfg, err := l.buildConfig()
	if err != nil {
		return nil, l.sources, err
	}
	return cfg, l.sources, nil
}

func (l *Loader) setupViper() error {
	l.v.SetEnvPrefix(EnvPrefix)
	l.v.SetEnvKeyReplacer(strings.NewReplacer(".", "_", "-", "_"))
	l.v.AutomaticEnv()

	l.v.SetTypeByDefaultValue(true)

	l.setDefaults(DefaultConfig)
	return nil
}

func (l *Loader) setDefaults(cfg types.CheckConfig) {
	l.v.SetDefault("check.env-paths", cfg.EnvPaths)
	l.v.SetDefault("check.example-path", cfg.ExamplePath)
	l.v.SetDefault("check.required-vars", cfg.RequiredVars)
	l.v.SetDefault("check.mask-keys", cfg.MaskKeys)
	l.v.SetDefault("check.mask-patterns", cfg.MaskPatterns)
	l.v.SetDefault("check.mask-all", cfg.MaskAll)
	l.v.SetDefault("check.mask-char", cfg.MaskChar)
	l.v.SetDefault("check.mask-keep-start", cfg.MaskKeepStart)
	l.v.SetDefault("check.mask-keep-end", cfg.MaskKeepEnd)
	l.v.SetDefault("check.ci", cfg.CI)
	l.v.SetDefault("check.json", cfg.JSON)
	l.v.SetDefault("check.strict", cfg.Strict)
	l.v.SetDefault("check.warn-on-extra", cfg.WarnOnExtra)
	l.v.SetDefault("check.fail-on-mismatch", cfg.FailOnMismatch)
	l.v.SetDefault("check.fail-on-missing", cfg.FailOnMissing)
	l.v.SetDefault("check.verbose", cfg.Verbose)
	l.v.SetDefault("check.quiet", cfg.Quiet)
	l.v.SetDefault("check.log-level", cfg.LogLevel)
	l.v.SetDefault("check.compare-base", cfg.CompareBase)
	l.v.SetDefault("check.compare-targets", cfg.CompareTargets)
}

func (l *Loader) loadConfigFile() error {
	if l.configPath != "" {
		absPath, err := filepath.Abs(l.configPath)
		if err != nil {
			return fmt.Errorf("invalid config path: %w", err)
		}
		l.v.SetConfigFile(absPath)
		if err := l.v.ReadInConfig(); err != nil {
			if os.IsNotExist(err) {
				return fmt.Errorf("config file not found: %s", absPath)
			}
			return fmt.Errorf("failed to read config file: %w", err)
		}
		l.sources = append(l.sources, fmt.Sprintf("config-file:%s", absPath))
		return nil
	}

	l.v.SetConfigName("envcheck")
	l.v.SetConfigType("yaml")

	searchPaths := []string{".", "./config", "/etc/envcheck", "$HOME/.envcheck"}
	for _, p := range searchPaths {
		l.v.AddConfigPath(os.ExpandEnv(p))
	}

	if err := l.v.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return fmt.Errorf("failed to read config: %w", err)
		}
		l.sources = append(l.sources, "config-file:not-found")
		return nil
	}

	return nil
}

func (l *Loader) buildConfig() (*types.CheckConfig, error) {
	cfg := &types.CheckConfig{}
	*cfg = DefaultConfig

	envUsed := []string{}
	potentialEnvKeys := []string{
		"ENV_PATHS", "EXAMPLE_PATH", "REQUIRED_VARS", "MASK_KEYS", "MASK_PATTERNS",
		"MASK_ALL", "MASK_CHAR", "MASK_KEEP_START", "MASK_KEEP_END",
		"CI", "JSON", "STRICT", "WARN_ON_EXTRA", "FAIL_ON_MISMATCH", "FAIL_ON_MISSING",
		"VERBOSE", "QUIET", "LOG_LEVEL", "COMPARE_BASE", "COMPARE_TARGETS",
	}
	for _, k := range potentialEnvKeys {
		if os.Getenv(EnvPrefix+"_"+k) != "" {
			envUsed = append(envUsed, EnvPrefix+"_"+k)
		}
	}

	mergeLayer := func(prefix string) {
		hasAny := false
		getKey := func(k string) string {
			if prefix == "" {
				return k
			}
			return prefix + "." + k
		}
		isSet := func(k string) bool {
			key := getKey(k)
			return l.v.InConfig(key) || l.v.IsSet(key)
		}

		if isSet("env-paths") {
			if v := l.v.GetStringSlice(getKey("env-paths")); len(v) > 0 {
				cfg.EnvPaths = v
				hasAny = true
			}
		}
		if isSet("example-path") {
			if v := l.v.GetString(getKey("example-path")); v != "" {
				cfg.ExamplePath = v
				hasAny = true
			}
		}
		if isSet("required-vars") {
			if v := l.v.GetStringSlice(getKey("required-vars")); len(v) > 0 {
				cfg.RequiredVars = v
				hasAny = true
			}
		}
		if isSet("mask-keys") {
			if v := l.v.GetStringSlice(getKey("mask-keys")); len(v) > 0 {
				cfg.MaskKeys = append(cfg.MaskKeys, v...)
				hasAny = true
			}
		}
		if isSet("mask-patterns") {
			if v := l.v.GetStringSlice(getKey("mask-patterns")); len(v) > 0 {
				cfg.MaskPatterns = v
				hasAny = true
			}
		}
		if isSet("mask-all") {
			cfg.MaskAll = l.v.GetBool(getKey("mask-all"))
			hasAny = true
		}
		if isSet("mask-char") {
			if v := l.v.GetString(getKey("mask-char")); v != "" {
				cfg.MaskChar = v
				hasAny = true
			}
		}
		if isSet("mask-keep-start") {
			cfg.MaskKeepStart = l.v.GetInt(getKey("mask-keep-start"))
			hasAny = true
		}
		if isSet("mask-keep-end") {
			cfg.MaskKeepEnd = l.v.GetInt(getKey("mask-keep-end"))
			hasAny = true
		}
		if isSet("ci") {
			cfg.CI = l.v.GetBool(getKey("ci"))
			hasAny = true
		}
		if isSet("json") {
			cfg.JSON = l.v.GetBool(getKey("json"))
			hasAny = true
		}
		if isSet("strict") {
			cfg.Strict = l.v.GetBool(getKey("strict"))
			hasAny = true
		}
		if isSet("warn-on-extra") {
			cfg.WarnOnExtra = l.v.GetBool(getKey("warn-on-extra"))
			hasAny = true
		}
		if isSet("fail-on-mismatch") {
			cfg.FailOnMismatch = l.v.GetBool(getKey("fail-on-mismatch"))
			hasAny = true
		}
		if isSet("fail-on-missing") {
			cfg.FailOnMissing = l.v.GetBool(getKey("fail-on-missing"))
			hasAny = true
		}
		if isSet("verbose") {
			cfg.Verbose = l.v.GetBool(getKey("verbose"))
			hasAny = true
		}
		if isSet("quiet") {
			cfg.Quiet = l.v.GetBool(getKey("quiet"))
			hasAny = true
		}
		if isSet("log-level") {
			if v := l.v.GetString(getKey("log-level")); v != "" {
				cfg.LogLevel = v
				hasAny = true
			}
		}
		if isSet("compare-base") {
			if v := l.v.GetString(getKey("compare-base")); v != "" {
				cfg.CompareBase = v
				hasAny = true
			}
		}
		if isSet("compare-targets") {
			if v := l.v.GetStringSlice(getKey("compare-targets")); len(v) > 0 {
				cfg.CompareTargets = v
				hasAny = true
			}
		}
		_ = hasAny
	}

	configUsed := l.v.ConfigFileUsed()
	if configUsed != "" {
		mergeLayer("check")
		l.sources = append(l.sources, fmt.Sprintf("config-file:%s", configUsed))
	}

	if l.profile != "" {
		profilePrefix := "profiles." + l.profile
		if l.v.InConfig("profiles") && (l.v.InConfig(profilePrefix+".env-paths") ||
			l.v.Sub(profilePrefix) != nil) {
			mergeLayer(profilePrefix)
			l.sources = append(l.sources, fmt.Sprintf("profile:%s", l.profile))
		}
	}

	if envPaths := os.Getenv(EnvPrefix + "_ENV_PATHS"); envPaths != "" {
		cfg.EnvPaths = splitAndTrim(envPaths)
	}
	if examplePath := os.Getenv(EnvPrefix + "_EXAMPLE_PATH"); examplePath != "" {
		cfg.ExamplePath = examplePath
	}
	if reqVars := os.Getenv(EnvPrefix + "_REQUIRED_VARS"); reqVars != "" {
		cfg.RequiredVars = splitAndTrim(reqVars)
	}
	if maskKeys := os.Getenv(EnvPrefix + "_MASK_KEYS"); maskKeys != "" {
		cfg.MaskKeys = splitAndTrim(maskKeys)
	}
	if maskPatterns := os.Getenv(EnvPrefix + "_MASK_PATTERNS"); maskPatterns != "" {
		cfg.MaskPatterns = splitAndTrim(maskPatterns)
	}
	if maskAll := os.Getenv(EnvPrefix + "_MASK_ALL"); maskAll != "" {
		cfg.MaskAll = parseBool(maskAll, cfg.MaskAll)
	}
	if maskChar := os.Getenv(EnvPrefix + "_MASK_CHAR"); maskChar != "" {
		cfg.MaskChar = maskChar
	}
	if maskStart := os.Getenv(EnvPrefix + "_MASK_KEEP_START"); maskStart != "" {
		if n, err := parseInt(maskStart); err == nil {
			cfg.MaskKeepStart = n
		}
	}
	if maskEnd := os.Getenv(EnvPrefix + "_MASK_KEEP_END"); maskEnd != "" {
		if n, err := parseInt(maskEnd); err == nil {
			cfg.MaskKeepEnd = n
		}
	}
	if ci := os.Getenv(EnvPrefix + "_CI"); ci != "" {
		cfg.CI = parseBool(ci, cfg.CI)
	}
	if jsonOut := os.Getenv(EnvPrefix + "_JSON"); jsonOut != "" {
		cfg.JSON = parseBool(jsonOut, cfg.JSON)
	}
	if strict := os.Getenv(EnvPrefix + "_STRICT"); strict != "" {
		cfg.Strict = parseBool(strict, cfg.Strict)
	}
	if warnExtra := os.Getenv(EnvPrefix + "_WARN_ON_EXTRA"); warnExtra != "" {
		cfg.WarnOnExtra = parseBool(warnExtra, cfg.WarnOnExtra)
	}
	if failMis := os.Getenv(EnvPrefix + "_FAIL_ON_MISMATCH"); failMis != "" {
		cfg.FailOnMismatch = parseBool(failMis, cfg.FailOnMismatch)
	}
	if failMiss := os.Getenv(EnvPrefix + "_FAIL_ON_MISSING"); failMiss != "" {
		cfg.FailOnMissing = parseBool(failMiss, cfg.FailOnMissing)
	}
	if verbose := os.Getenv(EnvPrefix + "_VERBOSE"); verbose != "" {
		cfg.Verbose = parseBool(verbose, cfg.Verbose)
	}
	if quiet := os.Getenv(EnvPrefix + "_QUIET"); quiet != "" {
		cfg.Quiet = parseBool(quiet, cfg.Quiet)
	}
	if logLevel := os.Getenv(EnvPrefix + "_LOG_LEVEL"); logLevel != "" {
		cfg.LogLevel = logLevel
	}
	if compBase := os.Getenv(EnvPrefix + "_COMPARE_BASE"); compBase != "" {
		cfg.CompareBase = compBase
	}
	if compTargets := os.Getenv(EnvPrefix + "_COMPARE_TARGETS"); compTargets != "" {
		cfg.CompareTargets = splitAndTrim(compTargets)
	}

	if len(envUsed) > 0 {
		l.sources = append(l.sources, fmt.Sprintf("env-vars:%s", strings.Join(envUsed, ",")))
	}

	l.applyCLIDefaults(cfg)

	cfg.ConfigPath = l.configPath

	if !l.SkipValidation {
		if err := validate(cfg); err != nil {
			return nil, err
		}
	}

	return cfg, nil
}

func (l *Loader) applyCLIDefaults(cfg *types.CheckConfig) {
	if len(l.cliDefaults.EnvPaths) > 0 {
		cfg.EnvPaths = l.cliDefaults.EnvPaths
		l.sources = append(l.sources, "cli:env-paths")
	}
	if l.cliDefaults.ExamplePath != "" {
		cfg.ExamplePath = l.cliDefaults.ExamplePath
		l.sources = append(l.sources, "cli:example-path")
	}
	if len(l.cliDefaults.RequiredVars) > 0 {
		cfg.RequiredVars = l.cliDefaults.RequiredVars
		l.sources = append(l.sources, "cli:required-vars")
	}
	if len(l.cliDefaults.MaskKeys) > 0 {
		cfg.MaskKeys = append(cfg.MaskKeys, l.cliDefaults.MaskKeys...)
		l.sources = append(l.sources, "cli:mask-keys")
	}
	if l.cliDefaults.MaskAll {
		cfg.MaskAll = true
		l.sources = append(l.sources, "cli:mask-all")
	}
	if l.cliDefaults.CI {
		cfg.CI = true
		l.sources = append(l.sources, "cli:ci")
	}
	if l.cliDefaults.JSON {
		cfg.JSON = true
		l.sources = append(l.sources, "cli:json")
	}
	if l.cliDefaults.Strict {
		cfg.Strict = true
		l.sources = append(l.sources, "cli:strict")
	}
	if l.cliDefaults.Verbose {
		cfg.Verbose = true
		cfg.Quiet = false
		l.sources = append(l.sources, "cli:verbose")
	}
	if l.cliDefaults.Quiet {
		cfg.Quiet = true
		cfg.Verbose = false
		l.sources = append(l.sources, "cli:quiet")
	}
	if l.cliDefaults.CompareBase != "" {
		cfg.CompareBase = l.cliDefaults.CompareBase
		l.sources = append(l.sources, "cli:compare-base")
	}
	if len(l.cliDefaults.CompareTargets) > 0 {
		cfg.CompareTargets = l.cliDefaults.CompareTargets
		l.sources = append(l.sources, "cli:compare-targets")
	}
	if l.cliDefaults.LogLevel != "" && l.cliDefaults.LogLevel != DefaultConfig.LogLevel {
		cfg.LogLevel = l.cliDefaults.LogLevel
		l.sources = append(l.sources, "cli:log-level")
	}
}

func validate(cfg *types.CheckConfig) error {
	if len(cfg.EnvPaths) == 0 && cfg.ExamplePath == "" && cfg.CompareBase == "" {
		return fmt.Errorf("at least one of --env, --example, or --compare-base must be provided")
	}
	if cfg.MaskKeepStart < 0 || cfg.MaskKeepEnd < 0 {
		return fmt.Errorf("mask keep start/end values must be non-negative")
	}
	if cfg.LogLevel != "" {
		validLevels := map[string]bool{"debug": true, "info": true, "warn": true, "error": true, "silent": true}
		if !validLevels[strings.ToLower(cfg.LogLevel)] {
			return fmt.Errorf("invalid log level: %s (must be debug, info, warn, error, silent)", cfg.LogLevel)
		}
	}
	if len(cfg.MaskChar) == 0 {
		cfg.MaskChar = DefaultMaskChar
	}
	return nil
}

func splitAndTrim(s string) []string {
	parts := strings.Split(s, ",")
	result := make([]string, 0, len(parts))
	for _, p := range parts {
		t := strings.TrimSpace(p)
		if t != "" {
			result = append(result, t)
		}
	}
	return result
}

func parseBool(s string, def bool) bool {
	s = strings.ToLower(strings.TrimSpace(s))
	switch s {
	case "1", "true", "yes", "on", "y":
		return true
	case "0", "false", "no", "off", "n":
		return false
	}
	return def
}

func parseInt(s string) (int, error) {
	var n int
	_, err := fmt.Sscanf(strings.TrimSpace(s), "%d", &n)
	return n, err
}

func LoadDotEnvOverrides(paths []string) map[string]string {
	result := map[string]string{}
	for _, p := range paths {
		if _, err := os.Stat(p); err == nil {
			if envs, err := godotenv.Read(p); err == nil {
				for k, v := range envs {
					result[k] = v
				}
			}
		}
	}
	return result
}

func ConfigToJSON(cfg *types.CheckConfig) (string, error) {
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return "", err
	}
	return string(data), nil
}

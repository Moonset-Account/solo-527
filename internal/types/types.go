package types

import "time"

type EnvVar struct {
	Key      string `json:"key"`
	Value    string `json:"value,omitempty"`
	Source   string `json:"source,omitempty"`
	Line     int    `json:"line,omitempty"`
	Required bool   `json:"required,omitempty"`
	Masked   bool   `json:"masked,omitempty"`
	Comment  string `json:"comment,omitempty"`
}

type EnvFile struct {
	Path    string      `json:"path"`
	Label   string      `json:"label"`
	Vars    []EnvVar    `json:"vars"`
	VarMap  map[string]EnvVar `json:"-"`
	ModTime time.Time   `json:"mod_time,omitempty"`
}

type DiffType string

const (
	DiffMissing      DiffType = "missing"
	DiffExtra        DiffType = "extra"
	DiffValueMismatch DiffType = "value_mismatch"
	DiffMatch        DiffType = "match"
)

type DiffItem struct {
	Type       DiffType `json:"type"`
	Key        string   `json:"key"`
	LeftValue  string   `json:"left_value,omitempty"`
	RightValue string   `json:"right_value,omitempty"`
	LeftSource string   `json:"left_source,omitempty"`
	RightSource string  `json:"right_source,omitempty"`
	Severity   string   `json:"severity"`
}

type MissingVar struct {
	Key      string `json:"key"`
	Required bool   `json:"required"`
	Example  string `json:"example,omitempty"`
	Comment  string `json:"comment,omitempty"`
}

type CheckResult struct {
	Timestamp     time.Time    `json:"timestamp"`
	ExitCode      int          `json:"exit_code"`
	Status        string       `json:"status"`
	EnvFiles      []EnvFile    `json:"env_files,omitempty"`
	Diffs         []DiffItem   `json:"diffs,omitempty"`
	Missing       []MissingVar `json:"missing,omitempty"`
	Extra         []string     `json:"extra,omitempty"`
	Summary       Summary      `json:"summary"`
	ConfigUsed    string       `json:"config_used,omitempty"`
	ConfigSources []string     `json:"config_sources,omitempty"`
}

type Summary struct {
	TotalFiles       int `json:"total_files"`
	TotalVars        int `json:"total_vars"`
	MissingCount     int `json:"missing_count"`
	MissingRequired  int `json:"missing_required_count"`
	ExtraCount       int `json:"extra_count"`
	MismatchCount    int `json:"mismatch_count"`
	MatchCount       int `json:"match_count"`
}

type CheckConfig struct {
	EnvPaths       []string     `json:"env_paths" mapstructure:"env-paths"`
	ExamplePath    string       `json:"example_path" mapstructure:"example-path"`
	RequiredVars   []string     `json:"required_vars" mapstructure:"required-vars"`
	MaskKeys       []string     `json:"mask_keys" mapstructure:"mask-keys"`
	MaskPatterns   []string     `json:"mask_patterns" mapstructure:"mask-patterns"`
	MaskAll        bool         `json:"mask_all" mapstructure:"mask-all"`
	MaskChar       string       `json:"mask_char" mapstructure:"mask-char"`
	MaskKeepStart  int          `json:"mask_keep_start" mapstructure:"mask-keep-start"`
	MaskKeepEnd    int          `json:"mask_keep_end" mapstructure:"mask-keep-end"`
	CI             bool         `json:"ci" mapstructure:"ci"`
	JSON           bool         `json:"json" mapstructure:"json"`
	Strict         bool         `json:"strict" mapstructure:"strict"`
	WarnOnExtra    bool         `json:"warn_on_extra" mapstructure:"warn-on-extra"`
	FailOnMismatch bool         `json:"fail_on_mismatch" mapstructure:"fail-on-mismatch"`
	FailOnMissing  bool         `json:"fail_on_missing" mapstructure:"fail-on-missing"`
	Verbose        bool         `json:"verbose" mapstructure:"verbose"`
	Quiet          bool         `json:"quiet" mapstructure:"quiet"`
	ConfigPath     string       `json:"-" mapstructure:"-"`
	LogLevel       string       `json:"log_level" mapstructure:"log-level"`
	CompareBase    string       `json:"compare_base" mapstructure:"compare-base"`
	CompareTargets []string     `json:"compare_targets" mapstructure:"compare-targets"`
}

type AppConfig struct {
	CheckConfig CheckConfig            `json:"check" mapstructure:"check"`
	Profiles    map[string]CheckConfig `json:"profiles" mapstructure:"profiles"`
}

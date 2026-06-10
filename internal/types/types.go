package types

import "time"

const (
	RuleMissingColumn    = "E001"
	RuleTypeMismatch     = "E002"
	RuleEnumOutOfRange   = "E003"
	RuleDateFormatError  = "E004"
	RuleDuplicatePrimary = "E005"
	RuleEmptyFile        = "E006"
	RuleEmptyValue       = "W001"
	RuleUnexpectedColumn = "W002"
)

const (
	SeverityCritical = "CRITICAL"
	SeverityError    = "ERROR"
	SeverityWarning  = "WARNING"
)

var RuleDescriptions = map[string]string{
	RuleMissingColumn:    "缺失必需列",
	RuleTypeMismatch:     "字段类型不匹配",
	RuleEnumOutOfRange:   "枚举值越界",
	RuleDateFormatError:  "日期格式错误",
	RuleDuplicatePrimary: "重复主键",
	RuleEmptyFile:        "文件为空或无数据行",
	RuleEmptyValue:       "字段为空值",
	RuleUnexpectedColumn: "存在未定义的额外列",
}

var RuleSeverities = map[string]string{
	RuleMissingColumn:    SeverityCritical,
	RuleEmptyFile:        SeverityCritical,
	RuleTypeMismatch:     SeverityError,
	RuleEnumOutOfRange:   SeverityError,
	RuleDateFormatError:  SeverityError,
	RuleDuplicatePrimary: SeverityError,
	RuleEmptyValue:       SeverityWarning,
	RuleUnexpectedColumn: SeverityWarning,
}

type ColumnType string

const (
	TypeString  ColumnType = "string"
	TypeInt     ColumnType = "int"
	TypeFloat   ColumnType = "float"
	TypeBool    ColumnType = "bool"
	TypeDate    ColumnType = "date"
	TypeEnum    ColumnType = "enum"
)

type ColumnSchema struct {
	Name        string      `json:"name" yaml:"name"`
	Type        ColumnType  `json:"type" yaml:"type"`
	Required    bool        `json:"required,omitempty" yaml:"required,omitempty"`
	PrimaryKey  bool        `json:"primaryKey,omitempty" yaml:"primaryKey,omitempty"`
	DateFormats []string    `json:"dateFormats,omitempty" yaml:"dateFormats,omitempty"`
	EnumValues  []string    `json:"enumValues,omitempty" yaml:"enumValues,omitempty"`
	Nullable    bool        `json:"nullable,omitempty" yaml:"nullable,omitempty"`
	Min         *float64    `json:"min,omitempty" yaml:"min,omitempty"`
	Max         *float64    `json:"max,omitempty" yaml:"max,omitempty"`
	Pattern     string      `json:"pattern,omitempty" yaml:"pattern,omitempty"`
}

type CSVSchema struct {
	Version       string         `json:"version" yaml:"version"`
	BusinessLine  string         `json:"businessLine" yaml:"businessLine"`
	Name          string         `json:"name" yaml:"name"`
	Description   string         `json:"description,omitempty" yaml:"description,omitempty"`
	Delimiter     string         `json:"delimiter,omitempty" yaml:"delimiter,omitempty"`
	HasHeader     *bool          `json:"hasHeader,omitempty" yaml:"hasHeader,omitempty"`
	Encoding      string         `json:"encoding,omitempty" yaml:"encoding,omitempty"`
	Columns       []ColumnSchema `json:"columns" yaml:"columns"`
	PrimaryKeys   []string       `json:"primaryKeys,omitempty" yaml:"primaryKeys,omitempty"`
	IgnoreRules   []IgnoreRule   `json:"ignoreRules,omitempty" yaml:"ignoreRules,omitempty"`
	CreatedAt     time.Time      `json:"createdAt,omitempty" yaml:"createdAt,omitempty"`
}

func (s *CSVSchema) GetHasHeader() bool {
	if s.HasHeader == nil {
		return true
	}
	return *s.HasHeader
}

type IgnoreRule struct {
	RuleIDs    []string `json:"ruleIds,omitempty" yaml:"ruleIds,omitempty"`
	Columns    []string `json:"columns,omitempty" yaml:"columns,omitempty"`
	Files      []string `json:"files,omitempty" yaml:"files,omitempty"`
	Reason     string   `json:"reason,omitempty" yaml:"reason,omitempty"`
}

type ValidationError struct {
	File       string      `json:"file"`
	Row        int         `json:"row,omitempty"`
	Column     string      `json:"column,omitempty"`
	Value      interface{} `json:"value,omitempty"`
	RuleID     string      `json:"ruleId"`
	RuleDesc   string      `json:"ruleDesc"`
	Severity   string      `json:"severity"`
	Message    string      `json:"message"`
	Expected   interface{} `json:"expected,omitempty"`
	Actual     interface{} `json:"actual,omitempty"`
	OccurredAt time.Time   `json:"occurredAt"`
}

type FileReport struct {
	File        string            `json:"file"`
	Schema      string            `json:"schema"`
	TotalRows   int               `json:"totalRows"`
	ValidRows   int               `json:"validRows"`
	InvalidRows int               `json:"invalidRows"`
	Errors      []ValidationError `json:"errors"`
	ErrorCounts map[string]int    `json:"errorCounts"`
	StartedAt   time.Time         `json:"startedAt"`
	FinishedAt  time.Time         `json:"finishedAt"`
	DurationMs  int64             `json:"durationMs"`
}

type ValidationReport struct {
	Version        string            `json:"version"`
	BusinessLine   string            `json:"businessLine,omitempty"`
	TotalFiles     int               `json:"totalFiles"`
	PassedFiles    int               `json:"passedFiles"`
	FailedFiles    int               `json:"failedFiles"`
	TotalRows      int               `json:"totalRows"`
	TotalErrors    int               `json:"totalErrors"`
	TotalWarnings  int               `json:"totalWarnings"`
	TotalCritical  int               `json:"totalCritical"`
	FileReports    []FileReport      `json:"fileReports"`
	GlobalErrors   map[string]int    `json:"globalErrors"`
	RuleSummary    map[string]int    `json:"ruleSummary"`
	StartedAt      time.Time         `json:"startedAt"`
	FinishedAt     time.Time         `json:"finishedAt"`
	DurationMs     int64             `json:"durationMs"`
	HasCriticalErr bool              `json:"hasCriticalError"`
}

type SampleOptions struct {
	Rows         int
	Random       bool
	OnlyInvalid  bool
	ShowIndex    bool
	Columns      []string
}

type ValidateOptions struct {
	SchemaPath     string
	CSVPaths       []string
	OutputJSON     string
	OutputConsole  bool
	StopOnError    bool
	FailOnWarning  bool
	MaxErrors      int
	IgnoreRules    []string
	IgnoreColumns  []string
	Delimiter      string
}

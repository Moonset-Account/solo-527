package validator

import (
	"fmt"
	"regexp"
	"sort"
	"strings"

	"github.com/datateam/csvvalidator/internal/schema"
)

type Severity string

const (
	SeverityError   Severity = "error"
	SeverityWarning Severity = "warning"
	SeverityInfo    Severity = "info"
)

type ErrorCode string

const (
	ErrMissingRequired   ErrorCode = "MISSING_REQUIRED"
	ErrTypeMismatch      ErrorCode = "TYPE_MISMATCH"
	ErrInvalidEnum       ErrorCode = "INVALID_ENUM"
	ErrPatternMismatch   ErrorCode = "PATTERN_MISMATCH"
	ErrDuplicateKey      ErrorCode = "DUPLICATE_KEY"
	ErrDuplicateUnique   ErrorCode = "DUPLICATE_UNIQUE"
	ErrOutOfRange        ErrorCode = "OUT_OF_RANGE"
	ErrLengthViolation   ErrorCode = "LENGTH_VIOLATION"
	ErrEmptyValue        ErrorCode = "EMPTY_VALUE"
	ErrUnknownColumn     ErrorCode = "UNKNOWN_COLUMN"
	ErrRowColumnMismatch ErrorCode = "ROW_COLUMN_MISMATCH"
)

type ValidationError struct {
	Code       ErrorCode              `json:"code"`
	Severity   Severity               `json:"severity"`
	LineNumber int                    `json:"line_number"`
	FieldName  string                 `json:"field_name,omitempty"`
	Value      string                 `json:"value,omitempty"`
	Message    string                 `json:"message"`
	Suggestion string                 `json:"suggestion,omitempty"`
	Context    map[string]interface{} `json:"context,omitempty"`
}

type FieldStat struct {
	Name          string   `json:"name"`
	TotalPresent  int      `json:"total_present"`
	TotalEmpty    int      `json:"total_empty"`
	DistinctCount int      `json:"distinct_count"`
	SampleValues  []string `json:"sample_values"`
}

type FieldStats struct {
	PerField map[string]FieldStat `json:"per_field"`
}

type ValidationResult struct {
	TotalRows       int                        `json:"total_rows"`
	ValidRows       int                        `json:"valid_rows"`
	InvalidRows     int                        `json:"invalid_rows"`
	Errors          []ValidationError          `json:"errors"`
	Warnings        []ValidationError          `json:"warnings"`
	DuplicateGroups map[string][]int           `json:"duplicate_groups,omitempty"`
	Stats           FieldStats                 `json:"stats"`
	IsValid         bool                       `json:"is_valid"`
}

type Row interface {
	GetLineNumber() int
	GetValues() map[string]string
	GetRaw() []string
}

type CsvRow struct {
	Line   int
	Values map[string]string
	Raw    []string
}

func (r CsvRow) GetLineNumber() int                    { return r.Line }
func (r CsvRow) GetValues() map[string]string           { return r.Values }
func (r CsvRow) GetRaw() []string                       { return r.Raw }

type Validator struct {
	schema     *schema.Schema
	strictMode bool
	maxErrors  int
}

func New(s *schema.Schema, strict bool) *Validator {
	return &Validator{
		schema:     s,
		strictMode: strict,
		maxErrors:  10000,
	}
}

func (v *Validator) Validate(rows []Row) *ValidationResult {
	result := &ValidationResult{
		TotalRows:       len(rows),
		Errors:          make([]ValidationError, 0),
		Warnings:        make([]ValidationError, 0),
		DuplicateGroups: make(map[string][]int),
		Stats:           FieldStats{PerField: make(map[string]FieldStat)},
	}

	v.initStats(rows, result)
	v.checkRequiredFields(rows, result)
	v.checkTypes(rows, result)
	v.checkEnums(rows, result)
	v.checkPatterns(rows, result)
	v.checkRanges(rows, result)
	v.checkLengths(rows, result)
	v.checkUniqueFields(rows, result)
	v.checkPrimaryKeys(rows, result)
	v.checkUniqueKeys(rows, result)
	v.finalizeResult(result)

	return result
}

func (v *Validator) initStats(rows []Row, result *ValidationResult) {
	for _, f := range v.schema.Fields {
		result.Stats.PerField[f.Name] = FieldStat{
			Name:         f.Name,
			SampleValues: make([]string, 0, 5),
		}
	}
	seen := make(map[string]map[string]bool)
	for _, f := range v.schema.Fields {
		seen[f.Name] = make(map[string]bool)
	}
	for _, row := range rows {
		vals := row.GetValues()
		for _, f := range v.schema.Fields {
			stat := result.Stats.PerField[f.Name]
			val := vals[f.Name]
			if val == "" {
				stat.TotalEmpty++
			} else {
				stat.TotalPresent++
				if !seen[f.Name][val] {
					seen[f.Name][val] = true
					stat.DistinctCount++
				}
				if len(stat.SampleValues) < 5 {
					stat.SampleValues = append(stat.SampleValues, val)
				}
			}
			result.Stats.PerField[f.Name] = stat
		}
	}
}

func (v *Validator) checkRequiredFields(rows []Row, result *ValidationResult) {
	for _, row := range rows {
		vals := row.GetValues()
		for _, f := range v.schema.Fields {
			if !f.Required {
				continue
			}
			val := strings.TrimSpace(vals[f.Name])
			if val == "" {
				result.Errors = append(result.Errors, ValidationError{
					Code:       ErrMissingRequired,
					Severity:   SeverityError,
					LineNumber: row.GetLineNumber(),
					FieldName:  f.Name,
					Value:      vals[f.Name],
					Message:    fmt.Sprintf("必填字段 '%s' 为空", f.Name),
					Suggestion: fmt.Sprintf("请在第 %d 行填充字段 '%s' 的值", row.GetLineNumber(), f.Name),
				})
			}
		}
	}
}

func (v *Validator) checkTypes(rows []Row, result *ValidationResult) {
	for _, row := range rows {
		vals := row.GetValues()
		for _, f := range v.schema.Fields {
			val := vals[f.Name]
			if val == "" {
				if f.Nullable || !f.Required {
					continue
				}
			}
			if !f.Required && val == "" {
				continue
			}
			if err := v.validateType(f, val); err != nil {
				result.Errors = append(result.Errors, ValidationError{
					Code:       ErrTypeMismatch,
					Severity:   SeverityError,
					LineNumber: row.GetLineNumber(),
					FieldName:  f.Name,
					Value:      val,
					Message:    fmt.Sprintf("字段 '%s' 类型错误: %v", f.Name, err),
					Suggestion: v.typeSuggestion(f, val),
				})
			}
		}
	}
}

func (v *Validator) validateType(f schema.FieldSchema, val string) error {
	if val == "" {
		return nil
	}
	switch f.Type {
	case schema.TypeString:
		return nil
	case schema.TypeInt:
		if !isInt(val) {
			return fmt.Errorf("期望整数类型 (int)，但得到 '%s'", truncate(val, 30))
		}
	case schema.TypeFloat:
		if !isFloat(val) {
			return fmt.Errorf("期望浮点数类型 (float)，但得到 '%s'", truncate(val, 30))
		}
	case schema.TypeBool:
		if !isBool(val) {
			return fmt.Errorf("期望布尔类型 (bool)，但得到 '%s'，允许值: true, false, 1, 0, yes, no", truncate(val, 30))
		}
	case schema.TypeDate:
		format := f.DateFormat
		if format == "" {
			format = "2006-01-02"
		}
		if !isDate(val, format) {
			return fmt.Errorf("期望日期格式 '%s'，但得到 '%s'", format, truncate(val, 30))
		}
	case schema.TypeDateTime:
		format := f.DateFormat
		if format == "" {
			format = "2006-01-02 15:04:05"
		}
		if !isDate(val, format) {
			return fmt.Errorf("期望日期时间格式 '%s'，但得到 '%s'", format, truncate(val, 30))
		}
	case schema.TypeEmail:
		if !isEmail(val) {
			return fmt.Errorf("期望合法的邮箱地址，但得到 '%s'", truncate(val, 30))
		}
	case schema.TypeURL:
		if !isURL(val) {
			return fmt.Errorf("期望合法的URL地址，但得到 '%s'", truncate(val, 30))
		}
	case schema.TypeEnum:
		return nil
	case schema.TypePattern:
		return nil
	}
	return nil
}

func (v *Validator) typeSuggestion(f schema.FieldSchema, val string) string {
	switch f.Type {
	case schema.TypeInt:
		if isFloat(val) {
			return fmt.Sprintf("值 '%s' 包含小数，请转换为整数或改用 float 类型", val)
		}
		return "请输入纯数字整数（如: 123, -456）"
	case schema.TypeFloat:
		return "请输入数字，可包含小数点（如: 123.45, -67.8）"
	case schema.TypeBool:
		return "请使用: true/false, 1/0, yes/no（不区分大小写）"
	case schema.TypeDate:
		format := f.DateFormat
		if format == "" {
			format = "YYYY-MM-DD"
		}
		return fmt.Sprintf("请按格式填写，例如: %s", format)
	case schema.TypeDateTime:
		format := f.DateFormat
		if format == "" {
			format = "YYYY-MM-DD HH:MM:SS"
		}
		return fmt.Sprintf("请按格式填写，例如: %s", format)
	case schema.TypeEmail:
		return "请填写完整邮箱，例如: name@example.com"
	case schema.TypeURL:
		return "请填写完整URL，例如: https://example.com/path"
	}
	return "请检查值的格式是否符合字段类型要求"
}

func (v *Validator) checkEnums(rows []Row, result *ValidationResult) {
	for _, row := range rows {
		vals := row.GetValues()
		for _, f := range v.schema.Fields {
			if f.Type != schema.TypeEnum {
				continue
			}
			val := vals[f.Name]
			if val == "" {
				continue
			}
			if !containsString(f.EnumValues, val) {
				result.Errors = append(result.Errors, ValidationError{
					Code:       ErrInvalidEnum,
					Severity:   SeverityError,
					LineNumber: row.GetLineNumber(),
					FieldName:  f.Name,
					Value:      val,
					Message:    fmt.Sprintf("字段 '%s' 的值 '%s' 不在允许的枚举值中", f.Name, truncate(val, 30)),
					Suggestion: fmt.Sprintf("允许的值为: %v；请从列表中选择或请求扩展枚举范围", f.EnumValues),
					Context:    map[string]interface{}{"allowed_values": f.EnumValues},
				})
			}
		}
	}
}

func (v *Validator) checkPatterns(rows []Row, result *ValidationResult) {
	for _, row := range rows {
		vals := row.GetValues()
		for _, f := range v.schema.Fields {
			if f.Type != schema.TypePattern || f.Pattern == "" {
				continue
			}
			val := vals[f.Name]
			if val == "" {
				continue
			}
			re, err := regexp.Compile(f.Pattern)
			if err != nil {
				result.Warnings = append(result.Warnings, ValidationError{
					Code:       ErrPatternMismatch,
					Severity:   SeverityWarning,
					LineNumber: 0,
					FieldName:  f.Name,
					Message:    fmt.Sprintf("字段 '%s' 的正则表达式无效: %v", f.Name, err),
					Suggestion: "请联系管理员修复schema中的正则表达式",
				})
				continue
			}
			if !re.MatchString(val) {
				result.Errors = append(result.Errors, ValidationError{
					Code:       ErrPatternMismatch,
					Severity:   SeverityError,
					LineNumber: row.GetLineNumber(),
					FieldName:  f.Name,
					Value:      val,
					Message:    fmt.Sprintf("字段 '%s' 的值 '%s' 不匹配正则模式", f.Name, truncate(val, 30)),
					Suggestion: fmt.Sprintf("值需匹配正则: %s", f.Pattern),
				})
			}
		}
	}
}

func (v *Validator) checkRanges(rows []Row, result *ValidationResult) {
	for _, row := range rows {
		vals := row.GetValues()
		for _, f := range v.schema.Fields {
			if f.MinValue == nil && f.MaxValue == nil {
				continue
			}
			val := vals[f.Name]
			if val == "" {
				continue
			}
			if !(f.Type == schema.TypeInt || f.Type == schema.TypeFloat) {
				continue
			}
			floatVal, ok := parseFloat(val)
			if !ok {
				continue
			}
			if f.MinValue != nil && floatVal < *f.MinValue {
				result.Errors = append(result.Errors, ValidationError{
					Code:       ErrOutOfRange,
					Severity:   SeverityError,
					LineNumber: row.GetLineNumber(),
					FieldName:  f.Name,
					Value:      val,
					Message:    fmt.Sprintf("字段 '%s' = %v 小于最小值 %v", f.Name, floatVal, *f.MinValue),
					Suggestion: fmt.Sprintf("请输入大于等于 %v 的值", *f.MinValue),
				})
			}
			if f.MaxValue != nil && floatVal > *f.MaxValue {
				result.Errors = append(result.Errors, ValidationError{
					Code:       ErrOutOfRange,
					Severity:   SeverityError,
					LineNumber: row.GetLineNumber(),
					FieldName:  f.Name,
					Value:      val,
					Message:    fmt.Sprintf("字段 '%s' = %v 大于最大值 %v", f.Name, floatVal, *f.MaxValue),
					Suggestion: fmt.Sprintf("请输入小于等于 %v 的值", *f.MaxValue),
				})
			}
		}
	}
}

func (v *Validator) checkLengths(rows []Row, result *ValidationResult) {
	for _, row := range rows {
		vals := row.GetValues()
		for _, f := range v.schema.Fields {
			if f.MinLength == nil && f.MaxLength == nil {
				continue
			}
			val := vals[f.Name]
			if val == "" && !f.Required {
				continue
			}
			l := len([]rune(val))
			if f.MinLength != nil && l < *f.MinLength {
				result.Errors = append(result.Errors, ValidationError{
					Code:       ErrLengthViolation,
					Severity:   SeverityError,
					LineNumber: row.GetLineNumber(),
					FieldName:  f.Name,
					Value:      val,
					Message:    fmt.Sprintf("字段 '%s' 长度 %d 小于最小长度 %d", f.Name, l, *f.MinLength),
					Suggestion: fmt.Sprintf("请输入至少 %d 个字符", *f.MinLength),
				})
			}
			if f.MaxLength != nil && l > *f.MaxLength {
				result.Errors = append(result.Errors, ValidationError{
					Code:       ErrLengthViolation,
					Severity:   SeverityError,
					LineNumber: row.GetLineNumber(),
					FieldName:  f.Name,
					Value:      val,
					Message:    fmt.Sprintf("字段 '%s' 长度 %d 大于最大长度 %d", f.Name, l, *f.MaxLength),
					Suggestion: fmt.Sprintf("请将内容缩短至 %d 字符以内（当前 %d 字符）", *f.MaxLength, l),
				})
			}
		}
	}
}

func (v *Validator) checkUniqueFields(rows []Row, result *ValidationResult) {
	uniqueFields := v.schema.UniqueFields()
	for _, field := range uniqueFields {
		seen := make(map[string][]int)
		for _, row := range rows {
			val := row.GetValues()[field]
			if val == "" {
				continue
			}
			seen[val] = append(seen[val], row.GetLineNumber())
		}
		for val, lines := range seen {
			if len(lines) > 1 {
				sort.Ints(lines)
				key := fmt.Sprintf("%s:%s", field, val)
				result.DuplicateGroups[key] = lines
				for _, ln := range lines {
					result.Errors = append(result.Errors, ValidationError{
						Code:       ErrDuplicateUnique,
						Severity:   SeverityError,
						LineNumber: ln,
						FieldName:  field,
						Value:      val,
						Message:    fmt.Sprintf("唯一字段 '%s' 出现重复值 '%s' (行: %v)", field, truncate(val, 30), lines),
						Suggestion: fmt.Sprintf("字段 '%s' 要求唯一，出现在第 %v 行，请合并或删除重复数据", field, lines),
						Context:    map[string]interface{}{"duplicate_lines": lines},
					})
				}
			}
		}
	}
}

func (v *Validator) checkPrimaryKeys(rows []Row, result *ValidationResult) {
	if len(v.schema.PrimaryKeys) == 0 {
		return
	}
	seen := make(map[string][]int)
	for _, row := range rows {
		vals := row.GetValues()
		keyParts := make([]string, len(v.schema.PrimaryKeys))
		allEmpty := true
		for i, pk := range v.schema.PrimaryKeys {
			keyParts[i] = vals[pk]
			if keyParts[i] != "" {
				allEmpty = false
			}
		}
		if allEmpty {
			continue
		}
		key := strings.Join(keyParts, "||")
		seen[key] = append(seen[key], row.GetLineNumber())
	}
	for key, lines := range seen {
		if len(lines) > 1 {
			sort.Ints(lines)
			result.DuplicateGroups[fmt.Sprintf("PK:%s", key)] = lines
			for _, ln := range lines {
				result.Errors = append(result.Errors, ValidationError{
					Code:       ErrDuplicateKey,
					Severity:   SeverityError,
					LineNumber: ln,
					FieldName:  strings.Join(v.schema.PrimaryKeys, ","),
					Value:      key,
					Message:    fmt.Sprintf("主键 (%s) 重复，冲突行: %v", strings.Join(v.schema.PrimaryKeys, ","), lines),
					Suggestion: fmt.Sprintf("主键字段组合必须唯一，冲突行: %v，请修改使每个组合唯一", lines),
					Context:    map[string]interface{}{"primary_keys": v.schema.PrimaryKeys, "duplicate_lines": lines},
				})
			}
		}
	}
}

func (v *Validator) checkUniqueKeys(rows []Row, result *ValidationResult) {
	for groupIdx, ukGroup := range v.schema.UniqueKeys {
		if len(ukGroup) == 0 {
			continue
		}
		seen := make(map[string][]int)
		for _, row := range rows {
			vals := row.GetValues()
			keyParts := make([]string, len(ukGroup))
			allEmpty := true
			for i, k := range ukGroup {
				keyParts[i] = vals[k]
				if keyParts[i] != "" {
					allEmpty = false
				}
			}
			if allEmpty {
				continue
			}
			key := strings.Join(keyParts, "||")
			seen[key] = append(seen[key], row.GetLineNumber())
		}
		for key, lines := range seen {
			if len(lines) > 1 {
				sort.Ints(lines)
				result.DuplicateGroups[fmt.Sprintf("UK%d:%s", groupIdx, key)] = lines
				for _, ln := range lines {
					result.Errors = append(result.Errors, ValidationError{
						Code:       ErrDuplicateUnique,
						Severity:   SeverityError,
						LineNumber: ln,
						FieldName:  strings.Join(ukGroup, ","),
						Value:      key,
						Message:    fmt.Sprintf("唯一键组 (%s) 重复，冲突行: %v", strings.Join(ukGroup, ","), lines),
						Suggestion: fmt.Sprintf("唯一键组合必须唯一，冲突行: %v", lines),
						Context:    map[string]interface{}{"unique_keys": ukGroup, "duplicate_lines": lines},
					})
				}
			}
		}
	}
}

func (v *Validator) finalizeResult(result *ValidationResult) {
	invalidLines := make(map[int]bool)
	for _, e := range result.Errors {
		if e.LineNumber > 0 {
			invalidLines[e.LineNumber] = true
		}
	}
	result.InvalidRows = len(invalidLines)
	result.ValidRows = result.TotalRows - result.InvalidRows
	result.IsValid = len(result.Errors) == 0
}

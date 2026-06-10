package reporter

import (
	"encoding/json"
	"fmt"
	"io"
	"sort"
	"strings"

	"github.com/datateam/csvvalidator/internal/schema"
	"github.com/datateam/csvvalidator/internal/validator"
)

type Format string

const (
	FormatTable Format = "table"
	FormatJSON  Format = "json"
)

type ReportOptions struct {
	Format          Format
	MaxErrorsShown  int
	ShowSamples     bool
	ShowSuggestions bool
	ShowStats       bool
	Schema          *schema.Schema
	CSVFilePath     string
	SchemaFilePath  string
	DryRun          bool
	FixPreview      bool
}

type FullReport struct {
	Meta        ReportMeta                `json:"meta"`
	Summary     Summary                   `json:"summary"`
	Errors      []validator.ValidationError `json:"errors,omitempty"`
	Warnings    []validator.ValidationError `json:"warnings,omitempty"`
	Stats       validator.FieldStats      `json:"stats,omitempty"`
	Suggestions []Suggestion              `json:"suggestions,omitempty"`
	FixActions  []FixAction               `json:"fix_actions,omitempty"`
}

type ReportMeta struct {
	SchemaName    string `json:"schema_name"`
	SchemaVersion string `json:"schema_version,omitempty"`
	SchemaFile    string `json:"schema_file"`
	CSVFile       string `json:"csv_file"`
	Format        string `json:"format"`
	DryRun        bool   `json:"dry_run"`
	GeneratedAt   string `json:"generated_at"`
	IsValid       bool   `json:"is_valid"`
}

type Summary struct {
	TotalRows       int `json:"total_rows"`
	ValidRows       int `json:"valid_rows"`
	InvalidRows     int `json:"invalid_rows"`
	TotalErrors     int `json:"total_errors"`
	TotalWarnings   int `json:"total_warnings"`
	ErrorByType     map[string]int `json:"error_by_type"`
	ErrorByField    map[string]int `json:"error_by_field"`
	PassRatePercent float64 `json:"pass_rate_percent"`
}

type Suggestion struct {
	Field    string `json:"field,omitempty"`
	Code     string `json:"code"`
	Message  string `json:"message"`
	Priority int    `json:"priority"`
}

type FixAction struct {
	LineNumber int               `json:"line_number"`
	FieldName  string            `json:"field_name"`
	ActionType string            `json:"action_type"`
	OldValue   string            `json:"old_value"`
	NewValue   string            `json:"new_value"`
	Reason     string            `json:"reason"`
}

func GenerateReport(
	result *validator.ValidationResult,
	opts *ReportOptions,
) *FullReport {
	report := &FullReport{
		Meta: ReportMeta{
			SchemaName:    opts.Schema.Name,
			SchemaVersion: opts.Schema.Version,
			SchemaFile:    opts.SchemaFilePath,
			CSVFile:       opts.CSVFilePath,
			Format:        string(opts.Format),
			DryRun:        opts.DryRun,
			GeneratedAt:   "runtime",
			IsValid:       result.IsValid,
		},
	}

	report.Summary = buildSummary(result)

	maxErr := opts.MaxErrorsShown
	if maxErr <= 0 {
		maxErr = 50
	}
	if len(result.Errors) > maxErr {
		report.Errors = result.Errors[:maxErr]
	} else {
		report.Errors = result.Errors
	}
	report.Warnings = result.Warnings

	if opts.ShowStats {
		report.Stats = result.Stats
	}

	if opts.ShowSuggestions {
		report.Suggestions = buildSuggestions(result, opts.Schema)
	}

	if opts.FixPreview {
		report.FixActions = buildFixActions(result, opts.Schema)
	}

	return report
}

func buildSummary(result *validator.ValidationResult) Summary {
	byType := make(map[string]int)
	byField := make(map[string]int)
	for _, e := range result.Errors {
		byType[string(e.Code)]++
		if e.FieldName != "" {
			byField[e.FieldName]++
		}
	}
	passRate := 0.0
	if result.TotalRows > 0 {
		passRate = float64(result.ValidRows) / float64(result.TotalRows) * 100.0
	}
	return Summary{
		TotalRows:       result.TotalRows,
		ValidRows:       result.ValidRows,
		InvalidRows:     result.InvalidRows,
		TotalErrors:     len(result.Errors),
		TotalWarnings:   len(result.Warnings),
		ErrorByType:     byType,
		ErrorByField:    byField,
		PassRatePercent: passRate,
	}
}

func buildSuggestions(result *validator.ValidationResult, s *schema.Schema) []Suggestion {
	var sugs []Suggestion
	seen := make(map[string]bool)
	for _, e := range result.Errors {
		key := fmt.Sprintf("%s|%s", e.Code, e.FieldName)
		if seen[key] {
			continue
		}
		seen[key] = true
		prio := 1
		switch e.Code {
		case validator.ErrMissingRequired, validator.ErrDuplicateKey:
			prio = 1
		case validator.ErrTypeMismatch, validator.ErrInvalidEnum:
			prio = 2
		default:
			prio = 3
		}
		sugs = append(sugs, Suggestion{
			Field:    e.FieldName,
			Code:     string(e.Code),
			Message:  e.Suggestion,
			Priority: prio,
		})
	}
	sort.Slice(sugs, func(i, j int) bool {
		if sugs[i].Priority != sugs[j].Priority {
			return sugs[i].Priority < sugs[j].Priority
		}
		return sugs[i].Field < sugs[j].Field
	})
	return sugs
}

func buildFixActions(result *validator.ValidationResult, s *schema.Schema) []FixAction {
	var actions []FixAction
	for _, e := range result.Errors {
		if e.LineNumber <= 0 {
			continue
		}
		action := FixAction{
			LineNumber: e.LineNumber,
			FieldName:  e.FieldName,
			OldValue:   e.Value,
			Reason:     e.Message,
		}
		switch e.Code {
		case validator.ErrTypeMismatch:
			field, ok := s.GetField(e.FieldName)
			if ok {
				action.ActionType = "retype"
				action.NewValue = suggestTypedValue(e.Value, field)
			}
		case validator.ErrMissingRequired:
			action.ActionType = "fill"
			action.NewValue = "[需人工填写]"
		case validator.ErrLengthViolation:
			action.ActionType = "truncate_or_expand"
			action.NewValue = "[需人工调整长度]"
		case validator.ErrInvalidEnum:
			action.ActionType = "map_enum"
			action.NewValue = "[请从枚举中选择]"
		case validator.ErrDuplicateKey, validator.ErrDuplicateUnique:
			action.ActionType = "dedup"
			action.NewValue = "[需人工修改或删除重复行]"
		default:
			action.ActionType = "manual"
			action.NewValue = "[需人工核查]"
		}
		actions = append(actions, action)
	}
	return actions
}

func suggestTypedValue(raw string, f *schema.FieldSchema) string {
	switch f.Type {
	case schema.TypeInt:
		clean := strings.TrimSpace(raw)
		if dotIdx := strings.Index(clean, "."); dotIdx > 0 {
			return clean[:dotIdx]
		}
		return clean
	case schema.TypeBool:
		if raw != "" {
			return "false"
		}
	}
	return raw
}

func (r *FullReport) Render(w io.Writer, format Format) error {
	switch format {
	case FormatJSON:
		return r.renderJSON(w)
	case FormatTable:
		return r.renderTable(w)
	default:
		return r.renderTable(w)
	}
}

func (r *FullReport) renderJSON(w io.Writer) error {
	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	return enc.Encode(r)
}

func (r *FullReport) renderTable(w io.Writer) error {
	lines := []string{}

	lines = append(lines, "")
	lines = append(lines, style("═══════════════════════════════════════════════════════════════", "bold"))
	lines = append(lines, style("  CSV 数据导入校验报告", "bold"))
	lines = append(lines, style("═══════════════════════════════════════════════════════════════", "bold"))
	lines = append(lines, "")

	validStr := style("✓ 通过", "green")
	if !r.Meta.IsValid {
		validStr = style("✗ 未通过", "red")
	}
	lines = append(lines, fmt.Sprintf("  校验结果: %s    合格率: %.1f%%", validStr, r.Summary.PassRatePercent))
	lines = append(lines, fmt.Sprintf("  Schema模型: %s    CSV文件: %s", r.Meta.SchemaName, r.Meta.CSVFile))
	lines = append(lines, "")

	lines = append(lines, style("  ┌─ 概览 ──────────────────────────────────────────────────────┐", "cyan"))
	lines = append(lines, fmt.Sprintf("  │  总行数:        %-45d │", r.Summary.TotalRows))
	lines = append(lines, fmt.Sprintf("  │  有效行:        %s%-45d │", padGreen(r.Summary.ValidRows), r.Summary.ValidRows))
	lines = append(lines, fmt.Sprintf("  │  有问题行:      %s%-45d │", padRed(r.Summary.InvalidRows), r.Summary.InvalidRows))
	lines = append(lines, fmt.Sprintf("  │  错误总数:      %s%-45d │", padRed(r.Summary.TotalErrors), r.Summary.TotalErrors))
	lines = append(lines, fmt.Sprintf("  │  警告总数:      %s%-45d │", padYellow(r.Summary.TotalWarnings), r.Summary.TotalWarnings))
	lines = append(lines, style("  └─────────────────────────────────────────────────────────────┘", "cyan"))
	lines = append(lines, "")

	if len(r.Summary.ErrorByType) > 0 {
		lines = append(lines, style("  错误类型分布:", "bold"))
		lines = append(lines, renderMapTable(r.Summary.ErrorByType, 58))
		lines = append(lines, "")
	}

	if len(r.Summary.ErrorByField) > 0 {
		lines = append(lines, style("  按字段错误统计:", "bold"))
		lines = append(lines, renderMapTable(r.Summary.ErrorByField, 58))
		lines = append(lines, "")
	}

	if len(r.Errors) > 0 {
		lines = append(lines, style("  错误详情 (前 " + itoa(len(r.Errors)) + " 条):", "bold"))
		lines = append(lines, renderErrorsTable(r.Errors))
		lines = append(lines, "")
	}

	if len(r.Warnings) > 0 {
		lines = append(lines, style("  警告信息:", "bold"))
		lines = append(lines, renderErrorsTable(r.Warnings))
		lines = append(lines, "")
	}

	if len(r.Stats.PerField) > 0 {
		lines = append(lines, style("  字段统计概览:", "bold"))
		lines = append(lines, renderStatsTable(r.Stats))
		lines = append(lines, "")
	}

	if len(r.Suggestions) > 0 {
		lines = append(lines, style("  修复建议 (按优先级):", "bold"))
		lines = append(lines, renderSuggestionsTable(r.Suggestions))
		lines = append(lines, "")
	}

	if len(r.FixActions) > 0 {
		lines = append(lines, style("  修复预览 (--fix-preview):", "bold"))
		lines = append(lines, renderFixActionsTable(r.FixActions))
		lines = append(lines, "")
	}

	if r.Meta.DryRun {
		lines = append(lines, style("  [Dry-Run 模式] 未对数据源执行任何修改操作", "yellow"))
		lines = append(lines, "")
	}

	if !r.Meta.IsValid {
		lines = append(lines, style("  建议: 根据上方错误详情修复CSV文件后重新执行校验。", "bold"))
	} else {
		lines = append(lines, style("  ✓ 所有检查项均已通过，数据可以安全导入。", "green"))
	}
	lines = append(lines, "")

	fmt.Fprintln(w, strings.Join(lines, "\n"))
	return nil
}

func renderMapTable(m map[string]int, width int) string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	var lines []string
	for _, k := range keys {
		v := m[k]
		bar := strings.Repeat("█", min(v, 30))
		valStr := fmt.Sprintf("%d", v)
		padding := width - len(k) - len(valStr) - len(bar) - 8
		if padding < 0 {
			padding = 0
		}
		lines = append(lines, fmt.Sprintf("    %-20s %s %s%s", k, bar, strings.Repeat(" ", padding), valStr))
	}
	return strings.Join(lines, "\n")
}

func renderErrorsTable(errors []validator.ValidationError) string {
	var lines []string
	lines = append(lines, fmt.Sprintf("    %-6s │ %-22s │ %-20s │ %s", "行号", "字段/错误码", "值(截断)", "说明"))
	lines = append(lines, "    ──────────────────────────────────────────────────────────────────────────")
	for _, e := range errors {
		fieldInfo := e.FieldName
		if fieldInfo == "" {
			fieldInfo = "-"
		}
		fieldInfo += " [" + string(e.Code) + "]"
		val := truncate(e.Value, 18)
		if val == "" {
			val = "(空)"
		}
		msg := truncate(e.Message, 45)
		lineNum := ""
		if e.LineNumber > 0 {
			lineNum = fmt.Sprintf("%d", e.LineNumber)
		}
		lines = append(lines, fmt.Sprintf("    %-6s │ %-22s │ %-20s │ %s", lineNum, truncate(fieldInfo, 22), val, msg))
	}
	return strings.Join(lines, "\n")
}

func renderStatsTable(stats validator.FieldStats) string {
	var lines []string
	lines = append(lines, fmt.Sprintf("    %-18s │ %-8s │ %-8s │ %-10s │ %s", "字段", "有值", "空值", "去重数", "样例值"))
	lines = append(lines, "    ──────────────────────────────────────────────────────────────────────────")
	keys := make([]string, 0, len(stats.PerField))
	for k := range stats.PerField {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		s := stats.PerField[k]
		samples := strings.Join(s.SampleValues, ", ")
		if len(samples) > 35 {
			samples = samples[:35] + "..."
		}
		lines = append(lines, fmt.Sprintf("    %-18s │ %-8d │ %-8d │ %-10d │ %s",
			truncate(k, 18), s.TotalPresent, s.TotalEmpty, s.DistinctCount, samples))
	}
	return strings.Join(lines, "\n")
}

func renderSuggestionsTable(sugs []Suggestion) string {
	var lines []string
	lines = append(lines, fmt.Sprintf("    %-3s │ %-18s │ %s", "优先级", "字段/错误码", "建议"))
	lines = append(lines, "    ──────────────────────────────────────────────────────────────────────────")
	for i, s := range sugs {
		_ = i
		prioStr := fmt.Sprintf("P%d", s.Priority)
		fieldInfo := s.Field
		if fieldInfo == "" {
			fieldInfo = "-"
		}
		fieldInfo += " [" + s.Code + "]"
		lines = append(lines, fmt.Sprintf("    %-3s │ %-18s │ %s", prioStr, truncate(fieldInfo, 18), truncate(s.Message, 80)))
	}
	return strings.Join(lines, "\n")
}

func renderFixActionsTable(actions []FixAction) string {
	var lines []string
	lines = append(lines, fmt.Sprintf("    %-6s │ %-15s │ %-10s │ %s -> %s", "行号", "字段", "操作", "原值", "建议值"))
	lines = append(lines, "    ──────────────────────────────────────────────────────────────────────────")
	maxShow := 20
	if len(actions) < maxShow {
		maxShow = len(actions)
	}
	for _, a := range actions[:maxShow] {
		old := a.OldValue
		if old == "" {
			old = "(空)"
		}
		lines = append(lines, fmt.Sprintf("    %-6d │ %-15s │ %-10s │ %s -> %s",
			a.LineNumber, truncate(a.FieldName, 15), a.ActionType,
			truncate(old, 15), truncate(a.NewValue, 20)))
	}
	if len(actions) > maxShow {
		lines = append(lines, fmt.Sprintf("    ... (省略 %d 条，使用 --report json 查看完整列表)", len(actions)-maxShow))
	}
	return strings.Join(lines, "\n")
}

func truncate(s string, max int) string {
	runes := []rune(s)
	if len(runes) <= max {
		return s
	}
	return string(runes[:max]) + "…"
}

func itoa(i int) string { return fmt.Sprintf("%d", i) }

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func style(text, kind string) string {
	colors := map[string]string{
		"red":     "\033[31m",
		"green":   "\033[32m",
		"yellow":  "\033[33m",
		"blue":    "\033[34m",
		"magenta": "\033[35m",
		"cyan":    "\033[36m",
		"bold":    "\033[1m",
		"reset":   "\033[0m",
	}
	reset := colors["reset"]
	return fmt.Sprintf("%s%s%s", colors[kind], text, reset)
}

func padGreen(n int) string {
	if n > 0 {
		return "\033[32m"
	}
	return ""
}
func padRed(n int) string {
	if n > 0 {
		return "\033[31m"
	}
	return ""
}
func padYellow(n int) string {
	if n > 0 {
		return "\033[33m"
	}
	return ""
}

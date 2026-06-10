package validator

import (
	"bufio"
	"encoding/csv"
	"fmt"
	"io"
	"math"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"csvchecker/internal/ignore"
	"csvchecker/internal/types"
)

type Validator struct {
	schema      *types.CSVSchema
	ignoreMgr   *ignore.Manager
	maxErrors   int
	stopOnError bool
	delimiter   rune
}

func New(schema *types.CSVSchema, mgr *ignore.Manager) *Validator {
	delim := ','
	if schema != nil && len(schema.Delimiter) > 0 {
		runes := []rune(schema.Delimiter)
		if len(runes) > 0 {
			delim = runes[0]
		}
	}
	return &Validator{
		schema:      schema,
		ignoreMgr:   mgr,
		maxErrors:   0,
		stopOnError: false,
		delimiter:   delim,
	}
}

func (v *Validator) SetMaxErrors(n int) { v.maxErrors = n }
func (v *Validator) SetStopOnError(b bool) { v.stopOnError = b }
func (v *Validator) SetDelimiter(d rune) { v.delimiter = d }

func (v *Validator) ValidateFile(csvPath string) (*types.FileReport, error) {
	start := time.Now()
	absPath, _ := filepath.Abs(csvPath)

	report := &types.FileReport{
		File:        absPath,
		Schema:      v.schema.Name,
		ErrorCounts: make(map[string]int),
		Errors:      []types.ValidationError{},
		StartedAt:   start,
	}

	fi, err := os.Stat(absPath)
	if err != nil {
		return report, fmt.Errorf("stat file failed: %w", err)
	}
	if fi.Size() == 0 {
		report.Errors = append(report.Errors, v.newError(absPath, 0, "", nil,
			types.RuleEmptyFile, "文件大小为 0，无任何内容"))
		report.FinishedAt = time.Now()
		report.DurationMs = time.Since(start).Milliseconds()
		v.summarize(report)
		return report, nil
	}

	f, err := os.Open(absPath)
	if err != nil {
		return report, fmt.Errorf("open file failed: %w", err)
	}
	defer f.Close()

	reader := csv.NewReader(bufio.NewReader(f))
	reader.Comma = v.delimiter
	reader.LazyQuotes = true
	reader.FieldsPerRecord = -1

	var header []string
	var headerMap map[string]int
	rowNum := 0
	primaryKeySet := make(map[string]int)
	invalidRows := make(map[int]bool)
	patternCache := make(map[string]*regexp.Regexp)

	for {
		row, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			report.Errors = append(report.Errors, v.newError(absPath, rowNum+1, "", nil,
				types.RuleEmptyFile, fmt.Sprintf("CSV 解析错误: %v", err)))
			break
		}

		rowNum++
		if v.schema.GetHasHeader() && rowNum == 1 {
			header = row
			headerMap = make(map[string]int)
			for i, col := range header {
				headerMap[strings.TrimSpace(col)] = i
			}
			headerErrs := v.validateHeader(absPath, header, headerMap)
			for _, e := range headerErrs {
				report.Errors = append(report.Errors, e)
				report.ErrorCounts[e.RuleID]++
				if e.Severity == types.SeverityCritical {
					report.FinishedAt = time.Now()
					report.DurationMs = time.Since(start).Milliseconds()
					v.summarize(report)
					return report, nil
				}
			}
			continue
		}

		report.TotalRows++
		if len(row) == 0 {
			continue
		}

		hasError := false
		rowErrors := v.validateRow(absPath, rowNum, row, header, headerMap, primaryKeySet, patternCache)
		for _, e := range rowErrors {
			report.Errors = append(report.Errors, e)
			report.ErrorCounts[e.RuleID]++
			hasError = true
			if v.stopOnError && (e.Severity == types.SeverityError || e.Severity == types.SeverityCritical) {
				break
			}
		}
		if hasError {
			invalidRows[rowNum] = true
			report.InvalidRows++
		}

		if v.maxErrors > 0 && len(report.Errors) >= v.maxErrors {
			break
		}
	}

	if rowNum == 0 || (v.schema.GetHasHeader() && rowNum == 1 && report.TotalRows == 0) {
		report.Errors = append(report.Errors, v.newError(absPath, 0, "", nil,
			types.RuleEmptyFile, "文件中没有任何数据行"))
	}

	report.ValidRows = report.TotalRows - report.InvalidRows
	report.FinishedAt = time.Now()
	report.DurationMs = time.Since(start).Milliseconds()

	v.summarize(report)
	return report, nil
}

func (v *Validator) validateHeader(file string, header []string, headerMap map[string]int) []types.ValidationError {
	var errs []types.ValidationError
	required := v.requiredColumns()
	for _, col := range required {
		if _, ok := headerMap[col]; !ok {
			errs = append(errs, v.newError(file, 0, col, nil,
				types.RuleMissingColumn, fmt.Sprintf("缺失必需列: %s", col)))
		}
	}

	definedCols := make(map[string]bool)
	for _, c := range v.schema.Columns {
		definedCols[c.Name] = true
	}
	for _, h := range header {
		h = strings.TrimSpace(h)
		if !definedCols[h] {
			errs = append(errs, v.newError(file, 1, h, nil,
				types.RuleUnexpectedColumn, fmt.Sprintf("CSV 中存在未定义的额外列: %s", h)))
		}
	}
	return errs
}

func (v *Validator) validateRow(file string, rowNum int, row []string,
	header []string, headerMap map[string]int,
	pkSet map[string]int, patternCache map[string]*regexp.Regexp) []types.ValidationError {

	var errs []types.ValidationError

	for _, col := range v.schema.Columns {
		idx := -1
		if headerMap != nil {
			if i, ok := headerMap[col.Name]; ok {
				idx = i
			}
		} else {
			colIdx := v.indexOfColumn(col.Name)
			if colIdx >= 0 && colIdx < len(row) {
				idx = colIdx
			}
		}

		var rawVal string
		if idx >= 0 && idx < len(row) {
			rawVal = strings.TrimSpace(row[idx])
		}

		if rawVal == "" {
			if col.Required || col.PrimaryKey {
				if !col.Nullable {
					errs = append(errs, v.newError(file, rowNum, col.Name, rawVal,
						types.RuleEmptyValue, fmt.Sprintf("必需列 [%s] 为空值", col.Name)))
				}
			}
			continue
		}

		colErrs := v.validateValue(file, rowNum, col, rawVal, patternCache)
		errs = append(errs, colErrs...)
	}

	pkErrs := v.checkPrimaryKey(file, rowNum, row, header, headerMap, pkSet)
	errs = append(errs, pkErrs...)

	return errs
}

func (v *Validator) validateValue(file string, rowNum int, col types.ColumnSchema,
	raw string, patternCache map[string]*regexp.Regexp) []types.ValidationError {

	var errs []types.ValidationError

	switch col.Type {
	case types.TypeInt:
		iv, err := strconv.ParseInt(raw, 10, 64)
		if err != nil {
			errs = append(errs, v.newErrorWithActual(file, rowNum, col.Name, raw,
				types.RuleTypeMismatch,
				fmt.Sprintf("列 [%s] 期望整数类型，实际值 '%s' 无法转换", col.Name, raw),
				"int", raw))
		} else {
			if col.Min != nil && float64(iv) < *col.Min {
				errs = append(errs, v.newErrorWithActual(file, rowNum, col.Name, raw,
					types.RuleTypeMismatch,
					fmt.Sprintf("列 [%s] 值 %d 小于最小值 %v", col.Name, iv, *col.Min),
					fmt.Sprintf(">= %v", *col.Min), iv))
			}
			if col.Max != nil && float64(iv) > *col.Max {
				errs = append(errs, v.newErrorWithActual(file, rowNum, col.Name, raw,
					types.RuleTypeMismatch,
					fmt.Sprintf("列 [%s] 值 %d 大于最大值 %v", col.Name, iv, *col.Max),
					fmt.Sprintf("<= %v", *col.Max), iv))
			}
		}

	case types.TypeFloat:
		fv, err := strconv.ParseFloat(raw, 64)
		if err != nil {
			errs = append(errs, v.newErrorWithActual(file, rowNum, col.Name, raw,
				types.RuleTypeMismatch,
				fmt.Sprintf("列 [%s] 期望浮点类型，实际值 '%s' 无法转换", col.Name, raw),
				"float", raw))
		} else {
			if col.Min != nil && fv < *col.Min {
				errs = append(errs, v.newErrorWithActual(file, rowNum, col.Name, raw,
					types.RuleTypeMismatch,
					fmt.Sprintf("列 [%s] 值 %v 小于最小值 %v", col.Name, fv, *col.Min),
					fmt.Sprintf(">= %v", *col.Min), fv))
			}
			if col.Max != nil && fv > *col.Max {
				errs = append(errs, v.newErrorWithActual(file, rowNum, col.Name, raw,
					types.RuleTypeMismatch,
					fmt.Sprintf("列 [%s] 值 %v 大于最大值 %v", col.Name, fv, *col.Max),
					fmt.Sprintf("<= %v", *col.Max), fv))
			}
		}

	case types.TypeBool:
		_, err := parseBool(raw)
		if err != nil {
			errs = append(errs, v.newErrorWithActual(file, rowNum, col.Name, raw,
				types.RuleTypeMismatch,
				fmt.Sprintf("列 [%s] 期望布尔类型，实际值 '%s' 无法转换 (支持: true/false/1/0/yes/no)", col.Name, raw),
				"bool", raw))
		}

	case types.TypeDate:
		formats := col.DateFormats
		if len(formats) == 0 {
			formats = []string{"2006-01-02", "2006/01/02", "2006-01-02 15:04:05"}
		}
		ok := false
		for _, f := range formats {
			if _, err := time.Parse(f, raw); err == nil {
				ok = true
				break
			}
		}
		if !ok {
			errs = append(errs, v.newErrorWithActual(file, rowNum, col.Name, raw,
				types.RuleDateFormatError,
				fmt.Sprintf("列 [%s] 日期 '%s' 格式不匹配 (支持格式: %s)", col.Name, raw, strings.Join(formats, ", ")),
				strings.Join(formats, ", "), raw))
		}

	case types.TypeEnum:
		enumSet := make(map[string]bool)
		for _, ev := range col.EnumValues {
			enumSet[strings.TrimSpace(ev)] = true
		}
		if !enumSet[raw] {
			errs = append(errs, v.newErrorWithActual(file, rowNum, col.Name, raw,
				types.RuleEnumOutOfRange,
				fmt.Sprintf("列 [%s] 值 '%s' 不在枚举范围内，允许值: [%s]",
					col.Name, raw, strings.Join(col.EnumValues, ", ")),
				strings.Join(col.EnumValues, ", "), raw))
		}

	case types.TypeString:
		if col.Pattern != "" {
			re, ok := patternCache[col.Pattern]
			if !ok {
				var err error
				re, err = regexp.Compile(col.Pattern)
				if err != nil {
					break
				}
				patternCache[col.Pattern] = re
			}
			if !re.MatchString(raw) {
				errs = append(errs, v.newErrorWithActual(file, rowNum, col.Name, raw,
					types.RuleTypeMismatch,
					fmt.Sprintf("列 [%s] 值 '%s' 不匹配正则模式: %s", col.Name, raw, col.Pattern),
					col.Pattern, raw))
			}
		}
		if col.Min != nil && float64(len(raw)) < *col.Min {
			errs = append(errs, v.newErrorWithActual(file, rowNum, col.Name, raw,
				types.RuleTypeMismatch,
				fmt.Sprintf("列 [%s] 字符串长度 %d 小于最小长度 %v", col.Name, len(raw), *col.Min),
				fmt.Sprintf("length >= %v", *col.Min), raw))
		}
		if col.Max != nil && float64(len(raw)) > *col.Max {
			errs = append(errs, v.newErrorWithActual(file, rowNum, col.Name, raw,
				types.RuleTypeMismatch,
				fmt.Sprintf("列 [%s] 字符串长度 %d 大于最大长度 %v", col.Name, len(raw), *col.Max),
				fmt.Sprintf("length <= %v", *col.Max), raw))
		}
	}

	return errs
}

func (v *Validator) checkPrimaryKey(file string, rowNum int, row []string,
	header []string, headerMap map[string]int, pkSet map[string]int) []types.ValidationError {

	pks := v.schema.PrimaryKeys
	if len(pks) == 0 {
		return nil
	}

	parts := make([]string, 0, len(pks))
	for _, pk := range pks {
		idx := -1
		if headerMap != nil {
			if i, ok := headerMap[pk]; ok {
				idx = i
			}
		} else {
			idx = v.indexOfColumn(pk)
		}
		if idx >= 0 && idx < len(row) {
			parts = append(parts, strings.TrimSpace(row[idx]))
		} else {
			parts = append(parts, "")
		}
	}

	pkKey := strings.Join(parts, "|||")
	for _, p := range parts {
		if p == "" {
			return nil
		}
	}
	if prev, ok := pkSet[pkKey]; ok {
		pkVal := strings.Join(parts, ", ")
		return []types.ValidationError{
			v.newErrorWithActual(file, rowNum, strings.Join(pks, ","), pkVal,
				types.RuleDuplicatePrimary,
				fmt.Sprintf("主键 [%s] = (%s) 在第 %d 行已存在，当前第 %d 行重复",
					strings.Join(pks, ","), pkVal, prev, rowNum),
				fmt.Sprintf("唯一值 (出现于第%d行)", prev),
				pkVal),
		}
	}
	pkSet[pkKey] = rowNum
	return nil
}

func (v *Validator) SampleFile(csvPath string, opt types.SampleOptions) ([][]string, []string, error) {
	absPath, _ := filepath.Abs(csvPath)
	f, err := os.Open(absPath)
	if err != nil {
		return nil, nil, err
	}
	defer f.Close()

	reader := csv.NewReader(bufio.NewReader(f))
	reader.Comma = v.delimiter
	reader.LazyQuotes = true
	reader.FieldsPerRecord = -1

	var header []string
	var allRows [][]string
	rowNum := 0

	for {
		row, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			break
		}
		rowNum++
		if v.schema.GetHasHeader() && rowNum == 1 {
			header = row
			continue
		}
		if opt.ShowIndex {
			row = append([]string{fmt.Sprintf("%d", rowNum)}, row...)
		}
		allRows = append(allRows, row)
	}

	if opt.Random && len(allRows) > opt.Rows {
		shuffle(allRows)
	}

	if len(allRows) > opt.Rows {
		allRows = allRows[:opt.Rows]
	}

	if len(opt.Columns) > 0 && header != nil {
		idxs := make([]int, 0, len(opt.Columns))
		headerIdx := make(map[string]int)
		startOff := 0
		if opt.ShowIndex {
			headerIdx["#"] = 0
			startOff = 1
		}
		for i, h := range header {
			headerIdx[h] = i + startOff
		}
		for _, c := range opt.Columns {
			if idx, ok := headerIdx[c]; ok {
				idxs = append(idxs, idx)
			}
		}
		if len(idxs) > 0 {
			if opt.ShowIndex {
				header = append([]string{"#"}, header...)
			}
			nh := make([]string, len(idxs))
			for i, idx := range idxs {
				if idx < len(header) {
					nh[i] = header[idx]
				}
			}
			header = nh
			nr := make([][]string, len(allRows))
			for r, row := range allRows {
				nr[r] = make([]string, len(idxs))
				for i, idx := range idxs {
					if idx < len(row) {
						nr[r][i] = row[idx]
					}
				}
			}
			allRows = nr
		}
	} else if opt.ShowIndex && header != nil {
		header = append([]string{"#"}, header...)
	}

	return allRows, header, nil
}

func (v *Validator) newError(file string, row int, col string, val interface{}, ruleID, msg string) types.ValidationError {
	return types.ValidationError{
		File:       file,
		Row:        row,
		Column:     col,
		Value:      val,
		RuleID:     ruleID,
		RuleDesc:   types.RuleDescriptions[ruleID],
		Severity:   types.RuleSeverities[ruleID],
		Message:    msg,
		OccurredAt: time.Now(),
	}
}

func (v *Validator) newErrorWithActual(file string, row int, col string, val interface{},
	ruleID, msg string, expected, actual interface{}) types.ValidationError {
	e := v.newError(file, row, col, val, ruleID, msg)
	e.Expected = expected
	e.Actual = actual
	return e
}

func (v *Validator) summarize(r *types.FileReport) {
	if v.ignoreMgr != nil {
		r.Errors = v.ignoreMgr.Filter(r.Errors)
		newCounts := make(map[string]int)
		for _, e := range r.Errors {
			newCounts[e.RuleID]++
		}
		r.ErrorCounts = newCounts
	}
}

func (v *Validator) requiredColumns() []string {
	var req []string
	for _, c := range v.schema.Columns {
		if c.Required || c.PrimaryKey {
			req = append(req, c.Name)
		}
	}
	return req
}

func (v *Validator) indexOfColumn(name string) int {
	for i, c := range v.schema.Columns {
		if c.Name == name {
			return i
		}
	}
	return -1
}

func parseBool(s string) (bool, error) {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "true", "1", "yes", "y", "t", "是":
		return true, nil
	case "false", "0", "no", "n", "f", "否":
		return false, nil
	}
	return false, fmt.Errorf("invalid bool: %s", s)
}

func shuffle(a [][]string) {
	for i := len(a) - 1; i > 0; i-- {
		j := int(math.Abs(float64(hashInt(i)))) % (i + 1)
		a[i], a[j] = a[j], a[i]
	}
}

func hashInt(n int) int {
	return n * 2654435761 % 1000000
}

func RunBatch(v *Validator, paths []string) *types.ValidationReport {
	start := time.Now()
	report := &types.ValidationReport{
		Version:      v.schema.Version,
		BusinessLine: v.schema.BusinessLine,
		FileReports:  make([]types.FileReport, 0, len(paths)),
		GlobalErrors: make(map[string]int),
		RuleSummary:  make(map[string]int),
		StartedAt:    start,
	}

	for _, p := range paths {
		fr, err := v.ValidateFile(p)
		if err != nil {
			fr.Errors = append(fr.Errors, types.ValidationError{
				File:       p,
				RuleID:     "SYS001",
				RuleDesc:   "系统错误",
				Severity:   types.SeverityCritical,
				Message:    fmt.Sprintf("文件处理失败: %v", err),
				OccurredAt: time.Now(),
			})
		}
		report.FileReports = append(report.FileReports, *fr)
		report.TotalFiles++
		report.TotalRows += fr.TotalRows
		fileHasErr := false
		fileHasCrit := false
		for _, e := range fr.Errors {
			report.TotalErrors++
			report.GlobalErrors[e.RuleID]++
			report.RuleSummary[e.RuleID]++
			if e.Severity == types.SeverityWarning {
				report.TotalWarnings++
			}
			if e.Severity == types.SeverityCritical {
				report.TotalCritical++
				fileHasCrit = true
			}
			fileHasErr = true
		}
		if fileHasErr {
			report.FailedFiles++
		} else {
			report.PassedFiles++
		}
		if fileHasCrit {
			report.HasCriticalErr = true
		}
	}

	report.FinishedAt = time.Now()
	report.DurationMs = time.Since(start).Milliseconds()
	return report
}

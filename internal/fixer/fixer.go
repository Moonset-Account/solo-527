package fixer

import (
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/datateam/csvvalidator/internal/schema"
	"github.com/datateam/csvvalidator/internal/validator"
)

type Fix struct {
	Line       int
	Column     int
	Field      string
	Old        string
	New        string
	Reason     string
	Confidence float64
}

type FixPreview struct {
	TotalAffectedRows int
	TotalAffectedCols int
	Fixes             []Fix
	SkippedRows       []int
}

func GeneratePreview(
	rows []validator.Row,
	s *schema.Schema,
	result *validator.ValidationResult,
) *FixPreview {
	fp := &FixPreview{
		Fixes:       make([]Fix, 0),
		SkippedRows: make([]int, 0),
	}
	affectedRows := make(map[int]bool)
	affectedFields := make(map[string]bool)

	processedLine := make(map[int]map[string]bool)

	for _, err := range result.Errors {
		if err.LineNumber <= 0 {
			continue
		}
		if processedLine[err.LineNumber] == nil {
			processedLine[err.LineNumber] = make(map[string]bool)
		}
		if err.FieldName != "" && processedLine[err.LineNumber][err.FieldName] {
			continue
		}
		if err.FieldName != "" {
			processedLine[err.LineNumber][err.FieldName] = true
		}

		f, fieldOk := s.GetField(err.FieldName)
		var rowValues map[string]string
		for _, r := range rows {
			if r.GetLineNumber() == err.LineNumber {
				rowValues = r.GetValues()
				break
			}
		}

		switch err.Code {
		case validator.ErrTypeMismatch:
			if !fieldOk || rowValues == nil {
				continue
			}
			old := rowValues[err.FieldName]
			newVal, ok := tryRetype(old, f)
			if ok {
				fp.Fixes = append(fp.Fixes, Fix{
					Line:       err.LineNumber,
					Field:      err.FieldName,
					Old:        old,
					New:        newVal,
					Reason:     "类型修正: " + err.Message,
					Confidence: 0.8,
				})
				affectedRows[err.LineNumber] = true
				affectedFields[err.FieldName] = true
			}

		case validator.ErrMissingRequired:
			if rowValues != nil {
				fp.Fixes = append(fp.Fixes, Fix{
					Line:       err.LineNumber,
					Field:      err.FieldName,
					Old:        rowValues[err.FieldName],
					New:        "[MANUAL_INPUT_REQUIRED]",
					Reason:     "必填字段为空 - 需要人工补充",
					Confidence: 0.3,
				})
				affectedRows[err.LineNumber] = true
				affectedFields[err.FieldName] = true
			}

		case validator.ErrInvalidEnum:
			if !fieldOk {
				continue
			}
			old := err.Value
			newVal, ok := suggestEnum(old, f.EnumValues)
			if ok {
				fp.Fixes = append(fp.Fixes, Fix{
					Line:       err.LineNumber,
					Field:      err.FieldName,
					Old:        old,
					New:        newVal,
					Reason:     "枚举值匹配建议",
					Confidence: 0.9,
				})
			} else {
				fp.Fixes = append(fp.Fixes, Fix{
					Line:       err.LineNumber,
					Field:      err.FieldName,
					Old:        old,
					New:        fmt.Sprintf("[INVALID_ENUM: %s]", old),
					Reason:     "枚举值不合法，需要人工处理",
					Confidence: 0.1,
				})
			}
			affectedRows[err.LineNumber] = true
			affectedFields[err.FieldName] = true

		case validator.ErrLengthViolation:
			if fieldOk && f.MaxLength != nil {
				old := err.Value
				runes := []rune(old)
				if len(runes) > *f.MaxLength {
					newVal := string(runes[:*f.MaxLength])
					fp.Fixes = append(fp.Fixes, Fix{
						Line:       err.LineNumber,
						Field:      err.FieldName,
						Old:        old,
						New:        newVal,
						Reason:     fmt.Sprintf("截断至最大长度 %d", *f.MaxLength),
						Confidence: 0.6,
					})
					affectedRows[err.LineNumber] = true
					affectedFields[err.FieldName] = true
				}
			}

		case validator.ErrOutOfRange:
			if fieldOk && rowValues != nil {
				old := rowValues[err.FieldName]
				fp.Fixes = append(fp.Fixes, Fix{
					Line:       err.LineNumber,
					Field:      err.FieldName,
					Old:        old,
					New:        fmt.Sprintf("[OUT_OF_RANGE: %s]", old),
					Reason:     "数值超出范围 - 需要人工核查",
					Confidence: 0.2,
				})
				affectedRows[err.LineNumber] = true
				affectedFields[err.FieldName] = true
			}

		case validator.ErrDuplicateKey, validator.ErrDuplicateUnique:
			fp.SkippedRows = append(fp.SkippedRows, err.LineNumber)
			fp.Fixes = append(fp.Fixes, Fix{
				Line:       err.LineNumber,
				Field:      err.FieldName,
				Old:        err.Value,
				New:        "[DUPLICATE_ROW - 建议删除或修改]",
				Reason:     err.Message,
				Confidence: 0.0,
			})
			affectedRows[err.LineNumber] = true
			affectedFields[err.FieldName] = true
		}
	}

	fp.TotalAffectedRows = len(affectedRows)
	fp.TotalAffectedCols = len(affectedFields)
	return fp
}

func tryRetype(value string, f *schema.FieldSchema) (string, bool) {
	value = strings.TrimSpace(value)
	if value == "" {
		return "", false
	}
	switch f.Type {
	case schema.TypeInt:
		if matched, _ := regexp.MatchString(`^-?\d+\.\d+$`, value); matched {
			idx := strings.Index(value, ".")
			return value[:idx], true
		}
		if re := regexp.MustCompile(`[^-\d]`); re.MatchString(value) {
			clean := re.ReplaceAllString(value, "")
			if clean != "" {
				return clean, true
			}
		}
	case schema.TypeFloat:
		if strings.Contains(value, ",") {
			return strings.ReplaceAll(value, ",", "."), true
		}
	case schema.TypeBool:
		lower := strings.ToLower(value)
		truthy := map[string]string{"是": "true", "否": "false", "对": "true", "错": "false"}
		if v, ok := truthy[lower]; ok {
			return v, true
		}
	case schema.TypeDate:
		return reformatDateFlexible(value, f.DateFormat)
	case schema.TypeEmail:
		if !strings.Contains(value, "@") {
			domains := []string{"@example.com", "@company.com"}
			return value + domains[0], true
		}
	}
	return value, false
}

func reformatDateFlexible(value, targetLayout string) (string, bool) {
	if targetLayout == "" {
		targetLayout = "2006-01-02"
	}
	formats := []string{
		"2006/01/02", "02-01-2006", "01/02/2006",
		"2006年01月02日", "2006.01.02", "20060102",
	}
	for _, layout := range formats {
		t, err := time.Parse(layout, value)
		if err == nil {
			newVal := t.Format(targetLayout)
			if newVal != value {
				return newVal, true
			}
		}
	}
	return value, false
}

func suggestEnum(value string, allowed []string) (string, bool) {
	lower := strings.ToLower(strings.TrimSpace(value))
	for _, a := range allowed {
		if strings.ToLower(a) == lower {
			return a, true
		}
	}
	best := ""
	var bestScore float64
	for _, a := range allowed {
		score := similarity(lower, strings.ToLower(a))
		if score > bestScore && score >= 0.7 {
			bestScore = score
			best = a
		}
	}
	if best != "" {
		return best, true
	}
	return "", false
}

func similarity(a, b string) float64 {
	if a == b {
		return 1.0
	}
	la, lb := len([]rune(a)), len([]rune(b))
	if la == 0 || lb == 0 {
		return 0.0
	}
	maxLen := la
	if lb > maxLen {
		maxLen = lb
	}
	dist := levenshtein(a, b)
	return float64(maxLen-dist) / float64(maxLen)
}

func levenshtein(a, b string) int {
	ra := []rune(a)
	rb := []rune(b)
	m, n := len(ra), len(rb)
	d := make([][]int, m+1)
	for i := range d {
		d[i] = make([]int, n+1)
	}
	for i := 0; i <= m; i++ {
		d[i][0] = i
	}
	for j := 0; j <= n; j++ {
		d[0][j] = j
	}
	for j := 1; j <= n; j++ {
		for i := 1; i <= m; i++ {
			if ra[i-1] == rb[j-1] {
				d[i][j] = d[i-1][j-1]
			} else {
				d[i][j] = min3(d[i-1][j]+1, d[i][j-1]+1, d[i-1][j-1]+1)
			}
		}
	}
	return d[m][n]
}

func min3(a, b, c int) int {
	if a < b {
		b = a
	}
	if b < c {
		return b
	}
	return c
}

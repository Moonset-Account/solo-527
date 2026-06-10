package csvparser

import (
	"bufio"
	"encoding/csv"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"unicode/utf8"

	"github.com/datateam/csvvalidator/internal/schema"
)

type Row struct {
	LineNumber int
	Raw        []string
	Values     map[string]string
}

type LoadedData struct {
	FilePath    string
	Headers     []string
	SchemaFields []string
	Rows        []Row
	TotalRows   int
	SkippedRows int
	ParseErrors []ParseError
}

type ParseError struct {
	LineNumber int
	Column     int
	Message    string
	Suggestion string
}

type LoadOptions struct {
	Delimiter   rune
	HasHeader   bool
	Encoding    string
	StrictMode  bool
	MaxErrors   int
}

func NewLoadOptionsFromSchema(s *schema.Schema, strict bool) *LoadOptions {
	delim := ','
	if s.Delimiter != "" {
		r, _ := utf8.DecodeRuneInString(s.Delimiter)
		if r != utf8.RuneError {
			delim = r
		}
	}
	hasHeader := true
	if s.HasHeader != nil {
		hasHeader = *s.HasHeader
	}
	return &LoadOptions{
		Delimiter:  delim,
		HasHeader:  hasHeader,
		Encoding:   s.Encoding,
		StrictMode: strict,
		MaxErrors:  100,
	}
}

func Load(path string, s *schema.Schema, opts *LoadOptions) (*LoadedData, error) {
	if path == "" {
		return nil, fmt.Errorf("CSV文件路径不能为空")
	}

	absPath, err := filepath.Abs(path)
	if err != nil {
		return nil, fmt.Errorf("解析CSV路径失败: %w", err)
	}

	f, err := os.Open(absPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("CSV文件不存在: %s\n建议: 请检查文件路径是否正确，确认文件已生成或未被移动", absPath)
		}
		return nil, fmt.Errorf("打开CSV文件失败: %w\n建议: 请检查文件读取权限", err)
	}
	defer f.Close()

	if opts == nil {
		opts = NewLoadOptionsFromSchema(s, false)
	}

	var reader io.Reader = bufio.NewReader(f)
	if opts.Encoding != "" && strings.ToLower(opts.Encoding) != "utf-8" {
		return nil, fmt.Errorf("暂不支持编码 '%s'\n建议: 请将CSV文件转换为 UTF-8 编码后重试", opts.Encoding)
	}

	csvReader := csv.NewReader(reader)
	csvReader.Comma = opts.Delimiter
	csvReader.LazyQuotes = true
	csvReader.TrimLeadingSpace = false
	csvReader.FieldsPerRecord = -1

	data := &LoadedData{
		FilePath:     absPath,
		SchemaFields: s.FieldNames(),
	}

	expectedCols := len(s.Fields)
	lineNum := 0

	if opts.HasHeader {
		lineNum++
		header, err := csvReader.Read()
		if err != nil {
			if err == io.EOF {
				return nil, fmt.Errorf("CSV文件为空或只有表头行\n建议: 请检查文件是否包含有效数据行")
			}
			return nil, fmt.Errorf("读取表头行失败: %w", err)
		}
		data.Headers = normalizeHeaders(header)
		if err := validateHeaders(data.Headers, s, opts.StrictMode); err != nil {
			return nil, err
		}
	} else {
		data.Headers = s.FieldNames()
	}

	colIdx := buildColumnIndex(data.Headers, s)

	for {
		lineNum++
		record, err := csvReader.Read()
		if err != nil {
			if err == io.EOF {
				break
			}
			if parseErr, ok := err.(*csv.ParseError); ok {
				data.ParseErrors = append(data.ParseErrors, ParseError{
					LineNumber: lineNum,
					Column:     parseErr.Column,
					Message:    fmt.Sprintf("CSV解析错误: %v", parseErr.Err),
					Suggestion: "请检查该行是否有未闭合的引号或非法字符",
				})
				if opts.MaxErrors > 0 && len(data.ParseErrors) >= opts.MaxErrors {
					return data, fmt.Errorf("解析错误过多 (已达 %d 条)，已停止处理\n建议: 修复前 %d 条错误后重新运行", opts.MaxErrors, opts.MaxErrors)
				}
				continue
			}
			return data, fmt.Errorf("读取CSV行 %d 失败: %w", lineNum, err)
		}

		data.TotalRows++

		if opts.StrictMode && len(record) != expectedCols {
			data.ParseErrors = append(data.ParseErrors, ParseError{
				LineNumber: lineNum,
				Message:    fmt.Sprintf("列数不匹配: 期望 %d 列，实际 %d 列", expectedCols, len(record)),
				Suggestion: fmt.Sprintf("请检查该行数据是否完整，表头定义了 %d 个字段", expectedCols),
			})
			data.SkippedRows++
			if opts.MaxErrors > 0 && len(data.ParseErrors) >= opts.MaxErrors {
				break
			}
			continue
		}

		values := make(map[string]string, len(s.Fields))
		for i, field := range s.Fields {
			idx, ok := colIdx[field.Name]
			var val string
			if ok && idx < len(record) {
				val = record[idx]
				if field.TrimSpace != nil && *field.TrimSpace {
					val = strings.TrimSpace(val)
				}
			}
			_ = i
			values[field.Name] = val
		}

		data.Rows = append(data.Rows, Row{
			LineNumber: lineNum,
			Raw:        record,
			Values:     values,
		})
	}

	if data.TotalRows == 0 {
		return data, fmt.Errorf("CSV文件中没有找到有效数据行 (共读取 %d 行)\n建议: 请检查文件内容是否符合预期格式", lineNum)
	}

	return data, nil
}

func normalizeHeaders(headers []string) []string {
	normalized := make([]string, len(headers))
	for i, h := range headers {
		normalized[i] = strings.TrimSpace(h)
		normalized[i] = strings.TrimPrefix(normalized[i], "\ufeff")
	}
	return normalized
}

func validateHeaders(headers []string, s *schema.Schema, strict bool) error {
	schemaFieldSet := make(map[string]bool)
	for _, f := range s.Fields {
		schemaFieldSet[f.Name] = true
	}

	headerSet := make(map[string]bool)
	for _, h := range headers {
		if headerSet[h] {
			return fmt.Errorf("CSV表头存在重复列名: '%s'\n建议: 请检查表头并移除重复的列", h)
		}
		headerSet[h] = true
	}

	var missing []string
	for _, f := range s.Fields {
		if !headerSet[f.Name] {
			missing = append(missing, f.Name)
		}
	}
	if len(missing) > 0 {
		return fmt.Errorf("CSV表头缺少schema要求的字段: %v\n建议: 请在CSV中添加这些列，或修改schema定义", missing)
	}

	if strict {
		var extra []string
		for _, h := range headers {
			if !schemaFieldSet[h] {
				extra = append(extra, h)
			}
		}
		if len(extra) > 0 {
			return fmt.Errorf("严格模式: CSV表头存在schema未定义的额外字段: %v\n建议: 移除这些列，或在 --strict=false 模式下运行（会忽略额外列）", extra)
		}
	}

	return nil
}

func buildColumnIndex(headers []string, s *schema.Schema) map[string]int {
	idx := make(map[string]int, len(headers))
	for i, h := range headers {
		if _, ok := s.GetField(h); ok {
			idx[h] = i
		}
	}
	for _, f := range s.Fields {
		if _, ok := idx[f.Name]; !ok {
			idx[f.Name] = -1
		}
	}
	return idx
}

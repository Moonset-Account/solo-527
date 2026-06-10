package schema

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"
)

type LoadOptions struct {
	StrictMode bool
}

func Load(path string, opts *LoadOptions) (*Schema, error) {
	if path == "" {
		return nil, fmt.Errorf("schema路径不能为空")
	}

	absPath, err := filepath.Abs(path)
	if err != nil {
		return nil, fmt.Errorf("解析schema路径失败: %w", err)
	}

	data, err := os.ReadFile(absPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("schema文件不存在: %s\n建议: 请检查路径是否正确，或使用 --schema 指定有效的schema文件", absPath)
		}
		return nil, fmt.Errorf("读取schema文件失败: %w\n建议: 请检查文件权限", err)
	}

	ext := strings.ToLower(filepath.Ext(absPath))
	var s *Schema
	var parseErr error

	switch ext {
	case ".json":
		s, parseErr = parseJSON(data)
	case ".yaml", ".yml":
		s, parseErr = parseYAML(data)
	default:
		s, parseErr = parseJSON(data)
		if parseErr != nil {
			if s2, err2 := parseYAML(data); err2 == nil {
				s = s2
				parseErr = nil
			}
		}
	}

	if parseErr != nil {
		return nil, fmt.Errorf("解析schema文件失败 (%s): %w\n建议: 请检查schema格式是否正确，支持JSON和YAML格式", ext, parseErr)
	}

	if err := validate(s, opts); err != nil {
		return nil, err
	}

	applyDefaults(s)
	return s, nil
}

func parseJSON(data []byte) (*Schema, error) {
	var s Schema
	if err := json.Unmarshal(data, &s); err != nil {
		return nil, fmt.Errorf("JSON解析错误: %w", err)
	}
	return &s, nil
}

func parseYAML(data []byte) (*Schema, error) {
	var s Schema
	if err := yaml.Unmarshal(data, &s); err != nil {
		return nil, fmt.Errorf("YAML解析错误: %w", err)
	}
	return &s, nil
}

func validate(s *Schema, opts *LoadOptions) error {
	if s == nil {
		return fmt.Errorf("schema为空")
	}

	if s.Name == "" {
		return fmt.Errorf("schema缺少 'name' 字段\n建议: 在schema顶层添加 name 字段，用于标识此数据模型")
	}

	if len(s.Fields) == 0 {
		return fmt.Errorf("schema没有定义任何字段 (fields)\n建议: 在 fields 数组中定义至少一个列")
	}

	strict := opts != nil && opts.StrictMode
	seenNames := make(map[string]bool)

	for i, f := range s.Fields {
		if f.Name == "" {
			return fmt.Errorf("第 %d 个字段缺少 'name' 字段", i+1)
		}
		if seenNames[f.Name] {
			return fmt.Errorf("字段名重复: '%s'\n建议: 每个字段名必须唯一", f.Name)
		}
		seenNames[f.Name] = true

		if f.Type == "" {
			return fmt.Errorf("字段 '%s' 缺少 'type' 字段\n建议: 支持的类型: string, int, float, bool, date, datetime, email, url, enum, pattern", f.Name)
		}

		validTypes := map[FieldType]bool{
			TypeString: true, TypeInt: true, TypeFloat: true,
			TypeBool: true, TypeDate: true, TypeDateTime: true,
			TypeEmail: true, TypeURL: true, TypeEnum: true, TypePattern: true,
		}
		if !validTypes[f.Type] {
			return fmt.Errorf("字段 '%s' 的类型 '%s' 不受支持\n建议: 使用以下类型之一: string, int, float, bool, date, datetime, email, url, enum, pattern", f.Name, f.Type)
		}

		if strict {
			if f.Description == "" {
				return fmt.Errorf("严格模式: 字段 '%s' 缺少 'description' 描述\n建议: 为每个字段添加业务说明，方便团队成员理解", f.Name)
			}
			if s.Version == "" {
				return fmt.Errorf("严格模式: Schema 缺少 'version' 字段\n建议: 使用语义化版本号 (如 1.0.0) 管理 Schema 变更")
			}
		}

		if f.Type == TypeEnum && len(f.EnumValues) == 0 {
			return fmt.Errorf("字段 '%s' 是 enum 类型但未定义 enum_values\n建议: 在字段中添加 enum_values 数组列出允许的值", f.Name)
		}

		if f.Type == TypePattern && f.Pattern == "" {
			return fmt.Errorf("字段 '%s' 是 pattern 类型但未定义 pattern 正则表达式", f.Name)
		}

		if (f.Type == TypeDate || f.Type == TypeDateTime) && f.DateFormat == "" {
			f.DateFormat = "2006-01-02"
			if f.Type == TypeDateTime {
				f.DateFormat = "2006-01-02 15:04:05"
			}
		}
	}

	for _, pk := range s.PrimaryKeys {
		if !seenNames[pk] {
			return fmt.Errorf("主键 '%s' 不在字段列表中\n建议: 检查 primary_keys 中的字段名是否与 fields 中的 name 匹配", pk)
		}
	}

	for i, uk := range s.UniqueKeys {
		for _, f := range uk {
			if !seenNames[f] {
				return fmt.Errorf("第 %d 组唯一键中的字段 '%s' 不存在", i+1, f)
			}
		}
	}

	return nil
}

func applyDefaults(s *Schema) {
	if s.Delimiter == "" {
		s.Delimiter = ","
	}
	if s.HasHeader == nil {
		b := true
		s.HasHeader = &b
	}
	for i := range s.Fields {
		if s.Fields[i].TrimSpace == nil {
			b := true
			s.Fields[i].TrimSpace = &b
		}
	}
}

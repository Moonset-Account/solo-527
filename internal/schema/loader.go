package schema

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"csvchecker/internal/types"

	"gopkg.in/yaml.v3"
)

const defaultDelimiter = ","

func LoadSchema(path string) (*types.CSVSchema, error) {
	absPath, err := filepath.Abs(path)
	if err != nil {
		return nil, fmt.Errorf("schema path error: %w", err)
	}

	data, err := os.ReadFile(absPath)
	if err != nil {
		return nil, fmt.Errorf("read schema file failed: %w", err)
	}

	var s *types.CSVSchema
	ext := strings.ToLower(filepath.Ext(absPath))
	switch ext {
	case ".json":
		s, err = parseJSON(data)
	case ".yaml", ".yml":
		s, err = parseYAML(data)
	default:
		s, err = parseAuto(data)
	}
	if err != nil {
		return nil, fmt.Errorf("parse schema failed: %w", err)
	}

	if err := validateAndFillDefaults(s); err != nil {
		return nil, err
	}

	return s, nil
}

func LoadSchemaFromDir(dirPath string, businessLine string) (*types.CSVSchema, error) {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return nil, fmt.Errorf("read schema directory failed: %w", err)
	}

	var matched *types.CSVSchema
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		ext := strings.ToLower(filepath.Ext(entry.Name()))
		if ext != ".json" && ext != ".yaml" && ext != ".yml" {
			continue
		}

		fullPath := filepath.Join(dirPath, entry.Name())
		s, err := LoadSchema(fullPath)
		if err != nil {
			continue
		}
		if s.BusinessLine == businessLine {
			if matched != nil {
				return nil, fmt.Errorf("duplicate schema for business line: %s, found: %s and %s",
					businessLine, matched.Name, s.Name)
			}
			matched = s
		}
	}

	if matched == nil {
		return nil, fmt.Errorf("schema not found for business line: %s", businessLine)
	}
	return matched, nil
}

func ListSchemas(dirPath string) ([]*types.CSVSchema, error) {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return nil, fmt.Errorf("read schema directory failed: %w", err)
	}

	var schemas []*types.CSVSchema
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		ext := strings.ToLower(filepath.Ext(entry.Name()))
		if ext != ".json" && ext != ".yaml" && ext != ".yml" {
			continue
		}

		fullPath := filepath.Join(dirPath, entry.Name())
		s, err := LoadSchema(fullPath)
		if err != nil {
			continue
		}
		schemas = append(schemas, s)
	}
	return schemas, nil
}

func parseJSON(data []byte) (*types.CSVSchema, error) {
	var s types.CSVSchema
	if err := json.Unmarshal(data, &s); err != nil {
		return nil, fmt.Errorf("json unmarshal: %w", err)
	}
	return &s, nil
}

func parseYAML(data []byte) (*types.CSVSchema, error) {
	var s types.CSVSchema
	if err := yaml.Unmarshal(data, &s); err != nil {
		return nil, fmt.Errorf("yaml unmarshal: %w", err)
	}
	return &s, nil
}

func parseAuto(data []byte) (*types.CSVSchema, error) {
	if len(data) > 0 {
		trimmed := strings.TrimSpace(string(data))
		if strings.HasPrefix(trimmed, "{") || strings.HasPrefix(trimmed, "[") {
			return parseJSON(data)
		}
	}
	return parseYAML(data)
}

func validateAndFillDefaults(s *types.CSVSchema) error {
	if s == nil {
		return fmt.Errorf("schema is nil")
	}
	if s.Name == "" {
		return fmt.Errorf("schema name is required")
	}
	if s.Version == "" {
		s.Version = "1.0"
	}
	if s.Delimiter == "" {
		s.Delimiter = defaultDelimiter
	}
	if s.BusinessLine == "" {
		s.BusinessLine = "default"
	}
	if len(s.Columns) == 0 {
		return fmt.Errorf("schema must define at least one column")
	}

	colMap := make(map[string]bool)
	for i := range s.Columns {
		col := &s.Columns[i]
		if col.Name == "" {
			return fmt.Errorf("column at index %d has empty name", i)
		}
		if colMap[col.Name] {
			return fmt.Errorf("duplicate column name: %s", col.Name)
		}
		colMap[col.Name] = true

		if col.Type == "" {
			col.Type = types.TypeString
		}
		if col.Type == types.TypeDate && len(col.DateFormats) == 0 {
			col.DateFormats = []string{"2006-01-02", "2006/01/02", "2006-01-02 15:04:05"}
		}
		if col.PrimaryKey {
			if !contains(s.PrimaryKeys, col.Name) {
				s.PrimaryKeys = append(s.PrimaryKeys, col.Name)
			}
		}
	}

	for _, pk := range s.PrimaryKeys {
		if !colMap[pk] {
			return fmt.Errorf("primary key column not found: %s", pk)
		}
		for i := range s.Columns {
			if s.Columns[i].Name == pk {
				s.Columns[i].PrimaryKey = true
				s.Columns[i].Required = true
				break
			}
		}
	}

	return nil
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

func GetColumn(s *types.CSVSchema, name string) *types.ColumnSchema {
	for i := range s.Columns {
		if s.Columns[i].Name == name {
			return &s.Columns[i]
		}
	}
	return nil
}

func ColumnNames(s *types.CSVSchema) []string {
	names := make([]string, len(s.Columns))
	for i, c := range s.Columns {
		names[i] = c.Name
	}
	return names
}

package schema

import (
	"os"
	"path/filepath"
	"testing"

	"csvchecker/internal/types"
)

func TestLoadYAMLSchema(t *testing.T) {
	tmp, err := os.MkdirTemp("", "schema-test-*")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tmp)

	yamlPath := filepath.Join(tmp, "test.yaml")
	yamlContent := `
version: "1.0"
businessLine: test
name: 测试 Schema
primaryKeys:
  - id
columns:
  - name: id
    type: string
    required: true
    primaryKey: true
  - name: age
    type: int
    min: 0
    max: 150
  - name: gender
    type: enum
    enumValues: [M, F, O]
  - name: created
    type: date
    dateFormats: ["2006-01-02"]
`
	if err := os.WriteFile(yamlPath, []byte(yamlContent), 0644); err != nil {
		t.Fatal(err)
	}

	s, err := LoadSchema(yamlPath)
	if err != nil {
		t.Fatalf("LoadSchema failed: %v", err)
	}
	if s.Name != "测试 Schema" {
		t.Errorf("expected 测试 Schema, got %s", s.Name)
	}
	if s.BusinessLine != "test" {
		t.Errorf("expected businessLine test, got %s", s.BusinessLine)
	}
	if len(s.Columns) != 4 {
		t.Fatalf("expected 4 columns, got %d", len(s.Columns))
	}
	if s.Columns[0].Type != types.TypeString {
		t.Errorf("expected TypeString, got %s", s.Columns[0].Type)
	}
	if !s.Columns[0].PrimaryKey {
		t.Error("expected id column to be primary key")
	}
	if len(s.PrimaryKeys) != 1 || s.PrimaryKeys[0] != "id" {
		t.Errorf("expected primary keys [id], got %v", s.PrimaryKeys)
	}
	if s.Columns[1].Min == nil || *s.Columns[1].Min != 0 {
		t.Errorf("expected age min=0, got %v", s.Columns[1].Min)
	}
	if s.Columns[2].EnumValues[0] != "M" {
		t.Errorf("expected gender enum M, got %v", s.Columns[2].EnumValues)
	}
	if s.Delimiter != "," {
		t.Errorf("expected default delimiter comma, got %q", s.Delimiter)
	}
	if !s.GetHasHeader() {
		t.Error("expected hasHeader default true")
	}
}

func TestLoadJSONSchema(t *testing.T) {
	tmp, err := os.MkdirTemp("", "schema-test-*")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tmp)

	jsonPath := filepath.Join(tmp, "test.json")
	jsonContent := `{
  "version": "2.0",
  "businessLine": "finance",
  "name": "财务Schema",
  "delimiter": "\t",
  "hasHeader": false,
  "columns": [
    {"name": "txn_id", "type": "string", "required": true, "primaryKey": true},
    {"name": "amount", "type": "float"}
  ]
}`
	if err := os.WriteFile(jsonPath, []byte(jsonContent), 0644); err != nil {
		t.Fatal(err)
	}
	s, err := LoadSchema(jsonPath)
	if err != nil {
		t.Fatalf("LoadSchema JSON failed: %v", err)
	}
	if s.Version != "2.0" {
		t.Errorf("expected version 2.0, got %s", s.Version)
	}
	if s.Delimiter != "\t" {
		t.Errorf("expected tab delimiter, got %q", s.Delimiter)
	}
	if s.GetHasHeader() {
		t.Error("expected hasHeader false")
	}
}

func TestSchemaValidation_EmptyName(t *testing.T) {
	tmp, _ := os.MkdirTemp("", "schema-test-*")
	defer os.RemoveAll(tmp)
	path := filepath.Join(tmp, "bad.yaml")
	os.WriteFile(path, []byte("columns:\n  - name: x\n"), 0644)
	_, err := LoadSchema(path)
	if err == nil {
		t.Fatal("expected error for empty schema name")
	}
}

func TestSchemaValidation_DuplicateColumn(t *testing.T) {
	tmp, _ := os.MkdirTemp("", "schema-test-*")
	defer os.RemoveAll(tmp)
	path := filepath.Join(tmp, "bad.yaml")
	os.WriteFile(path, []byte(`
name: dup-test
columns:
  - name: a
  - name: a
`), 0644)
	_, err := LoadSchema(path)
	if err == nil {
		t.Fatal("expected error for duplicate column")
	}
}

func TestSchemaValidation_UnknownPK(t *testing.T) {
	tmp, _ := os.MkdirTemp("", "schema-test-*")
	defer os.RemoveAll(tmp)
	path := filepath.Join(tmp, "bad.yaml")
	os.WriteFile(path, []byte(`
name: pk-test
primaryKeys: [not_exist]
columns:
  - name: id
    type: string
`), 0644)
	_, err := LoadSchema(path)
	if err == nil {
		t.Fatal("expected error for unknown primary key column")
	}
}

func TestLoadSchemaFromDir(t *testing.T) {
	tmp, _ := os.MkdirTemp("", "schema-test-*")
	defer os.RemoveAll(tmp)
	os.WriteFile(filepath.Join(tmp, "bl_a.yaml"), []byte(`
name: A
businessLine: line_a
columns:
  - name: id
`), 0644)
	os.WriteFile(filepath.Join(tmp, "bl_b.json"), []byte(`{"name":"B","businessLine":"line_b","columns":[{"name":"id"}]}`), 0644)

	s, err := LoadSchemaFromDir(tmp, "line_b")
	if err != nil {
		t.Fatalf("LoadSchemaFromDir failed: %v", err)
	}
	if s.Name != "B" {
		t.Errorf("expected B, got %s", s.Name)
	}
	_, err = LoadSchemaFromDir(tmp, "not_exist")
	if err == nil {
		t.Fatal("expected error for unknown business line")
	}
}

func TestGetColumnAndNames(t *testing.T) {
	s := &types.CSVSchema{
		Name: "test",
		Columns: []types.ColumnSchema{
			{Name: "a", Type: types.TypeInt},
			{Name: "b", Type: types.TypeString},
		},
	}
	if GetColumn(s, "a") == nil {
		t.Error("expected column a to exist")
	}
	if GetColumn(s, "z") != nil {
		t.Error("expected column z not to exist")
	}
	names := ColumnNames(s)
	if len(names) != 2 || names[0] != "a" || names[1] != "b" {
		t.Errorf("expected [a b], got %v", names)
	}
}

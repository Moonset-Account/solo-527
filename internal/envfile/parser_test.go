package envfile

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestParseReader(t *testing.T) {
	input := `# comment line
DATABASE_URL=postgres://localhost/mydb
REDIS_URL=redis://localhost:6379
API_KEY="sk-12345"
EMPTY_VAR=
SINGLE_QUOTED='hello world'
WITH_COMMENT=value # this is a comment
`
	ef, err := ParseReader(strings.NewReader(input), "test.env")
	if err != nil {
		t.Fatalf("ParseReader returned error: %v", err)
	}

	if len(ef.Vars) != 6 {
		t.Fatalf("expected 6 vars, got %d", len(ef.Vars))
	}

	tests := []struct {
		key      string
		expected string
	}{
		{"DATABASE_URL", "postgres://localhost/mydb"},
		{"REDIS_URL", "redis://localhost:6379"},
		{"API_KEY", "sk-12345"},
		{"EMPTY_VAR", ""},
		{"SINGLE_QUOTED", "hello world"},
		{"WITH_COMMENT", "value"},
	}

	for _, tt := range tests {
		v, ok := ef.Vars[tt.key]
		if !ok {
			t.Errorf("key %s not found", tt.key)
			continue
		}
		if v.Value != tt.expected {
			t.Errorf("key %s: expected %q, got %q", tt.key, tt.expected, v.Value)
		}
	}
}

func TestParseFile(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, ".env")
	content := "FOO=bar\nBAZ=qux\n"
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}

	ef, err := ParseFile(path)
	if err != nil {
		t.Fatalf("ParseFile returned error: %v", err)
	}
	if len(ef.Vars) != 2 {
		t.Fatalf("expected 2 vars, got %d", len(ef.Vars))
	}
	if ef.Vars["FOO"].Value != "bar" {
		t.Errorf("FOO: expected 'bar', got %q", ef.Vars["FOO"].Value)
	}
}

func TestParseFileNotFound(t *testing.T) {
	_, err := ParseFile("/nonexistent/.env")
	if err == nil {
		t.Fatal("expected error for nonexistent file")
	}
}

func TestKeys(t *testing.T) {
	vars := map[string]EnvVar{
		"B": {Key: "B"},
		"A": {Key: "A"},
		"C": {Key: "C"},
	}
	keys := Keys(vars)
	if len(keys) != 3 {
		t.Fatalf("expected 3 keys, got %d", len(keys))
	}
}

func TestEmptyLinesAndComments(t *testing.T) {
	input := "\n\n# only comments\n\n"
	ef, err := ParseReader(strings.NewReader(input), "empty.env")
	if err != nil {
		t.Fatal(err)
	}
	if len(ef.Vars) != 0 {
		t.Fatalf("expected 0 vars for empty/comment-only input, got %d", len(ef.Vars))
	}
}

func TestParseReader_InvalidLines(t *testing.T) {
	input := "NOT_AN_ASSIGNMENT\nVALID=yes\n123BAD=no\n"
	ef, err := ParseReader(strings.NewReader(input), "test.env")
	if err != nil {
		t.Fatal(err)
	}
	if _, ok := ef.Vars["VALID"]; !ok {
		t.Error("expected VALID to be parsed")
	}
	if len(ef.Vars) != 1 {
		t.Fatalf("expected 1 var, got %d", len(ef.Vars))
	}
}

package report

import (
	"bytes"
	"encoding/json"
	"strings"
	"testing"

	"github.com/envcheck/envcheck/internal/checker"
)

func makeResult() *checker.Result {
	return &checker.Result{
		EnvFiles:     []string{".env"},
		ExampleFiles: []string{".env.example"},
		Issues: []checker.Issue{
			{
				Severity: checker.SeverityError,
				Category: "missing_required",
				Key:      "DATABASE_URL",
				Message:  `required variable "DATABASE_URL" is missing from all env files`,
			},
			{
				Severity: checker.SeverityWarning,
				Category: "empty_value",
				Key:      "PORT",
				Message:  `variable "PORT" in .env has an empty value`,
				Source:   ".env",
			},
		},
		MissingInEnv: []string{"DATABASE_URL"},
		TotalChecked: 5,
		TotalIssues:  2,
		HasErrors:    true,
		HasWarnings:  true,
	}
}

func TestTextFormatter(t *testing.T) {
	var buf bytes.Buffer
	f := &TextFormatter{}
	result := makeResult()
	if err := f.Format(&buf, result); err != nil {
		t.Fatalf("TextFormatter error: %v", err)
	}
	output := buf.String()
	if !strings.Contains(output, "envcheck") {
		t.Error("output should contain header")
	}
	if !strings.Contains(output, "DATABASE_URL") {
		t.Error("output should contain missing variable name")
	}
}

func TestJSONFormatter(t *testing.T) {
	var buf bytes.Buffer
	f := &JSONFormatter{Indent: true}
	result := makeResult()
	if err := f.Format(&buf, result); err != nil {
		t.Fatalf("JSONFormatter error: %v", err)
	}

	var parsed checker.Result
	if err := json.Unmarshal(buf.Bytes(), &parsed); err != nil {
		t.Fatalf("output is not valid JSON: %v", err)
	}
	if parsed.TotalIssues != 2 {
		t.Errorf("expected 2 issues in JSON, got %d", parsed.TotalIssues)
	}
}

func TestCIFormatter(t *testing.T) {
	var buf bytes.Buffer
	f := &CIFormatter{}
	result := makeResult()
	if err := f.Format(&buf, result); err != nil {
		t.Fatalf("CIFormatter error: %v", err)
	}
	output := buf.String()
	if !strings.Contains(output, "::error") {
		t.Error("CI output should contain ::error annotation")
	}
	if !strings.Contains(output, "::warning") {
		t.Error("CI output should contain ::warning annotation")
	}
}

func TestTextFormatter_NoIssues(t *testing.T) {
	var buf bytes.Buffer
	f := &TextFormatter{}
	result := &checker.Result{
		EnvFiles:    []string{".env"},
		TotalIssues: 0,
	}
	if err := f.Format(&buf, result); err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(buf.String(), "All checks passed") {
		t.Error("should report all checks passed when no issues")
	}
}

func TestNewFormatter(t *testing.T) {
	if _, ok := NewFormatter("text", false, false).(*TextFormatter); !ok {
		t.Error("text format should return TextFormatter")
	}
	if _, ok := NewFormatter("json", false, false).(*JSONFormatter); !ok {
		t.Error("json format should return JSONFormatter")
	}
	if _, ok := NewFormatter("ci", false, false).(*CIFormatter); !ok {
		t.Error("ci format should return CIFormatter")
	}
}

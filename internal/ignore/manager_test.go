package ignore

import (
	"testing"
	"time"

	"csvchecker/internal/types"
)

func TestIgnoreByRuleID(t *testing.T) {
	m := NewManager()
	m.AddRuleIDs([]string{"E002", "W001"})
	if !m.ShouldIgnore("a.csv", "col", "E002") {
		t.Error("E002 should be ignored")
	}
	if !m.ShouldIgnore("a.csv", "col", "W001") {
		t.Error("W001 should be ignored")
	}
	if m.ShouldIgnore("a.csv", "col", "E003") {
		t.Error("E003 should not be ignored")
	}
}

func TestIgnoreByColumn(t *testing.T) {
	m := NewManager()
	m.AddColumns([]string{"phone", "email"})
	if !m.ShouldIgnore("a.csv", "phone", "E001") {
		t.Error("phone column should be ignored")
	}
	if m.ShouldIgnore("a.csv", "name", "E001") {
		t.Error("name should not be ignored")
	}
}

func TestIgnoreByFile(t *testing.T) {
	m := NewManager()
	m.AddFiles([]string{"ignore_me.csv", "/abs/path/to/file.csv"})
	if !m.ShouldIgnore("ignore_me.csv", "c", "E001") {
		t.Error("ignore_me.csv should be ignored by basename")
	}
	if !m.ShouldIgnore("/abs/path/to/file.csv", "c", "E001") {
		t.Error("absolute path should be ignored")
	}
	if m.ShouldIgnore("other.csv", "c", "E001") {
		t.Error("other.csv should not be ignored")
	}
}

func TestSchemaBasedIgnoreRules(t *testing.T) {
	m := NewManager()
	rules := []types.IgnoreRule{
		{RuleIDs: []string{"E002"}, Columns: []string{"age"}, Reason: "legacy"},
		{RuleIDs: []string{"W001"}, Files: []string{"legacy_*.csv"}, Reason: "allow empty"},
	}
	m.AddSchemaRules(rules)

	if !m.ShouldIgnore("any.csv", "age", "E002") {
		t.Error("E002 on age should be ignored")
	}
	if m.ShouldIgnore("any.csv", "name", "E002") {
		t.Error("E002 on name should not be ignored (only age)")
	}
	if !m.ShouldIgnore("legacy_2023.csv", "anycol", "W001") {
		t.Error("W001 on legacy glob match should be ignored")
	}
	if m.ShouldIgnore("other.csv", "anycol", "W001") {
		t.Error("W001 on non-matching file should not be ignored")
	}
}

func TestFilterErrors(t *testing.T) {
	m := NewManager()
	m.AddRuleIDs([]string{"E002"})
	errs := []types.ValidationError{
		{File: "a.csv", RuleID: "E001", Severity: types.SeverityError, OccurredAt: time.Now()},
		{File: "a.csv", RuleID: "E002", Severity: types.SeverityError, OccurredAt: time.Now()},
		{File: "a.csv", RuleID: "W001", Severity: types.SeverityWarning, OccurredAt: time.Now()},
		{File: "a.csv", RuleID: "E002", Column: "x", Severity: types.SeverityError, OccurredAt: time.Now()},
	}
	filtered := m.Filter(errs)
	if len(filtered) != 2 {
		t.Errorf("expected 2 after filter (remove 2 E002), got %d", len(filtered))
	}
	for _, e := range filtered {
		if e.RuleID == "E002" {
			t.Error("filtered should not contain E002")
		}
	}
}

func TestEmptyFilter(t *testing.T) {
	m := NewManager()
	var errs []types.ValidationError
	r := m.Filter(errs)
	if len(r) != 0 {
		t.Error("expected 0")
	}
	r2 := m.Filter(nil)
	if len(r2) != 0 {
		t.Error("expected 0 nil")
	}
}

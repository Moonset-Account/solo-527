package checker

import (
	"testing"

	"github.com/envcheck/envcheck/internal/envfile"
	"github.com/envcheck/envcheck/internal/mask"
)

func makeEnvFile(path string, vars map[string]string) *envfile.EnvFile {
	ef := &envfile.EnvFile{Path: path, Vars: make(map[string]envfile.EnvVar)}
	for k, v := range vars {
		ef.Vars[k] = envfile.EnvVar{Key: k, Value: v}
	}
	return ef
}

func TestMissingRequired(t *testing.T) {
	m := mask.New(nil)
	chk := New(m, []string{"DATABASE_URL", "REDIS_URL"}, false)
	chk.AddEnvFile(makeEnvFile(".env", map[string]string{
		"DATABASE_URL": "postgres://localhost",
	}))

	result := chk.Check()
	if !result.HasErrors {
		t.Error("expected errors for missing required vars")
	}
	missingCount := 0
	for _, iss := range result.Issues {
		if iss.Category == "missing_required" {
			missingCount++
		}
	}
	if missingCount != 1 {
		t.Errorf("expected 1 missing required, got %d", missingCount)
	}
}

func TestAllRequiredPresent(t *testing.T) {
	m := mask.New(nil)
	chk := New(m, []string{"DATABASE_URL"}, false)
	chk.AddEnvFile(makeEnvFile(".env", map[string]string{
		"DATABASE_URL": "postgres://localhost",
	}))

	result := chk.Check()
	for _, iss := range result.Issues {
		if iss.Category == "missing_required" {
			t.Errorf("should not have missing_required issue, got: %s", iss.Message)
		}
	}
}

func TestExampleCoverage_MissingInExample(t *testing.T) {
	m := mask.New(nil)
	chk := New(m, nil, false)
	chk.AddEnvFile(makeEnvFile(".env", map[string]string{
		"APP_NAME": "myapp",
		"NEW_VAR":  "value",
	}))
	chk.AddExampleFile(makeEnvFile(".env.example", map[string]string{
		"APP_NAME": "",
	}))

	result := chk.Check()
	found := false
	for _, iss := range result.Issues {
		if iss.Category == "missing_in_example" && iss.Key == "NEW_VAR" {
			found = true
		}
	}
	if !found {
		t.Error("expected missing_in_example issue for NEW_VAR")
	}
}

func TestExampleCoverage_MissingInEnv(t *testing.T) {
	m := mask.New(nil)
	chk := New(m, nil, false)
	chk.AddEnvFile(makeEnvFile(".env", map[string]string{
		"APP_NAME": "myapp",
	}))
	chk.AddExampleFile(makeEnvFile(".env.example", map[string]string{
		"APP_NAME": "",
		"REDIS_URL": "",
	}))

	result := chk.Check()
	found := false
	for _, iss := range result.Issues {
		if iss.Category == "missing_in_env" && iss.Key == "REDIS_URL" {
			found = true
		}
	}
	if !found {
		t.Error("expected missing_in_env issue for REDIS_URL")
	}
}

func TestEnvDiff(t *testing.T) {
	m := mask.New(nil)
	chk := New(m, nil, false)
	chk.AddEnvFile(makeEnvFile(".env", map[string]string{
		"APP_NAME": "myapp",
		"PORT":     "3000",
	}))
	chk.AddEnvFile(makeEnvFile(".env.prod", map[string]string{
		"APP_NAME": "myapp",
		"PORT":     "8080",
	}))

	result := chk.Check()
	if len(result.Diffs) != 1 {
		t.Fatalf("expected 1 diff, got %d", len(result.Diffs))
	}
	if result.Diffs[0].Key != "PORT" {
		t.Errorf("expected diff on PORT, got %s", result.Diffs[0].Key)
	}
}

func TestEmptyValues(t *testing.T) {
	m := mask.New(nil)
	chk := New(m, nil, false)
	chk.AddEnvFile(makeEnvFile(".env", map[string]string{
		"EMPTY":    "",
		"NOTEMPTY": "value",
	}))

	result := chk.Check()
	found := false
	for _, iss := range result.Issues {
		if iss.Category == "empty_value" && iss.Key == "EMPTY" {
			found = true
		}
	}
	if !found {
		t.Error("expected empty_value warning for EMPTY")
	}
}

func TestStrictMode_ExtraInEnv(t *testing.T) {
	m := mask.New(nil)
	chk := New(m, nil, true)
	chk.AddEnvFile(makeEnvFile(".env", map[string]string{
		"APP_NAME": "myapp",
		"EXTRA":    "value",
	}))
	chk.AddExampleFile(makeEnvFile(".env.example", map[string]string{
		"APP_NAME": "",
	}))

	result := chk.Check()
	found := false
	for _, iss := range result.Issues {
		if iss.Category == "extra_in_env" && iss.Key == "EXTRA" {
			found = true
		}
	}
	if !found {
		t.Error("expected extra_in_env issue in strict mode for EXTRA")
	}
}

func TestNoIssues(t *testing.T) {
	m := mask.New(nil)
	chk := New(m, []string{"APP_NAME"}, false)
	chk.AddEnvFile(makeEnvFile(".env", map[string]string{
		"APP_NAME": "myapp",
	}))
	chk.AddExampleFile(makeEnvFile(".env.example", map[string]string{
		"APP_NAME": "",
	}))

	result := chk.Check()
	if result.HasErrors {
		t.Error("expected no errors")
	}
	if result.TotalIssues != 0 {
		t.Errorf("expected 0 issues, got %d", result.TotalIssues)
	}
}

func TestExitCodeLogic(t *testing.T) {
	m := mask.New(nil)
	chk := New(m, []string{"MISSING"}, false)
	chk.AddEnvFile(makeEnvFile(".env", map[string]string{"PRESENT": "yes"}))
	result := chk.Check()
	if !result.HasErrors {
		t.Error("should have errors when required var is missing")
	}
	if result.TotalChecked != 1 {
		t.Errorf("TotalChecked should count unique keys across env and example files, got %d", result.TotalChecked)
	}
}

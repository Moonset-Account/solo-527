package output

import (
	"bytes"
	"encoding/json"
	"strings"
	"testing"
	"time"

	"logsum/internal/types"
)

func TestFormatter_WriteJSON(t *testing.T) {
	now := time.Now()
	report := types.SummaryReport{
		GeneratedAt:    now,
		TotalEntries:   100,
		ErrorEntries:   5,
		WarningEntries: 10,
		Clusters: []types.ErrorCluster{
			{
				ID:      "cluster1",
				Count:   3,
				Level:   types.LevelError,
				MessagePattern: "Database connection failed",
			},
		},
		Services: []string{"api", "web"},
	}

	var buf bytes.Buffer
	f := New(true, false, true, false, &buf)

	if err := f.WriteReport(report); err != nil {
		t.Fatalf("WriteReport failed: %v", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(buf.Bytes(), &result); err != nil {
		t.Fatalf("Output is not valid JSON: %v\nOutput: %s", err, buf.String())
	}

	if result["TotalEntries"] != float64(100) {
		t.Errorf("TotalEntries = %v, want 100", result["TotalEntries"])
	}
	if result["ErrorEntries"] != float64(5) {
		t.Errorf("ErrorEntries = %v, want 5", result["ErrorEntries"])
	}

	clusters, ok := result["Clusters"].([]interface{})
	if !ok {
		t.Fatal("Clusters not found or not an array")
	}
	if len(clusters) != 1 {
		t.Errorf("Clusters length = %d, want 1", len(clusters))
	}
}

func TestFormatter_WriteTable(t *testing.T) {
	now := time.Now()
	report := types.SummaryReport{
		GeneratedAt:    now,
		TotalEntries:   100,
		ErrorEntries:   3,
		WarningEntries: 2,
		Clusters: []types.ErrorCluster{
			{
				ID:               "abc123",
				Count:            3,
				Level:            types.LevelError,
				MessagePattern:   "Database connection failed",
				FirstOccurrence:  now.Add(-1 * time.Hour),
				LastOccurrence:   now,
				Services:         map[string]int{"api": 2, "web": 1},
				RequestIDs:       []string{"req1", "req2", "req3"},
				Environments:     map[string]int{"prod": 3},
			},
			{
				ID:               "def456",
				Count:            2,
				Level:            types.LevelWarn,
				MessagePattern:   "Slow query detected",
				FirstOccurrence:  now.Add(-30 * time.Minute),
				LastOccurrence:   now,
				Services:         map[string]int{"db": 2},
				RequestIDs:       []string{"req4", "req5"},
				Environments:     map[string]int{"prod": 2},
			},
		},
		Services: []string{"api", "web", "db"},
	}

	var buf bytes.Buffer
	f := New(true, false, false, false, &buf)

	if err := f.WriteReport(report); err != nil {
		t.Fatalf("WriteReport failed: %v", err)
	}

	output := buf.String()

	if !strings.Contains(output, "LOG SUMMARY REPORT") {
		t.Error("output should contain report header")
	}
	if !strings.Contains(output, "Total Entries") {
		t.Error("output should contain Total Entries")
	}
	if !strings.Contains(output, "100") {
		t.Error("output should contain total entries count")
	}
	if !strings.Contains(output, "ERROR CLUSTERS") {
		t.Error("output should contain error clusters section")
	}
	if !strings.Contains(output, "WARNING CLUSTERS") {
		t.Error("output should contain warning clusters section")
	}
	if !strings.Contains(output, "Database connection failed") {
		t.Error("output should contain error message")
	}
	if !strings.Contains(output, "Slow query detected") {
		t.Error("output should contain warning message")
	}
}

func TestFormatter_VerboseOutput(t *testing.T) {
	now := time.Now()
	report := types.SummaryReport{
		GeneratedAt:    now,
		TotalEntries:   10,
		ErrorEntries:   2,
		WarningEntries: 0,
		Clusters: []types.ErrorCluster{
			{
				ID:               "cluster1",
				Count:            2,
				Level:            types.LevelError,
				MessagePattern:   "Null pointer exception",
				SampleMessage:    "Null pointer in UserService",
				SampleStacktrace: "at com.example.UserService.get(UserService.java:123)\nat com.example.Controller.handle(Controller.java:456)",
				FirstOccurrence:  now.Add(-1 * time.Hour),
				LastOccurrence:   now,
				Services:         map[string]int{"api": 2},
				RequestIDs:       []string{"req1", "req2"},
				ContextSample:    []string{"[DEBUG] Processing request", "[ERROR] Null pointer", "[INFO] Cleanup"},
			},
		},
		TopErrors: []types.ErrorCluster{
			{
				ID:             "cluster1",
				Count:          2,
				Level:          types.LevelError,
				MessagePattern: "Null pointer exception",
			},
		},
	}

	var buf bytes.Buffer
	f := New(true, true, false, false, &buf)

	if err := f.WriteReport(report); err != nil {
		t.Fatalf("WriteReport failed: %v", err)
	}

	output := buf.String()

	if !strings.Contains(output, "DETAILS") {
		t.Error("verbose output should contain DETAILS section")
	}
	if !strings.Contains(output, "Cluster ID") {
		t.Error("verbose output should contain Cluster ID")
	}
	if !strings.Contains(output, "Stacktrace") {
		t.Error("verbose output should contain stack trace")
	}
	if !strings.Contains(output, "Context") {
		t.Error("verbose output should contain context")
	}
	if !strings.Contains(output, "Top Errors by Count") {
		t.Error("verbose output should contain top errors")
	}
}

func TestFormatter_CIOutput(t *testing.T) {
	now := time.Now()
	report := types.SummaryReport{
		GeneratedAt:    now,
		TotalEntries:   100,
		ErrorEntries:   5,
		WarningEntries: 10,
		Clusters: []types.ErrorCluster{
			{
				Count:            5,
				MessagePattern:   "Database timeout",
			},
		},
	}

	var buf bytes.Buffer
	f := New(true, false, false, true, &buf)

	if err := f.WriteReport(report); err != nil {
		t.Fatalf("WriteReport failed: %v", err)
	}

	output := buf.String()

	if !strings.Contains(output, "CI SUMMARY") {
		t.Error("CI output should contain CI SUMMARY")
	}
	if !strings.Contains(output, "TOTAL_ENTRIES=100") {
		t.Error("CI output should contain TOTAL_ENTRIES")
	}
	if !strings.Contains(output, "ERROR_COUNT=5") {
		t.Error("CI output should contain ERROR_COUNT")
	}
	if !strings.Contains(output, "WARNING_COUNT=10") {
		t.Error("CI output should contain WARNING_COUNT")
	}
	if !strings.Contains(output, "CLUSTER_COUNT=1") {
		t.Error("CI output should contain CLUSTER_COUNT")
	}
	if !strings.Contains(output, "TOP_ERROR=Database timeout") {
		t.Error("CI output should contain TOP_ERROR")
	}
	if !strings.Contains(output, "TOP_ERROR_COUNT=5") {
		t.Error("CI output should contain TOP_ERROR_COUNT")
	}
}

func TestFormatter_ColorOutput(t *testing.T) {
	report := types.SummaryReport{
		GeneratedAt:    time.Now(),
		TotalEntries:   1,
		ErrorEntries:   1,
		Clusters: []types.ErrorCluster{
			{Count: 1, Level: types.LevelError, MessagePattern: "Test error"},
		},
	}

	var colorBuf bytes.Buffer
	colorF := New(false, false, false, false, &colorBuf)
	if err := colorF.WriteReport(report); err != nil {
		t.Fatalf("WriteReport failed: %v", err)
	}
	colorOutput := colorBuf.String()

	var noColorBuf bytes.Buffer
	noColorF := New(true, false, false, false, &noColorBuf)
	if err := noColorF.WriteReport(report); err != nil {
		t.Fatalf("WriteReport failed: %v", err)
	}
	noColorOutput := noColorBuf.String()

	if !strings.Contains(colorOutput, "\033[") {
		t.Error("color output should contain ANSI codes")
	}
	if strings.Contains(noColorOutput, "\033[") {
		t.Error("no-color output should not contain ANSI codes")
	}
}

func TestFormatter_WriteError(t *testing.T) {
	err := &types.ProcessError{
		Code:       "TEST_ERROR",
		Message:    "Test error message",
		Suggestion: "Try this fix",
		Details: map[string]interface{}{
			"path":  "/tmp/test.log",
			"count": 42,
		},
	}

	t.Run("table format", func(t *testing.T) {
		var buf bytes.Buffer
		f := New(true, false, false, false, &buf)

		if err := f.WriteError(err); err != nil {
			t.Fatalf("WriteError failed: %v", err)
		}

		output := buf.String()
		if !strings.Contains(output, "ERROR") {
			t.Error("output should contain ERROR")
		}
		if !strings.Contains(output, "Test error message") {
			t.Error("output should contain error message")
		}
		if !strings.Contains(output, "TEST_ERROR") {
			t.Error("output should contain error code")
		}
		if !strings.Contains(output, "Try this fix") {
			t.Error("output should contain suggestion")
		}
		if !strings.Contains(output, "/tmp/test.log") {
			t.Error("output should contain details")
		}
	})

	t.Run("JSON format", func(t *testing.T) {
		var buf bytes.Buffer
		f := New(true, false, true, false, &buf)

		if err := f.WriteError(err); err != nil {
			t.Fatalf("WriteError failed: %v", err)
		}

		var result map[string]interface{}
		if err := json.Unmarshal(buf.Bytes(), &result); err != nil {
			t.Fatalf("Output is not valid JSON: %v", err)
		}

		if result["code"] != "TEST_ERROR" {
			t.Errorf("code = %v, want TEST_ERROR", result["code"])
		}
		if result["suggestion"] != "Try this fix" {
			t.Errorf("suggestion = %v, want 'Try this fix'", result["suggestion"])
		}
	})
}

func TestTruncate(t *testing.T) {
	tests := []struct {
		name   string
		input  string
		maxLen int
		want   string
	}{
		{"short string", "hello", 10, "hello"},
		{"exact length", "hello", 5, "hello"},
		{"long string", "hello world", 8, "hello..."},
		{"very short max", "hello", 3, "hel"},
		{"empty string", "", 5, ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := truncate(tt.input, tt.maxLen); got != tt.want {
				t.Errorf("truncate(%q, %d) = %q, want %q", tt.input, tt.maxLen, got, tt.want)
			}
		})
	}
}

func TestJoinMapKeys(t *testing.T) {
	m := map[string]int{
		"api": 1,
		"web": 2,
		"db":  3,
	}

	result := joinMapKeys(m)
	if result != "api, db, web" {
		t.Errorf("joinMapKeys() = %q, want %q", result, "api, db, web")
	}
}

func TestJSONOutput(t *testing.T) {
	f := New(false, false, true, false, nil)
	if !f.JSONOutput() {
		t.Error("JSONOutput() should return true")
	}

	f2 := New(false, false, false, false, nil)
	if f2.JSONOutput() {
		t.Error("JSONOutput() should return false")
	}
}

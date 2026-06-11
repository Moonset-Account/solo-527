package parser

import (
	"strings"
	"testing"

	"logsum/internal/types"
)

func TestParseLine(t *testing.T) {
	p := New(false)

	tests := []struct {
		name          string
		line          string
		wantLevel     types.LogLevel
		wantService   string
		wantRequestID string
		wantEnv       string
		wantMessage   string
	}{
		{
			name:          "standard log with JSON fields",
			line:          `2024-01-15T10:30:00Z ERROR service="api-gateway" request_id="abc123-def456" env="production" Database connection failed`,
			wantLevel:     types.LevelError,
			wantService:   "api-gateway",
			wantRequestID: "abc123-def456",
			wantEnv:       "production",
		},
		{
			name:          "log with UUID request ID",
			line:          `2024-01-15T10:30:01Z INFO service="user-service" 550e8400-e29b-41d4-a716-446655440000 User logged in successfully`,
			wantLevel:     types.LevelInfo,
			wantService:   "user-service",
			wantRequestID: "550e8400-e29b-41d4-a716-446655440000",
		},
		{
			name:          "bracket format log",
			line:          `2024-01-15 10:30:02 [payment-service] [WARN] [req-789] Payment processing timeout`,
			wantLevel:     types.LevelWarn,
			wantService:   "payment-service",
			wantRequestID: "req-789",
		},
		{
			name:          "fatal level log",
			line:          `2024/01/15 10:30:03 FATAL svc=order-service trace_id=trace-001 Critical system failure`,
			wantLevel:     types.LevelFatal,
			wantService:   "order-service",
			wantRequestID: "trace-001",
		},
		{
			name:          "debug level",
			line:          `2024-01-15T10:30:04.123Z DEBUG service="auth" Debug message`,
			wantLevel:     types.LevelDebug,
			wantService:   "auth",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			entry := p.parseLine(tt.line)
			if entry == nil {
				t.Fatal("expected entry, got nil")
			}
			if entry.Level != tt.wantLevel {
				t.Errorf("Level = %v, want %v", entry.Level, tt.wantLevel)
			}
			if tt.wantService != "" && entry.Service != tt.wantService {
				t.Errorf("Service = %v, want %v", entry.Service, tt.wantService)
			}
			if tt.wantRequestID != "" && entry.RequestID != tt.wantRequestID {
				t.Errorf("RequestID = %v, want %v", entry.RequestID, tt.wantRequestID)
			}
			if tt.wantEnv != "" && entry.Environment != tt.wantEnv {
				t.Errorf("Environment = %v, want %v", entry.Environment, tt.wantEnv)
			}
			if entry.Timestamp.IsZero() {
				t.Error("expected non-zero timestamp")
			}
		})
	}
}

func TestIsNewLogEntry(t *testing.T) {
	p := New(false)

	tests := []struct {
		name string
		line string
		want bool
	}{
		{"valid entry with timestamp and level", "2024-01-15T10:30:00Z ERROR something happened", true},
		{"valid entry with date format", "2024-01-15 10:30:00 INFO message", true},
		{"valid entry with slash format", "2024/01/15 10:30:00 WARN message", true},
		{"no timestamp", "ERROR something happened", false},
		{"no level", "2024-01-15T10:30:00Z something happened", false},
		{"stack trace line", "at com.example.Service.method(Service.java:123)", false},
		{"empty line", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := p.isNewLogEntry(tt.line); got != tt.want {
				t.Errorf("isNewLogEntry() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestFindTimestamp(t *testing.T) {
	tests := []struct {
		name     string
		line     string
		wantZero bool
	}{
		{"RFC3339", "2024-01-15T10:30:00Z message", false},
		{"RFC3339 with nano", "2024-01-15T10:30:00.123Z message", false},
		{"simple datetime", "2024-01-15 10:30:00 message", false},
		{"slash datetime", "2024/01/15 10:30:00 message", false},
		{"no timestamp", "just a message", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ts, idx := findTimestamp(tt.line)
			if tt.wantZero && !ts.IsZero() {
				t.Error("expected zero timestamp")
			}
			if !tt.wantZero && ts.IsZero() {
				t.Error("expected non-zero timestamp")
			}
			if !tt.wantZero && idx == 0 {
				t.Error("expected non-zero index")
			}
		})
	}
}

func TestFindLevel(t *testing.T) {
	tests := []struct {
		line string
		want types.LogLevel
	}{
		{"DEBUG message", types.LevelDebug},
		{"INFO message", types.LevelInfo},
		{"WARN message", types.LevelWarn},
		{"WARNING message", types.LevelWarn},
		{"ERROR message", types.LevelError},
		{"FATAL message", types.LevelFatal},
		{"PANIC message", types.LevelFatal},
		{"debug lowercase", types.LevelDebug},
		{"no level here", ""},
	}

	for _, tt := range tests {
		t.Run(tt.line, func(t *testing.T) {
			if got := findLevel(tt.line); got != tt.want {
				t.Errorf("findLevel(%q) = %v, want %v", tt.line, got, tt.want)
			}
		})
	}
}

func TestParseReader(t *testing.T) {
	p := New(false)

	logContent := `2024-01-15T10:30:00Z INFO service="api" request_id="r1" Starting request
2024-01-15T10:30:01Z DEBUG service="api" request_id="r1" Processing step 1
2024-01-15T10:30:02Z ERROR service="api" request_id="r1" Database connection failed
	at com.example.DB.connect(DB.java:123)
	at com.example.Service.process(Service.java:456)
2024-01-15T10:30:03Z WARN service="api" request_id="r1" Retrying operation
2024-01-15T10:30:04Z INFO service="api" request_id="r1" Request completed`

	entries, err := p.ParseReader(strings.NewReader(logContent), "test.log")
	if err != nil {
		t.Fatalf("ParseReader failed: %v", err)
	}

	if len(entries) != 5 {
		t.Errorf("expected 5 entries, got %d", len(entries))
	}

	errorEntry := entries[2]
	if errorEntry.Level != types.LevelError {
		t.Errorf("expected ERROR level, got %v", errorEntry.Level)
	}
	if !strings.Contains(errorEntry.ErrorStack, "DB.connect") {
		t.Error("expected stack trace in ErrorStack")
	}
}

func TestGetContextLines(t *testing.T) {
	lines := []string{"line0", "line1", "line2", "line3", "line4", "line5", "line6"}

	tests := []struct {
		name     string
		idx      int
		count    int
		before   bool
		wantLen  int
		wantFirst string
	}{
		{"before from middle", 3, 2, true, 2, "line1"},
		{"after from middle", 3, 2, false, 2, "line4"},
		{"before from start", 0, 3, true, 0, ""},
		{"after from end", 6, 3, false, 0, ""},
		{"before near start", 1, 3, true, 1, "line0"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := getContextLines(lines, tt.idx, tt.count, tt.before)
			if len(got) != tt.wantLen {
				t.Errorf("length = %d, want %d", len(got), tt.wantLen)
			}
			if tt.wantLen > 0 && got[0] != tt.wantFirst {
				t.Errorf("first = %q, want %q", got[0], tt.wantFirst)
			}
		})
	}
}

package logparser

import (
	"strings"
	"testing"
	"time"

	"github.com/google/go-cmp/cmp"
)

func TestParseReader_BasicStructuredLog(t *testing.T) {
	input := `2026-06-10T09:00:00.000Z INFO service=api-gateway env=prod request_id=abc-1 - Request OK
2026-06-10T09:00:01.000Z ERROR service=payment-svc env=staging request_id=abc-2 - Failed to charge
`
	p := NewParser()
	res, err := p.ParseReader(strings.NewReader(input), "test.log")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(res.Entries) != 2 {
		t.Fatalf("want 2 entries, got %d", len(res.Entries))
	}

	e1 := res.Entries[0]
	if e1.Level != LevelInfo {
		t.Errorf("entry1 level: want INFO, got %s", e1.Level)
	}
	if e1.Service != "api-gateway" {
		t.Errorf("entry1 service: want api-gateway, got %q", e1.Service)
	}
	if e1.Environment != "prod" {
		t.Errorf("entry1 env: want prod, got %q", e1.Environment)
	}
	if e1.RequestID != "abc-1" {
		t.Errorf("entry1 request_id: want abc-1, got %q", e1.RequestID)
	}
	if !strings.Contains(e1.Message, "Request OK") {
		t.Errorf("entry1 message: want contains 'Request OK', got %q", e1.Message)
	}
	if e1.Timestamp.IsZero() {
		t.Errorf("entry1 timestamp: want non-zero")
	}

	e2 := res.Entries[1]
	if e2.Level != LevelError {
		t.Errorf("entry2 level: want ERROR, got %s", e2.Level)
	}
	if e2.Service != "payment-svc" {
		t.Errorf("entry2 service: want payment-svc, got %q", e2.Service)
	}
}

func TestParseReader_JavaStacktrace(t *testing.T) {
	input := `2026-06-10 09:00:00 ERROR service=user-svc env=prod request_id=r-1 - NullPointerException
  at com.users.UserController.getProfile(UserController.java:78)
  at com.users.UserController.get(UserController.java:32)
2026-06-10 09:00:01 INFO service=user-svc env=prod request_id=r-2 - OK
`
	p := NewParser()
	res, err := p.ParseReader(strings.NewReader(input), "java.log")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(res.Entries) != 2 {
		t.Fatalf("want 2 entries, got %d", len(res.Entries))
	}
	errEntry := res.Entries[0]
	if len(errEntry.Stacktrace) != 2 {
		t.Fatalf("want 2 stack frames, got %d", len(errEntry.Stacktrace))
	}
	f0 := errEntry.Stacktrace[0]
	if f0.File != "UserController.java" || f0.Line != 78 {
		t.Errorf("frame0: want UserController.java:78, got %+v", f0)
	}
	if f0.Function != "com.users.UserController.getProfile" {
		t.Errorf("frame0 function: got %q", f0.Function)
	}
}

func TestParseReader_GoPanic(t *testing.T) {
	input := `2026/06/10 09:00:00 FATAL service=worker env=staging request_id=r-3 - processing batch
github.com/backend-ops/logsum/internal/core.(*Processor).processBatch(...)
	/Users/dev/project/internal/core/processor.go:112 +0x1d2
2026/06/10 09:00:01 INFO - next line
`
	p := NewParser()
	res, err := p.ParseReader(strings.NewReader(input), "go.log")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(res.Entries) != 2 {
		t.Fatalf("want 2 entries, got %d", len(res.Entries))
	}
	fatal := res.Entries[0]
	if fatal.Level != LevelFatal {
		t.Errorf("want FATAL, got %s", fatal.Level)
	}
}

func TestParseLevels(t *testing.T) {
	cases := map[string]Level{
		"DEBUG": LevelDebug, "debug": LevelDebug,
		"INFO": LevelInfo, "info": LevelInfo,
		"WARN": LevelWarn, "WARNING": LevelWarn,
		"ERROR": LevelError, "ERR": LevelError, "error": LevelError,
		"FATAL": LevelFatal, "fatal": LevelFatal,
		"xxx": LevelUnknown,
	}
	for in, want := range cases {
		got := ParseLevel(in)
		if got != want {
			t.Errorf("ParseLevel(%q) = %s, want %s", in, got, want)
		}
	}
}

func TestIsErrorOrAbove(t *testing.T) {
	for _, l := range []Level{LevelDebug, LevelInfo, LevelWarn, LevelUnknown} {
		if l.IsErrorOrAbove() {
			t.Errorf("%s should not be error-or-above", l)
		}
	}
	for _, l := range []Level{LevelError, LevelFatal} {
		if !l.IsErrorOrAbove() {
			t.Errorf("%s should be error-or-above", l)
		}
	}
}

func TestClusterKey_UniqueByServiceAndFunction(t *testing.T) {
	e1 := &LogEntry{Service: "a", Level: LevelError, Stacktrace: []StackFrame{{Function: "f1"}}}
	e2 := &LogEntry{Service: "a", Level: LevelError, Stacktrace: []StackFrame{{Function: "f1"}}}
	e3 := &LogEntry{Service: "b", Level: LevelError, Stacktrace: []StackFrame{{Function: "f1"}}}
	e4 := &LogEntry{Service: "a", Level: LevelWarn, Stacktrace: []StackFrame{{Function: "f1"}}}
	if diff := cmp.Diff(e1.ClusterKey(), e2.ClusterKey()); diff != "" {
		t.Errorf("same service/function should produce same key (-got +want):\n%s", diff)
	}
	if e1.ClusterKey() == e3.ClusterKey() {
		t.Errorf("different service should produce different key")
	}
	if e1.ClusterKey() == e4.ClusterKey() {
		t.Errorf("different level should produce different key")
	}
}

func TestNormalizeMessage(t *testing.T) {
	cases := []struct {
		in, want string
	}{
		{"user 123 not found", "user <NUM> not found"},
		{"got request from 192.168.1.1:8080", "got request from <IP>:<NUM>"},
		{"uuid 550e8400-e29b-41d4-a716-446655440000 done", "uuid <UUID> done"},
		{"failed with 0xc0ffee code", "failed with <HEX> code"},
	}
	for _, c := range cases {
		got := normalizeMessage(c.in)
		if got != c.want {
			t.Errorf("normalize(%q) = %q, want %q", c.in, got, c.want)
		}
	}
}

func TestExtractKVFields(t *testing.T) {
	e := &LogEntry{Fields: map[string]string{}}
	extractKVFields(e, "service=foo env=staging request_id=bar trace_id=qux custom=hello")
	if e.Service != "foo" {
		t.Errorf("service: want foo, got %q", e.Service)
	}
	if e.Environment != "staging" {
		t.Errorf("env: want staging, got %q", e.Environment)
	}
	if e.RequestID == "" {
		t.Errorf("request_id should be non-empty")
	}
	if v := e.Fields["custom"]; v != "hello" {
		t.Errorf("custom field: want hello, got %q", v)
	}
}

func TestParseDuration(t *testing.T) {
	p := NewParser()
	_ = p
	d, err := time.ParseDuration("2h")
	if err != nil {
		t.Fatal(err)
	}
	_ = d
}

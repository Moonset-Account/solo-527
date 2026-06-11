package cluster

import (
	"testing"
	"time"

	"logsum/internal/types"
)

func TestClusterer_Cluster(t *testing.T) {
	now := time.Now()

	entries := []types.LogEntry{
		{
			Timestamp: now.Add(-2 * time.Hour),
			Level:     types.LevelError,
			Service:   "api",
			Message:   "Database connection failed",
			ErrorStack: "com.example.DB.connect(DB.java:123)",
			RequestID: "req1",
			Environment: "prod",
		},
		{
			Timestamp: now.Add(-1 * time.Hour),
			Level:     types.LevelError,
			Service:   "web",
			Message:   "Database connection failed",
			ErrorStack: "com.example.DB.connect(DB.java:123)",
			RequestID: "req2",
			Environment: "prod",
		},
		{
			Timestamp: now.Add(-30 * time.Minute),
			Level:     types.LevelError,
			Service:   "api",
			Message:   "Null pointer exception",
			ErrorStack: "com.example.Service.process(Service.java:456)",
			RequestID: "req3",
			Environment: "prod",
		},
		{
			Timestamp: now.Add(-15 * time.Minute),
			Level:     types.LevelInfo,
			Service:   "api",
			Message:   "Request processed successfully",
		},
		{
			Timestamp: now.Add(-10 * time.Minute),
			Level:     types.LevelWarn,
			Service:   "api",
			Message:   "Slow query detected",
			RequestID: "req4",
		},
		{
			Timestamp: now.Add(-5 * time.Minute),
			Level:     types.LevelError,
			Service:   "api",
			Message:   "Database connection failed",
			ErrorStack: "com.example.DB.connect(DB.java:123)",
			RequestID: "req5",
			Environment: "staging",
		},
	}

	c := New(1, 3)
	clusters := c.Cluster(entries)

	if len(clusters) != 3 {
		t.Errorf("expected 3 clusters, got %d", len(clusters))
	}

	dbCluster := clusters[0]
	if dbCluster.Count != 3 {
		t.Errorf("DB cluster count = %d, want 3", dbCluster.Count)
	}
	if dbCluster.Services["api"] != 2 {
		t.Errorf("api service count = %d, want 2", dbCluster.Services["api"])
	}
	if dbCluster.Services["web"] != 1 {
		t.Errorf("web service count = %d, want 1", dbCluster.Services["web"])
	}
	if dbCluster.Environments["prod"] != 2 {
		t.Errorf("prod env count = %d, want 2", dbCluster.Environments["prod"])
	}
	if len(dbCluster.RequestIDs) < 2 {
		t.Errorf("expected at least 2 request IDs, got %d", len(dbCluster.RequestIDs))
	}

	if dbCluster.FirstOccurrence.After(dbCluster.LastOccurrence) {
		t.Error("First occurrence should be before last occurrence")
	}
}

func TestClusterer_MinClusterSize(t *testing.T) {
	now := time.Now()

	entries := []types.LogEntry{
		{
			Timestamp: now,
			Level:     types.LevelError,
			Message:   "Error 1",
			RequestID: "r1",
		},
		{
			Timestamp: now.Add(time.Minute),
			Level:     types.LevelError,
			Message:   "Error 1",
			RequestID: "r2",
		},
		{
			Timestamp: now.Add(2 * time.Minute),
			Level:     types.LevelError,
			Message:   "Unique error",
			RequestID: "r3",
		},
	}

	c := New(2, 0)
	clusters := c.Cluster(entries)

	if len(clusters) != 1 {
		t.Errorf("expected 1 cluster (min size 2), got %d", len(clusters))
	}

	if clusters[0].Count != 2 {
		t.Errorf("cluster count = %d, want 2", clusters[0].Count)
	}
}

func TestClusterer_GetTopN(t *testing.T) {
	clusters := []types.ErrorCluster{
		{Count: 10},
		{Count: 8},
		{Count: 5},
		{Count: 3},
		{Count: 1},
	}

	c := New(1, 0)

	top3 := c.GetTopN(clusters, 3)
	if len(top3) != 3 {
		t.Errorf("expected 3 clusters, got %d", len(top3))
	}
	if top3[0].Count != 10 {
		t.Errorf("first cluster count = %d, want 10", top3[0].Count)
	}

	all := c.GetTopN(clusters, 10)
	if len(all) != 5 {
		t.Errorf("expected 5 clusters, got %d", len(all))
	}

	none := c.GetTopN(clusters, 0)
	if len(none) != 5 {
		t.Errorf("expected all clusters when N=0, got %d", len(none))
	}
}

func TestGenerateSignature(t *testing.T) {
	msg1 := "User 12345 failed to login"
	msg2 := "User 67890 failed to login"
	stack := "at com.example.Auth.login(Auth.java:123)\n    at com.example.Service.process(Service.java:456)"

	sig1 := generateSignature(msg1, stack)
	sig2 := generateSignature(msg2, stack)

	if sig1 != sig2 {
		t.Error("signatures should match for same stack trace")
	}

	sig3 := generateSignature(msg1, "")
	sig4 := generateSignature(msg2, "")

	if sig3 != sig4 {
		t.Error("signatures should match for same message pattern")
	}
}

func TestGenerateMessagePattern(t *testing.T) {
	tests := []struct {
		name    string
		message string
		want    string
	}{
		{
			name:    "uuid replacement",
			message: "Request 550e8400-e29b-41d4-a716-446655440000 failed",
			want:    "Request <uuid> failed",
		},
		{
			name:    "ip replacement",
			message: "Connection from 192.168.1.1 blocked",
			want:    "Connection from <ip> blocked",
		},
		{
			name:    "number replacement",
			message: "User 12345 not found",
			want:    "User <num> not found",
		},
		{
			name:    "hex replacement",
			message: "Address 0xDEADBEEF invalid",
			want:    "Address <hex> invalid",
		},
		{
			name:    "email replacement",
			message: "Email sent to user@example.com",
			want:    "Email sent to <email>",
		},
		{
			name:    "path replacement",
			message: "File /var/log/app.log not found",
			want:    "File <path> not found",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := generateMessagePattern(tt.message)
			if got != tt.want {
				t.Errorf("generateMessagePattern() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestBuildReport(t *testing.T) {
	now := time.Now()
	entries := []types.LogEntry{
		{Level: types.LevelInfo, Service: "api"},
		{Level: types.LevelError, Service: "api"},
		{Level: types.LevelError, Service: "web"},
		{Level: types.LevelWarn, Service: "api"},
		{Level: types.LevelFatal, Service: "db"},
	}

	clusters := []types.ErrorCluster{
		{Count: 2, Level: types.LevelError},
		{Count: 1, Level: types.LevelWarn},
		{Count: 1, Level: types.LevelFatal},
	}

	timeRange := types.TimeRange{
		Start: now.Add(-1 * time.Hour),
		End:   now,
	}

	report := BuildReport(entries, clusters, 2, []string{"api"}, timeRange)

	if report.TotalEntries != 5 {
		t.Errorf("TotalEntries = %d, want 5", report.TotalEntries)
	}
	if report.ErrorEntries != 3 {
		t.Errorf("ErrorEntries = %d, want 3 (ERROR + FATAL)", report.ErrorEntries)
	}
	if report.WarningEntries != 1 {
		t.Errorf("WarningEntries = %d, want 1", report.WarningEntries)
	}
	if len(report.Services) != 3 {
		t.Errorf("Services count = %d, want 3", len(report.Services))
	}
	if len(report.TopErrors) != 2 {
		t.Errorf("TopErrors count = %d, want 2", len(report.TopErrors))
	}
	if len(report.FilteredServices) != 1 {
		t.Errorf("FilteredServices count = %d, want 1", len(report.FilteredServices))
	}
	if report.TimeRange != timeRange {
		t.Error("TimeRange not set correctly")
	}
}

func TestIsErrorLevel(t *testing.T) {
	tests := []struct {
		level types.LogLevel
		want  bool
	}{
		{types.LevelDebug, false},
		{types.LevelInfo, false},
		{types.LevelWarn, true},
		{types.LevelError, true},
		{types.LevelFatal, true},
	}

	for _, tt := range tests {
		t.Run(string(tt.level), func(t *testing.T) {
			if got := isErrorLevel(tt.level); got != tt.want {
				t.Errorf("isErrorLevel(%v) = %v, want %v", tt.level, got, tt.want)
			}
		})
	}
}

func TestGenerateClusterID(t *testing.T) {
	id1 := generateClusterID("test signature")
	id2 := generateClusterID("test signature")
	id3 := generateClusterID("different signature")

	if id1 != id2 {
		t.Error("same signature should produce same ID")
	}
	if id1 == id3 {
		t.Error("different signatures should produce different IDs")
	}
	if len(id1) != 12 {
		t.Errorf("ID length = %d, want 12", len(id1))
	}
}

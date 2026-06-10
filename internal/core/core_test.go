package core

import (
	"strings"
	"testing"
	"time"

	"github.com/backend-ops/logsum/pkg/logparser"
)

func mkEntry(svc, lvl, msg, rid, env string, tOffset time.Duration) *logparser.LogEntry {
	return &logparser.LogEntry{
		Timestamp:   time.Now().Add(tOffset),
		Level:       logparser.ParseLevel(lvl),
		Service:     svc,
		Environment: env,
		RequestID:   rid,
		Message:     msg,
	}
}

func TestBuildFilterOptions_DefaultOnlyErrors(t *testing.T) {
	opts := BuildFilterOptions(nil, nil, nil, nil, true, time.Time{}, time.Time{})
	errEntry := mkEntry("a", "ERROR", "boom", "r1", "prod", 0)
	infoEntry := mkEntry("a", "INFO", "ok", "r1", "prod", 0)
	if !opts.Match(errEntry) {
		t.Error("ERROR entry should match with default (only-errors)")
	}
	if opts.Match(infoEntry) {
		t.Error("INFO entry should NOT match with only-errors=true")
	}
}

func TestBuildFilterOptions_ServiceFilter(t *testing.T) {
	opts := BuildFilterOptions([]string{"api-gateway"}, nil, nil, nil, false, time.Time{}, time.Time{})
	entries := []*logparser.LogEntry{
		mkEntry("api-gateway", "INFO", "", "r1", "prod", 0),
		mkEntry("user-svc", "INFO", "", "r2", "prod", 0),
		mkEntry("API-GATEWAY", "WARN", "", "r3", "prod", 0),
	}
	matched := ApplyFilter(entries, opts)
	if len(matched) != 2 {
		t.Fatalf("want 2 matched, got %d", len(matched))
	}
}

func TestBuildFilterOptions_TimeRange(t *testing.T) {
	anchor := time.Now()
	since := anchor.Add(-1 * time.Hour)
	until := anchor.Add(-30 * time.Minute)
	opts := BuildFilterOptions(nil, nil, nil, nil, false, since, until)
	entryD := mkEntry("d", "INFO", "", "r4", "prod", 0)
	entryD.Timestamp = time.Time{}
	entries := []*logparser.LogEntry{
		mkEntry("a", "INFO", "", "r1", "prod", -90*time.Minute),  // before: excluded
		mkEntry("b", "INFO", "", "r2", "prod", -45*time.Minute),  // within: included
		mkEntry("c", "INFO", "", "r3", "prod", -15*time.Minute),  // after: excluded
		entryD,                                                    // no ts: included (unable to filter)
	}
	matched := ApplyFilter(entries, opts)
	if len(matched) != 2 {
		t.Fatalf("want 2 matched (b + no-timestamp d), got %d", len(matched))
	}
}

func TestBuildFilterOptions_EnvAndRequestID(t *testing.T) {
	opts := BuildFilterOptions(
		nil, nil,
		[]string{"prod"},
		[]string{"r-keep"},
		false, time.Time{}, time.Time{})
	entries := []*logparser.LogEntry{
		mkEntry("a", "INFO", "", "r-keep", "prod", 0),   // keep
		mkEntry("a", "INFO", "", "r-skip", "prod", 0),   // rid mismatch
		mkEntry("a", "INFO", "", "r-keep", "staging", 0), // env mismatch
	}
	matched := ApplyFilter(entries, opts)
	if len(matched) != 1 {
		t.Fatalf("want 1, got %d", len(matched))
	}
}

func TestClusterErrors_Basic(t *testing.T) {
	entries := []*logparser.LogEntry{
		mkEntry("a", "ERROR", "db timeout 1", "r1", "prod", 0),
		mkEntry("a", "ERROR", "db timeout 2", "r2", "prod", -time.Minute),
		mkEntry("a", "ERROR", "db timeout 3", "r3", "staging", -2*time.Minute),
		mkEntry("b", "ERROR", "payment 429", "r4", "prod", -3*time.Minute),
		mkEntry("c", "INFO", "ok", "r5", "prod", 0),
	}
	stats := ClusterErrors(entries, 10, 3, true)
	if stats.ClusterCount < 2 {
		t.Errorf("want >=2 clusters, got %d", stats.ClusterCount)
	}
	if stats.Summary[logparser.LevelError] != 4 {
		t.Errorf("level summary ERROR count: want 4, got %d", stats.Summary[logparser.LevelError])
	}
	if stats.Summary[logparser.LevelInfo] != 1 {
		t.Errorf("level summary INFO count: want 1, got %d", stats.Summary[logparser.LevelInfo])
	}

	// Top cluster should be the db timeout one (3 occurrences)
	if len(stats.Clusters) == 0 {
		t.Fatal("no clusters")
	}
	top := stats.Clusters[0]
	if top.Count < 2 {
		t.Errorf("top cluster count: want >=2, got %d (%+v)", top.Count, top)
	}
}

func TestClusterErrors_NoCluster(t *testing.T) {
	entries := []*logparser.LogEntry{
		mkEntry("a", "ERROR", "x", "r1", "prod", 0),
	}
	stats := ClusterErrors(entries, 10, 3, false)
	if stats.ClusterCount != 0 || len(stats.Clusters) != 0 {
		t.Errorf("doCluster=false should produce no clusters: %+v", stats)
	}
}

func TestBuildContextWindows_NoContext(t *testing.T) {
	entries := []*logparser.LogEntry{
		mkEntry("a", "INFO", "1", "", "", 0),
		mkEntry("a", "ERROR", "boom", "", "", 0),
		mkEntry("a", "INFO", "2", "", "", 0),
	}
	matches := []*logparser.LogEntry{entries[1]}
	wins := BuildContextWindows(entries, matches, 0)
	if len(wins) != 1 {
		t.Fatalf("want 1 window, got %d", len(wins))
	}
	w := wins[0]
	if len(w.Before)+len(w.After) != 0 {
		t.Errorf("distance 0 should have no before/after entries, got before=%d after=%d", len(w.Before), len(w.After))
	}
}

func TestBuildContextWindows_WithDistance(t *testing.T) {
	n := 9
	entries := make([]*logparser.LogEntry, n)
	for i := 0; i < n; i++ {
		entries[i] = mkEntry("a", "INFO", "line", "", "", 0)
		entries[i].LineNum = i + 1
	}
	matches := []*logparser.LogEntry{entries[4]} // center
	wins := BuildContextWindows(entries, matches, 2)
	if len(wins) != 1 {
		t.Fatalf("want 1 window, got %d", len(wins))
	}
	w := wins[0]
	if len(w.Before) != 2 || len(w.After) != 2 {
		t.Errorf("want 2+2 context, got before=%d after=%d", len(w.Before), len(w.After))
	}
	if w.Center != entries[4] {
		t.Errorf("wrong center")
	}
}

func TestComputeSinceFromEntries(t *testing.T) {
	t1 := time.Now().Add(-3 * time.Hour)
	t2 := time.Now().Add(-30 * time.Minute)
	entries := []*logparser.LogEntry{
		{Timestamp: t1},
		{Timestamp: t2},
	}
	got := ComputeSinceFromEntries(entries, 1*time.Hour)
	expected := t2.Add(-1 * time.Hour)
	delta := got.Sub(expected)
	if delta < 0 {
		delta = -delta
	}
	if delta > time.Second {
		t.Errorf("ComputeSinceFromEntries: want ~%v, got %v (delta %v)", expected, got, delta)
	}
}

func TestMergeAdjacent(t *testing.T) {
	mkWin := func(idx, d int) *ContextWindow {
		e := &logparser.LogEntry{LineNum: idx}
		return &ContextWindow{Center: e, Distance: d}
	}
	wins := []*ContextWindow{
		mkWin(5, 1),  // range 4..6
		mkWin(7, 1),  // range 6..8  -> adjacent/overlap
		mkWin(20, 1), // range 19..21 -> isolated
	}
	merged := MergeAdjacent(wins)
	if len(merged) != 2 {
		t.Fatalf("want 2 merged groups, got %d", len(merged))
	}
}

func TestBuildFilterOptions_LevelFilter(t *testing.T) {
	opts := BuildFilterOptions(nil, []string{"WARN", "ERROR"}, nil, nil, false, time.Time{}, time.Time{})
	entries := []*logparser.LogEntry{
		mkEntry("a", "DEBUG", "", "", "", 0), // excluded
		mkEntry("a", "INFO", "", "", "", 0),  // excluded
		mkEntry("a", "WARN", "", "", "", 0),  // included
		mkEntry("a", "ERROR", "", "", "", 0), // included
		mkEntry("a", "FATAL", "", "", "", 0), // excluded (only WARN,ERROR)
	}
	matched := ApplyFilter(entries, opts)
	if len(matched) != 2 {
		t.Fatalf("want 2 matched (WARN+ERROR), got %d", len(matched))
	}
	_ = strings.TrimSpace
}

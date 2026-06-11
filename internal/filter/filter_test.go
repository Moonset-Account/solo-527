package filter

import (
	"testing"
	"time"

	"logsum/internal/types"
)

func TestFilter_Matches(t *testing.T) {
	now := time.Now()

	tests := []struct {
		name   string
		filter *Filter
		entry  types.LogEntry
		want   bool
	}{
		{
			name: "match all levels",
			filter: New(
				[]types.LogLevel{types.LevelError, types.LevelWarn},
				nil, nil, "", time.Time{}, time.Time{},
			),
			entry: types.LogEntry{Level: types.LevelError},
			want:  true,
		},
		{
			name: "no match level",
			filter: New(
				[]types.LogLevel{types.LevelError},
				nil, nil, "", time.Time{}, time.Time{},
			),
			entry: types.LogEntry{Level: types.LevelInfo},
			want:  false,
		},
		{
			name: "match service",
			filter: New(
				nil,
				[]string{"api", "web"},
				nil, "", time.Time{}, time.Time{},
			),
			entry: types.LogEntry{Service: "api"},
			want:  true,
		},
		{
			name: "no match service",
			filter: New(
				nil,
				[]string{"api"},
				nil, "", time.Time{}, time.Time{},
			),
			entry: types.LogEntry{Service: "web"},
			want:  false,
		},
		{
			name: "match request ID",
			filter: New(
				nil, nil,
				[]string{"req1", "req2"},
				"", time.Time{}, time.Time{},
			),
			entry: types.LogEntry{RequestID: "req1"},
			want:  true,
		},
		{
			name: "match environment",
			filter: New(
				nil, nil, nil,
				"production",
				time.Time{}, time.Time{},
			),
			entry: types.LogEntry{Environment: "production"},
			want:  true,
		},
		{
			name: "no match environment",
			filter: New(
				nil, nil, nil,
				"production",
				time.Time{}, time.Time{},
			),
			entry: types.LogEntry{Environment: "staging"},
			want:  false,
		},
		{
			name: "match time range",
			filter: New(
				nil, nil, nil, "",
				now.Add(-1*time.Hour),
				now.Add(1*time.Hour),
			),
			entry: types.LogEntry{Timestamp: now},
			want:  true,
		},
		{
			name: "before time range",
			filter: New(
				nil, nil, nil, "",
				now,
				now.Add(1*time.Hour),
			),
			entry: types.LogEntry{Timestamp: now.Add(-1 * time.Hour)},
			want:  false,
		},
		{
			name: "after time range",
			filter: New(
				nil, nil, nil, "",
				now.Add(-1*time.Hour),
				now,
			),
			entry: types.LogEntry{Timestamp: now.Add(1 * time.Hour)},
			want:  false,
		},
		{
			name: "combined filters - match",
			filter: New(
				[]types.LogLevel{types.LevelError},
				[]string{"api"},
				nil, "",
				now.Add(-1*time.Hour),
				now.Add(1*time.Hour),
			),
			entry: types.LogEntry{
				Level:     types.LevelError,
				Service:   "api",
				Timestamp: now,
			},
			want: true,
		},
		{
			name: "combined filters - no match level",
			filter: New(
				[]types.LogLevel{types.LevelError},
				[]string{"api"},
				nil, "",
				time.Time{}, time.Time{},
			),
			entry: types.LogEntry{
				Level:   types.LevelInfo,
				Service: "api",
			},
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.filter.Matches(tt.entry); got != tt.want {
				t.Errorf("Matches() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestFilter_Apply(t *testing.T) {
	now := time.Now()
	entries := []types.LogEntry{
		{Timestamp: now.Add(-2 * time.Hour), Level: types.LevelInfo, Service: "api"},
		{Timestamp: now.Add(-1 * time.Hour), Level: types.LevelError, Service: "api"},
		{Timestamp: now.Add(-30 * time.Minute), Level: types.LevelError, Service: "web"},
		{Timestamp: now.Add(-15 * time.Minute), Level: types.LevelWarn, Service: "api"},
		{Timestamp: now, Level: types.LevelError, Service: "api"},
	}

	f := New(
		[]types.LogLevel{types.LevelError},
		[]string{"api"},
		nil, "",
		now.Add(-1*time.Hour),
		now,
	)

	filtered := f.Apply(entries)

	if len(filtered) != 2 {
		t.Errorf("expected 2 entries, got %d", len(filtered))
	}

	for _, e := range filtered {
		if e.Level != types.LevelError {
			t.Errorf("expected ERROR level, got %v", e.Level)
		}
		if e.Service != "api" {
			t.Errorf("expected api service, got %v", e.Service)
		}
	}

	if !filtered[0].Timestamp.Before(filtered[1].Timestamp) {
		t.Error("entries should be sorted by timestamp ascending")
	}
}

func TestGetUniqueServices(t *testing.T) {
	entries := []types.LogEntry{
		{Service: "api"},
		{Service: "web"},
		{Service: "api"},
		{Service: ""},
		{Service: "db"},
	}

	services := GetUniqueServices(entries)

	if len(services) != 3 {
		t.Errorf("expected 3 unique services, got %d", len(services))
	}

	expected := []string{"api", "db", "web"}
	for i, s := range services {
		if s != expected[i] {
			t.Errorf("index %d: got %q, want %q", i, s, expected[i])
		}
	}
}

func TestCountByLevel(t *testing.T) {
	entries := []types.LogEntry{
		{Level: types.LevelInfo},
		{Level: types.LevelError},
		{Level: types.LevelError},
		{Level: types.LevelWarn},
		{Level: types.LevelError},
		{Level: types.LevelFatal},
	}

	counts := CountByLevel(entries)

	expected := map[types.LogLevel]int{
		types.LevelInfo:  1,
		types.LevelError: 3,
		types.LevelWarn:  1,
		types.LevelFatal: 1,
	}

	for level, want := range expected {
		if got := counts[level]; got != want {
			t.Errorf("%v: got %d, want %d", level, got, want)
		}
	}
}

func TestGetFilteredServices(t *testing.T) {
	f := New(
		nil,
		[]string{"web", "api", "db"},
		nil, "", time.Time{}, time.Time{},
	)

	services := f.GetFilteredServices()

	if len(services) != 3 {
		t.Errorf("expected 3 services, got %d", len(services))
	}

	expected := []string{"api", "db", "web"}
	for i, s := range services {
		if s != expected[i] {
			t.Errorf("index %d: got %q, want %q", i, s, expected[i])
		}
	}
}

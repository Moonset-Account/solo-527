package filter

import (
	"sort"
	"time"

	"logsum/internal/types"
)

type Filter struct {
	levels      map[types.LogLevel]bool
	services    map[string]bool
	requestIDs  map[string]bool
	environment string
	timeRange   types.TimeRange
}

func New(
	levels []types.LogLevel,
	services []string,
	requestIDs []string,
	environment string,
	since, until time.Time,
) *Filter {
	f := &Filter{
		levels:      make(map[types.LogLevel]bool),
		services:    make(map[string]bool),
		requestIDs:  make(map[string]bool),
		environment: environment,
		timeRange: types.TimeRange{
			Start: since,
			End:   until,
		},
	}

	for _, l := range levels {
		f.levels[l] = true
	}
	for _, s := range services {
		f.services[s] = true
	}
	for _, id := range requestIDs {
		f.requestIDs[id] = true
	}

	return f
}

func (f *Filter) Apply(entries []types.LogEntry) []types.LogEntry {
	var filtered []types.LogEntry

	for _, entry := range entries {
		if f.Matches(entry) {
			filtered = append(filtered, entry)
		}
	}

	sort.Slice(filtered, func(i, j int) bool {
		return filtered[i].Timestamp.Before(filtered[j].Timestamp)
	})

	return filtered
}

func (f *Filter) Matches(entry types.LogEntry) bool {
	if len(f.levels) > 0 && !f.levels[entry.Level] {
		return false
	}

	if len(f.services) > 0 && !f.services[entry.Service] {
		return false
	}

	if len(f.requestIDs) > 0 && !f.requestIDs[entry.RequestID] {
		return false
	}

	if f.environment != "" && entry.Environment != f.environment {
		return false
	}

	if !f.timeRange.Start.IsZero() && entry.Timestamp.Before(f.timeRange.Start) {
		return false
	}

	if !f.timeRange.End.IsZero() && entry.Timestamp.After(f.timeRange.End) {
		return false
	}

	return true
}

func (f *Filter) GetFilteredServices() []string {
	services := make([]string, 0, len(f.services))
	for s := range f.services {
		services = append(services, s)
	}
	sort.Strings(services)
	return services
}

func (f *Filter) GetTimeRange() types.TimeRange {
	return f.timeRange
}

func GetUniqueServices(entries []types.LogEntry) []string {
	seen := make(map[string]bool)
	var services []string

	for _, e := range entries {
		if e.Service != "" && !seen[e.Service] {
			seen[e.Service] = true
			services = append(services, e.Service)
		}
	}

	sort.Strings(services)
	return services
}

func CountByLevel(entries []types.LogEntry) map[types.LogLevel]int {
	counts := make(map[types.LogLevel]int)
	for _, e := range entries {
		counts[e.Level]++
	}
	return counts
}

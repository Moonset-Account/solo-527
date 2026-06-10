package core

import (
	"strings"
	"time"

	"github.com/backend-ops/logsum/pkg/logparser"
)

type FilterOptions struct {
	Since        time.Time
	Until        time.Time
	Services     map[string]bool
	Levels       map[logparser.Level]bool
	Environments map[string]bool
	RequestIDs   map[string]bool
	OnlyErrors   bool
}

func BuildFilterOptions(services, levels, envs, rids []string, onlyErrors bool, since, until time.Time) *FilterOptions {
	opts := &FilterOptions{
		Since:        since,
		Until:        until,
		Services:     make(map[string]bool),
		Levels:       make(map[logparser.Level]bool),
		Environments: make(map[string]bool),
		RequestIDs:   make(map[string]bool),
		OnlyErrors:   onlyErrors,
	}
	for _, s := range services {
		if s = strings.TrimSpace(s); s != "" {
			opts.Services[strings.ToLower(s)] = true
		}
	}
	for _, l := range levels {
		if l = strings.TrimSpace(l); l != "" {
			opts.Levels[logparser.ParseLevel(l)] = true
		}
	}
	for _, e := range envs {
		if e = strings.TrimSpace(e); e != "" {
			opts.Environments[strings.ToLower(e)] = true
		}
	}
	for _, r := range rids {
		if r = strings.TrimSpace(r); r != "" {
			opts.RequestIDs[r] = true
		}
	}
	return opts
}

func (f *FilterOptions) Match(e *logparser.LogEntry) bool {
	if e == nil {
		return false
	}
	if f.OnlyErrors && !e.Level.IsErrorOrAbove() {
		return false
	}
	if !f.Since.IsZero() && !e.Timestamp.IsZero() && e.Timestamp.Before(f.Since) {
		return false
	}
	if !f.Until.IsZero() && !e.Timestamp.IsZero() && e.Timestamp.After(f.Until) {
		return false
	}
	if len(f.Services) > 0 {
		svc := strings.ToLower(e.Service)
		if !f.Services[svc] {
			return false
		}
	}
	if len(f.Levels) > 0 {
		if !f.Levels[e.Level] {
			return false
		}
	}
	if len(f.Environments) > 0 {
		env := strings.ToLower(e.Environment)
		if !f.Environments[env] {
			return false
		}
	}
	if len(f.RequestIDs) > 0 {
		if !f.RequestIDs[e.RequestID] {
			return false
		}
	}
	return true
}

func ApplyFilter(entries []*logparser.LogEntry, opts *FilterOptions) []*logparser.LogEntry {
	result := make([]*logparser.LogEntry, 0, len(entries))
	for _, e := range entries {
		if opts.Match(e) {
			result = append(result, e)
		}
	}
	return result
}

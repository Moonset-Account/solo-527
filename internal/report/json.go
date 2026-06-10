package report

import (
	"encoding/json"
	"io"
	"time"

	"github.com/backend-ops/logsum/internal/core"
	"github.com/backend-ops/logsum/pkg/logparser"
)

type JSONReport struct {
	Version     string    `json:"report_version"`
	GeneratedAt time.Time `json:"generated_at"`
	Stats       JSONStats `json:"stats"`
	Clusters    []JSONCluster `json:"clusters,omitempty"`
	Context     []JSONContextWindow `json:"context,omitempty"`
}

type JSONStats struct {
	TotalLines     int            `json:"total_lines"`
	ParsedEntries  int            `json:"parsed_entries"`
	ParseErrors    int            `json:"parse_errors"`
	MatchedEntries int            `json:"matched_entries"`
	ClusterCount   int            `json:"cluster_count"`
	ElapsedMs      int64          `json:"elapsed_ms"`
	LevelSummary   map[string]int `json:"level_summary"`
	ByService      map[string]int `json:"by_service,omitempty"`
	Inputs         []string       `json:"inputs"`
}

type JSONCluster struct {
	Rank         int               `json:"rank"`
	Signature    string            `json:"signature"`
	Level        string            `json:"level"`
	Service      string            `json:"service,omitempty"`
	Count        int               `json:"count"`
	FirstSeen    string            `json:"first_seen,omitempty"`
	LastSeen     string            `json:"last_seen,omitempty"`
	Message      string            `json:"message"`
	SampleCount  int               `json:"sample_count"`
	Samples      []SampleRef       `json:"samples,omitempty"`
	RequestIDs   []string          `json:"request_ids,omitempty"`
	Environments map[string]int    `json:"environments,omitempty"`
	Stacktrace   []StackFrameView  `json:"stacktrace,omitempty"`
}

type SampleRef struct {
	LineNum     int    `json:"line_num"`
	SourceFile  string `json:"source_file"`
	Timestamp   string `json:"timestamp,omitempty"`
	RequestID   string `json:"request_id,omitempty"`
	Environment string `json:"environment,omitempty"`
	Message     string `json:"message"`
}

type StackFrameView struct {
	Function string `json:"function"`
	File     string `json:"file"`
	Line     int    `json:"line"`
}

type JSONContextWindow struct {
	Center JSONEntry   `json:"center"`
	Before []JSONEntry `json:"before,omitempty"`
	After  []JSONEntry `json:"after,omitempty"`
}

type JSONEntry struct {
	Raw         string            `json:"raw"`
	Timestamp   string            `json:"timestamp"`
	Level       string            `json:"level"`
	Service     string            `json:"service,omitempty"`
	Environment string            `json:"environment,omitempty"`
	RequestID   string            `json:"request_id,omitempty"`
	Message     string            `json:"message"`
	LineNum     int               `json:"line_num"`
	SourceFile  string            `json:"source_file"`
	Stacktrace  []StackFrameView  `json:"stacktrace,omitempty"`
	Fields      map[string]string `json:"fields,omitempty"`
}

func RenderJSON(w io.Writer, stats *core.RunStats, version string) error {
	report := buildJSONReport(stats, version)
	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	return enc.Encode(report)
}

func buildJSONReport(stats *core.RunStats, version string) JSONReport {
	r := JSONReport{
		Version:     "1.0",
		GeneratedAt: time.Now().UTC(),
	}
	elapsed := int64(0)
	if !stats.FinishedAt.IsZero() && !stats.StartedAt.IsZero() {
		elapsed = stats.FinishedAt.Sub(stats.StartedAt).Milliseconds()
	}
	r.Stats = JSONStats{
		TotalLines:     stats.TotalLines,
		ParsedEntries:  stats.ParsedEntries,
		ParseErrors:    stats.ParseErrors,
		MatchedEntries: stats.MatchedEntries,
		ClusterCount:   0,
		ElapsedMs:      elapsed,
		LevelSummary:   make(map[string]int),
		ByService:      make(map[string]int),
		Inputs:         stats.Inputs,
	}
	if stats.Clusters != nil {
		r.Stats.ClusterCount = stats.Clusters.ClusterCount
		for k, v := range stats.Clusters.Summary {
			r.Stats.LevelSummary[string(k)] = v
		}
		for k, v := range stats.Clusters.ByService {
			r.Stats.ByService[k] = v
		}
		for i, c := range stats.Clusters.Clusters {
			r.Clusters = append(r.Clusters, clusterToJSON(i+1, c))
		}
	}
	for _, w := range stats.Windows {
		r.Context = append(r.Context, windowToJSON(w))
	}
	return r
}

func clusterToJSON(rank int, c *core.ErrorCluster) JSONCluster {
	jc := JSONCluster{
		Rank:         rank,
		Signature:    c.Signature,
		Level:        string(c.Level),
		Service:      c.Service,
		Count:        c.Count,
		SampleCount:  len(c.Samples),
		RequestIDs:   c.RequestIDs,
		Environments: c.Environments,
	}
	if !c.FirstSeen.IsZero() {
		jc.FirstSeen = c.FirstSeen.UTC().Format(time.RFC3339)
	}
	if !c.LastSeen.IsZero() {
		jc.LastSeen = c.LastSeen.UTC().Format(time.RFC3339)
	}
	if c.Representative != nil {
		jc.Message = c.Representative.Message
		jc.Stacktrace = framesToJSON(c.Representative.Stacktrace)
	}
	for _, s := range c.Samples {
		jc.Samples = append(jc.Samples, sampleRefOf(s))
	}
	return jc
}

func sampleRefOf(e *logparser.LogEntry) SampleRef {
	s := SampleRef{
		LineNum:     e.LineNum,
		SourceFile:  e.SourceFile,
		Message:     e.Message,
		RequestID:   e.RequestID,
		Environment: e.Environment,
	}
	if !e.Timestamp.IsZero() {
		s.Timestamp = e.Timestamp.UTC().Format(time.RFC3339)
	}
	return s
}

func framesToJSON(fs []logparser.StackFrame) []StackFrameView {
	if len(fs) == 0 {
		return nil
	}
	out := make([]StackFrameView, len(fs))
	for i, f := range fs {
		out[i] = StackFrameView{Function: f.Function, File: f.File, Line: f.Line}
	}
	return out
}

func windowToJSON(w *core.ContextWindow) JSONContextWindow {
	jw := JSONContextWindow{
		Center: entryToJSON(w.Center),
	}
	for _, b := range w.Before {
		jw.Before = append(jw.Before, entryToJSON(b))
	}
	for _, a := range w.After {
		jw.After = append(jw.After, entryToJSON(a))
	}
	return jw
}

func entryToJSON(e *logparser.LogEntry) JSONEntry {
	if e == nil {
		return JSONEntry{}
	}
	j := JSONEntry{
		Raw:         e.Raw,
		Level:       string(e.Level),
		Service:     e.Service,
		Environment: e.Environment,
		RequestID:   e.RequestID,
		Message:     e.Message,
		LineNum:     e.LineNum,
		SourceFile:  e.SourceFile,
		Stacktrace:  framesToJSON(e.Stacktrace),
		Fields:      e.Fields,
	}
	if !e.Timestamp.IsZero() {
		j.Timestamp = e.Timestamp.UTC().Format(time.RFC3339)
	}
	return j
}

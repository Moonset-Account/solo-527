package core

import (
	"fmt"
	"io"
	"os"
	"time"

	"github.com/backend-ops/logsum/pkg/logparser"
)

type RunStats struct {
	StartedAt       time.Time
	FinishedAt      time.Time
	Inputs          []string
	TotalLines      int
	ParsedEntries   int
	ParseErrors     int
	MatchedEntries  int
	MatchedErrorCount int
	Filter          *FilterOptions
	Clusters        *ClusterStats
	Windows         []*ContextWindow
}

type Processor struct {
	parser       *logparser.Parser
	progressOut  io.Writer
	verbose      bool
}

func NewProcessor(progressOut io.Writer, verbose bool) *Processor {
	return &Processor{
		parser:      logparser.NewParser(),
		progressOut: progressOut,
		verbose:     verbose,
	}
}

func (p *Processor) logf(format string, args ...interface{}) {
	if p.progressOut != nil && !p.verbose {
		return
	}
	if p.progressOut != nil {
		fmt.Fprintf(p.progressOut, format+"\n", args...)
	}
}

func (p *Processor) info(format string, args ...interface{}) {
	if p.progressOut != nil {
		fmt.Fprintf(p.progressOut, format+"\n", args...)
	}
}

func (p *Processor) LoadFiles(files []string, hasStdin bool) ([]*logparser.LogEntry, []logparser.ParseError, int, error) {
	var allEntries []*logparser.LogEntry
	var allErrors []logparser.ParseError
	totalLines := 0

	if hasStdin {
		p.info("[logsum] reading from stdin")
		res, err := p.parser.ParseReader(os.Stdin, "<stdin>")
		if err != nil {
			return allEntries, allErrors, totalLines, fmt.Errorf("stdin: %w", err)
		}
		allEntries = append(allEntries, res.Entries...)
		allErrors = append(allErrors, res.ParseErrors...)
		totalLines += res.TotalLines
	}

	for _, f := range files {
		p.info("[logsum] reading %s", f)
		fh, err := os.Open(f)
		if err != nil {
			return allEntries, allErrors, totalLines, fmt.Errorf("open %s: %w", f, err)
		}
		res, err := p.parser.ParseReader(fh, f)
		fh.Close()
		if err != nil {
			return allEntries, allErrors, totalLines, fmt.Errorf("parse %s: %w", f, err)
		}
		allEntries = append(allEntries, res.Entries...)
		allErrors = append(allErrors, res.ParseErrors...)
		totalLines += res.TotalLines
	}
	return allEntries, allErrors, totalLines, nil
}

func ComputeSinceFromEntries(entries []*logparser.LogEntry, rel time.Duration) time.Time {
	if rel <= 0 || len(entries) == 0 {
		return time.Time{}
	}
	latest := time.Time{}
	for _, e := range entries {
		if e.Timestamp.IsZero() {
			continue
		}
		if latest.IsZero() || e.Timestamp.After(latest) {
			latest = e.Timestamp
		}
	}
	if latest.IsZero() {
		return time.Time{}
	}
	return latest.Add(-rel)
}

type RunOpts struct {
	Files        []string
	HasStdin     bool
	Filter       *FilterOptions
	SinceRel     time.Duration
	TopN         int
	Context      int
	DoCluster    bool
	MaxSamples   int
}

func (p *Processor) Run(opts RunOpts) (*RunStats, error) {
	stats := &RunStats{
		StartedAt: time.Now(),
		Inputs:    append([]string{}, opts.Files...),
	}
	if opts.HasStdin {
		stats.Inputs = append(stats.Inputs, "<stdin>")
	}

	entries, perrs, totalLines, err := p.LoadFiles(opts.Files, opts.HasStdin)
	if err != nil {
		return stats, err
	}
	stats.TotalLines = totalLines
	stats.ParsedEntries = len(entries)
	stats.ParseErrors = len(perrs)
	p.logf("parsed %d entries, %d lines, %d parse issues", len(entries), totalLines, len(perrs))

	if opts.Filter != nil {
		if !opts.Filter.Since.IsZero() {
		} else if opts.SinceRel > 0 {
			opts.Filter.Since = ComputeSinceFromEntries(entries, opts.SinceRel)
			p.logf("computed relative since=%v (anchor latest log timestamp)", opts.Filter.Since)
		}
	}

	stats.Filter = opts.Filter
	matched := ApplyFilter(entries, opts.Filter)
	stats.MatchedEntries = len(matched)
	for _, e := range matched {
		if e.Level == logparser.LevelError || e.Level == logparser.LevelFatal {
			stats.MatchedErrorCount++
		}
	}
	p.logf("matched %d entries after filter (%d ERROR/FATAL)", len(matched), stats.MatchedErrorCount)

	if opts.DoCluster || opts.MaxSamples == 0 {
		opts.MaxSamples = 5
	}
	stats.Clusters = ClusterErrors(matched, opts.TopN, opts.MaxSamples, opts.DoCluster)

	if opts.Context > 0 || (opts.Context == 0 && len(matched) > 0) {
		stats.Windows = BuildContextWindows(entries, matched, opts.Context)
	}

	stats.FinishedAt = time.Now()
	return stats, nil
}

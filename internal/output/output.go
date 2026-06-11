package output

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"sort"
	"strings"
	"time"

	"logsum/internal/types"
)

type Formatter struct {
	noColor bool
	verbose bool
	json    bool
	ciMode  bool
	writer  io.Writer
}

type Color string

const (
	ColorReset   Color = "\033[0m"
	ColorRed     Color = "\033[31m"
	ColorGreen   Color = "\033[32m"
	ColorYellow  Color = "\033[33m"
	ColorBlue    Color = "\033[34m"
	ColorMagenta Color = "\033[35m"
	ColorCyan    Color = "\033[36m"
	ColorGray    Color = "\033[90m"
	ColorBold    Color = "\033[1m"
)

func New(noColor, verbose, json, ciMode bool, writer io.Writer) *Formatter {
	if writer == nil {
		writer = os.Stdout
	}
	if ciMode {
		noColor = true
	}
	return &Formatter{
		noColor: noColor,
		verbose: verbose,
		json:    json,
		ciMode:  ciMode,
		writer:  writer,
	}
}

func (f *Formatter) color(c Color, s string) string {
	if f.noColor {
		return s
	}
	return string(c) + s + string(ColorReset)
}

func (f *Formatter) WriteReport(report types.SummaryReport) error {
	if f.json {
		return f.writeJSON(report)
	}
	return f.writeTable(report)
}

func (f *Formatter) writeJSON(report types.SummaryReport) error {
	encoder := json.NewEncoder(f.writer)
	encoder.SetIndent("", "  ")
	return encoder.Encode(report)
}

func (f *Formatter) writeTable(report types.SummaryReport) error {
	f.printHeader(report)

	if report.ErrorEntries > 0 {
		f.printSection("ERROR CLUSTERS", ColorRed)
		f.printClusterTable(report.Clusters, types.LevelError)
	}

	if report.WarningEntries > 0 {
		f.printSection("WARNING CLUSTERS", ColorYellow)
		warnings := filterByLevel(report.Clusters, types.LevelWarn)
		f.printClusterTable(warnings, types.LevelWarn)
	}

	if f.verbose {
		f.printSection("DETAILS", ColorCyan)
		f.printVerboseDetails(report)
	}

	if f.ciMode {
		f.printCISummary(report)
	}

	return nil
}

func (f *Formatter) printHeader(report types.SummaryReport) {
	fmt.Fprintln(f.writer)
	fmt.Fprintf(f.writer, "%s\n", f.color(ColorBold, "═══ LOG SUMMARY REPORT ═══"))
	fmt.Fprintln(f.writer)

	fmt.Fprintf(f.writer, "%s: %s\n",
		f.color(ColorCyan, "Generated At"),
		report.GeneratedAt.Format(time.RFC3339))

	tr := report.TimeRange
	if !tr.Start.IsZero() && !tr.End.IsZero() {
		fmt.Fprintf(f.writer, "%s: %s → %s\n",
			f.color(ColorCyan, "Time Range"),
			tr.Start.Format(time.RFC3339),
			tr.End.Format(time.RFC3339))
	} else if !tr.End.IsZero() {
		fmt.Fprintf(f.writer, "%s: <beginning of logs> → %s\n",
			f.color(ColorCyan, "Time Range"),
			tr.End.Format(time.RFC3339))
	}

	if len(report.Services) > 0 {
		fmt.Fprintf(f.writer, "%s: %s\n",
			f.color(ColorCyan, "Services"),
			strings.Join(report.Services, ", "))
	}

	if len(report.FilteredServices) > 0 {
		fmt.Fprintf(f.writer, "%s: %s\n",
			f.color(ColorCyan, "Filtered To"),
			strings.Join(report.FilteredServices, ", "))
	}

	fmt.Fprintln(f.writer)

	stats := []struct {
		label string
		value int
		color Color
	}{
		{"Total Entries", report.TotalEntries, ColorBlue},
		{"Errors", report.ErrorEntries, ColorRed},
		{"Warnings", report.WarningEntries, ColorYellow},
		{"Unique Clusters", len(report.Clusters), ColorGreen},
	}

	for _, s := range stats {
		fmt.Fprintf(f.writer, "  %s: %s\n",
			f.color(s.color, fmt.Sprintf("%-20s", s.label)),
			f.color(ColorBold, fmt.Sprintf("%d", s.value)))
	}
	fmt.Fprintln(f.writer)
}

func (f *Formatter) printSection(title string, color Color) {
	fmt.Fprintln(f.writer)
	fmt.Fprintln(f.writer, f.color(color, strings.Repeat("═", 60)))
	fmt.Fprintln(f.writer, f.color(ColorBold, "  "+title))
	fmt.Fprintln(f.writer, f.color(color, strings.Repeat("─", 60)))
}

func (f *Formatter) printClusterTable(clusters []types.ErrorCluster, level types.LogLevel) {
	if len(clusters) == 0 {
		fmt.Fprintln(f.writer, f.color(ColorGray, "  No entries found."))
		return
	}

	levelColor := ColorRed
	if level == types.LevelWarn {
		levelColor = ColorYellow
	}

	headers := []string{"#", "Count", "Level", "Pattern", "Services", "First Seen"}
	widths := []int{4, 7, 7, 40, 15, 20}

	headerLine := ""
	for i, h := range headers {
		headerLine += f.color(ColorBold, fmt.Sprintf("%-*s", widths[i], h))
	}
	fmt.Fprintln(f.writer, headerLine)
	fmt.Fprintln(f.writer, f.color(ColorGray, strings.Repeat("─", 60)))

	displayClusters := clusters
	if !f.verbose && len(displayClusters) > 10 {
		displayClusters = clusters[:10]
	}

	for i, cluster := range displayClusters {
		levelStr := string(cluster.Level)
		services := joinMapKeys(cluster.Services)
		pattern := truncate(cluster.MessagePattern, 38)

		fmt.Fprintf(f.writer, "%-4d%-7d%-7s%-40s%-15s%-20s\n",
			i+1,
			cluster.Count,
			f.color(levelColor, levelStr),
			pattern,
			truncate(services, 13),
			cluster.FirstOccurrence.Format("2006-01-02 15:04:05"))

		if f.verbose {
			fmt.Fprintln(f.writer)
			f.printClusterDetails(cluster)
			fmt.Fprintln(f.writer)
		}
	}

	if !f.verbose && len(clusters) > 10 {
		fmt.Fprintln(f.writer, f.color(ColorGray,
			fmt.Sprintf("  ... and %d more clusters (use --verbose to see all)",
				len(clusters)-10)))
	}
}

func (f *Formatter) printClusterDetails(cluster types.ErrorCluster) {
	indent := "    "

	fmt.Fprintf(f.writer, "%s%s: %s\n", indent,
		f.color(ColorCyan, "Cluster ID"), cluster.ID)
	fmt.Fprintf(f.writer, "%s%s: %s\n", indent,
		f.color(ColorCyan, "Message"), cluster.SampleMessage)

	if len(cluster.RequestIDs) > 0 {
		fmt.Fprintf(f.writer, "%s%s: %s\n", indent,
			f.color(ColorCyan, "Request IDs"),
			strings.Join(cluster.RequestIDs, ", "))
	}

	if cluster.SampleStacktrace != "" {
		fmt.Fprintf(f.writer, "%s%s:\n", indent, f.color(ColorCyan, "Sample Stacktrace"))
		lines := strings.Split(cluster.SampleStacktrace, "\n")
		for i, line := range lines {
			if i > 10 {
				fmt.Fprintf(f.writer, "%s  %s\n", indent,
					f.color(ColorGray, "... (truncated)"))
				break
			}
			fmt.Fprintf(f.writer, "%s  %s\n", indent,
				f.color(ColorGray, truncate(line, 80)))
		}
	}

	if len(cluster.ContextSample) > 0 {
		fmt.Fprintf(f.writer, "%s%s:\n", indent, f.color(ColorCyan, "Context"))
		for _, line := range cluster.ContextSample {
			fmt.Fprintf(f.writer, "%s  %s\n", indent,
				f.color(ColorGray, truncate(line, 80)))
		}
	}
}

func (f *Formatter) printVerboseDetails(report types.SummaryReport) {
	fmt.Fprintf(f.writer, "\n%s\n", f.color(ColorBold, "  Top Errors by Count"))
	fmt.Fprintln(f.writer, f.color(ColorGray, "  "+strings.Repeat("─", 58)))

	for i, cluster := range report.TopErrors {
		fmt.Fprintf(f.writer, "  %d. [%s] %s (%d occurrences)\n",
			i+1,
			f.color(ColorRed, string(cluster.Level)),
			truncate(cluster.MessagePattern, 50),
			cluster.Count)
	}
}

func (f *Formatter) printCISummary(report types.SummaryReport) {
	fmt.Fprintln(f.writer)
	fmt.Fprintln(f.writer, f.color(ColorBold, "═══ CI SUMMARY ═══"))
	fmt.Fprintf(f.writer, "TOTAL_ENTRIES=%d\n", report.TotalEntries)
	fmt.Fprintf(f.writer, "ERROR_COUNT=%d\n", report.ErrorEntries)
	fmt.Fprintf(f.writer, "WARNING_COUNT=%d\n", report.WarningEntries)
	fmt.Fprintf(f.writer, "CLUSTER_COUNT=%d\n", len(report.Clusters))

	if len(report.Clusters) > 0 {
		top := report.Clusters[0]
		fmt.Fprintf(f.writer, "TOP_ERROR=%s\n", top.MessagePattern)
		fmt.Fprintf(f.writer, "TOP_ERROR_COUNT=%d\n", top.Count)
	}
}

func (f *Formatter) WriteError(err *types.ProcessError) error {
	if f.json {
		return json.NewEncoder(f.writer).Encode(map[string]interface{}{
			"error":      err.Error(),
			"code":       err.Code,
			"suggestion": err.Suggestion,
			"details":    err.Details,
		})
	}

	fmt.Fprintln(f.writer)
	fmt.Fprintf(f.writer, "%s: %s\n",
		f.color(ColorRed, "ERROR"),
		err.Error())
	fmt.Fprintf(f.writer, "%s: %s\n",
		f.color(ColorYellow, "Code"),
		err.Code)
	fmt.Fprintf(f.writer, "%s: %s\n",
		f.color(ColorGreen, "Suggestion"),
		err.Suggestion)

	if len(err.Details) > 0 {
		fmt.Fprintln(f.writer, f.color(ColorCyan, "Details:"))
		keys := make([]string, 0, len(err.Details))
		for k := range err.Details {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		for _, k := range keys {
			fmt.Fprintf(f.writer, "  %s: %v\n", k, err.Details[k])
		}
	}
	fmt.Fprintln(f.writer)

	return nil
}

func filterByLevel(clusters []types.ErrorCluster, level types.LogLevel) []types.ErrorCluster {
	var filtered []types.ErrorCluster
	for _, c := range clusters {
		if c.Level == level {
			filtered = append(filtered, c)
		}
	}
	return filtered
}

func joinMapKeys(m map[string]int) string {
	keys := make([]string, 0, len(m))
	for k := range m {
		if k != "" {
			keys = append(keys, k)
		}
	}
	sort.Strings(keys)
	return strings.Join(keys, ", ")
}

func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	if maxLen <= 3 {
		return s[:maxLen]
	}
	return s[:maxLen-3] + "..."
}

func (f *Formatter) JSONOutput() bool {
	return f.json
}

func WriteToFile(path string, content string) error {
	if path == "" {
		return nil
	}
	return os.WriteFile(path, []byte(content), 0644)
}

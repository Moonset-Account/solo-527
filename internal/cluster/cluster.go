package cluster

import (
	"crypto/sha256"
	"encoding/hex"
	"regexp"
	"sort"
	"strings"
	"time"

	"logsum/internal/types"
)

type Clusterer struct {
	minClusterSize int
	contextLines   int
}

func New(minClusterSize, contextLines int) *Clusterer {
	return &Clusterer{
		minClusterSize: minClusterSize,
		contextLines:   contextLines,
	}
}

func (c *Clusterer) Cluster(entries []types.LogEntry) []types.ErrorCluster {
	clustersMap := make(map[string]*types.ErrorCluster)

	for _, entry := range entries {
		if !isErrorLevel(entry.Level) {
			continue
		}

		sig := generateSignature(entry.Message, entry.ErrorStack)
		pattern := generateMessagePattern(entry.Message)

		if cluster, exists := clustersMap[sig]; exists {
			cluster.Count++
			if entry.Timestamp.Before(cluster.FirstOccurrence) {
				cluster.FirstOccurrence = entry.Timestamp
			}
			if entry.Timestamp.After(cluster.LastOccurrence) {
				cluster.LastOccurrence = entry.Timestamp
			}
			cluster.Services[entry.Service]++
			cluster.Environments[entry.Environment]++
			if len(cluster.RequestIDs) < 10 {
				found := false
				for _, id := range cluster.RequestIDs {
					if id == entry.RequestID {
						found = true
						break
					}
				}
				if !found && entry.RequestID != "" {
					cluster.RequestIDs = append(cluster.RequestIDs, entry.RequestID)
				}
			}
		} else {
			clusterID := generateClusterID(sig)
			clustersMap[sig] = &types.ErrorCluster{
				ID:               clusterID,
				Signature:        sig,
				MessagePattern:   pattern,
				Count:            1,
				FirstOccurrence:  entry.Timestamp,
				LastOccurrence:   entry.Timestamp,
				Services:         map[string]int{entry.Service: 1},
				RequestIDs:       []string{entry.RequestID},
				Environments:     map[string]int{entry.Environment: 1},
				SampleStacktrace: truncate(entry.ErrorStack, 500),
				SampleMessage:    entry.Message,
				ContextSample:    getContextSample(entry, c.contextLines),
				Level:            entry.Level,
			}
		}
	}

	clusters := make([]types.ErrorCluster, 0, len(clustersMap))
	for _, cluster := range clustersMap {
		if cluster.Count >= c.minClusterSize {
			clusters = append(clusters, *cluster)
		}
	}

	sort.Slice(clusters, func(i, j int) bool {
		return clusters[i].Count > clusters[j].Count
	})

	for i := range clusters {
		if len(clusters[i].RequestIDs) > 5 {
			clusters[i].RequestIDs = clusters[i].RequestIDs[:5]
		}
	}

	return clusters
}

func (c *Clusterer) GetTopN(clusters []types.ErrorCluster, n int) []types.ErrorCluster {
	if n <= 0 || n >= len(clusters) {
		return clusters
	}
	return clusters[:n]
}

func isErrorLevel(level types.LogLevel) bool {
	return level == types.LevelError || level == types.LevelFatal || level == types.LevelWarn
}

var (
	uuidPattern      = regexp.MustCompile(`[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}`)
	numPattern       = regexp.MustCompile(`\b\d+\b`)
	ipPattern        = regexp.MustCompile(`\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b`)
	hexPattern       = regexp.MustCompile(`\b0x[0-9a-fA-F]+\b`)
	filePathPattern  = regexp.MustCompile(`(?:/[^/\s]+)+`)
	emailPattern     = regexp.MustCompile(`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`)
	stackLinePattern = regexp.MustCompile(`^\s*(?:at\s+)?(?:[a-zA-Z0-9_.$]+)\s*\((?:[^:]+:\d+)\)\s*$`)
)

func generateSignature(message, stack string) string {
	var sigParts []string

	normalizedMsg := normalizeText(message)
	if stack != "" {
		stackLines := strings.Split(stack, "\n")
		for _, line := range stackLines {
			line = strings.TrimSpace(line)
			if stackLinePattern.MatchString(line) {
				method := extractMethodName(line)
				if method != "" {
					sigParts = append(sigParts, method)
				}
			}
		}
		if len(sigParts) > 0 {
			return strings.Join(sigParts, "|")
		}
	}

	return normalizedMsg
}

func generateMessagePattern(message string) string {
	pattern := message
	pattern = uuidPattern.ReplaceAllString(pattern, "<uuid>")
	pattern = ipPattern.ReplaceAllString(pattern, "<ip>")
	pattern = hexPattern.ReplaceAllString(pattern, "<hex>")
	pattern = emailPattern.ReplaceAllString(pattern, "<email>")
	pattern = filePathPattern.ReplaceAllString(pattern, "<path>")
	pattern = numPattern.ReplaceAllString(pattern, "<num>")
	return pattern
}

func normalizeText(s string) string {
	s = strings.ToLower(s)
	s = uuidPattern.ReplaceAllString(s, "")
	s = ipPattern.ReplaceAllString(s, "")
	s = hexPattern.ReplaceAllString(s, "")
	s = emailPattern.ReplaceAllString(s, "")
	s = filePathPattern.ReplaceAllString(s, "")
	s = numPattern.ReplaceAllString(s, "")
	s = regexp.MustCompile(`\s+`).ReplaceAllString(s, " ")
	s = strings.Trim(s, " \t\n\r")
	return s
}

func extractMethodName(stackLine string) string {
	stackLine = strings.TrimSpace(stackLine)
	stackLine = strings.TrimPrefix(stackLine, "at ")
	idx := strings.Index(stackLine, "(")
	if idx > 0 {
		return strings.TrimSpace(stackLine[:idx])
	}
	return ""
}

func generateClusterID(sig string) string {
	h := sha256.Sum256([]byte(sig))
	return hex.EncodeToString(h[:])[:12]
}

func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}

func getContextSample(entry types.LogEntry, lines int) []string {
	var sample []string
	if lines > 0 && len(entry.ContextBefore) > 0 {
		before := entry.ContextBefore
		if len(before) > lines {
			before = before[len(before)-lines:]
		}
		sample = append(sample, before...)
	}
	sample = append(sample, entry.RawLine)
	if lines > 0 && len(entry.ContextAfter) > 0 {
		after := entry.ContextAfter
		if len(after) > lines {
			after = after[:lines]
		}
		sample = append(sample, after...)
	}
	return sample
}

func BuildReport(
	entries []types.LogEntry,
	clusters []types.ErrorCluster,
	topN int,
	filteredServices []string,
	timeRange types.TimeRange,
) types.SummaryReport {
	totalEntries := len(entries)
	errorEntries := 0
	warningEntries := 0
	servicesSet := make(map[string]bool)

	for _, e := range entries {
		servicesSet[e.Service] = true
		if e.Level == types.LevelError || e.Level == types.LevelFatal {
			errorEntries++
		} else if e.Level == types.LevelWarn {
			warningEntries++
		}
	}

	services := make([]string, 0, len(servicesSet))
	for s := range servicesSet {
		if s != "" {
			services = append(services, s)
		}
	}
	sort.Strings(services)

	topErrors := clusters
	if topN > 0 && topN < len(clusters) {
		topErrors = clusters[:topN]
	}

	return types.SummaryReport{
		GeneratedAt:      nowFunc(),
		TimeRange:        timeRange,
		Services:         services,
		TotalEntries:     totalEntries,
		ErrorEntries:     errorEntries,
		WarningEntries:   warningEntries,
		Clusters:         clusters,
		TopErrors:        topErrors,
		FilteredServices: filteredServices,
	}
}

var nowFunc = func() time.Time {
	return time.Now()
}

func SetNowFunc(f func() time.Time) {
	nowFunc = f
}

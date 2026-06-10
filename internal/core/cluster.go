package core

import (
	"sort"
	"time"

	"github.com/backend-ops/logsum/pkg/logparser"
)

type ErrorCluster struct {
	Key          string                 `json:"key"`
	Signature    string                 `json:"signature"`
	Level        logparser.Level        `json:"level"`
	Service      string                 `json:"service"`
	Count        int                    `json:"count"`
	FirstSeen    time.Time              `json:"first_seen"`
	LastSeen     time.Time              `json:"last_seen"`
	Representative *logparser.LogEntry  `json:"representative"`
	Samples      []*logparser.LogEntry  `json:"samples"`
	RequestIDs   []string               `json:"request_ids,omitempty"`
	Environments map[string]int         `json:"environments,omitempty"`
}

type ClusterStats struct {
	TotalEntries int
	MatchedCount int
	ClusterCount int
	Clusters     []*ErrorCluster
	Summary      map[logparser.Level]int
	ByService    map[string]int
}

func ClusterErrors(entries []*logparser.LogEntry, topN, maxSamples int, doCluster bool) *ClusterStats {
	stats := &ClusterStats{
		TotalEntries: 0,
		MatchedCount: len(entries),
		ClusterCount: 0,
		Clusters:     nil,
		Summary:      make(map[logparser.Level]int),
		ByService:    make(map[string]int),
	}

	for _, e := range entries {
		stats.Summary[e.Level]++
		if e.Service != "" {
			stats.ByService[e.Service]++
		}
	}

	if !doCluster || len(entries) == 0 {
		return stats
	}

	groups := make(map[string]*ErrorCluster)
	for _, e := range entries {
		key := e.ClusterKey()
		c, ok := groups[key]
		if !ok {
			c = &ErrorCluster{
				Key:          key,
				Signature:    e.ErrorSignature(),
				Level:        e.Level,
				Service:      e.Service,
				Count:        0,
				FirstSeen:    e.Timestamp,
				LastSeen:     e.Timestamp,
				Representative: e,
				Samples:      make([]*logparser.LogEntry, 0, maxSamples),
				Environments: make(map[string]int),
			}
			groups[key] = c
		}
		c.Count++
		if !e.Timestamp.IsZero() {
			if c.FirstSeen.IsZero() || e.Timestamp.Before(c.FirstSeen) {
				c.FirstSeen = e.Timestamp
			}
			if e.Timestamp.After(c.LastSeen) {
				c.LastSeen = e.Timestamp
			}
		}
		if len(c.Samples) < maxSamples {
			c.Samples = append(c.Samples, e)
		}
		if e.RequestID != "" {
			found := false
			for _, rid := range c.RequestIDs {
				if rid == e.RequestID {
					found = true
					break
				}
			}
			if !found {
				c.RequestIDs = append(c.RequestIDs, e.RequestID)
			}
		}
		if e.Environment != "" {
			c.Environments[e.Environment]++
		}
	}

	clusters := make([]*ErrorCluster, 0, len(groups))
	for _, c := range groups {
		clusters = append(clusters, c)
	}
	sort.SliceStable(clusters, func(i, j int) bool {
		if clusters[i].Count != clusters[j].Count {
			return clusters[i].Count > clusters[j].Count
		}
		return clusters[i].LastSeen.After(clusters[j].LastSeen)
	})

	if topN > 0 && topN < len(clusters) {
		clusters = clusters[:topN]
	}
	stats.Clusters = clusters
	stats.ClusterCount = len(clusters)
	return stats
}

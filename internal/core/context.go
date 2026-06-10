package core

import "github.com/backend-ops/logsum/pkg/logparser"

type ContextWindow struct {
	Center   *logparser.LogEntry   `json:"center"`
	Before   []*logparser.LogEntry `json:"before"`
	After    []*logparser.LogEntry `json:"after"`
	Distance int                   `json:"distance"`
}

func BuildContextWindows(allEntries []*logparser.LogEntry, matches []*logparser.LogEntry, distance int) []*ContextWindow {
	if distance <= 0 {
		wins := make([]*ContextWindow, len(matches))
		for i, m := range matches {
			wins[i] = &ContextWindow{Center: m, Distance: 0}
		}
		return wins
	}

	matchSet := make(map[*logparser.LogEntry]bool, len(matches))
	for _, m := range matches {
		matchSet[m] = true
	}

	idxMap := make(map[*logparser.LogEntry]int, len(allEntries))
	for i, e := range allEntries {
		idxMap[e] = i
	}

	wins := make([]*ContextWindow, 0, len(matches))
	used := make(map[*logparser.LogEntry]bool)

	for _, m := range matches {
		if used[m] {
			continue
		}
		centerIdx, ok := idxMap[m]
		if !ok {
			continue
		}
		win := &ContextWindow{
			Center:   m,
			Distance: distance,
		}
		for i := centerIdx - distance; i < centerIdx; i++ {
			if i >= 0 && i < len(allEntries) {
				win.Before = append(win.Before, allEntries[i])
				used[allEntries[i]] = true
			}
		}
		for i := centerIdx + 1; i <= centerIdx+distance; i++ {
			if i >= 0 && i < len(allEntries) {
				win.After = append(win.After, allEntries[i])
				used[allEntries[i]] = true
			}
		}
		used[m] = true
		wins = append(wins, win)
	}
	return wins
}

func MergeAdjacent(windows []*ContextWindow) []*ContextWindow {
	if len(windows) < 2 {
		return windows
	}
	merged := make([]*ContextWindow, 0, len(windows))
	current := windows[0]
	for _, w := range windows[1:] {
		if adjacentOrOverlap(current, w) {
			current = mergeTwo(current, w)
		} else {
			merged = append(merged, current)
			current = w
		}
	}
	merged = append(merged, current)
	return merged
}

func adjacentOrOverlap(a, b *ContextWindow) bool {
	aEnd := lineIndex(a.Center) + a.Distance
	bStart := lineIndex(b.Center) - b.Distance
	return bStart <= aEnd+1
}

func lineIndex(e *logparser.LogEntry) int {
	if e == nil {
		return 0
	}
	return e.LineNum
}

func mergeTwo(a, b *ContextWindow) *ContextWindow {
	return &ContextWindow{
		Center:   a.Center,
		Before:   a.Before,
		After:    append(append(a.After, a.Center), append(b.Before, append([]*logparser.LogEntry{b.Center}, b.After...)...)...),
		Distance: a.Distance + b.Distance + 1,
	}
}

package parser

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"logsum/internal/types"
)

var (
	timestampPatterns = []*regexp.Regexp{
		regexp.MustCompile(`\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?`),
		regexp.MustCompile(`\d{4}/\d{2}/\d{2} \d{2}:\d{2}:\d{2}`),
		regexp.MustCompile(`\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}`),
	}

	levelPattern = regexp.MustCompile(`(?i)\b(DEBUG|INFO|WARN(?:ING)?|ERROR|FATAL|PANIC)\b`)

	servicePatterns = []*regexp.Regexp{
		regexp.MustCompile(`["']?service["']?\s*[:=]\s*["']?([^\s"',]+)["']?`),
		regexp.MustCompile(`["']?svc["']?\s*[:=]\s*["']?([^\s"',]+)["']?`),
		regexp.MustCompile(`\[([^\]]+)\]\s*\[`),
	}

	requestIDPatterns = []*regexp.Regexp{
		regexp.MustCompile(`["']?request_id["']?\s*[:=]\s*["']?([^\s"',]+)["']?`),
		regexp.MustCompile(`["']?trace_id["']?\s*[:=]\s*["']?([^\s"',]+)["']?`),
		regexp.MustCompile(`["']?req_id["']?\s*[:=]\s*["']?([^\s"',]+)["']?`),
		regexp.MustCompile(`\[([^\]]+)\]`),
		regexp.MustCompile(`\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b`),
	}

	envPatterns = []*regexp.Regexp{
		regexp.MustCompile(`["']?environment["']?\s*[:=]\s*["']?([^\s"',]+)["']?`),
		regexp.MustCompile(`["']?env["']?\s*[:=]\s*["']?([^\s"',]+)["']?`),
	}

	errorPattern = regexp.MustCompile(`(?:error|Error|ERROR)`)
)

type Parser struct {
	verbose bool
}

func New(verbose bool) *Parser {
	return &Parser{verbose: verbose}
}

func (p *Parser) ParsePaths(paths []string) ([]types.LogEntry, error) {
	var allEntries []types.LogEntry

	for _, path := range paths {
		entries, err := p.ParsePath(path)
		if err != nil {
			return nil, err
		}
		allEntries = append(allEntries, entries...)
	}

	return allEntries, nil
}

func (p *Parser) ParsePath(path string) ([]types.LogEntry, error) {
	info, err := os.Stat(path)
	if err != nil {
		return nil, &types.ProcessError{
			Code:       "INPUT_READ_ERROR",
			Message:    fmt.Sprintf("Failed to access %s: %v", path, err),
			Suggestion: "Check that the path exists and is readable",
			Details:    map[string]interface{}{"path": path},
		}
	}

	if !info.IsDir() {
		return p.ParseFile(path)
	}

	var entries []types.LogEntry
	err = filepath.Walk(path, func(filePath string, f os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if f.IsDir() {
			return nil
		}
		if isLogFile(filePath) {
			fileEntries, parseErr := p.ParseFile(filePath)
			if parseErr != nil {
				return parseErr
			}
			entries = append(entries, fileEntries...)
		}
		return nil
	})

	if err != nil {
		return nil, &types.ProcessError{
			Code:       "DIR_WALK_ERROR",
			Message:    fmt.Sprintf("Failed to walk directory %s: %v", path, err),
			Suggestion: "Check directory permissions",
			Details:    map[string]interface{}{"path": path},
		}
	}

	return entries, nil
}

func isLogFile(path string) bool {
	ext := strings.ToLower(filepath.Ext(path))
	base := strings.ToLower(filepath.Base(path))
	allowedExts := map[string]bool{
		".log":    true,
		".txt":    true,
		".ndjson": true,
		".jsonl":  true,
		".sample": true,
		".testdata": true,
		".input":  true,
	}
	if allowedExts[ext] {
		return true
	}
	if strings.Contains(base, "log") {
		return true
	}
	if strings.Contains(base, "sample") || strings.Contains(base, "testdata") || strings.Contains(base, "input") {
		return true
	}
	return false
}

func (p *Parser) ParseFile(path string) ([]types.LogEntry, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, &types.ProcessError{
			Code:       "FILE_OPEN_ERROR",
			Message:    fmt.Sprintf("Failed to open file %s: %v", path, err),
			Suggestion: "Check file permissions and existence",
			Details:    map[string]interface{}{"path": path},
		}
	}
	defer file.Close()

	return p.ParseReader(file, path)
}

func (p *Parser) ParseReader(r io.Reader, sourceName string) ([]types.LogEntry, error) {
	scanner := bufio.NewScanner(r)
	scanner.Buffer(make([]byte, 1024*1024), 1024*1024)

	var entries []types.LogEntry
	var currentEntry *types.LogEntry
	var lines []string
	lineNum := 0
	lineIndexMap := make(map[int]int)

	for scanner.Scan() {
		line := scanner.Text()
		lines = append(lines, line)
		lineNum++

		if strings.TrimSpace(line) == "" {
			if currentEntry != nil {
				currentEntry.ErrorStack += "\n" + line
			}
			continue
		}

		if p.isNewLogEntry(line) {
			if currentEntry != nil {
				entries = append(entries, *currentEntry)
			}
			currentEntry = p.parseLine(line)
			if currentEntry != nil {
				currentEntry.RawLine = line
				lineIndexMap[len(entries)] = lineNum - 1
			}
		} else if currentEntry != nil {
			currentEntry.Message += "\n" + line
			if errorPattern.MatchString(currentEntry.Message) || strings.Contains(line, "at ") || strings.Contains(line, "\t") {
				if currentEntry.ErrorStack == "" {
					currentEntry.ErrorStack = currentEntry.Message
				}
			}
		}
	}

	if currentEntry != nil {
		entries = append(entries, *currentEntry)
		lineIndexMap[len(entries)-1] = lineNum - 1
	}

	if err := scanner.Err(); err != nil {
		return nil, &types.ProcessError{
			Code:       "READ_ERROR",
			Message:    fmt.Sprintf("Error reading %s: %v", sourceName, err),
			Suggestion: "Check for file corruption or encoding issues",
			Details:    map[string]interface{}{"source": sourceName},
		}
	}

	for i := range entries {
		idx := lineIndexMap[i]
		entries[i].ContextBefore = getContextLines(lines, idx, 3, true)
		entries[i].ContextAfter = getContextLines(lines, idx, 3, false)
	}

	return entries, nil
}

func (p *Parser) isNewLogEntry(line string) bool {
	for _, pattern := range timestampPatterns {
		if pattern.MatchString(line) {
			if levelPattern.MatchString(line) {
				return true
			}
		}
	}
	return false
}

func (p *Parser) parseLine(line string) *types.LogEntry {
	entry := &types.LogEntry{
		Level: types.LevelInfo,
	}

	ts, tsIdx := findTimestamp(line)
	if ts.IsZero() {
		entry.Timestamp = time.Now()
	} else {
		entry.Timestamp = ts
	}

	level := findLevel(line)
	if level != "" {
		entry.Level = level
	}

	service := findService(line)
	if service != "" {
		entry.Service = service
	}

	reqID := findRequestID(line, entry.Service, string(entry.Level))
	if reqID != "" {
		entry.RequestID = reqID
	}

	env := findEnvironment(line)
	if env != "" {
		entry.Environment = env
	}

	msgStart := tsIdx
	if msgStart > 0 && msgStart < len(line) {
		remaining := line[msgStart:]
		entry.Message = strings.TrimSpace(removeMeta(remaining, entry.Level, entry.Service, entry.RequestID))
	} else {
		entry.Message = strings.TrimSpace(line)
	}

	return entry
}

func findTimestamp(line string) (time.Time, int) {
	for _, pattern := range timestampPatterns {
		match := pattern.FindStringIndex(line)
		if match != nil {
			tsStr := line[match[0]:match[1]]
			for _, layout := range []string{
				time.RFC3339,
				time.RFC3339Nano,
				"2006-01-02T15:04:05",
				"2006-01-02 15:04:05",
				"2006/01/02 15:04:05",
				"2006-01-02T15:04:05.999",
				"2006-01-02 15:04:05.999",
			} {
				if t, err := time.Parse(layout, tsStr); err == nil {
					return t, match[1]
				}
			}
			return time.Now(), match[1]
		}
	}
	return time.Time{}, 0
}

func findLevel(line string) types.LogLevel {
	match := levelPattern.FindString(line)
	if match == "" {
		return ""
	}
	switch strings.ToUpper(match) {
	case "DEBUG":
		return types.LevelDebug
	case "INFO":
		return types.LevelInfo
	case "WARN", "WARNING":
		return types.LevelWarn
	case "ERROR":
		return types.LevelError
	case "FATAL", "PANIC":
		return types.LevelFatal
	default:
		return ""
	}
}

func findService(line string) string {
	for _, pattern := range servicePatterns {
		match := pattern.FindStringSubmatch(line)
		if len(match) > 1 {
			return match[1]
		}
	}
	return ""
}

func findRequestID(line string, excludeService, excludeLevel string) string {
	excluded := map[string]bool{
		strings.ToLower(excludeService): true,
		strings.ToLower(excludeLevel):   true,
		"debug": true,
		"info":  true,
		"warn":  true,
		"warning": true,
		"error": true,
		"fatal": true,
		"panic": true,
	}

	for _, pattern := range requestIDPatterns {
		matches := pattern.FindAllStringSubmatch(line, -1)
		for _, match := range matches {
			if len(match) > 1 {
				candidate := strings.ToLower(match[1])
				if !excluded[candidate] {
					return match[1]
				}
			}
		}
	}
	return ""
}

func findEnvironment(line string) string {
	for _, pattern := range envPatterns {
		match := pattern.FindStringSubmatch(line)
		if len(match) > 1 {
			return match[1]
		}
	}
	return ""
}

func removeMeta(s string, level types.LogLevel, service, reqID string) string {
	result := s
	result = strings.Replace(result, string(level), "", 1)
	result = strings.Replace(result, strings.ToLower(string(level)), "", 1)

	metaPatterns := []*regexp.Regexp{
		regexp.MustCompile(`["']?service["']?\s*[:=]\s*["']?[^"'\s,]+["']?`),
		regexp.MustCompile(`["']?svc["']?\s*[:=]\s*["']?[^"'\s,]+["']?`),
		regexp.MustCompile(`["']?request_id["']?\s*[:=]\s*["']?[^"'\s,]+["']?`),
		regexp.MustCompile(`["']?trace_id["']?\s*[:=]\s*["']?[^"'\s,]+["']?`),
		regexp.MustCompile(`["']?req_id["']?\s*[:=]\s*["']?[^"'\s,]+["']?`),
		regexp.MustCompile(`["']?environment["']?\s*[:=]\s*["']?[^"'\s,]+["']?`),
		regexp.MustCompile(`["']?env["']?\s*[:=]\s*["']?[^"'\s,]+["']?`),
	}

	for _, pattern := range metaPatterns {
		result = pattern.ReplaceAllString(result, "")
	}

	result = regexp.MustCompile(`\s+`).ReplaceAllString(result, " ")
	result = strings.Trim(result, " \t\n\r[]{}()\"',;:.")
	return result
}

func getContextLines(lines []string, idx, count int, before bool) []string {
	var context []string
	start := 0
	end := 0

	if before {
		start = idx - count
		if start < 0 {
			start = 0
		}
		end = idx
	} else {
		start = idx + 1
		end = idx + 1 + count
		if end > len(lines) {
			end = len(lines)
		}
	}

	for i := start; i < end && i < len(lines); i++ {
		if i >= 0 {
			context = append(context, lines[i])
		}
	}

	return context
}

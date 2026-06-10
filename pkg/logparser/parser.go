package logparser

import (
	"bufio"
	"fmt"
	"io"
	"regexp"
	"strconv"
	"strings"
	"time"
)

type ParseResult struct {
	Entries    []*LogEntry
	ParseErrors []ParseError
	TotalLines int
}

type ParseError struct {
	LineNum    int
	SourceFile string
	Content    string
	Err        string
}

type Parser struct {
	timeFormats  []string
	serviceHints []string
}

func NewParser() *Parser {
	return &Parser{
		timeFormats: []string{
			time.RFC3339Nano,
			time.RFC3339,
			"2006-01-02T15:04:05.000Z07:00",
			"2006-01-02 15:04:05.000",
			"2006-01-02 15:04:05",
			"2006/01/02 15:04:05",
			"02/Jan/2006:15:04:05 -0700",
			"Jan 02 15:04:05",
			"Jan  2 15:04:05",
		},
		serviceHints: nil,
	}
}

func (p *Parser) WithServiceHints(hints []string) *Parser {
	p.serviceHints = hints
	return p
}

var (
	linePattern1 = regexp.MustCompile(`^\[?(\d{4}[-/]\d{2}[-/]\d{2}[ T]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\]?\s*`)
	levelPattern = regexp.MustCompile(`\b(DEBUG|INFO|WARN(?:ING)?|ERROR|ERR|FATAL|TRACE)\b`)
	requestIDPatterns = []*regexp.Regexp{
		regexp.MustCompile(`[Rr]equest[_-]?[Ii][Dd]\s*[=:]\s*([A-Za-z0-9_-]+)`),
		regexp.MustCompile(`[Tt]race[_-]?[Ii][Dd]\s*[=:]\s*([A-Za-z0-9_-]+)`),
		regexp.MustCompile(`[Xx]-[Rr]equest-[Ii][Dd]:\s*([A-Za-z0-9_-]+)`),
		regexp.MustCompile(`\b([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\b`),
	}
	servicePatterns = []*regexp.Regexp{
		regexp.MustCompile(`[Ss]ervice\s*[=:]\s*([A-Za-z0-9_\-\.]+)`),
		regexp.MustCompile(`\[([A-Za-z0-9_\-\.]+)\]\s*$`),
		regexp.MustCompile(`app_name\s*[=:]\s*([A-Za-z0-9_\-\.]+)`),
	}
	envPatterns = []*regexp.Regexp{
		regexp.MustCompile(`[Ee]nv\s*[=:]\s*([A-Za-z0-9_\-]+)`),
		regexp.MustCompile(`[Ee]nvironment\s*[=:]\s*([A-Za-z0-9_\-]+)`),
		regexp.MustCompile(`\b(prod|production|staging|stage|dev|development|test|uat|qa)\b`, ),
	}
	stackAtPattern = regexp.MustCompile(`^\s*at\s+([^\s(]+)\s*\(([^:]+):(\d+)(?::(\d+))?\)\s*$`)
	stackGoPattern = regexp.MustCompile(`^\s*([^\s(]+)\s*\(([^)]*)\)\s*$`)
	stackFileLine  = regexp.MustCompile(`^\s*([^:]+):(\d+)(?:\s+.*)?$`)
)

func (p *Parser) ParseReader(r io.Reader, sourceFile string) (*ParseResult, error) {
	result := &ParseResult{
		Entries:     make([]*LogEntry, 0, 1024),
		ParseErrors: make([]ParseError, 0),
	}

	scanner := bufio.NewScanner(r)
	buf := make([]byte, 0, 1024*1024)
	scanner.Buffer(buf, 32*1024*1024)

	var currentEntry *LogEntry
	var inStacktrace bool
	lineNum := 0

	for scanner.Scan() {
		lineNum++
		result.TotalLines++
		line := scanner.Text()

		if currentEntry != nil && (inStacktrace || looksLikeStacktrace(line)) {
			inStacktrace = true
			if frame, ok := parseStackFrame(line); ok {
				currentEntry.Stacktrace = append(currentEntry.Stacktrace, frame)
				continue
			}
			if strings.TrimSpace(line) == "" {
				continue
			}
			if looksLikeStacktrace(line) {
				currentEntry.Message += "\n" + line
				continue
			}
		}

		if inStacktrace && strings.TrimSpace(line) == "" {
			continue
		}

		entry, ok := p.parseLine(line, lineNum, sourceFile)
		if !ok {
			if currentEntry != nil {
				currentEntry.Message += "\n" + line
			} else {
				result.ParseErrors = append(result.ParseErrors, ParseError{
					LineNum:    lineNum,
					SourceFile: sourceFile,
					Content:    line,
					Err:        "unrecognized log format",
				})
			}
			continue
		}

		if currentEntry != nil {
			result.Entries = append(result.Entries, currentEntry)
		}
		currentEntry = entry
		inStacktrace = false
	}

	if currentEntry != nil {
		result.Entries = append(result.Entries, currentEntry)
	}

	if err := scanner.Err(); err != nil {
		return result, fmt.Errorf("scanner error: %w", err)
	}

	return result, nil
}

func (p *Parser) parseLine(line string, lineNum int, sourceFile string) (*LogEntry, bool) {
	remaining := line
	entry := &LogEntry{
		Raw:        line,
		LineNum:    lineNum,
		SourceFile: sourceFile,
		Fields:     make(map[string]string),
	}

	ts, rest, ok := extractTimestamp(line, p.timeFormats)
	if !ok {
		return nil, false
	}
	entry.Timestamp = ts
	remaining = rest

	if lvlMatch := levelPattern.FindStringSubmatchIndex(remaining); lvlMatch != nil {
		lvl := remaining[lvlMatch[0]:lvlMatch[1]]
		entry.Level = ParseLevel(lvl)
		before := strings.TrimRight(remaining[:lvlMatch[0]], " \t-:|[]")
		after := strings.TrimLeft(remaining[lvlMatch[1]:], " \t-:|[]")
		remaining = strings.TrimSpace(before + " " + after)
	}

	for _, pat := range requestIDPatterns {
		if m := pat.FindStringSubmatchIndex(remaining); m != nil {
			rid := ""
			if len(m) == 4 {
				rid = remaining[m[2]:m[3]]
			} else {
				rid = remaining[m[0]:m[1]]
			}
			entry.RequestID = rid
			remaining = (remaining[:m[0]] + remaining[m[1]:])
			remaining = strings.TrimSpace(remaining)
			break
		}
	}

	for _, pat := range servicePatterns {
		if m := pat.FindStringSubmatchIndex(remaining); m != nil {
			svc := remaining[m[2]:m[3]]
			entry.Service = svc
			remaining = strings.TrimSpace(remaining[:m[0]] + remaining[m[1]:])
			break
		}
	}
	if entry.Service == "" && len(p.serviceHints) > 0 {
		entry.Service = p.serviceHints[0]
	}

	for _, pat := range envPatterns {
		if m := pat.FindStringSubmatchIndex(remaining); m != nil {
			env := ""
			if len(m) >= 4 {
				env = remaining[m[2]:m[3]]
			} else {
				env = remaining[m[0]:m[1]]
			}
			entry.Environment = strings.ToLower(env)
			remaining = strings.TrimSpace(remaining[:m[0]] + remaining[m[1]:])
			break
		}
	}

	msgStart := 0
	if idx := strings.Index(remaining, " - "); idx >= 0 {
		msgStart = idx + 3
	} else if idx := strings.Index(remaining, "] "); idx >= 0 {
		msgStart = idx + 2
	} else if idx := strings.Index(remaining, ": "); idx >= 0 && idx < 30 {
		msgStart = idx + 2
	}
	if msgStart > 0 && msgStart < len(remaining) {
		entry.Message = strings.TrimSpace(remaining[msgStart:])
	} else {
		entry.Message = strings.TrimSpace(remaining)
	}
	entry.Message = strings.TrimPrefix(entry.Message, "-")
	entry.Message = strings.TrimPrefix(entry.Message, ":")
	entry.Message = strings.TrimSpace(entry.Message)

	extractKVFields(entry, remaining)

	if explicit, ok := entry.Fields["message"]; ok && explicit != "" {
		entry.Message = explicit
		delete(entry.Fields, "message")
	} else if explicit, ok := entry.Fields["msg"]; ok && explicit != "" {
		entry.Message = explicit
		delete(entry.Fields, "msg")
	}

	return entry, true
}

func extractTimestamp(line string, formats []string) (time.Time, string, bool) {
	m := linePattern1.FindStringSubmatchIndex(line)
	if m == nil {
		return time.Time{}, line, false
	}

	raw := strings.Trim(line[m[0]:m[1]], "[] ")
	remaining := strings.TrimLeft(line[m[1]:], " -:|")

	normalized := raw
	if strings.Contains(normalized, ",") {
		normalized = strings.Replace(normalized, ",", ".", 1)
	}

	for _, fmt := range formats {
		if t, err := time.Parse(fmt, normalized); err == nil {
			return t, remaining, true
		}
		if t, err := time.ParseInLocation(fmt, normalized, time.Local); err == nil {
			return t, remaining, true
		}
	}

	extraFormats := []string{
		"2006-01-02 15:04:05.000",
		"2006-01-02 15:04:05,000",
	}
	for _, fmt := range extraFormats {
		if t, err := time.Parse(fmt, raw); err == nil {
			return t, remaining, true
		}
		if t, err := time.ParseInLocation(fmt, raw, time.Local); err == nil {
			return t, remaining, true
		}
	}
	return time.Time{}, remaining, false
}

func extractKVFields(entry *LogEntry, text string) {
	kvPattern := regexp.MustCompile(`(\w+)=([^\s,"]+|"[^"]*")`)
	matches := kvPattern.FindAllStringSubmatch(text, -1)
	for _, m := range matches {
		k, v := m[1], strings.Trim(m[2], "\"")
		switch strings.ToLower(k) {
		case "service", "svc", "app":
			if entry.Service == "" {
				entry.Service = v
			}
		case "env", "environment":
			entry.Environment = strings.ToLower(v)
		case "request_id", "requestid", "trace_id", "traceid", "rid":
			if entry.RequestID == "" {
				entry.RequestID = v
			}
		default:
			entry.Fields[k] = v
		}
	}
}

func looksLikeStacktrace(line string) bool {
	trimmed := strings.TrimSpace(line)
	if trimmed == "" {
		return true
	}
	if strings.HasPrefix(trimmed, "at ") {
		return true
	}
	if strings.HasPrefix(trimmed, "Caused by:") {
		return true
	}
	if strings.HasPrefix(trimmed, "Exception:") || strings.Contains(trimmed, "Exception:") || strings.Contains(trimmed, "Error:") {
		return true
	}
	if strings.HasPrefix(trimmed, "panic:") || strings.HasPrefix(trimmed, "goroutine ") {
		return true
	}
	if strings.HasPrefix(trimmed, "created by ") {
		return true
	}
	if strings.HasPrefix(line, "\t") || strings.HasPrefix(line, "    ") {
		if strings.Contains(trimmed, ".go:") || strings.Contains(trimmed, ".java:") {
			return true
		}
		if stackFileLine.MatchString(trimmed) {
			return true
		}
	}
	if strings.Contains(trimmed, "(") && strings.Contains(trimmed, ")") && !strings.Contains(trimmed, "=") {
		hasDot := strings.Contains(trimmed, ".")
		hasTimestampPrefix := linePattern1.MatchString(line)
		hasLevelMatch := levelPattern.MatchString(trimmed) && strings.Index(trimmed, string(levelPattern.FindString(trimmed))) < 30
		if hasDot && !hasTimestampPrefix && !hasLevelMatch {
			return true
		}
	}
	if stackGoPattern.MatchString(trimmed) && strings.Contains(trimmed, ".go:") {
		return true
	}
	if stackFileLine.MatchString(trimmed) && strings.Contains(trimmed, ".") {
		return true
	}
	return false
}

func parseStackFrame(line string) (StackFrame, bool) {
	trimmed := strings.TrimSpace(line)

	if m := stackAtPattern.FindStringSubmatch(trimmed); m != nil {
		fn := m[1]
		file := m[2]
		ln, _ := strconv.Atoi(m[3])
		return StackFrame{Function: fn, File: file, Line: ln}, true
	}

	if strings.Contains(trimmed, ".go:") {
		if idx := strings.LastIndex(trimmed, " "); idx > 0 {
			filePart := trimmed[idx+1:]
			fn := trimmed[:idx]
			if m := stackFileLine.FindStringSubmatch(filePart); m != nil {
				ln, _ := strconv.Atoi(m[2])
				return StackFrame{Function: fn, File: m[1], Line: ln}, true
			}
		}
	}

	return StackFrame{}, false
}

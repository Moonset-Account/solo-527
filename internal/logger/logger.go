package logger

import (
	"fmt"
	"io"
	"os"
	"strings"
	"sync"
	"time"
)

type Level int

const (
	LevelDebug Level = iota
	LevelInfo
	LevelWarn
	LevelError
	LevelSilent
)

func (l Level) String() string {
	switch l {
	case LevelDebug:
		return "DEBUG"
	case LevelInfo:
		return "INFO"
	case LevelWarn:
		return "WARN"
	case LevelError:
		return "ERROR"
	case LevelSilent:
		return "SILENT"
	}
	return "UNKNOWN"
}

func ParseLevel(s string) Level {
	s = strings.ToLower(strings.TrimSpace(s))
	switch s {
	case "debug":
		return LevelDebug
	case "info":
		return LevelInfo
	case "warn", "warning":
		return LevelWarn
	case "error":
		return LevelError
	case "silent", "quiet":
		return LevelSilent
	}
	return LevelInfo
}

type Field struct {
	Key   string
	Value interface{}
}

func F(key string, value interface{}) Field {
	return Field{Key: key, Value: value}
}

type Logger struct {
	mu      sync.Mutex
	level   Level
	out     io.Writer
	errOut  io.Writer
	json    bool
	prefix  string
	fields  []Field
}

var (
	std     = New()
	stdMu   sync.Mutex
)

func New() *Logger {
	return &Logger{
		level:  LevelInfo,
		out:    os.Stdout,
		errOut: os.Stderr,
		json:   false,
	}
}

func Std() *Logger {
	return std
}

func SetLevel(l Level) {
	stdMu.Lock()
	defer stdMu.Unlock()
	std.level = l
}

func SetJSON(enabled bool) {
	stdMu.Lock()
	defer stdMu.Unlock()
	std.json = enabled
}

func SetQuiet() {
	SetLevel(LevelSilent)
}

func SetVerbose() {
	SetLevel(LevelDebug)
}

func (l *Logger) With(fields ...Field) *Logger {
	return &Logger{
		level:  l.level,
		out:    l.out,
		errOut: l.errOut,
		json:   l.json,
		fields: append(l.fields, fields...),
	}
}

func (l *Logger) Debug(msg string, fields ...Field) {
	l.log(LevelDebug, msg, fields)
}

func (l *Logger) Info(msg string, fields ...Field) {
	l.log(LevelInfo, msg, fields)
}

func (l *Logger) Warn(msg string, fields ...Field) {
	l.log(LevelWarn, msg, fields)
}

func (l *Logger) Error(msg string, fields ...Field) {
	l.log(LevelError, msg, fields)
}

func Debug(msg string, fields ...Field) {
	std.log(LevelDebug, msg, fields)
}

func Info(msg string, fields ...Field) {
	std.log(LevelInfo, msg, fields)
}

func Warn(msg string, fields ...Field) {
	std.log(LevelWarn, msg, fields)
}

func Error(msg string, fields ...Field) {
	std.log(LevelError, msg, fields)
}

func (l *Logger) log(level Level, msg string, extraFields []Field) {
	if level < l.level {
		return
	}

	l.mu.Lock()
	defer l.mu.Unlock()

	writer := l.out
	if level == LevelError {
		writer = l.errOut
	}

	allFields := append(l.fields, extraFields...)
	ts := time.Now().Format("2006-01-02T15:04:05.000Z07:00")

	if l.json {
		l.writeJSON(writer, ts, level, msg, allFields)
	} else {
		l.writeText(writer, ts, level, msg, allFields)
	}
}

func (l *Logger) writeText(w io.Writer, ts string, level Level, msg string, fields []Field) {
	levelColor := ""
	levelReset := ""
	if l.isTerminal(w) {
		switch level {
		case LevelDebug:
			levelColor = "\033[36m"
		case LevelInfo:
			levelColor = "\033[32m"
		case LevelWarn:
			levelColor = "\033[33m"
		case LevelError:
			levelColor = "\033[31m"
		}
		levelReset = "\033[0m"
	}

	fieldStr := ""
	for _, f := range fields {
		fieldStr += fmt.Sprintf(" %s%v=%v%s", levelColor, f.Key, f.Value, levelReset)
	}

	fmt.Fprintf(w, "%s %s[%s]%s %s%s\n",
		ts,
		levelColor, level.String(), levelReset,
		msg,
		fieldStr,
	)
}

func (l *Logger) writeJSON(w io.Writer, ts string, level Level, msg string, fields []Field) {
	fieldMap := map[string]interface{}{
		"timestamp": ts,
		"level":     level.String(),
		"message":   msg,
	}
	for _, f := range fields {
		fieldMap[f.Key] = f.Value
	}

	parts := []string{}
	parts = append(parts, fmt.Sprintf(`"timestamp":%q`, ts))
	parts = append(parts, fmt.Sprintf(`"level":%q`, level.String()))
	parts = append(parts, fmt.Sprintf(`"message":%q`, msg))

	for _, f := range fields {
		switch v := f.Value.(type) {
		case string:
			parts = append(parts, fmt.Sprintf("%q:%q", f.Key, v))
		case int, int64, float64, bool:
			parts = append(parts, fmt.Sprintf("%q:%v", f.Key, v))
		default:
			parts = append(parts, fmt.Sprintf("%q:%q", f.Key, fmt.Sprintf("%v", v)))
		}
	}

	fmt.Fprintf(w, "{%s}\n", strings.Join(parts, ","))
}

func (l *Logger) isTerminal(w io.Writer) bool {
	f, ok := w.(*os.File)
	if !ok {
		return false
	}
	fi, err := f.Stat()
	if err != nil {
		return false
	}
	return (fi.Mode() & os.ModeCharDevice) != 0
}

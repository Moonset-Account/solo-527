package logparser

import "time"

type Level string

const (
	LevelDebug   Level = "DEBUG"
	LevelInfo    Level = "INFO"
	LevelWarn    Level = "WARN"
	LevelError   Level = "ERROR"
	LevelFatal   Level = "FATAL"
	LevelUnknown Level = "UNKNOWN"
)

func ParseLevel(s string) Level {
	switch s {
	case "DEBUG", "debug", "Debug":
		return LevelDebug
	case "INFO", "info", "Info":
		return LevelInfo
	case "WARN", "warn", "Warn", "WARNING", "warning":
		return LevelWarn
	case "ERROR", "error", "Error", "ERR", "err":
		return LevelError
	case "FATAL", "fatal", "Fatal":
		return LevelFatal
	default:
		return LevelUnknown
	}
}

func (l Level) IsErrorOrAbove() bool {
	return l == LevelError || l == LevelFatal
}

type StackFrame struct {
	File     string `json:"file"`
	Line     int    `json:"line"`
	Function string `json:"function"`
}

type LogEntry struct {
	Raw        string            `json:"raw"`
	Timestamp  time.Time         `json:"timestamp"`
	Level      Level             `json:"level"`
	Service    string            `json:"service"`
	Environment string           `json:"environment"`
	RequestID  string            `json:"request_id"`
	Message    string            `json:"message"`
	Stacktrace []StackFrame      `json:"stacktrace,omitempty"`
	Fields     map[string]string `json:"fields,omitempty"`
	LineNum    int               `json:"line_num"`
	SourceFile string            `json:"source_file"`
}

func (e *LogEntry) ErrorSignature() string {
	if len(e.Stacktrace) > 0 {
		top := e.Stacktrace[0]
		return top.Function
	}
	return e.Message
}

func (e *LogEntry) ClusterKey() string {
	parts := make([]byte, 0, 256)
	parts = append(parts, []byte(e.Service)...)
	parts = append(parts, '|')
	parts = append(parts, []byte(e.Level)...)
	parts = append(parts, '|')
	if len(e.Stacktrace) > 0 {
		for i, f := range e.Stacktrace {
			if i > 2 {
				break
			}
			parts = append(parts, []byte(f.Function)...)
			parts = append(parts, ':')
		}
	} else {
		parts = append(parts, normalizeMessage(e.Message)...)
	}
	return string(parts)
}

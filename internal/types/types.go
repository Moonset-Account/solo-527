package types

import (
	"time"
)

type LogLevel string

const (
	LevelDebug LogLevel = "DEBUG"
	LevelInfo  LogLevel = "INFO"
	LevelWarn  LogLevel = "WARN"
	LevelError LogLevel = "ERROR"
	LevelFatal LogLevel = "FATAL"
)

type LogEntry struct {
	Timestamp    time.Time
	Service      string
	Level        LogLevel
	RequestID    string
	Message      string
	ErrorStack   string
	Environment  string
	RawLine      string
	ContextBefore []string
	ContextAfter  []string
}

type ErrorCluster struct {
	ID               string
	Signature        string
	MessagePattern   string
	Count            int
	FirstOccurrence  time.Time
	LastOccurrence   time.Time
	Services         map[string]int
	RequestIDs       []string
	Environments     map[string]int
	SampleStacktrace string
	SampleMessage    string
	ContextSample    []string
	Level            LogLevel
}

type SummaryReport struct {
	GeneratedAt      time.Time
	TimeRange        TimeRange
	Services         []string
	TotalEntries     int
	ErrorEntries     int
	WarningEntries   int
	Clusters         []ErrorCluster
	TopErrors        []ErrorCluster
	FilteredServices []string
}

type TimeRange struct {
	Start time.Time
	End   time.Time
}

type ProcessError struct {
	Code      string
	Message   string
	Suggestion string
	Details   map[string]interface{}
}

func (e *ProcessError) Error() string {
	return e.Message
}

const (
	ExitCodeSuccess      = 0
	ExitCodeConfigError  = 1
	ExitCodeInputError   = 2
	ExitCodeProcessError = 3
	ExitCodeOutputError  = 4
	ExitCodeNoData       = 10
	ExitCodeHasErrors    = 11
)

package logger

import (
	"fmt"
	"io"
	"os"
	"sync"
	"time"
)

type Level int

const (
	LevelDebug Level = iota
	LevelInfo
	LevelWarn
	LevelError
	LevelFatal
)

type Logger struct {
	out      io.Writer
	errOut   io.Writer
	minLevel Level
	mu       sync.Mutex
	prefix   string
}

var defaultLogger = New(os.Stdout, os.Stderr, LevelInfo, "")

func New(out, errOut io.Writer, minLevel Level, prefix string) *Logger {
	return &Logger{
		out:      errOut,
		errOut:   errOut,
		minLevel: minLevel,
		prefix:   prefix,
	}
}

func SetDefault(l *Logger) {
	defaultLogger = l
}

func SetLevel(level Level) {
	defaultLogger.minLevel = level
}

func (l *Logger) log(level Level, format string, args ...interface{}) {
	if level < l.minLevel {
		return
	}
	l.mu.Lock()
	defer l.mu.Unlock()

	tag := map[Level]string{
		LevelDebug: "DEBUG",
		LevelInfo:  "INFO ",
		LevelWarn:  "WARN ",
		LevelError: "ERROR",
		LevelFatal: "FATAL",
	}[level]

	color := map[Level]string{
		LevelDebug: "\033[36m",
		LevelInfo:  "\033[32m",
		LevelWarn:  "\033[33m",
		LevelError: "\033[31m",
		LevelFatal: "\033[35m",
	}[level]
	reset := "\033[0m"

	ts := time.Now().Format("2006-01-02 15:04:05")
	msg := fmt.Sprintf(format, args...)
	line := fmt.Sprintf("%s%s [%s] %s%s %s\n", color, ts, tag, reset, l.prefix, msg)

	w := l.out
	if level >= LevelError {
		w = l.errOut
	}
	fmt.Fprint(w, line)

	if level == LevelFatal {
		os.Exit(1)
	}
}

func Debug(format string, args ...interface{}) { defaultLogger.log(LevelDebug, format, args...) }
func Info(format string, args ...interface{})  { defaultLogger.log(LevelInfo, format, args...) }
func Warn(format string, args ...interface{})  { defaultLogger.log(LevelWarn, format, args...) }
func Error(format string, args ...interface{}) { defaultLogger.log(LevelError, format, args...) }
func Fatal(format string, args ...interface{}) { defaultLogger.log(LevelFatal, format, args...) }

func ParseLevel(s string) Level {
	switch s {
	case "debug", "DEBUG":
		return LevelDebug
	case "info", "INFO":
		return LevelInfo
	case "warn", "warning", "WARN":
		return LevelWarn
	case "error", "ERROR":
		return LevelError
	case "fatal", "FATAL":
		return LevelFatal
	}
	return LevelInfo
}

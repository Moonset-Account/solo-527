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
	LevelError Level = iota
	LevelWarn
	LevelInfo
	LevelDebug
)

type Logger struct {
	mu       sync.Mutex
	out      io.Writer
	errOut   io.Writer
	level    Level
	prefix   string
	useTime  bool
}

var defaultLogger = New(os.Stderr, LevelInfo, "logsum")

func Default() *Logger { return defaultLogger }

func New(out io.Writer, level Level, prefix string) *Logger {
	return &Logger{
		out:     out,
		errOut:  out,
		level:   level,
		prefix:  prefix,
		useTime: true,
	}
}

func (l *Logger) SetLevel(level Level) {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.level = level
}

func (l *Logger) SetQuiet() {
	l.SetLevel(LevelError)
}

func (l *Logger) SetVerbose() {
	l.SetLevel(LevelDebug)
}

func (l *Logger) log(w io.Writer, lvl Level, tag, format string, args []interface{}) {
	if lvl > l.level {
		return
	}
	l.mu.Lock()
	defer l.mu.Unlock()
	ts := ""
	if l.useTime {
		ts = time.Now().Format("2006-01-02 15:04:05 ")
	}
	pfx := ""
	if l.prefix != "" {
		pfx = l.prefix + ": "
	}
	msg := fmt.Sprintf(format, args...)
	fmt.Fprintf(w, "%s%s%s %s\n", ts, pfx, tag, msg)
}

func (l *Logger) Errorf(format string, args ...interface{}) {
	l.log(l.errOut, LevelError, "[ERR]", format, args)
}

func (l *Logger) Warnf(format string, args ...interface{}) {
	l.log(l.out, LevelWarn, "[WARN]", format, args)
}

func (l *Logger) Infof(format string, args ...interface{}) {
	l.log(l.out, LevelInfo, "[INFO]", format, args)
}

func (l *Logger) Debugf(format string, args ...interface{}) {
	l.log(l.out, LevelDebug, "[DEBUG]", format, args)
}

func Errorf(format string, args ...interface{}) { defaultLogger.Errorf(format, args) }
func Warnf(format string, args ...interface{})  { defaultLogger.Warnf(format, args) }
func Infof(format string, args ...interface{})  { defaultLogger.Infof(format, args) }
func Debugf(format string, args ...interface{}) { defaultLogger.Debugf(format, args) }

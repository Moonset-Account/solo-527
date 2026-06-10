package rollback

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

type ActionKind string

const (
	ActionCreateFile ActionKind = "create_file"
	ActionWriteFile  ActionKind = "write_file"
	ActionRemoveFile ActionKind = "remove_file"
)

type Action struct {
	Kind      ActionKind          `json:"kind"`
	Target    string              `json:"target"`
	Backup    string              `json:"backup,omitempty"`
	Content   string              `json:"content,omitempty"`
	Timestamp time.Time           `json:"timestamp"`
	Extra     map[string]string   `json:"extra,omitempty"`
	Err       string              `json:"error,omitempty"`
	Applied   bool                `json:"applied"`
	Reverted  bool                `json:"reverted"`
}

type Log struct {
	RunID     string    `json:"run_id"`
	StartedAt time.Time `json:"started_at"`
	Command   string    `json:"command"`
	Actions   []Action  `json:"actions"`
	baseDir   string
}

func NewLog(command string, baseDir string) (*Log, error) {
	if baseDir == "" {
		baseDir = os.TempDir()
	}
	id := fmt.Sprintf("logsum-%d-%s", os.Getpid(), time.Now().Format("20060102-150405"))
	if err := os.MkdirAll(filepath.Join(baseDir, id), 0o755); err != nil {
		return nil, err
	}
	return &Log{
		RunID:     id,
		StartedAt: time.Now(),
		Command:   command,
		baseDir:   filepath.Join(baseDir, id),
	}, nil
}

func (l *Log) Path() string { return l.baseDir }

func (l *Log) Record(a Action) {
	if a.Timestamp.IsZero() {
		a.Timestamp = time.Now()
	}
	l.Actions = append(l.Actions, a)
}

func (l *Log) CreateWriteAction(target, backup string, hadBackup bool) {
	l.Record(Action{
		Kind:   ActionWriteFile,
		Target: target,
		Backup: backup,
		Applied: true,
		Extra: map[string]string{"had_backup": fmt.Sprintf("%t", hadBackup)},
	})
}

func (l *Log) CreateRemoveAction(target, backup string) {
	l.Record(Action{
		Kind:   ActionRemoveFile,
		Target: target,
		Backup: backup,
		Applied: true,
	})
}

func (l *Log) Save() error {
	if l.baseDir == "" {
		return fmt.Errorf("rollback log not initialized")
	}
	path := filepath.Join(l.baseDir, "rollback.json")
	f, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0o644)
	if err != nil {
		return err
	}
	defer f.Close()
	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	return enc.Encode(l)
}

func (l *Log) RevertAll() []error {
	errs := make([]error, 0)
	for i := len(l.Actions) - 1; i >= 0; i-- {
		a := &l.Actions[i]
		if !a.Applied || a.Reverted {
			continue
		}
		if err := revertOne(a); err != nil {
			a.Err = err.Error()
			errs = append(errs, fmt.Errorf("revert %s %s: %w", a.Kind, a.Target, err))
			continue
		}
		a.Reverted = true
	}
	if len(errs) == 0 {
		_ = l.Save()
	}
	return errs
}

func revertOne(a *Action) error {
	switch a.Kind {
	case ActionWriteFile:
		if a.Backup != "" {
			if _, err := os.Stat(a.Backup); err == nil {
				return os.Rename(a.Backup, a.Target)
			}
		}
		return os.Remove(a.Target)
	case ActionRemoveFile:
		if a.Backup != "" {
			if _, err := os.Stat(a.Backup); err == nil {
				return os.Rename(a.Backup, a.Target)
			}
		}
		return nil
	case ActionCreateFile:
		return os.Remove(a.Target)
	}
	return nil
}

package rollback

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

type OperationType string

const (
	OpValidate OperationType = "validate"
	OpDryRun   OperationType = "dry_run"
	OpFix      OperationType = "fix_preview"
)

type Record struct {
	ID            string                 `json:"id"`
	Timestamp     string                 `json:"timestamp"`
	Operation     OperationType          `json:"operation"`
	SchemaFile    string                 `json:"schema_file"`
	SchemaName    string                 `json:"schema_name"`
	CSVFile       string                 `json:"csv_file"`
	Success       bool                   `json:"success"`
	TotalRows     int                    `json:"total_rows"`
	ErrorCount    int                    `json:"error_count"`
	WarningCount  int                    `json:"warning_count"`
	ExitCode      int                    `json:"exit_code"`
	ErrorMessage  string                 `json:"error_message,omitempty"`
	DurationMs    int64                  `json:"duration_ms"`
	User          string                 `json:"user,omitempty"`
	Hostname      string                 `json:"hostname,omitempty"`
	Extra         map[string]interface{} `json:"extra,omitempty"`
}

type Recorder struct {
	logDir string
}

func New(logDir string) (*Recorder, error) {
	if logDir == "" {
		return nil, fmt.Errorf("回滚日志目录不能为空")
	}
	abs, err := filepath.Abs(logDir)
	if err != nil {
		return nil, fmt.Errorf("解析日志目录失败: %w", err)
	}
	if err := os.MkdirAll(abs, 0o755); err != nil {
		return nil, fmt.Errorf("创建日志目录失败: %w\n建议: 请检查 %s 的写入权限", err, abs)
	}
	return &Recorder{logDir: abs}, nil
}

func (r *Recorder) Save(record *Record) (string, error) {
	if record.Timestamp == "" {
		record.Timestamp = time.Now().Format(time.RFC3339)
	}
	if record.ID == "" {
		record.ID = fmt.Sprintf("%s_%d", record.Operation, time.Now().UnixNano())
	}
	filename := fmt.Sprintf("%s_%s.json",
		time.Now().Format("20060102_150405"),
		string(record.Operation))
	path := filepath.Join(r.logDir, filename)

	data, err := json.MarshalIndent(record, "", "  ")
	if err != nil {
		return "", fmt.Errorf("序列化回滚记录失败: %w", err)
	}
	if err := os.WriteFile(path, data, 0o644); err != nil {
		return "", fmt.Errorf("写入回滚记录失败: %w\n建议: 请检查 %s 的写入权限", err, path)
	}
	return path, nil
}

func (r *Recorder) List(limit int) ([]Record, error) {
	entries, err := os.ReadDir(r.logDir)
	if err != nil {
		return nil, fmt.Errorf("读取日志目录失败: %w", err)
	}
	var files []os.DirEntry
	for _, e := range entries {
		if !e.IsDir() && filepath.Ext(e.Name()) == ".json" {
			files = append(files, e)
		}
	}
	if limit > 0 && len(files) > limit {
		files = files[len(files)-limit:]
	}
	var records []Record
	for i := len(files) - 1; i >= 0; i-- {
		f := files[i]
		path := filepath.Join(r.logDir, f.Name())
		data, err := os.ReadFile(path)
		if err != nil {
			continue
		}
		var rec Record
		if err := json.Unmarshal(data, &rec); err == nil {
			records = append(records, rec)
		}
	}
	return records, nil
}

package envfile

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"regexp"
	"strings"
)

type EnvVar struct {
	Key     string
	Value   string
	Line    int
	Comment string
}

type EnvFile struct {
	Path string
	Vars map[string]EnvVar
}

var (
	linePattern = regexp.MustCompile(`^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$`)
	commentRe   = regexp.MustCompile(`#\s*(.*)$`)
)

func ParseFile(path string) (*EnvFile, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("open env file %s: %w", path, err)
	}
	defer f.Close()
	return ParseReader(f, path)
}

func ParseReader(r io.Reader, path string) (*EnvFile, error) {
	ef := &EnvFile{
		Path: path,
		Vars: make(map[string]EnvVar),
	}
	scanner := bufio.NewScanner(r)
	lineNum := 0
	for scanner.Scan() {
		lineNum++
		line := scanner.Text()
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			continue
		}
		matches := linePattern.FindStringSubmatch(trimmed)
		if matches == nil {
			continue
		}
		key := matches[1]
		rawVal := matches[2]
		value := extractValue(rawVal)
		comment := ""
		if cm := commentRe.FindStringSubmatch(rawVal); cm != nil {
			comment = strings.TrimSpace(cm[1])
		}
		ef.Vars[key] = EnvVar{
			Key:     key,
			Value:   value,
			Line:    lineNum,
			Comment: comment,
		}
	}
	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("scan env file %s: %w", path, err)
	}
	return ef, nil
}

func ParseStdin() (*EnvFile, error) {
	return ParseReader(os.Stdin, "<stdin>")
}

func extractValue(raw string) string {
	raw = strings.TrimSpace(raw)
	if strings.HasPrefix(raw, `"`) && strings.HasSuffix(raw, `"`) {
		return strings.Trim(raw, `"`)
	}
	if strings.HasPrefix(raw, `'`) && strings.HasSuffix(raw, `'`) {
		return strings.Trim(raw, `'`)
	}
	if idx := strings.Index(raw, " #"); idx != -1 {
		return strings.TrimSpace(raw[:idx])
	}
	return raw
}

func Keys(vars map[string]EnvVar) []string {
	keys := make([]string, 0, len(vars))
	for k := range vars {
		keys = append(keys, k)
	}
	return keys
}

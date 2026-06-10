package parser

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/devops/envcheck/internal/types"
)

var (
	envLineRegex = regexp.MustCompile(`^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$`)
	exportRegex  = regexp.MustCompile(`^\s*export\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$`)
	commentRegex = regexp.MustCompile(`^\s*#`)
	blankRegex   = regexp.MustCompile(`^\s*$`)
)

func ParseFile(path string) (*types.EnvFile, error) {
	absPath, err := filepath.Abs(path)
	if err != nil {
		return nil, fmt.Errorf("resolve path: %w", err)
	}

	f, err := os.Open(absPath)
	if err != nil {
		return nil, fmt.Errorf("open file %s: %w", absPath, err)
	}
	defer f.Close()

	info, err := f.Stat()
	if err != nil {
		return nil, fmt.Errorf("stat file: %w", err)
	}

	envFile := &types.EnvFile{
		Path:    absPath,
		Label:   filepath.Base(absPath),
		Vars:    []types.EnvVar{},
		VarMap:  map[string]types.EnvVar{},
		ModTime: info.ModTime(),
	}

	scanner := bufio.NewScanner(f)
	lineNum := 0
	var lastComment string

	for scanner.Scan() {
		lineNum++
		line := scanner.Text()

		if blankRegex.MatchString(line) {
			lastComment = ""
			continue
		}

		if commentRegex.MatchString(line) {
			comment := strings.TrimSpace(strings.TrimPrefix(line, "#"))
			comment = strings.TrimSpace(comment)
			if lastComment == "" {
				lastComment = comment
			} else {
				lastComment = lastComment + " " + comment
			}
			continue
		}

		matches := envLineRegex.FindStringSubmatch(line)
		if len(matches) == 0 {
			matches = exportRegex.FindStringSubmatch(line)
		}

		if len(matches) >= 3 {
			key := matches[1]
			rawValue := matches[2]
			value := parseValue(rawValue)

			ev := types.EnvVar{
				Key:     key,
				Value:   value,
				Source:  absPath,
				Line:    lineNum,
				Comment: lastComment,
			}

			requiredMarker := strings.ToLower(lastComment)
			if strings.Contains(requiredMarker, "required") ||
				strings.Contains(requiredMarker, "必填") {
				ev.Required = true
			}

			envFile.Vars = append(envFile.Vars, ev)
			envFile.VarMap[key] = ev
			lastComment = ""
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("read file: %w", err)
	}

	return envFile, nil
}

func parseValue(raw string) string {
	raw = strings.TrimSpace(raw)

	if len(raw) >= 2 {
		first := raw[0]
		last := raw[len(raw)-1]

		if (first == '"' && last == '"') || (first == '\'' && last == '\'') {
			inner := raw[1 : len(raw)-1]

			if first == '"' {
				inner = strings.ReplaceAll(inner, `\\`, `\`)
				inner = strings.ReplaceAll(inner, `\"`, `"`)
				inner = strings.ReplaceAll(inner, `\n`, "\n")
				inner = strings.ReplaceAll(inner, `\t`, "\t")
			}
			return inner
		}
	}

	idx := strings.Index(raw, " #")
	if idx >= 0 {
		raw = strings.TrimSpace(raw[:idx])
	}
	idx = strings.Index(raw, "\t#")
	if idx >= 0 {
		raw = strings.TrimSpace(raw[:idx])
	}

	return raw
}

func ParseFiles(paths []string) ([]*types.EnvFile, error) {
	files := make([]*types.EnvFile, 0, len(paths))
	errs := []string{}

	for _, p := range paths {
		ef, err := ParseFile(p)
		if err != nil {
			errs = append(errs, err.Error())
			continue
		}
		files = append(files, ef)
	}

	if len(errs) > 0 {
		return files, fmt.Errorf("parse errors:\n  - %s", strings.Join(errs, "\n  - "))
	}

	return files, nil
}

func MergeEnvFiles(files []*types.EnvFile) map[string]types.EnvVar {
	merged := map[string]types.EnvVar{}

	for _, ef := range files {
		for _, v := range ef.Vars {
			merged[v.Key] = v
		}
	}

	return merged
}

func FindEnvFiles(patterns []string) ([]string, error) {
	paths := []string{}
	seen := map[string]bool{}

	for _, pattern := range patterns {
		if strings.Contains(pattern, "*") || strings.Contains(pattern, "?") {
			matches, err := filepath.Glob(pattern)
			if err != nil {
				return nil, fmt.Errorf("glob pattern %s: %w", pattern, err)
			}
			for _, m := range matches {
				abs, err := filepath.Abs(m)
				if err != nil {
					continue
				}
				if !seen[abs] {
					seen[abs] = true
					paths = append(paths, abs)
				}
			}
		} else {
			abs, err := filepath.Abs(pattern)
			if err != nil {
				continue
			}
			if _, err := os.Stat(abs); err == nil {
				if !seen[abs] {
					seen[abs] = true
					paths = append(paths, abs)
				}
			}
		}
	}

	return paths, nil
}

func DetectRequiredVars(exampleVars []types.EnvVar) []string {
	required := []string{}
	for _, v := range exampleVars {
		if v.Required {
			required = append(required, v.Key)
		}
	}
	return required
}

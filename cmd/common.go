package cmd

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"csvchecker/internal/ignore"
	"csvchecker/internal/schema"
	"csvchecker/internal/types"
	"csvchecker/internal/validator"
)

func buildIgnoreManager(s *types.CSVSchema, ignoreRules, ignoreCols, ignoreFiles []string) *ignore.Manager {
	mgr := ignore.NewManager()
	mgr.AddRuleIDs(ignoreRules)
	mgr.AddColumns(ignoreCols)
	mgr.AddFiles(ignoreFiles)
	if s != nil && len(s.IgnoreRules) > 0 {
		mgr.AddSchemaRules(s.IgnoreRules)
	}
	return mgr
}

func loadSchema() (*types.CSVSchema, error) {
	var s *types.CSVSchema
	var err error

	if flagSchema != "" {
		s, err = schema.LoadSchema(flagSchema)
		if err != nil {
			return nil, fmt.Errorf("加载 schema 失败: %w", err)
		}
	} else if flagBusiness != "" {
		absDir, _ := filepath.Abs(flagSchemaDir)
		s, err = schema.LoadSchemaFromDir(absDir, flagBusiness)
		if err != nil {
			return nil, fmt.Errorf("按业务线加载 schema 失败: %w", err)
		}
	} else {
		return nil, fmt.Errorf("请指定 --schema (-s) 或 --business-line (-b) 参数")
	}
	return s, nil
}

func buildValidator(s *types.CSVSchema, ignoreMgr *ignore.Manager, maxErrors int, stopOnError bool) *validator.Validator {
	v := validator.New(s, ignoreMgr)
	v.SetMaxErrors(maxErrors)
	v.SetStopOnError(stopOnError)
	if flagDelimiter != "" {
		runes := []rune(flagDelimiter)
		if len(runes) > 0 {
			v.SetDelimiter(runes[0])
		}
	}
	return v
}

func expandCSVPaths(paths []string) ([]string, error) {
	var result []string
	seen := make(map[string]bool)
	for _, p := range paths {
		matches, err := filepath.Glob(p)
		if err != nil {
			return nil, err
		}
		if len(matches) == 0 {
			abs, _ := filepath.Abs(p)
			if !seen[abs] {
				seen[abs] = true
				result = append(result, p)
			}
			continue
		}
		for _, m := range matches {
			fi, err := os.Stat(m)
			if err != nil {
				continue
			}
			if fi.IsDir() {
				entries, err := os.ReadDir(m)
				if err != nil {
					continue
				}
				for _, e := range entries {
					if e.IsDir() {
						continue
					}
					ext := strings.ToLower(filepath.Ext(e.Name()))
					if ext == ".csv" || ext == ".tsv" || ext == ".txt" {
						fp := filepath.Join(m, e.Name())
						abs, _ := filepath.Abs(fp)
						if !seen[abs] {
							seen[abs] = true
							result = append(result, fp)
						}
					}
				}
			} else {
				abs, _ := filepath.Abs(m)
				if !seen[abs] {
					seen[abs] = true
					result = append(result, m)
				}
			}
		}
	}
	return result, nil
}

func exitCode(report *types.ValidationReport, failOnWarning bool) int {
	if report.HasCriticalErr {
		return 2
	}
	if report.TotalErrors > 0 {
		if failOnWarning {
			return 3
		}
		hasError := false
		for rid := range report.RuleSummary {
			if sev, ok := types.RuleSeverities[rid]; ok && (sev == types.SeverityError) {
				hasError = true
				break
			}
		}
		if hasError {
			return 1
		}
	}
	return 0
}

package diffengine

import (
	"strings"

	"github.com/devops/envcheck/internal/types"
)

type Engine struct {
	strict         bool
	warnOnExtra    bool
	failOnMismatch bool
	failOnMissing  bool
}

func New(cfg *types.CheckConfig) *Engine {
	return &Engine{
		strict:         cfg.Strict,
		warnOnExtra:    cfg.WarnOnExtra,
		failOnMismatch: cfg.FailOnMismatch,
		failOnMissing:  cfg.FailOnMissing,
	}
}

func (e *Engine) CompareTwo(left, right *types.EnvFile) []types.DiffItem {
	diffs := []types.DiffItem{}

	leftKeys := map[string]bool{}
	rightKeys := map[string]bool{}

	for _, lv := range left.Vars {
		leftKeys[lv.Key] = true
		rv, exists := right.VarMap[lv.Key]
		if !exists {
			diffs = append(diffs, types.DiffItem{
				Type:       types.DiffMissing,
				Key:        lv.Key,
				LeftValue:  lv.Value,
				LeftSource: left.Label,
				RightSource: right.Label,
				Severity:   e.severityForMissing(),
			})
		} else {
			rightKeys[lv.Key] = true
			if lv.Value != rv.Value {
				diffs = append(diffs, types.DiffItem{
					Type:        types.DiffValueMismatch,
					Key:         lv.Key,
					LeftValue:   lv.Value,
					RightValue:  rv.Value,
					LeftSource:  left.Label,
					RightSource: right.Label,
					Severity:    e.severityForMismatch(),
				})
			} else {
				diffs = append(diffs, types.DiffItem{
					Type:       types.DiffMatch,
					Key:        lv.Key,
					LeftSource: left.Label,
					RightSource: right.Label,
					Severity:   "info",
				})
			}
		}
	}

	for _, rv := range right.Vars {
		if !rightKeys[rv.Key] && !leftKeys[rv.Key] {
			diffs = append(diffs, types.DiffItem{
				Type:        types.DiffExtra,
				Key:         rv.Key,
				RightValue:  rv.Value,
				LeftSource:  left.Label,
				RightSource: right.Label,
				Severity:    e.severityForExtra(),
			})
		}
	}

	return diffs
}

func (e *Engine) CompareAgainstExample(envVars map[string]types.EnvVar, exampleFile *types.EnvFile, requiredList []string) ([]types.DiffItem, []types.MissingVar, []string) {
	diffs := []types.DiffItem{}
	missing := []types.MissingVar{}
	extra := []string{}

	requiredSet := map[string]bool{}
	for _, r := range requiredList {
		requiredSet[r] = true
	}

	for _, exVar := range exampleFile.Vars {
		isRequired := exVar.Required || requiredSet[exVar.Key]
		actualVar, exists := envVars[exVar.Key]

		if !exists {
			mv := types.MissingVar{
				Key:      exVar.Key,
				Required: isRequired,
				Example:  exVar.Value,
				Comment:  exVar.Comment,
			}
			missing = append(missing, mv)

			severity := "warn"
			if isRequired {
				severity = "error"
			}
			diffs = append(diffs, types.DiffItem{
				Type:        types.DiffMissing,
				Key:         exVar.Key,
				RightValue:  exVar.Value,
				RightSource: exampleFile.Label,
				Severity:    severity,
			})
		} else {
			if actualVar.Value != exVar.Value {
				diffs = append(diffs, types.DiffItem{
					Type:        types.DiffValueMismatch,
					Key:         exVar.Key,
					LeftValue:   actualVar.Value,
					RightValue:  exVar.Value,
					LeftSource:  actualVar.Source,
					RightSource: exampleFile.Label,
					Severity:    e.severityForMismatch(),
				})
			} else {
				diffs = append(diffs, types.DiffItem{
					Type:        types.DiffMatch,
					Key:         exVar.Key,
					LeftSource:  actualVar.Source,
					RightSource: exampleFile.Label,
					Severity:    "info",
				})
			}
		}
	}

	for k, av := range envVars {
		_, inExample := exampleFile.VarMap[k]
		if !inExample {
			extra = append(extra, k)
			diffs = append(diffs, types.DiffItem{
				Type:       types.DiffExtra,
				Key:        k,
				LeftValue:  av.Value,
				LeftSource: av.Source,
				Severity:   e.severityForExtra(),
			})
		}
	}

	return diffs, missing, extra
}

func (e *Engine) ComputeExitCode(diffs []types.DiffItem, missing []types.MissingVar) int {
	exitCode := 0

	missingRequiredCount := 0
	for _, m := range missing {
		if m.Required {
			missingRequiredCount++
		}
	}
	if missingRequiredCount > 0 && e.failOnMissing {
		exitCode |= 0x01
	}

	mismatchCount := 0
	for _, d := range diffs {
		if d.Type == types.DiffValueMismatch {
			mismatchCount++
		}
	}
	if mismatchCount > 0 && e.failOnMismatch {
		exitCode |= 0x02
	}

	extraCount := 0
	for _, d := range diffs {
		if d.Type == types.DiffExtra {
			extraCount++
		}
	}
	if extraCount > 0 && e.strict {
		exitCode |= 0x04
	}

	return exitCode
}

func ComputeSummary(envFiles []*types.EnvFile, diffs []types.DiffItem, missing []types.MissingVar) types.Summary {
	s := types.Summary{}
	s.TotalFiles = len(envFiles)

	for _, ef := range envFiles {
		s.TotalVars += len(ef.Vars)
	}

	s.MissingCount = len(missing)
	for _, m := range missing {
		if m.Required {
			s.MissingRequired++
		}
	}

	for _, d := range diffs {
		switch d.Type {
		case types.DiffExtra:
			s.ExtraCount++
		case types.DiffValueMismatch:
			s.MismatchCount++
		case types.DiffMatch:
			s.MatchCount++
		}
	}

	return s
}

func (e *Engine) severityForMissing() string {
	if e.failOnMissing {
		return "error"
	}
	return "warn"
}

func (e *Engine) severityForMismatch() string {
	if e.failOnMismatch {
		return "error"
	}
	return "warn"
}

func (e *Engine) severityForExtra() string {
	if e.strict {
		return "error"
	}
	if e.warnOnExtra {
		return "warn"
	}
	return "info"
}

func FilterDiffsBySeverity(diffs []types.DiffItem, minSeverity string) []types.DiffItem {
	sevLevel := map[string]int{"info": 0, "warn": 1, "error": 2}
	minLevel := sevLevel[strings.ToLower(minSeverity)]

	result := []types.DiffItem{}
	for _, d := range diffs {
		if sevLevel[d.Severity] >= minLevel {
			result = append(result, d)
		}
	}
	return result
}

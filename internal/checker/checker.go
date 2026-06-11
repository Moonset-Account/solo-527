package checker

import (
	"fmt"
	"sort"
	"strings"

	"github.com/envcheck/envcheck/internal/envfile"
	"github.com/envcheck/envcheck/internal/mask"
)

type Severity string

const (
	SeverityError   Severity = "error"
	SeverityWarning Severity = "warning"
	SeverityInfo    Severity = "info"
)

type Issue struct {
	Severity Severity `json:"severity"`
	Category string   `json:"category"`
	Key      string   `json:"key"`
	Message  string   `json:"message"`
	Source   string   `json:"source,omitempty"`
	Target   string   `json:"target,omitempty"`
}

type DiffEntry struct {
	Key       string `json:"key"`
	Source    string `json:"source"`
	SourceVal string `json:"source_val"`
	Target    string `json:"target"`
	TargetVal string `json:"target_val"`
}

type Result struct {
	EnvFiles      []string    `json:"env_files"`
	ExampleFiles  []string    `json:"example_files"`
	Issues        []Issue     `json:"issues"`
	Diffs         []DiffEntry `json:"diffs"`
	MissingInEnv  []string    `json:"missing_in_env"`
	MissingInEx   []string    `json:"missing_in_example"`
	HasErrors     bool        `json:"has_errors"`
	HasWarnings   bool        `json:"has_warnings"`
	TotalChecked  int         `json:"total_checked"`
	TotalIssues   int         `json:"total_issues"`
}

type Checker struct {
	envFiles     []*envfile.EnvFile
	exampleFiles []*envfile.EnvFile
	masker       *mask.Masker
	required     []string
	strict       bool
}

func New(masker *mask.Masker, required []string, strict bool) *Checker {
	return &Checker{
		masker:   masker,
		required: required,
		strict:   strict,
	}
}

func (c *Checker) AddEnvFile(ef *envfile.EnvFile) {
	c.envFiles = append(c.envFiles, ef)
}

func (c *Checker) AddExampleFile(ef *envfile.EnvFile) {
	c.exampleFiles = append(c.exampleFiles, ef)
}

func (c *Checker) Check() *Result {
	r := &Result{}

	for _, ef := range c.envFiles {
		r.EnvFiles = append(r.EnvFiles, ef.Path)
	}
	for _, ef := range c.exampleFiles {
		r.ExampleFiles = append(r.ExampleFiles, ef.Path)
	}

	c.checkMissingRequired(r)
	c.checkExampleCoverage(r)
	c.checkEnvDiff(r)
	c.checkEmptyValues(r)

	if c.strict {
		c.checkExtraInEnv(r)
	}

	r.TotalIssues = len(r.Issues)
	for _, iss := range r.Issues {
		if iss.Severity == SeverityError {
			r.HasErrors = true
		}
		if iss.Severity == SeverityWarning {
			r.HasWarnings = true
		}
	}
	totalKeys := make(map[string]bool)
	for _, ef := range c.envFiles {
		for k := range ef.Vars {
			totalKeys[k] = true
		}
	}
	for _, ef := range c.exampleFiles {
		for k := range ef.Vars {
			totalKeys[k] = true
		}
	}
	r.TotalChecked = len(totalKeys)

	return r
}

func (c *Checker) checkMissingRequired(r *Result) {
	for _, req := range c.required {
		found := false
		for _, ef := range c.envFiles {
			if _, ok := ef.Vars[req]; ok {
				found = true
				break
			}
		}
		if !found {
			r.Issues = append(r.Issues, Issue{
				Severity: SeverityError,
				Category: "missing_required",
				Key:      req,
				Message:  fmt.Sprintf("required variable %q is missing from all env files", req),
			})
			r.MissingInEnv = append(r.MissingInEnv, req)
		}
	}
}

func (c *Checker) checkExampleCoverage(r *Result) {
	allEnvKeys := c.collectKeys(c.envFiles)
	allExKeys := c.collectKeys(c.exampleFiles)

	for k := range allEnvKeys {
		if _, ok := allExKeys[k]; !ok && len(c.exampleFiles) > 0 {
			r.Issues = append(r.Issues, Issue{
				Severity: SeverityWarning,
				Category: "missing_in_example",
				Key:      k,
				Message:  fmt.Sprintf("variable %q exists in env but is missing from example files", k),
			})
			r.MissingInEx = append(r.MissingInEx, k)
		}
	}

	for k := range allExKeys {
		if _, ok := allEnvKeys[k]; !ok && len(c.envFiles) > 0 {
			r.Issues = append(r.Issues, Issue{
				Severity: SeverityWarning,
				Category: "missing_in_env",
				Key:      k,
				Message:  fmt.Sprintf("variable %q exists in example but is missing from env files", k),
			})
			r.MissingInEnv = append(r.MissingInEnv, k)
		}
	}
}

func (c *Checker) checkEnvDiff(r *Result) {
	if len(c.envFiles) < 2 {
		return
	}
	ref := c.envFiles[0]
	for i := 1; i < len(c.envFiles); i++ {
		other := c.envFiles[i]
		for k, rv := range ref.Vars {
			if ov, ok := other.Vars[k]; ok {
				if rv.Value != ov.Value {
					r.Diffs = append(r.Diffs, DiffEntry{
						Key:       k,
						Source:    ref.Path,
						SourceVal: c.masker.MaskValue(k, rv.Value),
						Target:    other.Path,
						TargetVal: c.masker.MaskValue(k, ov.Value),
					})
					r.Issues = append(r.Issues, Issue{
						Severity: SeverityInfo,
						Category: "value_diff",
						Key:      k,
						Message:  fmt.Sprintf("variable %q differs between %s and %s", k, ref.Path, other.Path),
						Source:   ref.Path,
						Target:   other.Path,
					})
				}
			}
		}
	}
}

func (c *Checker) checkEmptyValues(r *Result) {
	for _, ef := range c.envFiles {
		for k, v := range ef.Vars {
			if strings.TrimSpace(v.Value) == "" {
				r.Issues = append(r.Issues, Issue{
					Severity: SeverityWarning,
					Category: "empty_value",
					Key:      k,
					Message:  fmt.Sprintf("variable %q in %s has an empty value", k, ef.Path),
					Source:   ef.Path,
				})
			}
		}
	}
}

func (c *Checker) checkExtraInEnv(r *Result) {
	allExKeys := c.collectKeys(c.exampleFiles)
	for _, ef := range c.envFiles {
		for k := range ef.Vars {
			if _, ok := allExKeys[k]; !ok && len(c.exampleFiles) > 0 {
				r.Issues = append(r.Issues, Issue{
					Severity: SeverityWarning,
					Category: "extra_in_env",
					Key:      k,
					Message:  fmt.Sprintf("variable %q in %s is not defined in any example file (strict mode)", k, ef.Path),
					Source:   ef.Path,
				})
			}
		}
	}
}

func (c *Checker) collectKeys(files []*envfile.EnvFile) map[string]bool {
	keys := make(map[string]bool)
	for _, f := range files {
		for k := range f.Vars {
			keys[k] = true
		}
	}
	return keys
}

func SortKeys(m map[string]envfile.EnvVar) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return keys
}

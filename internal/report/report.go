package report

import (
	"encoding/json"
	"fmt"
	"io"
	"strings"

	"github.com/envcheck/envcheck/internal/checker"
)

type Formatter interface {
	Format(w io.Writer, result *checker.Result) error
}

type TextFormatter struct {
	Quiet   bool
	Verbose bool
}

type JSONFormatter struct {
	Indent bool
}

type CIFormatter struct{}

func NewFormatter(format string, quiet, verbose bool) Formatter {
	switch format {
	case "json":
		return &JSONFormatter{Indent: true}
	case "ci":
		return &CIFormatter{}
	default:
		return &TextFormatter{Quiet: quiet, Verbose: verbose}
	}
}

func (f *TextFormatter) Format(w io.Writer, r *checker.Result) error {
	fmt.Fprintf(w, "envcheck - Environment Variable Consistency Report\n")
	fmt.Fprintf(w, "%s\n", strings.Repeat("=", 52))
	fmt.Fprintf(w, "Env files:     %s\n", strings.Join(r.EnvFiles, ", "))
	if len(r.ExampleFiles) > 0 {
		fmt.Fprintf(w, "Example files: %s\n", strings.Join(r.ExampleFiles, ", "))
	}
	fmt.Fprintf(w, "Variables checked: %d\n", r.TotalChecked)
	fmt.Fprintf(w, "Issues found:      %d\n", r.TotalIssues)
	fmt.Fprintf(w, "%s\n", strings.Repeat("-", 52))

	if len(r.Issues) == 0 {
		fmt.Fprintf(w, "\n✓ All checks passed. No issues found.\n")
		return nil
	}

	fmt.Fprintf(w, "\nIssues:\n")
	for i, iss := range r.Issues {
		icon := severityIcon(iss.Severity)
		fmt.Fprintf(w, "  %s [%s] %s: %s", icon, iss.Severity, iss.Key, iss.Message)
		if f.Verbose && iss.Source != "" {
			fmt.Fprintf(w, " (source: %s", iss.Source)
			if iss.Target != "" {
				fmt.Fprintf(w, ", target: %s", iss.Target)
			}
			fmt.Fprintf(w, ")")
		}
		fmt.Fprintf(w, "\n")
		if f.Quiet && i >= 9 {
			remaining := len(r.Issues) - 10
			if remaining > 0 {
				fmt.Fprintf(w, "  ... and %d more issues (use --verbose to see all)\n", remaining)
			}
			break
		}
	}

	if len(r.Diffs) > 0 {
		fmt.Fprintf(w, "\nValue Differences:\n")
		for _, d := range r.Diffs {
			fmt.Fprintf(w, "  %s:\n    %s = %s\n    %s = %s\n", d.Key, d.Source, d.SourceVal, d.Target, d.TargetVal)
		}
	}

	if len(r.MissingInEnv) > 0 {
		fmt.Fprintf(w, "\nMissing in env files: %s\n", strings.Join(r.MissingInEnv, ", "))
	}
	if len(r.MissingInEx) > 0 {
		fmt.Fprintf(w, "Missing in example files: %s\n", strings.Join(r.MissingInEx, ", "))
	}

	return nil
}

func (f *JSONFormatter) Format(w io.Writer, r *checker.Result) error {
	enc := json.NewEncoder(w)
	if f.Indent {
		enc.SetIndent("", "  ")
	}
	return enc.Encode(r)
}

func (f *CIFormatter) Format(w io.Writer, r *checker.Result) error {
	for _, iss := range r.Issues {
		level := "error"
		if iss.Severity == checker.SeverityWarning {
			level = "warning"
		} else if iss.Severity == checker.SeverityInfo {
			level = "info"
		}
		loc := ""
		if iss.Source != "" {
			loc = fmt.Sprintf("::%s", iss.Source)
			if iss.Target != "" {
				loc += fmt.Sprintf("::%s", iss.Target)
			}
		}
		fmt.Fprintf(w, "::%s%s::%s [%s] %s\n", level, loc, iss.Key, iss.Category, iss.Message)
	}

	if r.HasErrors {
		fmt.Fprintf(w, "::error::envcheck found %d error(s)\n", countBySeverity(r, checker.SeverityError))
	}
	if r.HasWarnings {
		fmt.Fprintf(w, "::warning::envcheck found %d warning(s)\n", countBySeverity(r, checker.SeverityWarning))
	}

	return nil
}

func severityIcon(s checker.Severity) string {
	switch s {
	case checker.SeverityError:
		return "✗"
	case checker.SeverityWarning:
		return "⚠"
	case checker.SeverityInfo:
		return "ℹ"
	default:
		return "·"
	}
}

func countBySeverity(r *checker.Result, s checker.Severity) int {
	count := 0
	for _, iss := range r.Issues {
		if iss.Severity == s {
			count++
		}
	}
	return count
}

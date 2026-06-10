package cli

import (
	"fmt"
	"os"
	"strings"
	"time"
)

type ExitCode int

const (
	ExitSuccess         ExitCode = 0
	ExitInvalidArgs     ExitCode = 2
	ExitFileError       ExitCode = 3
	ExitParseError      ExitCode = 4
	ExitNoResults       ExitCode = 5
	ExitInternalError   ExitCode = 1
	ExitErrorsFound     ExitCode = 99
)

type OutputFormat string

const (
	FormatText OutputFormat = "text"
	FormatJSON OutputFormat = "json"
)

type Config struct {
	Inputs       []string
	Since        time.Duration
	SinceTime    time.Time
	UntilTime    time.Time
	Services     []string
	Levels       []string
	Environments []string
	RequestIDs   []string
	Output       string
	Format       OutputFormat
	TopN         int
	Context      int
	Clusters     bool
	OnlyErrors   bool
	Verbose      bool
	Quiet        bool
	VersionFlag  bool
	HelpFlag     bool
	FailOnError  bool
	JSONFlag     bool
}

func DefaultConfig() *Config {
	return &Config{
		Inputs:       nil,
		Since:        0,
		SinceTime:    time.Time{},
		UntilTime:    time.Time{},
		Services:     nil,
		Levels:       nil,
		Environments: nil,
		RequestIDs:   nil,
		Output:       "",
		Format:       FormatText,
		TopN:         10,
		Context:      2,
		Clusters:     true,
		OnlyErrors:   true,
		Verbose:      false,
		Quiet:        false,
		VersionFlag:  false,
		HelpFlag:     false,
		FailOnError:  false,
		JSONFlag:     false,
	}
}

type ArgumentError struct {
	Flag    string
	Message string
	Err     error
}

func (e *ArgumentError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("invalid argument --%s: %s: %v", e.Flag, e.Message, e.Err)
	}
	return fmt.Sprintf("invalid argument --%s: %s", e.Flag, e.Message)
}

func (c *Config) Validate() error {
	if len(c.Inputs) == 0 {
		return &ArgumentError{
			Flag:    "inputs",
			Message: "at least one log file or '-' for stdin is required",
		}
	}
	if c.TopN <= 0 {
		return &ArgumentError{
			Flag:    "top",
			Message: "must be a positive integer",
		}
	}
	if c.Context < 0 {
		return &ArgumentError{
			Flag:    "context",
			Message: "must be a non-negative integer",
		}
	}
	if !c.SinceTime.IsZero() && !c.UntilTime.IsZero() && c.SinceTime.After(c.UntilTime) {
		return &ArgumentError{
			Flag:    "since",
			Message: "--since must be before --until",
		}
	}
	fmts := map[OutputFormat]bool{FormatText: true, FormatJSON: true}
	if !fmts[c.Format] {
		return &ArgumentError{
			Flag:    "format",
			Message: fmt.Sprintf("unsupported format %q, must be one of: text, json", c.Format),
		}
	}
	return nil
}

func (c *Config) ComputeSince(reference time.Time) time.Time {
	if !c.SinceTime.IsZero() {
		return c.SinceTime
	}
	if c.Since > 0 {
		return reference.Add(-c.Since)
	}
	return time.Time{}
}

func (c *Config) EffectiveInputs() ([]string, bool) {
	hasStdin := false
	files := make([]string, 0, len(c.Inputs))
	for _, in := range c.Inputs {
		if in == "-" {
			hasStdin = true
		} else {
			files = append(files, in)
		}
	}
	return files, hasStdin
}

func HasStdinData() bool {
	fi, err := os.Stdin.Stat()
	if err != nil {
		return false
	}
	return (fi.Mode() & os.ModeCharDevice) == 0
}

type commaList []string

func (c *commaList) String() string     { return strings.Join(*c, ",") }
func (c *commaList) Set(v string) error { *c = append(*c, strings.Split(v, ",")...); return nil }

type durationValue struct{ d *time.Duration }

func (d durationValue) String() string   { return d.d.String() }
func (d durationValue) Set(s string) error {
	du, err := ParseDuration(s)
	if err != nil {
		return err
	}
	*d.d = du
	return nil
}

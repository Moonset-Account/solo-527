package main

import (
	"bytes"
	"fmt"
	"os"
	"time"

	"logsum/internal/cluster"
	"logsum/internal/config"
	"logsum/internal/filter"
	"logsum/internal/output"
	"logsum/internal/parser"
	"logsum/internal/types"
)

func main() {
	noColor := hasArg("--no-color") || hasArg("LOGSUM_NO_COLOR")
	jsonOut := hasArg("--json")
	ciMode := hasArg("--ci") || hasArg("LOGSUM_CI")

	exitCode, err := run()
	if err != nil {
		formatter := output.New(noColor, false, jsonOut, ciMode, os.Stderr)
		if procErr, ok := err.(*types.ProcessError); ok {
			formatter.WriteError(procErr)
		} else {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		}
	}
	os.Exit(exitCode)
}

func hasArg(arg string) bool {
	for _, a := range os.Args {
		if a == arg {
			return true
		}
	}
	if os.Getenv(arg) != "" {
		return true
	}
	return false
}

func run() (int, error) {
	startTime := time.Now()

	cfg, err := config.Load()
	if err != nil {
		return types.ExitCodeConfigError, err
	}

	formatter := output.New(cfg.NoColor, cfg.Verbose, cfg.OutputJSON, cfg.CIOutput, os.Stdout)

	if cfg.Verbose {
		fmt.Fprintf(os.Stderr, "[DEBUG] Input paths: %v\n", cfg.InputPaths)
		fmt.Fprintf(os.Stderr, "[DEBUG] Time range: %v to %v\n", cfg.Since, cfg.Until)
		fmt.Fprintf(os.Stderr, "[DEBUG] Services filter: %v\n", cfg.Services)
		fmt.Fprintf(os.Stderr, "[DEBUG] Request IDs filter: %v\n", cfg.RequestIDs)
		fmt.Fprintf(os.Stderr, "[DEBUG] Environment: %s\n", cfg.Environment)
		fmt.Fprintf(os.Stderr, "[DEBUG] Top N: %d\n", cfg.TopN)
		fmt.Fprintf(os.Stderr, "[DEBUG] JSON output: %v\n", cfg.OutputJSON)
		fmt.Fprintf(os.Stderr, "[DEBUG] Context lines: %d\n", cfg.ContextLines)
	}

	logParser := parser.New(cfg.Verbose)

	entries, err := logParser.ParsePaths(cfg.InputPaths)
	if err != nil {
		return types.ExitCodeInputError, err
	}

	if cfg.Verbose {
		fmt.Fprintf(os.Stderr, "[DEBUG] Parsed %d log entries\n", len(entries))
	}

	logFilter := filter.New(
		cfg.Levels,
		cfg.Services,
		cfg.RequestIDs,
		cfg.Environment,
		cfg.Since,
		cfg.Until,
	)

	filteredEntries := logFilter.Apply(entries)

	if cfg.Verbose {
		fmt.Fprintf(os.Stderr, "[DEBUG] Filtered to %d entries\n", len(filteredEntries))
		if len(filteredEntries) == 0 {
			fmt.Fprintf(os.Stderr, "[DEBUG] Warning: No entries matched filter criteria\n")
		}
	}

	if len(filteredEntries) == 0 {
		report := cluster.BuildReport(
			filteredEntries,
			[]types.ErrorCluster{},
			cfg.TopN,
			logFilter.GetFilteredServices(),
			logFilter.GetTimeRange(),
		)

		if err := writeOutput(formatter, report, cfg.OutputPath); err != nil {
			return types.ExitCodeOutputError, err
		}

		if cfg.CIOutput {
			return types.ExitCodeNoData, nil
		}
		return types.ExitCodeSuccess, nil
	}

	clusterer := cluster.New(cfg.MinClusterSize, cfg.ContextLines)
	clusters := clusterer.Cluster(filteredEntries)

	if cfg.Verbose {
		fmt.Fprintf(os.Stderr, "[DEBUG] Generated %d error clusters\n", len(clusters))
	}

	report := cluster.BuildReport(
		filteredEntries,
		clusters,
		cfg.TopN,
		logFilter.GetFilteredServices(),
		logFilter.GetTimeRange(),
	)

	if err := writeOutput(formatter, report, cfg.OutputPath); err != nil {
		return types.ExitCodeOutputError, err
	}

	if cfg.Verbose {
		fmt.Fprintf(os.Stderr, "[DEBUG] Processing completed in %v\n", time.Since(startTime))
	}

	exitCode := types.ExitCodeSuccess
	if cfg.CIOutput {
		if report.ErrorEntries > 0 {
			exitCode = types.ExitCodeHasErrors
		} else if len(filteredEntries) == 0 {
			exitCode = types.ExitCodeNoData
		}
	}

	return exitCode, nil
}

func writeOutput(formatter *output.Formatter, report types.SummaryReport, outputPath string) error {
	if outputPath != "" {
		var buf bytes.Buffer
		fileFormatter := output.New(true, true, formatter.JSONOutput(), false, &buf)
		if err := fileFormatter.WriteReport(report); err != nil {
			return &types.ProcessError{
				Code:       "OUTPUT_WRITE_ERROR",
				Message:    fmt.Sprintf("Failed to generate output: %v", err),
				Suggestion: "Check output file path permissions",
			}
		}
		if err := output.WriteToFile(outputPath, buf.String()); err != nil {
			return &types.ProcessError{
				Code:       "FILE_WRITE_ERROR",
				Message:    fmt.Sprintf("Failed to write output file %s: %v", outputPath, err),
				Suggestion: "Check that the output directory exists and is writable",
				Details:    map[string]interface{}{"path": outputPath},
			}
		}
	}

	return formatter.WriteReport(report)
}

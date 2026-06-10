package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/backend-ops/logsum/internal/cli"
	"github.com/backend-ops/logsum/internal/core"
	"github.com/backend-ops/logsum/internal/logger"
	"github.com/backend-ops/logsum/internal/report"
	"github.com/backend-ops/logsum/internal/rollback"
)

func main() {
	code := run(os.Args[1:])
	os.Exit(int(code))
}

func run(args []string) cli.ExitCode {
	log := logger.Default()

	cfg, err := cli.ParseArgs(args, os.Stderr)
	if err != nil {
		fmt.Fprintf(os.Stderr, "错误: %v\n\n尝试 'logsum --help' 获取帮助。\n", err)
		return cli.ExitInvalidArgs
	}

	if cfg.HelpFlag {
		fmt.Fprint(os.Stdout, cli.FullHelpText())
		return cli.ExitSuccess
	}
	if cfg.VersionFlag {
		fmt.Fprint(os.Stdout, cli.VersionText())
		return cli.ExitSuccess
	}

	if cfg.Verbose {
		log.SetVerbose()
	} else if cfg.Quiet {
		log.SetQuiet()
	}

	if len(cfg.Inputs) == 0 && cli.HasStdinData() {
		cfg.Inputs = append(cfg.Inputs, "-")
	}
	if err := cfg.Validate(); err != nil {
		fmt.Fprintf(os.Stderr, "错误: %v\n\n尝试 'logsum --help' 获取帮助。\n", err)
		return cli.ExitInvalidArgs
	}

	var rollLog *rollback.Log
	if rollDir := os.Getenv("LOGSUM_ROLLBACK_DIR"); rollDir != "" || cfg.Output != "" {
		rl, err := rollback.NewLog(strings.Join(os.Args[1:], " "), os.Getenv("LOGSUM_ROLLBACK_DIR"))
		if err == nil {
			rollLog = rl
			defer func() { _ = rl.Save() }()
		}
	}

	files, hasStdin := cfg.EffectiveInputs()

	filterOpts := core.BuildFilterOptions(
		cfg.Services, cfg.Levels, cfg.Environments, cfg.RequestIDs,
		cfg.OnlyErrors, cfg.ComputeSince(nowOrZero()), cfg.UntilTime,
	)

	var progressOut *logger.Logger
	if cfg.Verbose {
		progressOut = log
	} else {
		progressOut = logger.New(nopWriter{}, logger.LevelError, "")
	}

	proc := core.NewProcessor(os.Stderr, cfg.Verbose)
	stats, err := proc.Run(core.RunOpts{
		Files:      files,
		HasStdin:   hasStdin,
		Filter:     filterOpts,
		SinceRel:   cfg.Since,
		TopN:       cfg.TopN,
		Context:    cfg.Context,
		DoCluster:  cfg.Clusters,
		MaxSamples: 5,
	})
	if err != nil {
		if rollLog != nil {
			if errs := rollLog.RevertAll(); len(errs) > 0 {
				for _, e := range errs {
					logger.Errorf("rollback: %v", e)
				}
			}
		}
		if strings.Contains(err.Error(), "open ") || strings.Contains(err.Error(), "stat ") {
			fmt.Fprintf(os.Stderr, "文件错误: %v\n", err)
			return cli.ExitFileError
		}
		fmt.Fprintf(os.Stderr, "处理错误: %v\n", err)
		return cli.ExitInternalError
	}

	if stats.MatchedEntries == 0 {
		if !cfg.Quiet {
			fmt.Fprintln(os.Stderr, "提示: 没有匹配的日志条目。")
			fmt.Fprintln(os.Stderr, "  - 尝试 --errors-only=false 查看全部级别")
			fmt.Fprintln(os.Stderr, "  - 调整 --since、--service、--level 过滤器")
		}
	}

	outputTarget := os.Stdout
	backupPath := ""
	if cfg.Output != "" {
		if fi, err := os.Stat(cfg.Output); err == nil && !fi.IsDir() {
			backupPath = cfg.Output + ".bak"
			if err := os.Rename(cfg.Output, backupPath); err != nil {
				fmt.Fprintf(os.Stderr, "警告: 无法备份输出文件 %s: %v\n", cfg.Output, err)
				backupPath = ""
			}
		}
		dir := filepath.Dir(cfg.Output)
		if dir != "" && dir != "." {
			if err := os.MkdirAll(dir, 0o755); err != nil {
				fmt.Fprintf(os.Stderr, "创建输出目录失败: %v\n", err)
				return cli.ExitFileError
			}
		}
		fh, err := os.OpenFile(cfg.Output, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0o644)
		if err != nil {
			fmt.Fprintf(os.Stderr, "打开输出文件失败: %v\n", err)
			if backupPath != "" {
				_ = os.Rename(backupPath, cfg.Output)
			}
			return cli.ExitFileError
		}
		defer fh.Close()
		outputTarget = fh
		if rollLog != nil {
			rollLog.CreateWriteAction(cfg.Output, backupPath, backupPath != "")
		}
		_ = progressOut
	}

	switch cfg.Format {
	case cli.FormatJSON:
		if err := report.RenderJSON(outputTarget, stats, cli.Version); err != nil {
			fmt.Fprintf(os.Stderr, "生成 JSON 报告失败: %v\n", err)
			return cli.ExitInternalError
		}
	default:
		if err := report.RenderText(outputTarget, stats); err != nil {
			fmt.Fprintf(os.Stderr, "生成文本报告失败: %v\n", err)
			return cli.ExitInternalError
		}
	}

	if cfg.FailOnError && stats.MatchedErrorCount > 0 {
		return cli.ExitErrorsFound
	}
	if stats.MatchedEntries == 0 {
		return cli.ExitNoResults
	}
	return cli.ExitSuccess
}

func nowOrZero() time.Time {
	return time.Now()
}

type nopWriter struct{}

func (nopWriter) Write(p []byte) (int, error) { return len(p), nil }

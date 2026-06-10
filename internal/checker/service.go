package checker

import (
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"github.com/devops/envcheck/internal/config"
	"github.com/devops/envcheck/internal/diffengine"
	"github.com/devops/envcheck/internal/logger"
	"github.com/devops/envcheck/internal/masker"
	"github.com/devops/envcheck/internal/parser"
	"github.com/devops/envcheck/internal/types"
)

type Service struct {
	cfg     *types.CheckConfig
	masker  *masker.Masker
	diffEng *diffengine.Engine
}

func New(cfg *types.CheckConfig) *Service {
	return &Service{
		cfg:     cfg,
		masker:  masker.New(cfg),
		diffEng: diffengine.New(cfg),
	}
}

func (s *Service) RunCheck() (*types.CheckResult, error) {
	start := time.Now()
	result := &types.CheckResult{
		Timestamp: start,
		Status:    "running",
	}

	logger.Debug("starting environment consistency check",
		logger.F("env_paths", strings.Join(s.cfg.EnvPaths, ",")),
		logger.F("example_path", s.cfg.ExamplePath),
		logger.F("required_vars", len(s.cfg.RequiredVars)),
	)

	envFilePaths, err := parser.FindEnvFiles(s.cfg.EnvPaths)
	if err != nil {
		logger.Error("failed to find env files", logger.F("error", err))
		return nil, err
	}
	logger.Debug("resolved env file paths", logger.F("count", len(envFilePaths)))

	envFiles, parseErr := parser.ParseFiles(envFilePaths)
	if parseErr != nil {
		logger.Warn("some env files failed to parse", logger.F("error", parseErr))
	}

	var exampleFile *types.EnvFile
	if s.cfg.ExamplePath != "" {
		ef, err := parser.ParseFile(s.cfg.ExamplePath)
		if err != nil {
			logger.Error("failed to parse example file", logger.F("error", err))
			return nil, fmt.Errorf("example file parse error: %w", err)
		}
		exampleFile = ef
		logger.Debug("example file loaded",
			logger.F("path", ef.Path),
			logger.F("vars", len(ef.Vars)))

		autoRequired := parser.DetectRequiredVars(exampleFile.Vars)
		if len(autoRequired) > 0 {
			already := map[string]bool{}
			for _, r := range s.cfg.RequiredVars {
				already[r] = true
			}
			for _, r := range autoRequired {
				if !already[r] {
					s.cfg.RequiredVars = append(s.cfg.RequiredVars, r)
				}
			}
			logger.Debug("auto-detected required vars from example comments",
				logger.F("count", len(autoRequired)))
		}
	}

	mergedVars := parser.MergeEnvFiles(envFiles)
	logger.Debug("merged environment variables", logger.F("count", len(mergedVars)))

	var diffs []types.DiffItem
	var missing []types.MissingVar
	var extra []string

	if exampleFile != nil {
		diffs, missing, extra = s.diffEng.CompareAgainstExample(
			mergedVars, exampleFile, s.cfg.RequiredVars)
		logger.Debug("example comparison complete",
			logger.F("diffs", len(diffs)),
			logger.F("missing", len(missing)),
			logger.F("extra", len(extra)))
	} else if len(envFiles) >= 2 {
		base := envFiles[0]
		for _, target := range envFiles[1:] {
			fileDiffs := s.diffEng.CompareTwo(base, target)
			diffs = append(diffs, fileDiffs...)
		}
		logger.Debug("multi-file comparison complete",
			logger.F("base", base.Label),
			logger.F("diffs", len(diffs)))
	}

	s.masker.MaskEnvFiles(envFiles)
	diffs = s.masker.MaskDiffs(diffs)
	logger.Debug("sensitive values masked")

	for i := range missing {
		if s.masker.ShouldMask(missing[i].Key) {
			missing[i].Example = s.masker.MaskValue(missing[i].Example)
		}
	}

	convertedEnvFiles := make([]types.EnvFile, 0, len(envFiles))
	for _, ef := range envFiles {
		convertedEnvFiles = append(convertedEnvFiles, *ef)
	}
	result.EnvFiles = convertedEnvFiles

	result.Diffs = diffs
	result.Missing = missing
	result.Extra = extra
	result.Summary = diffengine.ComputeSummary(envFiles, diffs, missing)

	exitCode := s.diffEng.ComputeExitCode(diffs, missing)
	result.ExitCode = exitCode

	if exitCode == 0 {
		result.Status = "pass"
	} else {
		result.Status = "fail"
	}

	cfgSources := []string{}
	if s.cfg.ConfigPath != "" {
		abs, _ := filepath.Abs(s.cfg.ConfigPath)
		result.ConfigUsed = abs
	}
	result.ConfigSources = append(result.ConfigSources, cfgSources...)

	logger.Debug("check completed",
		logger.F("status", result.Status),
		logger.F("exit_code", exitCode),
		logger.F("duration_ms", time.Since(start).Milliseconds()))

	return result, nil
}

func (s *Service) RunCompare() (*types.CheckResult, error) {
	if s.cfg.CompareBase == "" {
		return nil, fmt.Errorf("--compare-base is required for compare command")
	}
	if len(s.cfg.CompareTargets) == 0 {
		return nil, fmt.Errorf("at least one compare target is required")
	}

	start := time.Now()
	result := &types.CheckResult{
		Timestamp: start,
		Status:    "running",
	}

	baseFile, err := parser.ParseFile(s.cfg.CompareBase)
	if err != nil {
		return nil, fmt.Errorf("failed to parse base file: %w", err)
	}
	logger.Debug("base file loaded", logger.F("path", baseFile.Path))

	diffs := []types.DiffItem{}
	envFiles := []types.EnvFile{}

	envFiles = append(envFiles, *baseFile)

	for _, targetPath := range s.cfg.CompareTargets {
		targetFile, err := parser.ParseFile(targetPath)
		if err != nil {
			logger.Warn("failed to parse target file",
				logger.F("path", targetPath),
				logger.F("error", err))
			continue
		}
		envFiles = append(envFiles, *targetFile)

		fileDiffs := s.diffEng.CompareTwo(baseFile, targetFile)
		for i := range fileDiffs {
			if fileDiffs[i].LeftSource == baseFile.Label {
				fileDiffs[i].LeftSource = filepath.Base(s.cfg.CompareBase)
			}
			if fileDiffs[i].RightSource == targetFile.Label {
				fileDiffs[i].RightSource = filepath.Base(targetPath)
			}
		}
		diffs = append(diffs, fileDiffs...)
	}

	s.masker.MaskDiffs(diffs)
	for i := range envFiles {
		s.masker.MaskEnvFile(&envFiles[i])
	}

	result.EnvFiles = envFiles
	result.Diffs = diffs
	result.Summary = diffengine.ComputeSummary(
		convertToPointers(envFiles), diffs, nil)

	exitCode := s.diffEng.ComputeExitCode(diffs, nil)
	result.ExitCode = exitCode

	if exitCode == 0 {
		result.Status = "pass"
	} else {
		result.Status = "fail"
	}

	return result, nil
}

func (s *Service) RunValidate() (*types.CheckResult, error) {
	if len(s.cfg.RequiredVars) == 0 && s.cfg.ExamplePath == "" {
		return nil, fmt.Errorf("validation requires --required-vars or --example-path")
	}

	return s.RunCheck()
}

func (s *Service) RunList() (*types.CheckResult, error) {
	result, err := s.RunCheck()
	if err != nil {
		return nil, err
	}
	return result, nil
}

func convertToPointers(files []types.EnvFile) []*types.EnvFile {
	ptrs := make([]*types.EnvFile, len(files))
	for i := range files {
		ptrs[i] = &files[i]
	}
	return ptrs
}

func GetConfigInfo(cfg *types.CheckConfig, sources []string) string {
	info := "配置优先级（高→低）:\n"
	info += "  1. 命令行参数 (CLI flags)\n"
	info += "  2. 环境变量 (ENVCHECK_*)\n"
	info += "  3. 配置文件 (envcheck.yaml / 指定 --config)\n"
	info += "  4. 内置默认值\n\n"

	if len(sources) > 0 {
		info += "实际配置来源:\n"
		for i, src := range sources {
			info += fmt.Sprintf("  %d. %s\n", i+1, src)
		}
	} else {
		info += "使用内置默认配置\n"
	}

	cfgJSON, _ := config.ConfigToJSON(cfg)
	info += "\n当前生效配置:\n" + cfgJSON + "\n"

	return info
}

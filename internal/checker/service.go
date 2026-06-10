package checker

import (
	"fmt"
	"path/filepath"
	"sort"
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
		Timestamp:   start,
		Status:      "running",
		FileResults: []types.FileResult{},
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

	convertedEnvFiles := make([]types.EnvFile, 0, len(envFiles))
	overallDiffs := []types.DiffItem{}
	overallMissing := []types.MissingVar{}
	overallExtra := []string{}
	overallExitCode := 0
	seenMissing := map[string]bool{}
	seenExtra := map[string]bool{}

	missingSet := map[string]types.MissingVar{}
	extraSet := map[string]bool{}

	for _, envFile := range envFiles {
		singleFileMasked := *envFile
		s.masker.MaskEnvFile(&singleFileMasked)
		convertedEnvFiles = append(convertedEnvFiles, singleFileMasked)

		fileVarMap := map[string]types.EnvVar{}
		for _, v := range envFile.Vars {
			fileVarMap[v.Key] = v
		}

		var fileDiffs []types.DiffItem
		var fileMissing []types.MissingVar
		var fileExtra []string

		if exampleFile != nil {
			fileDiffs, fileMissing, fileExtra = s.diffEng.CompareAgainstExample(
				fileVarMap, exampleFile, s.cfg.RequiredVars)
		} else if len(envFiles) >= 2 {
			firstFile := envFiles[0]
			if envFile.Path != firstFile.Path {
				fileDiffs = s.diffEng.CompareTwo(firstFile, envFile)
			}
		}

		s.masker.MaskDiffs(fileDiffs)
		for i := range fileMissing {
			if s.masker.ShouldMask(fileMissing[i].Key) {
				fileMissing[i].Example = s.masker.MaskValue(fileMissing[i].Example)
			}
		}

		fileExitCode := s.diffEng.ComputeExitCode(fileDiffs, fileMissing)
		overallExitCode |= fileExitCode

		fileSummary := diffengine.ComputeSummary(
			[]*types.EnvFile{envFile}, fileDiffs, fileMissing)

		fileStatus := "pass"
		if fileExitCode != 0 {
			fileStatus = "fail"
		}

		fr := types.FileResult{
			EnvFile:  singleFileMasked,
			Diffs:    fileDiffs,
			Missing:  fileMissing,
			Extra:    fileExtra,
			Summary:  fileSummary,
			ExitCode: fileExitCode,
			Status:   fileStatus,
		}
		result.FileResults = append(result.FileResults, fr)

		for _, d := range fileDiffs {
			overallDiffs = append(overallDiffs, d)
		}
		for _, m := range fileMissing {
			if _, ok := missingSet[m.Key]; !ok {
				missingSet[m.Key] = m
			}
			if !seenMissing[m.Key] {
				seenMissing[m.Key] = true
				overallMissing = append(overallMissing, m)
			}
		}
		for _, e := range fileExtra {
			extraSet[e] = true
			if !seenExtra[e] {
				seenExtra[e] = true
				overallExtra = append(overallExtra, e)
			}
		}
	}

	s.masker.MaskEnvFiles(envFiles)
	overallDiffs = s.masker.MaskDiffs(overallDiffs)

	result.EnvFiles = convertedEnvFiles
	result.Diffs = overallDiffs
	result.Missing = overallMissing
	result.Extra = overallExtra

	summaryPointers := make([]*types.EnvFile, 0, len(envFiles))
	for i := range envFiles {
		summaryPointers = append(summaryPointers, envFiles[i])
	}
	result.Summary = diffengine.ComputeSummary(summaryPointers, overallDiffs, overallMissing)

	result.ExitCode = overallExitCode
	if overallExitCode == 0 {
		result.Status = "pass"
	} else {
		result.Status = "fail"
	}

	if s.cfg.ConfigPath != "" {
		abs, _ := filepath.Abs(s.cfg.ConfigPath)
		result.ConfigUsed = abs
	}

	logger.Debug("check completed",
		logger.F("status", result.Status),
		logger.F("files_checked", len(result.FileResults)),
		logger.F("files_failed", s.countFailedFiles(result.FileResults)),
		logger.F("exit_code", overallExitCode),
		logger.F("duration_ms", time.Since(start).Milliseconds()))

	return result, nil
}

func (s *Service) countFailedFiles(results []types.FileResult) int {
	n := 0
	for _, r := range results {
		if r.ExitCode != 0 {
			n++
		}
	}
	return n
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

func formatValue(v interface{}) string {
	if sv, ok := v.([]string); ok {
		if len(sv) == 0 {
			return "[]"
		}
		return "[" + strings.Join(sv, ", ") + "]"
	}
	if sv, ok := v.(string); ok {
		if sv == "" {
			return `""`
		}
		return sv
	}
	return fmt.Sprintf("%v", v)
}

func GetConfigInfo(cfg *types.CheckConfig, sources []string, layers []config.ConfigLayer) string {
	var b strings.Builder
	sep := strings.Repeat("═", 72)
	subSep := strings.Repeat("─", 72)

	b.WriteString("\n")
	b.WriteString(sep)
	b.WriteString("\n  ⚙️  配置展示\n")
	b.WriteString(sep)
	b.WriteString("\n\n")

	b.WriteString("  🎯 配置优先级（高 → 低）:\n")
	b.WriteString("    1. 命令行参数 (CLI flags)\n")
	b.WriteString("    2. 环境变量 (ENVCHECK_*)\n")
	b.WriteString("    3. 配置文件 profiles.<name> 覆盖\n")
	b.WriteString("    4. 配置文件 check 节\n")
	b.WriteString("    5. 内置默认值\n")

	if len(sources) > 0 {
		b.WriteString("\n  📥 实际配置来源:\n")
		for i, src := range sources {
			b.WriteString(fmt.Sprintf("    %d. %s\n", i+1, src))
		}
	} else {
		b.WriteString("\n  📥 实际配置来源: 使用内置默认配置\n")
	}

	if len(layers) > 0 {
		b.WriteString("\n  ")
		b.WriteString(subSep)
		b.WriteString("\n  🔍 逐层覆盖关系（字段变更）:\n")
		b.WriteString(fmt.Sprintf("  （共 %d 层，自底向上生效）\n", len(layers)))

		for li, layer := range layers {
			b.WriteString(fmt.Sprintf("\n  %s [%d/%d] \033[1m%s\033[0m\n", subSep, li+1, len(layers), layer.Name))
			b.WriteString(fmt.Sprintf("    变更 %d 个字段:\n", len(layer.Changes)))

			keys := make([]string, 0, len(layer.Changes))
			for k := range layer.Changes {
				keys = append(keys, k)
			}
			sort.Strings(keys)

			for _, key := range keys {
				chg := layer.Changes[key]
				if chgMap, ok := chg.(map[string]interface{}); ok {
					before := formatValue(chgMap["before"])
					after := formatValue(chgMap["after"])
					b.WriteString(fmt.Sprintf("      \033[36m%-28s\033[0m  \033[31m%s\033[0m → \033[32m%s\033[0m\n",
						key, before, after))
				}
			}
		}
		b.WriteString(fmt.Sprintf("\n  %s\n", subSep))
	}

	b.WriteString("\n  📄 当前生效配置:\n")
	cfgJSON, _ := config.ConfigToJSON(cfg)
	b.WriteString("  ")
	b.WriteString(strings.ReplaceAll(cfgJSON, "\n", "\n  "))
	b.WriteString("\n\n")
	b.WriteString(sep)
	b.WriteString("\n")

	return b.String()
}

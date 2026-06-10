package cli

import (
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/devops/envcheck/internal/checker"
	"github.com/devops/envcheck/internal/config"
	"github.com/devops/envcheck/internal/logger"
	"github.com/devops/envcheck/internal/output"
	"github.com/devops/envcheck/internal/types"
	"github.com/spf13/cobra"
)

type CLI struct {
	rootCmd    *cobra.Command
	configPath string
	profile    string

	envPaths       []string
	examplePath    string
	requiredVars   []string
	maskKeys       []string
	maskAll        bool
	maskChar       string
	maskKeepStart  int
	maskKeepEnd    int
	ci             bool
	jsonOutput     bool
	strict         bool
	warnOnExtra    bool
	failOnMismatch bool
	failOnMissing  bool
	verbose        bool
	quiet          bool
	logLevel       string

	compareBase    string
	compareTargets []string
}

func New() *CLI {
	cli := &CLI{}
	cli.buildRoot()
	return cli
}

func (c *CLI) buildRoot() {
	c.rootCmd = &cobra.Command{
		Use:   "envcheck",
		Short: "环境变量一致性检查工具",
		Long: `envcheck 是一个环境变量一致性检查工具，用于确保多个部署环境、
示例配置文件和实际环境之间的变量定义保持一致。

功能特性:
  • 对比 .env 文件与示例配置的差异
  • 检测缺失的必填变量和多余变量
  • 自动遮蔽敏感值（PASSWORD/SECRET/TOKEN/KEY 等）
  • CI/CD 集成支持（GitHub Actions, GitLab CI）
  • 结构化 JSON 输出
  • 配置文件、环境变量、命令行参数三级优先级

配置优先级（高→低）:
  1. 命令行参数
  2. 环境变量 (ENVCHECK_*)
  3. 配置文件 (envcheck.yaml)
  4. 内置默认值

环境变量:
  ENVCHECK_ENV_PATHS         环境文件路径（逗号分隔）
  ENVCHECK_EXAMPLE_PATH      示例配置文件路径
  ENVCHECK_REQUIRED_VARS     必填变量（逗号分隔）
  ENVCHECK_MASK_KEYS         额外遮蔽的变量名
  ENVCHECK_MASK_ALL          遮蔽所有值 (true/false)
  ENVCHECK_CI                CI 模式 (true/false)
  ENVCHECK_JSON              JSON 输出 (true/false)
  ENVCHECK_STRICT            严格模式 (true/false)
  ENVCHECK_VERBOSE           详细输出 (true/false)
  ENVCHECK_QUIET             静默模式 (true/false)
  ENVCHECK_LOG_LEVEL         日志级别 (debug/info/warn/error/silent)`,
		Example: `  # 基础：对比 .env 和 .env.example
  envcheck check --env .env --example .env.example

  # 对比多个环境文件
  envcheck check --env .env.dev,.env.staging,.env.prod --example .env.example

  # 使用通配符匹配
  envcheck check --env "configs/.env.*" --example .env.example

  # 强制 CI 模式 + JSON 输出
  envcheck check --env .env --example .env.example --ci --json

  # 遮蔽所有敏感值并严格校验
  envcheck check --env .env --example .env.example --mask-all --strict

  # 指定必填变量
  envcheck check --env .env --required-vars DB_HOST,DB_USER,DB_PASS

  # 对比两个环境文件的差异
  envcheck diff --base .env.prod --target .env.staging

  # 使用配置文件
  envcheck check --config envcheck.yaml --profile production

  # 显示当前配置来源
  envcheck config show --env .env --example .env.example`,
		SilenceUsage: true,
	}

	c.rootCmd.PersistentFlags().StringVar(&c.configPath, "config", "",
		"配置文件路径 (默认查找 ./envcheck.yaml, ./config/envcheck.yaml, $HOME/.envcheck/envcheck.yaml)")
	c.rootCmd.PersistentFlags().StringVar(&c.profile, "profile", "",
		"使用配置文件中的指定 profile")
	c.rootCmd.PersistentFlags().BoolVarP(&c.verbose, "verbose", "v", false,
		"详细输出模式")
	c.rootCmd.PersistentFlags().BoolVarP(&c.quiet, "quiet", "q", false,
		"静默模式，仅输出错误和结果")
	c.rootCmd.PersistentFlags().StringVar(&c.logLevel, "log-level", "info",
		"日志级别: debug, info, warn, error, silent")

	c.addCheckCmd()
	c.addDiffCmd()
	c.addListCmd()
	c.addValidateCmd()
	c.addConfigCmd()
	c.addVersionCmd()

	c.rootCmd.SetFlagErrorFunc(func(cmd *cobra.Command, err error) error {
		fmt.Fprintf(os.Stderr, "❌ 参数错误: %v\n\n", err)
		fmt.Fprintf(os.Stderr, "使用 '%s --help' 查看可用参数\n", cmd.CommandPath())
		return err
	})
}

func (c *CLI) addCommonCheckFlags(cmd *cobra.Command) {
	cmd.Flags().StringSliceVarP(&c.envPaths, "env", "e", []string{},
		"环境文件路径，可多次指定或逗号分隔 (支持通配符)")
	cmd.Flags().StringVarP(&c.examplePath, "example", "x", "",
		"示例配置文件路径 (.env.example)")
	cmd.Flags().StringSliceVar(&c.requiredVars, "required-vars", []string{},
		"必填变量列表，逗号分隔")
	cmd.Flags().StringSliceVar(&c.maskKeys, "mask", []string{},
		"额外需要遮蔽的变量名")
	cmd.Flags().BoolVar(&c.maskAll, "mask-all", false,
		"遮蔽所有变量值 (保守模式默认开启)")
	cmd.Flags().StringVar(&c.maskChar, "mask-char", "*",
		"遮蔽字符")
	cmd.Flags().IntVar(&c.maskKeepStart, "mask-keep-start", 2,
		"遮蔽时保留值开头字符数")
	cmd.Flags().IntVar(&c.maskKeepEnd, "mask-keep-end", 2,
		"遮蔽时保留值末尾字符数")
	cmd.Flags().BoolVar(&c.ci, "ci", false,
		"CI 模式，输出机器可读格式并写入 GITHUB_STEP_SUMMARY")
	cmd.Flags().BoolVar(&c.jsonOutput, "json", false,
		"输出 JSON 格式结果")
	cmd.Flags().BoolVar(&c.strict, "strict", false,
		"严格模式：多余变量视为错误 (默认: 警告)")
	cmd.Flags().BoolVar(&c.warnOnExtra, "warn-extra", true,
		"报告超出示例文件的变量 (默认: true)")
	cmd.Flags().BoolVar(&c.failOnMismatch, "fail-mismatch", true,
		"值不匹配时返回非零退出码 (默认: true)")
	cmd.Flags().BoolVar(&c.failOnMissing, "fail-missing", true,
		"必填变量缺失时返回非零退出码 (默认: true)")
}

func (c *CLI) addCheckCmd() {
	cmd := &cobra.Command{
		Use:   "check",
		Short: "执行环境变量一致性检查",
		Long: `执行完整的环境变量一致性检查。

对比实际环境文件与示例配置，检测：
  • 缺失的变量（区分必填/可选）
  • 值不匹配的变量
  • 超出示例定义的多余变量`,
		Example: `  # 最常用：检查 .env 是否符合 .env.example
  envcheck check -e .env -x .env.example

  # 检查所有环境配置
  envcheck check -e .env.dev,.env.staging,.env.prod -x .env.example

  # JSON 输出并通过管道传给 jq
  envcheck check -e .env -x .env.example --json | jq '.summary'

  # 仅检查必填变量（在 .env.example 中用 # required 标记）
  envcheck check -e .env -x .env.example --strict`,
		RunE: c.runCheck,
	}
	c.addCommonCheckFlags(cmd)
	c.rootCmd.AddCommand(cmd)
}

func (c *CLI) addDiffCmd() {
	cmd := &cobra.Command{
		Use:   "diff",
		Short: "对比两个或多个环境文件的差异",
		Long: `直接对比多个环境文件，找出变量之间的差异。

不依赖示例配置文件，用于多环境之间的横向对比。`,
		Example: `  # 对比生产和预发环境
  envcheck diff --base .env.prod --target .env.staging

  # 基准文件与多个目标对比
  envcheck diff --base .env.prod --target .env.staging,.env.dev

  # 遮蔽所有值 + JSON
  envcheck diff --base .env.prod --target .env.staging --mask-all --json`,
		RunE: c.runDiff,
	}
	cmd.Flags().StringVar(&c.compareBase, "base", "",
		"对比基准文件 (left side)")
	cmd.Flags().StringSliceVar(&c.compareTargets, "target", []string{},
		"对比目标文件，可多个 (right side)")
	cmd.Flags().StringSliceVar(&c.maskKeys, "mask", []string{},
		"额外需要遮蔽的变量名")
	cmd.Flags().BoolVar(&c.maskAll, "mask-all", false,
		"遮蔽所有变量值")
	cmd.Flags().StringVar(&c.maskChar, "mask-char", "*", "遮蔽字符")
	cmd.Flags().IntVar(&c.maskKeepStart, "mask-keep-start", 2, "遮蔽时保留开头字符数")
	cmd.Flags().IntVar(&c.maskKeepEnd, "mask-keep-end", 2, "遮蔽时保留末尾字符数")
	cmd.Flags().BoolVar(&c.ci, "ci", false, "CI 模式")
	cmd.Flags().BoolVar(&c.jsonOutput, "json", false, "JSON 输出")
	cmd.Flags().BoolVar(&c.strict, "strict", false, "严格模式")
	cmd.MarkFlagRequired("base")
	cmd.MarkFlagRequired("target")
	c.rootCmd.AddCommand(cmd)
}

func (c *CLI) addListCmd() {
	cmd := &cobra.Command{
		Use:   "list",
		Short: "列出环境文件中的所有变量",
		Long:  `解析并列出一个或多个环境文件中的变量，自动遮蔽敏感值。`,
		Example: `  # 列出 .env 中所有变量
  envcheck list -e .env

  # 详细输出（含行号、来源）
  envcheck list -e .env.dev,.env.prod -v

  # 完全不遮蔽（慎用）
  envcheck list -e .env --mask= --mask-keep-start=999`,
		RunE: c.runList,
	}
	c.addCommonCheckFlags(cmd)
	c.rootCmd.AddCommand(cmd)
}

func (c *CLI) addValidateCmd() {
	cmd := &cobra.Command{
		Use:   "validate",
		Short: "只验证必填变量是否存在",
		Long: `跳过值对比，只验证必填变量的存在性。

可通过 --required-vars 指定，或从 .env.example 的注释中自动检测。`,
		Example: `  # 验证 DB_* 变量存在
  envcheck validate -e .env --required-vars DB_HOST,DB_PORT,DB_USER

  # 从示例文件自动检测 required 标记
  envcheck validate -e .env -x .env.example`,
		RunE: c.runValidate,
	}
	c.addCommonCheckFlags(cmd)
	c.rootCmd.AddCommand(cmd)
}

func (c *CLI) addConfigCmd() {
	configCmd := &cobra.Command{
		Use:   "config",
		Short: "配置管理子命令",
		Long:  `查看当前生效的配置、配置来源和优先级。`,
	}

	showCmd := &cobra.Command{
		Use:   "show",
		Short: "显示当前生效的配置和来源",
		Long: `按优先级顺序显示所有配置的来源：
  1. 命令行参数
  2. 环境变量
  3. 配置文件
  4. 默认值

并输出最终合并后的配置内容（JSON 格式）。`,
		Example: `  # 显示默认配置
  envcheck config show

  # 结合命令行参数显示覆盖关系
  envcheck config show --env .env --ci --strict --mask-all

  # 配合配置文件
  envcheck config show --config envcheck.yaml --profile production`,
		RunE: c.runConfigShow,
	}
	c.addCommonCheckFlags(showCmd)
	configCmd.AddCommand(showCmd)

	initCmd := &cobra.Command{
		Use:   "init",
		Short: "在当前目录生成示例配置文件 envcheck.yaml",
		Long: `生成一个带有详细注释的 envcheck.yaml 示例文件，
包含所有可配置项及其默认值。`,
		Example: `  # 在当前目录生成配置文件
  envcheck config init

  # 指定输出路径
  envcheck config init --config ./config/envcheck.yaml`,
		RunE: c.runConfigInit,
	}
	configCmd.AddCommand(initCmd)

	c.rootCmd.AddCommand(configCmd)
}

func (c *CLI) addVersionCmd() {
	cmd := &cobra.Command{
		Use:   "version",
		Short: "显示版本信息",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Println("envcheck v1.0.0")
			fmt.Println("环境变量一致性检查工具")
			fmt.Println("https://github.com/devops/envcheck")
		},
	}
	c.rootCmd.AddCommand(cmd)
}

func (c *CLI) buildCheckConfigFromCLI() types.CheckConfig {
	cfg := config.DefaultConfig

	if len(c.envPaths) > 0 {
		cfg.EnvPaths = c.envPaths
	}
	if c.examplePath != "" {
		cfg.ExamplePath = c.examplePath
	}
	if len(c.requiredVars) > 0 {
		cfg.RequiredVars = c.requiredVars
	}
	if len(c.maskKeys) > 0 {
		cfg.MaskKeys = c.maskKeys
	}
	if c.maskAll {
		cfg.MaskAll = true
	}
	if c.maskChar != "" && c.maskChar != config.DefaultMaskChar {
		cfg.MaskChar = c.maskChar
	}
	if c.maskKeepStart != 0 {
		cfg.MaskKeepStart = c.maskKeepStart
	}
	if c.maskKeepEnd != 0 {
		cfg.MaskKeepEnd = c.maskKeepEnd
	}
	if c.ci {
		cfg.CI = true
	}
	if c.jsonOutput {
		cfg.JSON = true
	}
	if c.strict {
		cfg.Strict = true
	}
	if !c.warnOnExtra {
		cfg.WarnOnExtra = false
	}
	if !c.failOnMismatch {
		cfg.FailOnMismatch = false
	}
	if !c.failOnMissing {
		cfg.FailOnMissing = false
	}
	if c.verbose {
		cfg.Verbose = true
	}
	if c.quiet {
		cfg.Quiet = true
	}
	if c.logLevel != "" && c.logLevel != "info" {
		cfg.LogLevel = c.logLevel
	}
	if c.compareBase != "" {
		cfg.CompareBase = c.compareBase
	}
	if len(c.compareTargets) > 0 {
		cfg.CompareTargets = c.compareTargets
	}

	return cfg
}

func (c *CLI) loadConfig() (*types.CheckConfig, []string, error) {
	loader := config.NewLoader(c.configPath, c.profile)
	cliDefaults := c.buildCheckConfigFromCLI()
	loader.SetCLIDefaults(cliDefaults)
	return loader.Load()
}

func (c *CLI) setupLogging(cfg *types.CheckConfig) {
	level := logger.ParseLevel(cfg.LogLevel)
	if cfg.Verbose {
		level = logger.LevelDebug
	}
	if cfg.Quiet {
		level = logger.LevelSilent
	}
	logger.SetLevel(level)

	if cfg.JSON && !cfg.CI {
		logger.SetJSON(true)
	}
}

func (c *CLI) runCheck(cmd *cobra.Command, args []string) error {
	cfg, sources, err := c.loadConfig()
	if err != nil {
		return fmt.Errorf("配置加载失败: %w", err)
	}
	c.setupLogging(cfg)

	logger.Debug("configuration loaded",
		logger.F("sources", strings.Join(sources, "; ")))

	svc := checker.New(cfg)
	result, err := svc.RunCheck()
	if err != nil {
		return err
	}
	result.ConfigSources = sources

	writeResult(result, cfg)
	os.Exit(result.ExitCode)
	return nil
}

func (c *CLI) runDiff(cmd *cobra.Command, args []string) error {
	cfg, sources, err := c.loadConfig()
	if err != nil {
		return fmt.Errorf("配置加载失败: %w", err)
	}
	cfg.CompareBase = c.compareBase
	cfg.CompareTargets = c.compareTargets
	c.setupLogging(cfg)

	svc := checker.New(cfg)
	result, err := svc.RunCompare()
	if err != nil {
		return err
	}
	result.ConfigSources = sources

	writeResult(result, cfg)
	os.Exit(result.ExitCode)
	return nil
}

func (c *CLI) runList(cmd *cobra.Command, args []string) error {
	cfg, sources, err := c.loadConfig()
	if err != nil {
		return fmt.Errorf("配置加载失败: %w", err)
	}
	cfg.Verbose = true
	c.setupLogging(cfg)

	svc := checker.New(cfg)
	result, err := svc.RunList()
	if err != nil {
		return err
	}
	result.ConfigSources = sources
	result.ExitCode = 0
	result.Status = "pass"

	writeResult(result, cfg)
	return nil
}

func (c *CLI) runValidate(cmd *cobra.Command, args []string) error {
	cfg, sources, err := c.loadConfig()
	if err != nil {
		return fmt.Errorf("配置加载失败: %w", err)
	}
	cfg.FailOnMismatch = false
	c.setupLogging(cfg)

	svc := checker.New(cfg)
	result, err := svc.RunValidate()
	if err != nil {
		return err
	}
	result.ConfigSources = sources

	writeResult(result, cfg)
	os.Exit(result.ExitCode)
	return nil
}

func (c *CLI) runConfigShow(cmd *cobra.Command, args []string) error {
	loader := config.NewLoader(c.configPath, c.profile)
	cliDefaults := c.buildCheckConfigFromCLI()
	loader.SetCLIDefaults(cliDefaults)
	loader.SetSkipValidation(true)
	cfg, sources, err := loader.Load()
	if err != nil {
		return fmt.Errorf("配置加载失败: %w", err)
	}

	info := checker.GetConfigInfo(cfg, sources)
	fmt.Println(info)
	return nil
}

func (c *CLI) runConfigInit(cmd *cobra.Command, args []string) error {
	outPath := c.configPath
	if outPath == "" {
		outPath = "envcheck.yaml"
	}

	content := sampleConfigYAML()
	if err := os.WriteFile(outPath, []byte(content), 0644); err != nil {
		return fmt.Errorf("写入配置文件失败: %w", err)
	}

	fmt.Printf("✅ 配置文件已生成: %s\n\n", outPath)
	fmt.Println("编辑配置后可通过以下命令检查配置:")
	fmt.Printf("  envcheck config show --config %s\n", outPath)
	return nil
}

func (c *CLI) Execute() {
	if err := c.rootCmd.Execute(); err != nil {
		if c.quiet {
			os.Exit(1)
		}
		fmt.Fprintf(os.Stderr, "\n❌ 执行失败: %v\n", err)
		os.Exit(1)
	}
}

func writeResult(result *types.CheckResult, cfg *types.CheckConfig) {
	var writer io.Writer = os.Stdout

	if cfg.JSON {
		formatter := output.NewJSONFormatter(true)
		formatter.Write(writer, result)
	} else if cfg.CI {
		ciFormatter := output.NewCIFormatter(true, false)
		ciFormatter.Write(os.Stdout, result)

		if !cfg.Quiet {
			textFormatter := output.NewTextFormatter(true, cfg.Verbose, false)
			textFormatter.Write(writer, result)
		}
	} else {
		formatter := output.NewTextFormatter(false, cfg.Verbose, false)
		formatter.Write(writer, result)
	}
}

func sampleConfigYAML() string {
	return `# envcheck 配置文件
# 优先级: 命令行参数 > 环境变量 (ENVCHECK_*) > 本文件 > 默认值

check:
  # 环境文件路径列表（支持通配符）
  env-paths:
    - .env
    - ".env.*"

  # 示例配置文件路径
  example-path: .env.example

  # 必填变量列表（如果 .env.example 中有 # required 注释会自动识别）
  required-vars:
    - APP_ENV
    - DB_HOST
    - DB_PORT

  # 需要额外遮蔽的变量名（不区分大小写）
  # 默认会匹配包含 PASSWORD/SECRET/TOKEN/KEY/CREDENTIAL 的变量
  mask-keys:
    - API_KEY
    - PRIVATE_TOKEN

  # 遮蔽模式（匹配子字符串，不区分大小写）
  mask-patterns:
    - PASSWORD
    - SECRET
    - TOKEN
    - KEY
    - CREDENTIAL

  # 是否遮蔽所有值（保守建议: CI 环境中开启）
  mask-all: false

  # 遮蔽字符
  mask-char: "*"

  # 遮蔽时保留值的开头/末尾字符数
  mask-keep-start: 2
  mask-keep-end: 2

  # 启用 CI 模式（GitHub Actions 等）
  ci: false

  # 输出 JSON 格式
  json: false

  # 严格模式：多余变量也视为错误
  strict: false

  # 报告超出示例文件的变量
  warn-on-extra: true

  # 值不一致时返回非零退出码
  fail-on-mismatch: true

  # 必填变量缺失时返回非零退出码
  fail-on-missing: true

  # 详细输出
  verbose: false

  # 静默模式
  quiet: false

  # 日志级别: debug, info, warn, error, silent
  log-level: info

# 不同环境的配置 profile
profiles:
  # 开发环境：不遮蔽、宽松
  development:
    env-paths:
      - .env.dev
    example-path: .env.example
    mask-all: false
    strict: false
    log-level: debug

  # 预发环境：遮蔽敏感值、正常校验
  staging:
    env-paths:
      - .env.staging
    example-path: .env.example
    mask-all: false
    strict: false
    ci: true

  # 生产环境：全部遮蔽、严格模式
  production:
    env-paths:
      - .env.prod
    example-path: .env.example
    mask-all: true
    strict: true
    ci: true
    log-level: warn
`
}

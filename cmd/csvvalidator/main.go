package main

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/datateam/csvvalidator/internal/csvparser"
	"github.com/datateam/csvvalidator/internal/fixer"
	"github.com/datateam/csvvalidator/internal/logger"
	"github.com/datateam/csvvalidator/internal/reporter"
	"github.com/datateam/csvvalidator/internal/rollback"
	"github.com/datateam/csvvalidator/internal/schema"
	"github.com/datateam/csvvalidator/internal/validator"
	"github.com/spf13/cobra"
)

var (
	flagSchema        string
	flagStrict        bool
	flagReport        string
	flagFixPreview    bool
	flagDryRun        bool
	flagLogLevel      string
	flagMaxErrors     int
	flagNoColors      bool
	flagRollbackDir   string
	flagOutputFile    string
	flagShowSamples   bool
	flagShowSuggest   bool
	flagShowStats     bool
)

const version = "1.0.0"

func main() {
	rootCmd := buildRootCommand()
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}

func buildRootCommand() *cobra.Command {
	root := &cobra.Command{
		Use:   "csvvalidator [CSV文件路径]",
		Short: "CSV 数据导入校验器 - 面向数据运营的日常工作流",
		Long: `csvvalidator 是一款面向数据运营团队的 CSV 数据校验工具。
它可以：
  • 根据预定义 Schema 校验字段类型、必填列、枚举值、主键/唯一键重复
  • 精确定位错误所在行、列，展示样例错误值
  • 生成人类可读的表格报告，或输出 JSON 供其他脚本消费
  • 提供修复建议与修复预览（--fix-preview）
  • 保留回滚记录，方便审计

默认行为保守：不修改任何源文件，仅输出报告。

典型工作流：
  1. 先 dry-run 模式运行了解问题
  2. 根据 --report table 的表格修复数据
  3. 用 --report json 接入后续自动化脚本
  4. 发布前再跑一次校验确保通过`,
		Example: `  # 基本使用：校验 users.csv，使用 users_schema.yaml（默认表格输出）
  csvvalidator users.csv --schema users_schema.yaml

  # 严格模式 + 输出 JSON 给其他脚本
  csvvalidator data.csv --schema schema.json --strict --report json

  # 仅预览修复建议（不会修改源文件）
  csvvalidator data.csv --schema schema.yaml --fix-preview

  # Dry-Run 模式，所有操作均不写入
  csvvalidator data.csv --schema schema.yaml --dry-run

  # 查看帮助
  csvvalidator --help
  csvvalidator validate --help
  csvvalidator history --help`,
		Version:       version,
		SilenceErrors: true,
		SilenceUsage:  false,
		Args:          cobra.MaximumNArgs(1),
		PreRunE: func(cmd *cobra.Command, args []string) error {
			logger.SetLevel(logger.ParseLevel(flagLogLevel))
			if flagNoColors {
				os.Setenv("NO_COLOR", "1")
			}
			return nil
		},
		RunE: runValidate,
	}

	root.SetVersionTemplate(`csvvalidator v{{.Version}}
`)

	pf := root.PersistentFlags()
	pf.StringVar(&flagSchema, "schema", "", "Schema 文件路径（支持 JSON/YAML）[必填]")
	pf.BoolVar(&flagStrict, "strict", false, "严格模式：禁止CSV存在未定义列、列数必须严格匹配")
	pf.StringVar(&flagReport, "report", "table", "报告格式：table（人类可读表格）或 json（机器可读）")
	pf.BoolVar(&flagFixPreview, "fix-preview", false, "生成修复预览建议（不会修改源文件）")
	pf.BoolVar(&flagDryRun, "dry-run", false, "仅演示操作，不写入任何回滚或修复记录")
	pf.StringVar(&flagLogLevel, "log-level", "info", "日志级别：debug/info/warn/error")
	pf.IntVar(&flagMaxErrors, "max-errors", 50, "最多展示的错误条数（仅影响展示）")
	pf.BoolVar(&flagNoColors, "no-colors", false, "禁用彩色输出")
	pf.StringVar(&flagRollbackDir, "rollback-dir", "./.csvvalidator/history", "回滚/审计记录保存目录")
	pf.StringVar(&flagOutputFile, "output", "", "报告输出文件路径，默认输出到 stdout")
	pf.BoolVar(&flagShowSamples, "show-samples", true, "报告中展示字段样例值")
	pf.BoolVar(&flagShowSuggest, "show-suggestions", true, "报告中展示修复建议汇总")
	pf.BoolVar(&flagShowStats, "show-stats", true, "报告中展示字段统计概览")

	root.AddCommand(buildValidateCmd())
	root.AddCommand(buildHistoryCmd())
	root.AddCommand(buildSchemaCmd())
	root.AddCommand(buildFixCmd())

	return root
}

func buildValidateCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "validate [CSV文件路径]",
		Short: "执行 CSV 校验（与主命令等效）",
		Long:  `validate 子命令与根命令执行的逻辑完全相同，显式表达"校验"语义。`,
		Example: `  csvvalidator validate data.csv --schema schema.yaml
  csvvalidator validate data.csv --schema schema.json --strict --report json`,
		Args: cobra.MaximumNArgs(1),
		RunE: runValidate,
	}
}

func buildHistoryCmd() *cobra.Command {
	var limit int
	cmd := &cobra.Command{
		Use:   "history",
		Short: "查看历史校验记录",
		Long:  `列出最近的校验操作记录，用于审计与回溯。`,
		Example: `  csvvalidator history
  csvvalidator history --limit 20
  csvvalidator history --rollback-dir ./custom_logs`,
		RunE: func(cmd *cobra.Command, args []string) error {
			rec, err := rollback.New(flagRollbackDir)
			if err != nil {
				return fmt.Errorf("无法打开回滚目录: %w\n建议: 请确认 --rollback-dir 指向可写入目录，或使用 --dry-run 跳过记录写入", err)
			}
			list, err := rec.List(limit)
			if err != nil {
				return fmt.Errorf("读取历史记录失败: %w", err)
			}
			if len(list) == 0 {
				fmt.Println("暂无历史校验记录。")
				return nil
			}
			fmt.Printf("\n  共 %d 条记录:\n\n", len(list))
			fmt.Printf("  %-20s  %-10s  %-6s  %-6s  %-8s  %-8s  %s\n",
				"时间", "操作", "成功", "行数", "错误", "警告", "CSV 文件")
			fmt.Println("  " + strings.Repeat("─", 110))
			for _, r := range list {
				ts, _ := time.Parse(time.RFC3339, r.Timestamp)
				tsStr := ts.Format("2006-01-02 15:04:05")
				success := "✓"
				if !r.Success {
					success = "✗"
				}
				fmt.Printf("  %-20s  %-10s  %-6s  %-6d  %-8d  %-8d  %s\n",
					tsStr, r.Operation, success, r.TotalRows, r.ErrorCount, r.WarningCount,
					filepath.Base(r.CSVFile))
			}
			fmt.Println("")
			return nil
		},
	}
	cmd.Flags().IntVar(&limit, "limit", 10, "展示最近的 N 条记录")
	return cmd
}

func buildSchemaCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "schema",
		Short: "Schema 辅助命令（示例/模板/说明）",
		Long:  `生成示例 Schema 文件，或查看 Schema 字段类型说明。`,
		Example: `  csvvalidator schema example > users_schema.yaml
  csvvalidator schema types`,
	}
	cmd.AddCommand(&cobra.Command{
		Use:   "example",
		Short: "输出一份完整的示例 Schema（JSON）",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Println(schemaExample)
		},
	})
	cmd.AddCommand(&cobra.Command{
		Use:   "types",
		Short: "列出所有支持的字段类型",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Print(typesHelp)
		},
	})
	return cmd
}

func buildFixCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "fix [CSV路径]",
		Short: "[预览] 根据 Schema 自动修复数据（仅 dry-run）",
		Long:  `目前仅在 --dry-run 模式下展示修复预览，不修改任何文件。`,
		Args:  cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			if !flagDryRun {
				return fmt.Errorf("fix 子命令目前仅支持 dry-run 模式\n建议: 请加上 --dry-run --fix-preview 预览修复方案，或使用根命令的 --fix-preview")
			}
			return runValidate(cmd, args)
		},
	}
	return cmd
}

func runValidate(cmd *cobra.Command, args []string) error {
	start := time.Now()
	var csvPath string
	if len(args) > 0 {
		csvPath = args[0]
	}
	if csvPath == "" {
		return fmt.Errorf("缺少 CSV 文件路径\n\n示例:\n  csvvalidator data.csv --schema schema.yaml\n  csvvalidator ./imports/users_2024.csv --schema schemas/users.json")
	}
	if flagSchema == "" {
		return fmt.Errorf("缺少 --schema 参数\n\n示例:\n  csvvalidator %s --schema schemas/my_schema.yaml\n提示: 使用 'csvvalidator schema example' 查看示例 Schema", filepath.Base(csvPath))
	}

	logger.Info("开始校验: CSV=%s, Schema=%s", csvPath, flagSchema)

	if flagReport != "table" && flagReport != "json" {
		return fmt.Errorf("--report 参数值不合法: %s\n建议: 使用 'table'（默认）或 'json'", flagReport)
	}

	sch, err := schema.Load(flagSchema, &schema.LoadOptions{StrictMode: flagStrict})
	if err != nil {
		logger.Error("Schema 加载失败: %v", err)
		return err
	}
	logger.Debug("Schema 加载成功: %s v%s", sch.Name, sch.Version)

	parsedData, err := csvparser.Load(csvPath, sch, csvparser.NewLoadOptionsFromSchema(sch, flagStrict))
	if err != nil {
		logger.Error("CSV 解析失败: %v", err)
		writeRollback(start, csvPath, flagSchema, sch, 0, 0, 0, false, err)
		return err
	}
	logger.Info("CSV 解析完成: 总行数=%d, 跳过=%d", parsedData.TotalRows, parsedData.SkippedRows)

	vrows := make([]validator.Row, 0, len(parsedData.Rows))
	for _, r := range parsedData.Rows {
		vrows = append(vrows, validator.CsvRow{
			Line:   r.LineNumber,
			Values: r.Values,
			Raw:    r.Raw,
		})
	}

	v := validator.New(sch, flagStrict)
	result := v.Validate(vrows)
	logger.Info("校验完成: 错误=%d, 警告=%d, 通过=%d / %d",
		len(result.Errors), len(result.Warnings), result.ValidRows, result.TotalRows)

	reportOpts := &reporter.ReportOptions{
		Format:          reporter.Format(flagReport),
		MaxErrorsShown:  flagMaxErrors,
		ShowSamples:     flagShowSamples,
		ShowSuggestions: flagShowSuggest,
		ShowStats:       flagShowStats,
		Schema:          sch,
		CSVFilePath:     csvPath,
		SchemaFilePath:  flagSchema,
		DryRun:          flagDryRun,
		FixPreview:      flagFixPreview,
	}

	if flagFixPreview {
		_ = fixer.GeneratePreview(vrows, sch, result)
	}

	report := reporter.GenerateReport(result, reportOpts)
	report.Meta.GeneratedAt = start.Format(time.RFC3339)

	var out io.Writer = os.Stdout
	if flagOutputFile != "" {
		f, err := os.Create(flagOutputFile)
		if err != nil {
			return fmt.Errorf("无法创建输出文件: %w", err)
		}
		defer f.Close()
		out = f
		logger.Info("报告写入文件: %s", flagOutputFile)
	}
	if err := report.Render(out, reporter.Format(flagReport)); err != nil {
		return fmt.Errorf("生成报告失败: %w", err)
	}

	success := result.IsValid
	ec := len(result.Errors)
	wc := len(result.Warnings)
	tr := result.TotalRows
	writeRollback(start, csvPath, flagSchema, sch, tr, ec, wc, success, nil)

	if flagDryRun {
		logger.Info("[Dry-Run] 所有步骤已完成，未对任何文件写入修复或导入操作")
	}

	if !success {
		exitCode := 2
		logger.Warn("校验未通过 (exit=%d)：共 %d 条错误，%d 条警告", exitCode, ec, wc)
		os.Exit(exitCode)
	}

	if parsedData.SkippedRows > 0 {
		logger.Warn("注意：有 %d 行因解析问题被跳过，建议检查原始 CSV", parsedData.SkippedRows)
	}

	logger.Info("校验通过 ✓")
	return nil
}

func writeRollback(start time.Time, csvPath, schemaPath string, sch *schema.Schema, total, errs, warns int, success bool, runErr error) {
	if flagDryRun {
		return
	}
	rec, err := rollback.New(flagRollbackDir)
	if err != nil {
		logger.Warn("无法创建回滚记录目录: %v，跳过写入审计日志", err)
		return
	}
	exitCode := 0
	if !success {
		exitCode = 2
	}
	if runErr != nil {
		exitCode = 1
	}
	hostname, _ := os.Hostname()
	user := os.Getenv("USER")
	record := &rollback.Record{
		Operation:    rollback.OpValidate,
		SchemaFile:   schemaPath,
		SchemaName:   sch.Name,
		CSVFile:      csvPath,
		Success:      success,
		TotalRows:    total,
		ErrorCount:   errs,
		WarningCount: warns,
		ExitCode:     exitCode,
		DurationMs:   time.Since(start).Milliseconds(),
		Hostname:     hostname,
		User:         user,
	}
	if runErr != nil {
		record.ErrorMessage = runErr.Error()
	}
	path, err := rec.Save(record)
	if err != nil {
		logger.Warn("写入回滚记录失败: %v", err)
	} else {
		logger.Debug("回滚记录已写入: %s", path)
	}
}

const schemaExample = `{
  "name": "用户信息模型",
  "description": "用户基础数据导入Schema示例",
  "version": "1.0.0",
  "delimiter": ",",
  "has_header": true,
  "primary_keys": ["user_id"],
  "unique_keys": [["email"]],
  "fields": [
    {
      "name": "user_id",
      "type": "string",
      "required": true,
      "unique": true,
      "description": "用户唯一ID"
    },
    {
      "name": "username",
      "type": "string",
      "required": true,
      "min_length": 2,
      "max_length": 50,
      "description": "用户名"
    },
    {
      "name": "email",
      "type": "email",
      "required": true,
      "description": "用户邮箱（唯一）"
    },
    {
      "name": "age",
      "type": "int",
      "min_value": 0,
      "max_value": 150,
      "description": "年龄（0-150）"
    },
    {
      "name": "role",
      "type": "enum",
      "enum_values": ["admin", "editor", "viewer", "guest"],
      "description": "用户角色"
    },
    {
      "name": "status",
      "type": "enum",
      "required": true,
      "enum_values": ["active", "inactive", "suspended"],
      "description": "账户状态"
    },
    {
      "name": "signup_date",
      "type": "date",
      "date_format": "2006-01-02",
      "description": "注册日期 YYYY-MM-DD"
    },
    {
      "name": "website",
      "type": "url",
      "description": "个人主页URL"
    },
    {
      "name": "is_verified",
      "type": "bool",
      "description": "是否已验证邮箱"
    },
    {
      "name": "phone",
      "type": "pattern",
      "pattern": "^1[3-9]\\d{9}$",
      "description": "中国大陆手机号"
    }
  ]
}`

const typesHelp = `  支持的字段类型 (field.type):

  string     字符串 (默认)
  int        整数，例如: 123, -456
  float      浮点数，例如: 3.14, -2.5
  bool       布尔，支持: true/false, 1/0, yes/no, y/n, t/f
  date       日期，需配合 date_format (默认 2006-01-02)
  datetime   日期时间，默认格式 2006-01-02 15:04:05
  email      合法邮箱地址
  url        合法 URL (含 Scheme 和 Host)
  enum       枚举值，必填 enum_values: ["a", "b"]
  pattern    正则匹配，必填 pattern: "^\\d+$"

  字段级别的额外约束:
  required        是否必填 (bool)
  unique          是否单列唯一 (bool)
  min_length      最小字符长度
  max_length      最大字符长度
  min_value       数值最小值 (int/float)
  max_value       数值最大值 (int/float)
  nullable        空值是否允许
  trim_space      是否自动去除首尾空白（默认 true）

  表级别约束:
  primary_keys   主键字段数组（组合唯一 + 非空）
  unique_keys    二维数组，每组字段组合唯一
  delimiter      CSV 分隔符 (默认 ,)
  has_header     CSV 是否含表头 (默认 true)
`

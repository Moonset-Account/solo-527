package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var (
	flagSchema      string
	flagBusiness    string
	flagSchemaDir   string
	flagNoColor     bool
	flagVerbose     bool
	flagDelimiter   string
)

var rootCmd = &cobra.Command{
	Use:   "csvchecker",
	Short: "CSV 结构校验器 - 供数据运营导入前使用",
	Long: `csvchecker 是一个 CSV 数据质量校验工具，支持：
  • 缺失列检测 (E001)
  • 类型不匹配检测 (E002)
  • 枚举越界检测 (E003)
  • 日期格式错误检测 (E004)
  • 重复主键检测 (E005)
  • 空文件检测 (E006)
  
严重结构错误返回非零退出码，普通脏数据写入报告。`,
	Example: `  # 使用 schema 文件校验单个 CSV
  csvchecker validate -s schemas/ecommerce.yaml orders.csv

  # 使用业务线自动匹配 schema，并输出 JSON 报告
  csvchecker validate -b ecommerce --schema-dir ./schemas -o report.json *.csv

  # 采样查看 CSV 前 20 行
  csvchecker sample -s schemas/ecommerce.yaml orders.csv -n 20

  # 读取已有的 JSON 报告并以彩色方式展示
  csvchecker report -i report.json`,
	Version: "1.0.0",
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func init() {
	rootCmd.PersistentFlags().StringVarP(&flagSchema, "schema", "s", "", "Schema 配置文件路径 (JSON/YAML)")
	rootCmd.PersistentFlags().StringVarP(&flagBusiness, "business-line", "b", "", "业务线名称（自动从 schema 目录匹配）")
	rootCmd.PersistentFlags().StringVar(&flagSchemaDir, "schema-dir", "./schemas", "Schema 配置目录（配合 business-line 使用）")
	rootCmd.PersistentFlags().BoolVar(&flagNoColor, "no-color", false, "禁用彩色输出")
	rootCmd.PersistentFlags().BoolVarP(&flagVerbose, "verbose", "v", false, "输出详细信息")
	rootCmd.PersistentFlags().StringVarP(&flagDelimiter, "delimiter", "d", "", "CSV 分隔符，默认使用 schema 配置 (,)")
}

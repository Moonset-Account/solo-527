package cmd

import (
	"fmt"
	"os"

	"csvchecker/internal/reporter"
	"csvchecker/internal/validator"

	"github.com/spf13/cobra"
)

var (
	valOutputJSON     string
	valOutputConsole  bool
	valStopOnError    bool
	valFailOnWarning  bool
	valMaxErrors      int
	valIgnoreRules    []string
	valIgnoreColumns  []string
	valIgnoreFiles    []string
	valNoDetail       bool
)

var validateCmd = &cobra.Command{
	Use:   "validate [csv files...]",
	Short: "校验 CSV 文件结构与内容",
	Long:  `根据 Schema 配置批量校验 CSV 文件，输出控制台报告或 JSON 报告文件。`,
	Args:  cobra.MinimumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		s, err := loadSchema()
		if err != nil {
			return err
		}

		paths, err := expandCSVPaths(args)
		if err != nil {
			return err
		}
		if len(paths) == 0 {
			return fmt.Errorf("未找到任何 CSV 文件")
		}

		ignoreMgr := buildIgnoreManager(s, valIgnoreRules, valIgnoreColumns, valIgnoreFiles)
		v := buildValidator(s, ignoreMgr, valMaxErrors, valStopOnError)

		rpt := validator.RunBatch(v, paths)

		rep := reporter.New()
		rep.SetNoColor(flagNoColor)

		if valOutputJSON != "" {
			if err := rep.WriteJSON(valOutputJSON, rpt, true); err != nil {
				fmt.Fprintf(os.Stderr, "写入 JSON 报告失败: %v\n", err)
			} else if flagVerbose {
				fmt.Fprintf(os.Stderr, "已写入 JSON 报告: %s\n", valOutputJSON)
			}
		}

		if valOutputConsole || valOutputJSON == "" {
			rep.PrintConsole(rpt, !valNoDetail)
		}

		code := exitCode(rpt, valFailOnWarning)
		if code != 0 {
			os.Exit(code)
		}
		return nil
	},
}

func init() {
	rootCmd.AddCommand(validateCmd)
	validateCmd.Flags().StringVarP(&valOutputJSON, "output", "o", "", "输出 JSON 报告的文件路径")
	validateCmd.Flags().BoolVar(&valOutputConsole, "console", true, "输出控制台彩色报告")
	validateCmd.Flags().BoolVar(&valStopOnError, "stop-on-error", false, "遇到第一个严重错误即停止")
	validateCmd.Flags().BoolVar(&valFailOnWarning, "fail-on-warning", false, "存在警告也返回非零退出码")
	validateCmd.Flags().IntVar(&valMaxErrors, "max-errors", 0, "单个文件最大错误数 (0 表示不限制)")
	validateCmd.Flags().StringSliceVar(&valIgnoreRules, "ignore-rule", nil, "忽略指定规则编号，例如 E002,W001")
	validateCmd.Flags().StringSliceVar(&valIgnoreColumns, "ignore-column", nil, "忽略指定列的所有校验")
	validateCmd.Flags().StringSliceVar(&valIgnoreFiles, "ignore-file", nil, "忽略指定文件")
	validateCmd.Flags().BoolVar(&valNoDetail, "no-detail", false, "不输出详细错误，仅展示摘要")
}

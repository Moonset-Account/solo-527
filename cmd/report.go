package cmd

import (
	"encoding/json"
	"fmt"
	"os"

	"csvchecker/internal/reporter"
	"csvchecker/internal/types"

	"github.com/spf13/cobra"
)

var (
	repInputJSON   string
	repNoDetail    bool
	repExportJSON  string
	repExportCSV   string
	repFilterRule  []string
	repFilterSev   []string
	repFilterFile  []string
)

var reportCmd = &cobra.Command{
	Use:   "report",
	Short: "解析并展示校验报告",
	Long:  `从 JSON 报告文件读取校验结果，以彩色方式输出摘要和详情，支持按规则、级别、文件过滤。`,
	RunE: func(cmd *cobra.Command, args []string) error {
		if repInputJSON == "" {
			return fmt.Errorf("请使用 -i 指定 JSON 报告文件路径")
		}

		data, err := os.ReadFile(repInputJSON)
		if err != nil {
			return fmt.Errorf("读取报告文件失败: %w", err)
		}

		var rpt types.ValidationReport
		if err := json.Unmarshal(data, &rpt); err != nil {
			return fmt.Errorf("解析报告 JSON 失败: %w", err)
		}

		filtered := applyFilters(&rpt)

		rep := reporter.New()
		rep.SetNoColor(flagNoColor)

		if repExportJSON != "" {
			if err := rep.WriteJSON(repExportJSON, filtered, true); err != nil {
				fmt.Fprintf(os.Stderr, "导出 JSON 失败: %v\n", err)
			} else {
				fmt.Fprintf(os.Stderr, "已导出过滤后的 JSON: %s\n", repExportJSON)
			}
		}

		if repExportCSV != "" {
			if err := writeErrorsCSV(repExportCSV, filtered); err != nil {
				fmt.Fprintf(os.Stderr, "导出 CSV 失败: %v\n", err)
			} else {
				fmt.Fprintf(os.Stderr, "已导出问题明细 CSV: %s\n", repExportCSV)
			}
		}

		rep.PrintConsole(filtered, !repNoDetail)
		code := exitCode(filtered, valFailOnWarning)
		if code != 0 {
			os.Exit(code)
		}
		return nil
	},
}

func applyFilters(r *types.ValidationReport) *types.ValidationReport {
	ruleSet := make(map[string]bool)
	for _, rid := range repFilterRule {
		ruleSet[rid] = true
	}
	sevSet := make(map[string]bool)
	for _, s := range repFilterSev {
		sevSet[s] = true
	}
	fileSet := make(map[string]bool)
	for _, f := range repFilterFile {
		fileSet[f] = true
	}

	noFilter := len(ruleSet) == 0 && len(sevSet) == 0 && len(fileSet) == 0
	if noFilter {
		return r
	}

	clone := &types.ValidationReport{
		Version:      r.Version,
		BusinessLine: r.BusinessLine,
		TotalFiles:   r.TotalFiles,
		FileReports:  make([]types.FileReport, 0, len(r.FileReports)),
		GlobalErrors: make(map[string]int),
		RuleSummary:  make(map[string]int),
		StartedAt:    r.StartedAt,
		FinishedAt:   r.FinishedAt,
		DurationMs:   r.DurationMs,
	}

	for _, fr := range r.FileReports {
		if len(fileSet) > 0 && !fileSet[fr.File] {
			// still keep the file record but empty errors? skip for now
			continue
		}
		nfr := fr
		nfr.Errors = nil
		nfr.ErrorCounts = make(map[string]int)
		for _, e := range fr.Errors {
			if len(ruleSet) > 0 && !ruleSet[e.RuleID] {
				continue
			}
			if len(sevSet) > 0 && !sevSet[e.Severity] {
				continue
			}
			nfr.Errors = append(nfr.Errors, e)
			nfr.ErrorCounts[e.RuleID]++
			clone.TotalErrors++
			clone.GlobalErrors[e.RuleID]++
			clone.RuleSummary[e.RuleID]++
			if e.Severity == types.SeverityWarning {
				clone.TotalWarnings++
			}
			if e.Severity == types.SeverityCritical {
				clone.TotalCritical++
				clone.HasCriticalErr = true
			}
		}
		if len(nfr.Errors) > 0 {
			clone.FailedFiles++
		} else {
			clone.PassedFiles++
		}
		clone.TotalRows += fr.TotalRows
		clone.FileReports = append(clone.FileReports, nfr)
	}
	return clone
}

func writeErrorsCSV(path string, r *types.ValidationReport) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()

	fmt.Fprintln(f, "file,row,column,ruleId,severity,ruleDesc,message,expected,actual")
	for _, fr := range r.FileReports {
		for _, e := range fr.Errors {
			fmt.Fprintf(f, "%q,%d,%q,%q,%q,%q,%q,%q,%q\n",
				e.File, e.Row, e.Column, e.RuleID, e.Severity, e.RuleDesc,
				e.Message, fmt.Sprintf("%v", e.Expected), fmt.Sprintf("%v", e.Actual))
		}
	}
	return nil
}

func init() {
	rootCmd.AddCommand(reportCmd)
	reportCmd.Flags().StringVarP(&repInputJSON, "input", "i", "", "输入的 JSON 报告文件")
	reportCmd.Flags().BoolVar(&repNoDetail, "no-detail", false, "不输出详细错误，仅展示摘要")
	reportCmd.Flags().StringVar(&repExportJSON, "export-json", "", "将过滤后的报告导出为新 JSON 文件")
	reportCmd.Flags().StringVar(&repExportCSV, "export-csv", "", "将问题明细导出为 CSV 文件")
	reportCmd.Flags().StringSliceVar(&repFilterRule, "filter-rule", nil, "仅显示指定规则编号 (逗号分隔)")
	reportCmd.Flags().StringSliceVar(&repFilterSev, "filter-severity", nil, "仅显示指定级别 (CRITICAL,ERROR,WARNING)")
	reportCmd.Flags().StringSliceVar(&repFilterFile, "filter-file", nil, "仅显示指定文件的报告")
}

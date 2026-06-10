package output

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"sort"
	"strings"

	"github.com/devops/envcheck/internal/types"
)

type Formatter interface {
	Write(w io.Writer, result *types.CheckResult) error
}

type TextFormatter struct {
	CI        bool
	Verbose   bool
	ShowMatch bool
}

type JSONFormatter struct {
	Pretty bool
}

type CIFormatter struct {
	GitHubActions bool
	GitLabCI      bool
}

func NewTextFormatter(ci bool, verbose bool, showMatch bool) *TextFormatter {
	return &TextFormatter{CI: ci, Verbose: verbose, ShowMatch: showMatch}
}

func NewJSONFormatter(pretty bool) *JSONFormatter {
	return &JSONFormatter{Pretty: pretty}
}

func NewCIFormatter(ga bool, gl bool) *CIFormatter {
	return &CIFormatter{GitHubActions: ga, GitLabCI: gl}
}

func (f *TextFormatter) Write(w io.Writer, r *types.CheckResult) error {
	sep := strings.Repeat("─", 72)

	fmt.Fprintln(w, sep)
	fmt.Fprintf(w, "  环境变量一致性检查报告\n")
	fmt.Fprintf(w, "  生成时间: %s\n", r.Timestamp.Format("2006-01-02 15:04:05 MST"))
	if r.ConfigUsed != "" {
		fmt.Fprintf(w, "  使用配置: %s\n", r.ConfigUsed)
	}
	if len(r.ConfigSources) > 0 {
		fmt.Fprintf(w, "  配置来源: %s\n", strings.Join(r.ConfigSources, " > "))
	}
	fmt.Fprintln(w, sep)

	f.writeEnvFiles(w, r)
	f.writeMissing(w, r)
	f.writeDiffs(w, r)
	f.writeExtra(w, r)
	f.writeSummary(w, r)

	status := "✓ 通过"
	statusColor := "\033[32m"
	if r.ExitCode != 0 {
		status = "✗ 失败"
		statusColor = "\033[31m"
	}
	reset := "\033[0m"

	fmt.Fprintln(w, sep)
	fmt.Fprintf(w, "  最终状态: %s%s%s  (退出码: %d)\n", statusColor, status, reset, r.ExitCode)
	fmt.Fprintln(w, sep)

	return nil
}

func (f *TextFormatter) writeEnvFiles(w io.Writer, r *types.CheckResult) {
	if len(r.EnvFiles) == 0 {
		return
	}
	fmt.Fprintf(w, "\n  📁 已加载环境文件:\n")
	for _, ef := range r.EnvFiles {
		fmt.Fprintf(w, "    • %s  (%d 个变量)\n", ef.Path, len(ef.Vars))
		if f.Verbose {
			for _, v := range ef.Vars {
				maskTag := ""
				if v.Masked {
					maskTag = " [已遮蔽]"
				}
				fmt.Fprintf(w, "      L%-3d: %-30s = %s%s\n", v.Line, v.Key, truncate(v.Value, 50), maskTag)
			}
		}
	}
}

func (f *TextFormatter) writeMissing(w io.Writer, r *types.CheckResult) {
	if len(r.Missing) == 0 {
		return
	}

	sort.Slice(r.Missing, func(i, j int) bool {
		if r.Missing[i].Required != r.Missing[j].Required {
			return r.Missing[i].Required
		}
		return r.Missing[i].Key < r.Missing[j].Key
	})

	fmt.Fprintf(w, "\n  ⚠️  缺失变量 (%d):\n", len(r.Missing))
	for _, m := range r.Missing {
		reqTag := "  可选"
		color := "\033[33m"
		if m.Required {
			reqTag = "必填"
			color = "\033[31m"
		}
		reset := "\033[0m"

		fmt.Fprintf(w, "    %s[%s]%s %s", color, reqTag, reset, m.Key)
		if m.Example != "" {
			fmt.Fprintf(w, "  (示例值: %s)", truncate(m.Example, 40))
		}
		if m.Comment != "" {
			fmt.Fprintf(w, "  # %s", truncate(m.Comment, 50))
		}
		fmt.Fprintln(w)
	}
}

func (f *TextFormatter) writeDiffs(w io.Writer, r *types.CheckResult) {
	showCount := 0
	for _, d := range r.Diffs {
		if d.Type != types.DiffMatch || f.ShowMatch {
			showCount++
		}
	}
	if showCount == 0 {
		return
	}

	fmt.Fprintf(w, "\n  🔍 差异对比 (%d 项):\n", showCount)

	sort.Slice(r.Diffs, func(i, j int) bool {
		order := map[types.DiffType]int{
			types.DiffMissing:      0,
			types.DiffValueMismatch: 1,
			types.DiffExtra:        2,
			types.DiffMatch:        3,
		}
		oi := order[r.Diffs[i].Type]
		oj := order[r.Diffs[j].Type]
		if oi != oj {
			return oi < oj
		}
		return r.Diffs[i].Key < r.Diffs[j].Key
	})

	for _, d := range r.Diffs {
		if d.Type == types.DiffMatch && !f.ShowMatch {
			continue
		}

		sevColor := "\033[36m"
		icon := "ℹ"
		switch d.Severity {
		case "error":
			sevColor = "\033[31m"
			icon = "✗"
		case "warn":
			sevColor = "\033[33m"
			icon = "!"
		}
		reset := "\033[0m"

		typeLabel := map[types.DiffType]string{
			types.DiffMissing:       "缺失",
			types.DiffValueMismatch: "不一致",
			types.DiffExtra:         "多余",
			types.DiffMatch:         "匹配",
		}

		fmt.Fprintf(w, "    %s%s %s [%s]%s\n",
			sevColor, icon, d.Key, typeLabel[d.Type], reset)

		switch d.Type {
		case types.DiffValueMismatch:
			leftSrc := d.LeftSource
			if leftSrc == "" {
				leftSrc = "当前"
			}
			rightSrc := d.RightSource
			if rightSrc == "" {
				rightSrc = "参考"
			}
			fmt.Fprintf(w, "      \033[31m- %s:\033[0m %s\n", leftSrc, truncate(d.LeftValue, 60))
			fmt.Fprintf(w, "      \033[32m+ %s:\033[0m %s\n", rightSrc, truncate(d.RightValue, 60))
		case types.DiffMissing:
			if d.RightValue != "" {
				fmt.Fprintf(w, "      期望: %s\n", truncate(d.RightValue, 60))
			}
		case types.DiffExtra:
			if d.LeftValue != "" {
				fmt.Fprintf(w, "      当前值: %s\n", truncate(d.LeftValue, 60))
			}
		}
	}
}

func (f *TextFormatter) writeExtra(w io.Writer, r *types.CheckResult) {
	if len(r.Extra) == 0 {
		return
	}
	fmt.Fprintf(w, "\n  ➕ 超出示例文件的变量 (%d):\n", len(r.Extra))
	sort.Strings(r.Extra)
	for _, e := range r.Extra {
		fmt.Fprintf(w, "    • %s\n", e)
	}
}

func (f *TextFormatter) writeSummary(w io.Writer, r *types.CheckResult) {
	s := r.Summary
	fmt.Fprintf(w, "\n  📊 统计摘要:\n")
	fmt.Fprintf(w, "    环境文件数:       %d\n", s.TotalFiles)
	fmt.Fprintf(w, "    总变量数:         %d\n", s.TotalVars)
	fmt.Fprintf(w, "    匹配变量数:       %d\n", s.MatchCount)

	missColor := "\033[32m"
	if s.MissingCount > 0 {
		missColor = "\033[33m"
	}
	fmt.Fprintf(w, "    缺失变量数:       %s%d\033[0m", missColor, s.MissingCount)
	if s.MissingRequired > 0 {
		reqColor := "\033[31m"
		fmt.Fprintf(w, "  (%s其中必填: %d\033[0m)", reqColor, s.MissingRequired)
	}
	fmt.Fprintln(w)

	misColor := "\033[32m"
	if s.MismatchCount > 0 {
		misColor = "\033[31m"
	}
	fmt.Fprintf(w, "    值不匹配数:       %s%d\033[0m\n", misColor, s.MismatchCount)

	extColor := "\033[32m"
	if s.ExtraCount > 0 {
		extColor = "\033[33m"
	}
	fmt.Fprintf(w, "    多余变量数:       %s%d\033[0m\n", extColor, s.ExtraCount)
}

func (f *JSONFormatter) Write(w io.Writer, r *types.CheckResult) error {
	var data []byte
	var err error
	if f.Pretty {
		data, err = json.MarshalIndent(r, "", "  ")
	} else {
		data, err = json.Marshal(r)
	}
	if err != nil {
		return err
	}
	fmt.Fprintln(w, string(data))
	return nil
}

func (f *CIFormatter) Write(w io.Writer, r *types.CheckResult) error {
	if f.GitHubActions {
		return f.writeGitHubActions(w, r)
	}
	if f.GitLabCI {
		return f.writeGitLabCI(w, r)
	}
	return f.writeGenericCI(w, r)
}

func (f *CIFormatter) writeGitHubActions(w io.Writer, r *types.CheckResult) error {
	gha := os.Getenv("GITHUB_ACTIONS")
	if gha == "true" {
		summaryPath := os.Getenv("GITHUB_STEP_SUMMARY")
		if summaryPath != "" {
			fh, err := os.OpenFile(summaryPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
			if err == nil {
				defer fh.Close()
				f.writeMarkdownSummary(fh, r)
			}
		}
	}

	for _, d := range r.Diffs {
		level := "notice"
		switch d.Severity {
		case "error":
			level = "error"
		case "warn":
			level = "warning"
		}
		msg := ""
		switch d.Type {
		case types.DiffMissing:
			msg = fmt.Sprintf("缺失变量: %s", d.Key)
		case types.DiffValueMismatch:
			msg = fmt.Sprintf("值不一致: %s (期望: %s, 实际: %s)", d.Key, d.RightValue, d.LeftValue)
		case types.DiffExtra:
			msg = fmt.Sprintf("多余变量: %s", d.Key)
		case types.DiffMatch:
			continue
		}
		fmt.Fprintf(w, "::%s title=envcheck::%s\n", level, escapeGHA(msg))
	}

	if r.ExitCode != 0 {
		fmt.Fprintf(w, "::error::envcheck 检查失败: 退出码 %d\n", r.ExitCode)
	}

	return nil
}

func (f *CIFormatter) writeGitLabCI(w io.Writer, r *types.CheckResult) error {
	for _, d := range r.Diffs {
		if d.Type == types.DiffMatch {
			continue
		}
		level := "INFO"
		switch d.Severity {
		case "error":
			level = "ERROR"
		case "warn":
			level = "WARNING"
		}
		fmt.Fprintf(w, "[%s] envcheck: %s - %s\n", level, d.Type, d.Key)
	}
	return nil
}

func (f *CIFormatter) writeGenericCI(w io.Writer, r *types.CheckResult) error {
	for _, d := range r.Diffs {
		if d.Type == types.DiffMatch {
			continue
		}
		tag := strings.ToUpper(d.Severity)
		fmt.Fprintf(w, "[%s] %s: %s", tag, d.Type, d.Key)
		if d.LeftValue != "" {
			fmt.Fprintf(w, " 实际=%s", d.LeftValue)
		}
		if d.RightValue != "" {
			fmt.Fprintf(w, " 期望=%s", d.RightValue)
		}
		fmt.Fprintln(w)
	}
	return nil
}

func (f *CIFormatter) writeMarkdownSummary(w io.Writer, r *types.CheckResult) {
	s := r.Summary
	status := "✅ 通过"
	if r.ExitCode != 0 {
		status = "❌ 失败"
	}

	fmt.Fprintf(w, "## 环境变量一致性检查\n\n")
	fmt.Fprintf(w, "**状态:** %s &nbsp;|&nbsp; **退出码:** %d\n\n", status, r.ExitCode)
	fmt.Fprintf(w, "### 统计摘要\n\n")
	fmt.Fprintf(w, "| 指标 | 数量 |\n")
	fmt.Fprintf(w, "|------|------|\n")
	fmt.Fprintf(w, "| 环境文件数 | %d |\n", s.TotalFiles)
	fmt.Fprintf(w, "| 总变量数 | %d |\n", s.TotalVars)
	fmt.Fprintf(w, "| ✅ 匹配 | %d |\n", s.MatchCount)
	fmt.Fprintf(w, "| ⚠️ 缺失 (必填) | %d (%d) |\n", s.MissingCount, s.MissingRequired)
	fmt.Fprintf(w, "| ❌ 值不匹配 | %d |\n", s.MismatchCount)
	fmt.Fprintf(w, "| ➕ 多余变量 | %d |\n\n", s.ExtraCount)

	if len(r.Missing) > 0 {
		fmt.Fprintf(w, "### 缺失变量\n\n")
		fmt.Fprintf(w, "| 变量 | 必填 | 示例值 | 说明 |\n")
		fmt.Fprintf(w, "|------|------|--------|------|\n")
		for _, m := range r.Missing {
			req := "❌"
			if !m.Required {
				req = "✅"
			}
			fmt.Fprintf(w, "| `%s` | %s | `%s` | %s |\n",
				m.Key, req, truncate(m.Example, 50), m.Comment)
		}
		fmt.Fprintln(w)
	}

	diffIssues := []types.DiffItem{}
	for _, d := range r.Diffs {
		if d.Type != types.DiffMatch {
			diffIssues = append(diffIssues, d)
		}
	}
	if len(diffIssues) > 0 {
		fmt.Fprintf(w, "### 差异详情\n\n")
		fmt.Fprintf(w, "| 类型 | 变量 | 实际值 | 期望值 |\n")
		fmt.Fprintf(w, "|------|------|--------|--------|\n")
		for _, d := range diffIssues {
			typeLabel := map[types.DiffType]string{
				types.DiffMissing:       "⚠️ 缺失",
				types.DiffValueMismatch: "❌ 不一致",
				types.DiffExtra:         "➕ 多余",
			}
			fmt.Fprintf(w, "| %s | `%s` | `%s` | `%s` |\n",
				typeLabel[d.Type], d.Key,
				truncate(d.LeftValue, 40),
				truncate(d.RightValue, 40))
		}
	}
}

func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	if max <= 3 {
		return strings.Repeat(".", max)
	}
	return s[:max-3] + "..."
}

func escapeGHA(s string) string {
	s = strings.ReplaceAll(s, "%", "%25")
	s = strings.ReplaceAll(s, "\r", "%0D")
	s = strings.ReplaceAll(s, "\n", "%0A")
	return s
}

func ExitWithResult(result *types.CheckResult, jsonMode bool) {
	if jsonMode {
		formatter := NewJSONFormatter(true)
		formatter.Write(os.Stdout, result)
	}
	os.Exit(result.ExitCode)
}

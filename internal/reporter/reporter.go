package reporter

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"sort"
	"strings"
	"text/tabwriter"

	"csvchecker/internal/types"

	"github.com/fatih/color"
)

type OutputStyle int

const (
	StyleAuto    OutputStyle = iota
	StylePlain
	StyleColor
)

type Reporter struct {
	style   OutputStyle
	out     io.Writer
	errOut  io.Writer
	noColor bool
}

func New() *Reporter {
	return &Reporter{
		style:  StyleAuto,
		out:    os.Stdout,
		errOut: os.Stderr,
	}
}

func (r *Reporter) SetStyle(s OutputStyle) { r.style = s }
func (r *Reporter) SetNoColor(b bool) {
	r.noColor = b
	if b {
		color.NoColor = true
	}
}
func (r *Reporter) SetOutput(w io.Writer) { r.out = w }

func (r *Reporter) colorFunc(s string) func(a ...interface{}) string {
	switch s {
	case "red":
		return color.New(color.FgRed, color.Bold).SprintFunc()
	case "green":
		return color.New(color.FgGreen, color.Bold).SprintFunc()
	case "yellow":
		return color.New(color.FgYellow).SprintFunc()
	case "cyan":
		return color.New(color.FgCyan).SprintFunc()
	case "magenta":
		return color.New(color.FgMagenta).SprintFunc()
	case "white":
		return color.New(color.FgWhite).SprintFunc()
	case "bold":
		return color.New(color.Bold).SprintFunc()
	case "bgred":
		return color.New(color.BgRed, color.FgWhite, color.Bold).SprintFunc()
	case "bgyellow":
		return color.New(color.BgYellow, color.FgBlack, color.Bold).SprintFunc()
	}
	return fmt.Sprint
}

func (r *Reporter) sevColor(sev string) func(a ...interface{}) string {
	switch sev {
	case types.SeverityCritical:
		return r.colorFunc("bgred")
	case types.SeverityError:
		return r.colorFunc("red")
	case types.SeverityWarning:
		return r.colorFunc("yellow")
	}
	return r.colorFunc("white")
}

func (r *Reporter) PrintSummary(report *types.ValidationReport) {
	w := tabwriter.NewWriter(r.out, 0, 4, 2, ' ', 0)
	defer w.Flush()

	bold := r.colorFunc("bold")
	cyan := r.colorFunc("cyan")
	green := r.colorFunc("green")
	red := r.colorFunc("red")
	yellow := r.colorFunc("yellow")

	fmt.Fprintln(w, bold("══════════════════════════════════════════════════════════════"))
	fmt.Fprintf(w, "%s\t%s\t\n", bold(" CSV 校验报告"), cyan(fmt.Sprintf("[%s] v%s", report.BusinessLine, report.Version)))
	fmt.Fprintln(w, bold("──────────────────────────────────────────────────────────────"))
	fmt.Fprintf(w, " 校验开始时间\t%s\t\n", report.StartedAt.Format("2006-01-02 15:04:05"))
	fmt.Fprintf(w, " 校验结束时间\t%s\t\n", report.FinishedAt.Format("2006-01-02 15:04:05"))
	fmt.Fprintf(w, " 总耗时\t%d ms\t\n", report.DurationMs)
	fmt.Fprintln(w, bold("──────────────────────────────────────────────────────────────"))
	passStr := green(fmt.Sprintf("%d 个", report.PassedFiles))
	failStr := red(fmt.Sprintf("%d 个", report.FailedFiles))
	fmt.Fprintf(w, " 处理文件\t%d 个 (通过: %s, 失败: %s)\t\n", report.TotalFiles, passStr, failStr)
	fmt.Fprintf(w, " 数据总行数\t%d 行\t\n", report.TotalRows)
	totalE := report.TotalErrors
	cc := red(fmt.Sprintf("%d", report.TotalCritical))
	ee := red(fmt.Sprintf("%d", report.TotalErrors-report.TotalCritical-report.TotalWarnings))
	ww := yellow(fmt.Sprintf("%d", report.TotalWarnings))
	fmt.Fprintf(w, " 问题总数\t%d (严重:%s / 错误:%s / 警告:%s)\t\n", totalE, cc, ee, ww)
	fmt.Fprintln(w, bold("──────────────────────────────────────────────────────────────"))
}

func (r *Reporter) PrintFileReports(report *types.ValidationReport, detail bool) {
	bold := r.colorFunc("bold")
	green := r.colorFunc("green")
	red := r.colorFunc("red")

	for _, fr := range report.FileReports {
		status := green("✓ 通过")
		if len(fr.Errors) > 0 {
			status = red("✗ 失败")
		}
		fmt.Fprintf(r.out, "\n%s  %s\n", status, bold(filepathBase(fr.File)))
		fmt.Fprintf(r.out, "   行数: %d  |  有效: %d  |  无效: %d  |  耗时: %dms\n",
			fr.TotalRows, fr.ValidRows, fr.InvalidRows, fr.DurationMs)

		if len(fr.ErrorCounts) > 0 {
			fmt.Fprintf(r.out, "   %s", bold("失败规则:"))
			rids := make([]string, 0, len(fr.ErrorCounts))
			for rid := range fr.ErrorCounts {
				rids = append(rids, rid)
			}
			sort.Strings(rids)
			for _, rid := range rids {
				cnt := fr.ErrorCounts[rid]
				sev := types.RuleSeverities[rid]
				sc := r.sevColor(sev)
				desc := types.RuleDescriptions[rid]
				fmt.Fprintf(r.out, " %s(%s×%d)", sc(rid), desc, cnt)
			}
			fmt.Fprintln(r.out)
		}

		if detail && len(fr.Errors) > 0 {
			fmt.Fprintln(r.out, bold("   ┌─────────────────────────────────────────────────────"))
			for _, e := range fr.Errors {
				r.printError(&e, "   │ ")
			}
			fmt.Fprintln(r.out, bold("   └─────────────────────────────────────────────────────"))
		}
	}
}

func (r *Reporter) printError(e *types.ValidationError, prefix string) {
	sc := r.sevColor(e.Severity)
	cyan := r.colorFunc("cyan")

	loc := cyan("<header>")
	if e.Row > 0 {
		loc = fmt.Sprintf("第%d行", e.Row)
	}
	if e.Column != "" {
		loc = fmt.Sprintf("%s [%s]", loc, e.Column)
	}

	fmt.Fprintf(r.out, "%s%s %s: %s\n", prefix, sc(e.RuleID), loc, e.Message)
	if e.Expected != nil || e.Actual != nil {
		fmt.Fprintf(r.out, "%s   期望: %v  |  实际: %v\n", prefix, e.Expected, e.Actual)
	}
}

func (r *Reporter) PrintRuleSummary(report *types.ValidationReport) {
	if len(report.RuleSummary) == 0 {
		return
	}
	bold := r.colorFunc("bold")
	fmt.Fprintln(r.out, bold("\n■ 按规则汇总问题:"))
	fmt.Fprintln(r.out, "  规则ID     级别      次数    说明")
	fmt.Fprintln(r.out, "  ───────────────────────────────────────────────")

	rids := make([]string, 0, len(report.RuleSummary))
	for rid := range report.RuleSummary {
		rids = append(rids, rid)
	}
	sort.Strings(rids)
	for _, rid := range rids {
		cnt := report.RuleSummary[rid]
		sev := types.RuleSeverities[rid]
		sc := r.sevColor(sev)
		desc := types.RuleDescriptions[rid]
		fmt.Fprintf(r.out, "  %s  %-8s  %5d    %s\n", sc(rid), sev, cnt, desc)
	}
}

func (r *Reporter) PrintConsole(report *types.ValidationReport, detail bool) {
	r.PrintSummary(report)
	r.PrintFileReports(report, detail)
	r.PrintRuleSummary(report)

	bold := r.colorFunc("bold")
	red := r.colorFunc("red")
	green := r.colorFunc("green")
	yellow := r.colorFunc("yellow")

	fmt.Fprintln(r.out, bold("\n══════════════════════════════════════════════════════════════"))
	if report.HasCriticalErr {
		fmt.Fprintf(r.out, " %s 存在严重结构错误，请优先修复后重试\n", red("【失败】"))
	} else if report.TotalErrors > 0 {
		fmt.Fprintf(r.out, " %s 校验完成，存在 %d 个问题（可查看报告详情进行修复）\n", yellow("【警告】"), report.TotalErrors)
	} else {
		fmt.Fprintf(r.out, " %s 所有文件通过校验！\n", green("【成功】"))
	}
	fmt.Fprintln(r.out, bold("══════════════════════════════════════════════════════════════"))
}

func (r *Reporter) WriteJSON(path string, report *types.ValidationReport, pretty bool) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()

	enc := json.NewEncoder(f)
	enc.SetEscapeHTML(false)
	if pretty {
		enc.SetIndent("", "  ")
	}
	return enc.Encode(report)
}

func (r *Reporter) PrintSample(rows [][]string, header []string, maxWidth int) {
	if len(rows) == 0 && len(header) == 0 {
		fmt.Fprintln(r.out, "(空)")
		return
	}
	bold := r.colorFunc("bold")
	cyan := r.colorFunc("cyan")

	cols := header
	if len(cols) == 0 && len(rows) > 0 {
		cols = make([]string, len(rows[0]))
		for i := range cols {
			cols[i] = fmt.Sprintf("col%d", i+1)
		}
	} else if len(rows) > 0 && len(header) < len(rows[0]) {
		// ignore extra
	}

	widths := make([]int, len(cols))
	for i, c := range cols {
		widths[i] = len(c)
	}
	for _, row := range rows {
		for i := range widths {
			if i < len(row) {
				l := displayLen(row[i])
				if l > widths[i] {
					widths[i] = l
				}
			}
		}
	}
	for i := range widths {
		if maxWidth > 0 && widths[i] > maxWidth {
			widths[i] = maxWidth
		}
	}

	var sb strings.Builder
	sb.WriteString("┌")
	for i, w := range widths {
		if i > 0 {
			sb.WriteString("┬")
		}
		sb.WriteString(strings.Repeat("─", w+2))
	}
	sb.WriteString("┐")
	fmt.Fprintln(r.out, sb.String())

	sb.Reset()
	sb.WriteString("│")
	for i, c := range cols {
		pad := widths[i] - displayLen(c)
		if pad < 0 {
			pad = 0
		}
		sb.WriteString(" ")
		sb.WriteString(bold(truncate(c, widths[i])))
		sb.WriteString(strings.Repeat(" ", pad))
		sb.WriteString(" │")
	}
	fmt.Fprintln(r.out, sb.String())

	sb.Reset()
	sb.WriteString("├")
	for i, w := range widths {
		if i > 0 {
			sb.WriteString("┼")
		}
		sb.WriteString(strings.Repeat("─", w+2))
	}
	sb.WriteString("┤")
	fmt.Fprintln(r.out, sb.String())

	for ri, row := range rows {
		sb.Reset()
		sb.WriteString("│")
		for i := range widths {
			var val string
			if i < len(row) {
				val = row[i]
			}
			pad := widths[i] - displayLen(val)
			if pad < 0 {
				pad = 0
			}
			sb.WriteString(" ")
			prefix := ""
			if ri%2 == 1 {
				prefix = ""
			}
			_ = prefix
			sb.WriteString(cyan(truncate(val, widths[i])))
			sb.WriteString(strings.Repeat(" ", pad))
			sb.WriteString(" │")
		}
		fmt.Fprintln(r.out, sb.String())
	}

	sb.Reset()
	sb.WriteString("└")
	for i, w := range widths {
		if i > 0 {
			sb.WriteString("┴")
		}
		sb.WriteString(strings.Repeat("─", w+2))
	}
	sb.WriteString("┘")
	fmt.Fprintln(r.out, sb.String())
}

func displayLen(s string) int {
	l := 0
	for _, r := range s {
		if r > 127 {
			l += 2
		} else {
			l += 1
		}
	}
	return l
}

func truncate(s string, max int) string {
	if max <= 0 {
		return s
	}
	l := 0
	runes := []rune(s)
	for i, r := range runes {
		if r > 127 {
			l += 2
		} else {
			l += 1
		}
		if l > max {
			if i > 2 {
				return string(runes[:i-2]) + ".."
			}
			return string(runes[:i])
		}
	}
	return s
}

func filepathBase(s string) string {
	parts := strings.Split(s, "/")
	if len(parts) > 3 {
		return ".../" + strings.Join(parts[len(parts)-2:], "/")
	}
	return s
}

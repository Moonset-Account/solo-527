package report

import (
	"fmt"
	"io"
	"sort"
	"strings"
	"time"

	"github.com/backend-ops/logsum/internal/core"
	"github.com/backend-ops/logsum/pkg/logparser"
)

const (
	colorReset  = ""
	colorBold   = ""
	colorRed    = ""
	colorYellow = ""
	colorCyan   = ""
	colorGray   = ""
)

func RenderText(w io.Writer, stats *core.RunStats) error {
	tw := &textWriter{w: w}
	tw.writeHeader(stats)
	tw.writeSummary(stats)
	tw.writeClusters(stats)
	tw.writeContext(stats)
	return tw.err
}

type textWriter struct {
	w   io.Writer
	err error
}

func (t *textWriter) printf(format string, args ...interface{}) {
	if t.err != nil {
		return
	}
	_, t.err = fmt.Fprintf(t.w, format, args...)
}

func (t *textWriter) section(title string) {
	t.printf("\n%s%s%s\n%s\n", colorBold, title, colorReset, strings.Repeat("=", len(title)))
}

func (t *textWriter) writeHeader(s *core.RunStats) {
	title := "日志摘要与错误聚类报告"
	elapsed := time.Duration(0)
	if !s.FinishedAt.IsZero() {
		elapsed = s.FinishedAt.Sub(s.StartedAt)
	}
	t.printf("%s%s%s  (生成于 %s, 耗时 %v)\n",
		colorBold, title, colorReset,
		time.Now().Format("2006-01-02 15:04:05"),
		elapsed.Round(time.Millisecond))
	t.printf("输入源: %v\n", s.Inputs)
}

func (t *textWriter) writeSummary(s *core.RunStats) {
	t.section("总体统计")
	t.printf("  总行数:         %d\n", s.TotalLines)
	t.printf("  解析条目:       %d\n", s.ParsedEntries)
	t.printf("  解析问题:       %d\n", s.ParseErrors)
	t.printf("  匹配条目:       %d\n", s.MatchedEntries)
	if s.Clusters != nil {
		t.printf("  错误聚类数:     %d\n", s.Clusters.ClusterCount)

		if len(s.Clusters.Summary) > 0 {
			t.printf("  级别分布:       ")
			keys := make([]logparser.Level, 0, len(s.Clusters.Summary))
			for k := range s.Clusters.Summary {
				keys = append(keys, k)
			}
			sort.Slice(keys, func(i, j int) bool { return keys[i] < keys[j] })
			parts := make([]string, 0, len(keys))
			for _, k := range keys {
				parts = append(parts, fmt.Sprintf("%s=%d", k, s.Clusters.Summary[k]))
			}
			t.printf("%s\n", strings.Join(parts, ", "))
		}
		if len(s.Clusters.ByService) > 0 {
			t.printf("  按服务统计:     ")
			keys := make([]string, 0, len(s.Clusters.ByService))
			for k := range s.Clusters.ByService {
				keys = append(keys, k)
			}
			sort.Strings(keys)
			parts := make([]string, 0, len(keys))
			for _, k := range keys {
				parts = append(parts, fmt.Sprintf("%s=%d", k, s.Clusters.ByService[k]))
			}
			t.printf("%s\n", strings.Join(parts, ", "))
		}
	}
}

func (t *textWriter) writeClusters(s *core.RunStats) {
	if s.Clusters == nil || len(s.Clusters.Clusters) == 0 {
		t.section("错误聚类")
		t.printf("  (未发现匹配的错误条目)\n")
		return
	}
	t.section(fmt.Sprintf("Top %d 错误聚类", len(s.Clusters.Clusters)))
	for i, c := range s.Clusters.Clusters {
		t.writeCluster(i+1, c)
	}
}

func (t *textWriter) writeCluster(rank int, c *core.ErrorCluster) {
	svc := c.Service
	if svc == "" {
		svc = "<unknown>"
	}
	t.printf("\n  #%d [%s] %s  %s%s%s  (%dx)\n",
		rank, c.Level, svc,
		colorBold, truncate(c.Signature, 100), colorReset, c.Count)

	if c.Representative != nil {
		t.printf("     消息: %s\n", indentAndWrap(c.Representative.Message, 11, 100))
	}
	if !c.FirstSeen.IsZero() && !c.LastSeen.IsZero() {
		t.printf("     时间: %s .. %s\n",
			c.FirstSeen.Local().Format("01-02 15:04:05"),
			c.LastSeen.Local().Format("01-02 15:04:05"))
	}
	if len(c.Environments) > 0 {
		t.printf("     环境: ")
		keys := make([]string, 0, len(c.Environments))
		for k := range c.Environments {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		parts := make([]string, 0, len(keys))
		for _, k := range keys {
			parts = append(parts, fmt.Sprintf("%s×%d", k, c.Environments[k]))
		}
		t.printf("%s\n", strings.Join(parts, ", "))
	}
	if len(c.RequestIDs) > 0 {
		max := len(c.RequestIDs)
		if max > 5 {
			max = 5
		}
		t.printf("     请求ID: %s", strings.Join(c.RequestIDs[:max], ", "))
		if len(c.RequestIDs) > max {
			t.printf(" (共 %d 个)", len(c.RequestIDs))
		}
		t.printf("\n")
	}
	if c.Representative != nil && len(c.Representative.Stacktrace) > 0 {
		t.printf("     错误栈 (前3):\n")
		for i, f := range c.Representative.Stacktrace {
			if i >= 3 {
				break
			}
			t.printf("       %s:%d %s\n", f.File, f.Line, f.Function)
		}
	}
	if len(c.Samples) > 0 {
		t.printf("     样本位置 (共 %dx):\n", c.Count)
		for i, s := range c.Samples {
			src := s.SourceFile
			if src == "" {
				src = "<stdin>"
			}
			ts := ""
			if !s.Timestamp.IsZero() {
				ts = s.Timestamp.Local().Format("15:04:05") + " "
			}
			rid := ""
			if s.RequestID != "" {
				rid = " [" + s.RequestID + "]"
			}
			t.printf("       %d) %s:%d %s%s%s\n",
				i+1, src, s.LineNum, ts, truncate(s.Message, 80), rid)
		}
	}
}

func (t *textWriter) writeContext(s *core.RunStats) {
	if len(s.Windows) == 0 {
		return
	}
	t.section(fmt.Sprintf("上下文窗口 (%d 处匹配)", len(s.Windows)))
	for i, w := range s.Windows {
		t.printf("\n  [%d] -------------------------------------------------------------\n", i+1)
		for _, b := range w.Before {
			writeEntryLine(t, b, "  | ")
		}
		writeEntryLine(t, w.Center, "▶ | ")
		for _, a := range w.After {
			writeEntryLine(t, a, "  | ")
		}
	}
}

func writeEntryLine(t *textWriter, e *logparser.LogEntry, prefix string) {
	if e == nil {
		return
	}
	ts := ""
	if !e.Timestamp.IsZero() {
		ts = e.Timestamp.Local().Format("15:04:05") + " "
	}
	svc := e.Service
	if svc == "" {
		svc = "-"
	}
	rid := ""
	if e.RequestID != "" {
		rid = " (" + e.RequestID + ")"
	}
	src := ""
	if e.SourceFile != "" {
		src = fmt.Sprintf(" @%s:%d", e.SourceFile, e.LineNum)
	}
	msg := truncate(e.Message, 120)
	t.printf("%s%s%s %s%s%s %s%s\n",
		prefix, ts, e.Level, svc, rid, src, msg, colorReset)
}

func truncate(s string, max int) string {
	if max <= 0 {
		return s
	}
	s = strings.TrimSpace(s)
	if len(s) <= max {
		return s
	}
	return s[:max] + "..."
}

func indentAndWrap(s string, indent, width int) string {
	if width <= 0 {
		return s
	}
	indentStr := strings.Repeat(" ", indent)
	s = strings.TrimSpace(s)
	if len(s) == 0 {
		return s
	}
	lines := []string{}
	for len(s) > width {
		cut := width
		if idx := strings.LastIndexAny(s[:width], " \t,;"); idx > 0 {
			cut = idx
		}
		lines = append(lines, strings.TrimRight(s[:cut], " "))
		s = strings.TrimLeft(s[cut:], " ")
	}
	if s != "" {
		lines = append(lines, s)
	}
	if len(lines) == 0 {
		return ""
	}
	if len(lines) == 1 {
		return lines[0]
	}
	return lines[0] + "\n" + indentStr + strings.Join(lines[1:], "\n"+indentStr)
}

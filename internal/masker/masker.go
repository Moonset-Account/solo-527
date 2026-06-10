package masker

import (
	"strings"
	"unicode/utf8"

	"github.com/devops/envcheck/internal/types"
)

type Masker struct {
	maskKeys      map[string]bool
	maskPatterns  []string
	maskAll       bool
	maskChar      string
	keepStart     int
	keepEnd       int
}

func New(cfg *types.CheckConfig) *Masker {
	keySet := map[string]bool{}
	for _, k := range cfg.MaskKeys {
		keySet[strings.ToUpper(strings.TrimSpace(k))] = true
	}

	return &Masker{
		maskKeys:     keySet,
		maskPatterns: cfg.MaskPatterns,
		maskAll:      cfg.MaskAll,
		maskChar:     cfg.MaskChar,
		keepStart:    cfg.MaskKeepStart,
		keepEnd:      cfg.MaskKeepEnd,
	}
}

func (m *Masker) ShouldMask(key string) bool {
	if m.maskAll {
		return true
	}

	upperKey := strings.ToUpper(key)

	if m.maskKeys[upperKey] {
		return true
	}

	for _, pattern := range m.maskPatterns {
		if strings.Contains(upperKey, strings.ToUpper(pattern)) {
			return true
		}
	}

	return false
}

func (m *Masker) MaskValue(value string) string {
	if value == "" {
		return value
	}

	if m.keepStart == 0 && m.keepEnd == 0 {
		length := utf8.RuneCountInString(value)
		if length == 0 {
			return value
		}
		return strings.Repeat(m.maskChar, minRuneLen(length, 8))
	}

	runes := []rune(value)
	n := len(runes)

	startLen := minInt(m.keepStart, n)
	endLen := minInt(m.keepEnd, n-startLen)
	maskLen := n - startLen - endLen

	if maskLen <= 0 {
		return strings.Repeat(m.maskChar, minInt(n, 4))
	}

	prefix := string(runes[:startLen])
	suffix := string(runes[n-endLen:])
	masked := strings.Repeat(m.maskChar, maskLen)

	return prefix + masked + suffix
}

func (m *Masker) MaskEnvVar(v types.EnvVar) types.EnvVar {
	if m.ShouldMask(v.Key) {
		v.Value = m.MaskValue(v.Value)
		v.Masked = true
	}
	return v
}

func (m *Masker) MaskEnvFile(ef *types.EnvFile) *types.EnvFile {
	for i := range ef.Vars {
		ef.Vars[i] = m.MaskEnvVar(ef.Vars[i])
		if ef.VarMap != nil {
			if orig, ok := ef.VarMap[ef.Vars[i].Key]; ok {
				ef.VarMap[ef.Vars[i].Key] = m.MaskEnvVar(orig)
			}
		}
	}
	return ef
}

func (m *Masker) MaskEnvFiles(files []*types.EnvFile) {
	for _, f := range files {
		m.MaskEnvFile(f)
	}
}

func (m *Masker) MaskDiffs(diffs []types.DiffItem) []types.DiffItem {
	for i := range diffs {
		d := &diffs[i]
		if m.ShouldMask(d.Key) {
			if d.LeftValue != "" {
				d.LeftValue = m.MaskValue(d.LeftValue)
			}
			if d.RightValue != "" {
				d.RightValue = m.MaskValue(d.RightValue)
			}
		}
	}
	return diffs
}

func (m *Masker) MaskEnvMap(envMap map[string]types.EnvVar) map[string]types.EnvVar {
	result := map[string]types.EnvVar{}
	for k, v := range envMap {
		result[k] = m.MaskEnvVar(v)
	}
	return result
}

func MaskValueSimple(value string, maskChar string, keepStart, keepEnd int) string {
	if value == "" {
		return value
	}
	if maskChar == "" {
		maskChar = "*"
	}

	runes := []rune(value)
	n := len(runes)

	startLen := minInt(keepStart, n)
	endLen := minInt(keepEnd, n-startLen)
	maskLen := n - startLen - endLen

	if maskLen <= 0 {
		return strings.Repeat(maskChar, minInt(n, 4))
	}

	prefix := string(runes[:startLen])
	suffix := string(runes[n-endLen:])
	masked := strings.Repeat(maskChar, maskLen)

	return prefix + masked + suffix
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func minRuneLen(a, b int) int {
	if a < b {
		return a
	}
	return b
}

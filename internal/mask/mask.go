package mask

import (
	"regexp"
	"strings"
)

type Masker struct {
	patterns []*regexp.Regexp
}

func New(patterns []string) *Masker {
	m := &Masker{}
	for _, p := range patterns {
		re, err := regexp.Compile("(?i)" + regexp.QuoteMeta(p))
		if err != nil {
			continue
		}
		m.patterns = append(m.patterns, re)
	}
	return m
}

func (m *Masker) ShouldMask(key string) bool {
	for _, p := range m.patterns {
		if p.MatchString(key) {
			return true
		}
	}
	return false
}

func (m *Masker) MaskValue(key, value string) string {
	if m.ShouldMask(key) {
		if len(value) <= 4 {
			return "****"
		}
		return value[:2] + strings.Repeat("*", len(value)-4) + value[len(value)-2:]
	}
	return value
}

func (m *Masker) MaskMap(vars map[string]string) map[string]string {
	result := make(map[string]string, len(vars))
	for k, v := range vars {
		result[k] = m.MaskValue(k, v)
	}
	return result
}

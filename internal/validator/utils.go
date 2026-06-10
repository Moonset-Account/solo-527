package validator

import (
	"net/mail"
	"net/url"
	"strconv"
	"strings"
	"time"
	"unicode"
)

func isInt(s string) bool {
	s = strings.TrimSpace(s)
	if s == "" {
		return false
	}
	if s[0] == '-' || s[0] == '+' {
		s = s[1:]
	}
	if s == "" {
		return false
	}
	for _, r := range s {
		if !unicode.IsDigit(rune(r)) {
			return false
		}
	}
	return true
}

func isFloat(s string) bool {
	s = strings.TrimSpace(s)
	_, err := strconv.ParseFloat(s, 64)
	return err == nil
}

func parseFloat(s string) (float64, bool) {
	s = strings.TrimSpace(s)
	f, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return 0, false
	}
	return f, true
}

func isBool(s string) bool {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "true", "false", "1", "0", "yes", "no", "y", "n", "t", "f":
		return true
	}
	return false
}

func isDate(s string, layout string) bool {
	s = strings.TrimSpace(s)
	_, err := time.Parse(layout, s)
	return err == nil
}

func isEmail(s string) bool {
	s = strings.TrimSpace(s)
	addr, err := mail.ParseAddress(s)
	if err != nil {
		return false
	}
	return addr.Address == s && strings.Contains(s, "@") && len(s) > 3
}

func isURL(s string) bool {
	s = strings.TrimSpace(s)
	u, err := url.Parse(s)
	if err != nil {
		return false
	}
	return u.Scheme != "" && u.Host != ""
}

func containsString(list []string, s string) bool {
	for _, item := range list {
		if item == s {
			return true
		}
	}
	return false
}

func truncate(s string, max int) string {
	runes := []rune(s)
	if len(runes) <= max {
		return s
	}
	return string(runes[:max]) + "..."
}

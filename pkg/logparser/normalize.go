package logparser

import (
	"regexp"
	"strings"
)

var (
	uuidRegexp     = regexp.MustCompile(`[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}`)
	numRegexp      = regexp.MustCompile(`\b\d+(\.\d+)?\b`)
	hexRegexp      = regexp.MustCompile(`\b0x[0-9a-fA-F]+\b`)
	ipRegexp       = regexp.MustCompile(`\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b`)
	pathVarRegexp  = regexp.MustCompile(`/{[^}]+}`)
	quotedRegexp   = regexp.MustCompile(`"[^"]*"`)
	whitespaceRe   = regexp.MustCompile(`\s+`)
)

func normalizeMessage(msg string) string {
	s := msg
	s = uuidRegexp.ReplaceAllString(s, "<UUID>")
	s = ipRegexp.ReplaceAllString(s, "<IP>")
	s = hexRegexp.ReplaceAllString(s, "<HEX>")
	s = numRegexp.ReplaceAllString(s, "<NUM>")
	s = pathVarRegexp.ReplaceAllString(s, "/<VAR>")
	s = quotedRegexp.ReplaceAllString(s, "\"<STR>\"")
	s = whitespaceRe.ReplaceAllString(s, " ")
	return strings.TrimSpace(s)
}

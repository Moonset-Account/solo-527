package ignore

import (
	"path/filepath"
	"strings"

	"csvchecker/internal/types"
)

type Manager struct {
	ignoreRuleIDs    map[string]bool
	ignoreColumns    map[string]bool
	ignoreFiles      map[string]bool
	schemaRules      []types.IgnoreRule
}

func NewManager() *Manager {
	return &Manager{
		ignoreRuleIDs: make(map[string]bool),
		ignoreColumns: make(map[string]bool),
		ignoreFiles:   make(map[string]bool),
	}
}

func (m *Manager) AddRuleIDs(ids []string) {
	for _, id := range ids {
		m.ignoreRuleIDs[strings.TrimSpace(id)] = true
	}
}

func (m *Manager) AddColumns(cols []string) {
	for _, c := range cols {
		m.ignoreColumns[strings.TrimSpace(c)] = true
	}
}

func (m *Manager) AddFiles(files []string) {
	for _, f := range files {
		abs, _ := filepath.Abs(f)
		m.ignoreFiles[abs] = true
		m.ignoreFiles[strings.TrimSpace(f)] = true
	}
}

func (m *Manager) AddSchemaRules(rules []types.IgnoreRule) {
	m.schemaRules = append(m.schemaRules, rules...)
}

func (m *Manager) ShouldIgnore(file string, column string, ruleID string) bool {
	if m.ignoreRuleIDs[ruleID] {
		return true
	}
	if column != "" && m.ignoreColumns[column] {
		return true
	}
	absFile, _ := filepath.Abs(file)
	if m.ignoreFiles[absFile] || m.ignoreFiles[file] {
		return true
	}
	fileBase := filepath.Base(file)
	if m.ignoreFiles[fileBase] {
		return true
	}

	for _, rule := range m.schemaRules {
		if m.ruleMatches(rule, file, column, ruleID, absFile, fileBase) {
			return true
		}
	}
	return false
}

func (m *Manager) ruleMatches(rule types.IgnoreRule, file, column, ruleID, absFile, fileBase string) bool {
	ruleMatch := len(rule.RuleIDs) == 0
	for _, rid := range rule.RuleIDs {
		if rid == ruleID {
			ruleMatch = true
			break
		}
	}
	if !ruleMatch {
		return false
	}

	colMatch := len(rule.Columns) == 0
	for _, col := range rule.Columns {
		if col == column {
			colMatch = true
			break
		}
	}
	if !colMatch {
		return false
	}

	fileMatch := len(rule.Files) == 0
	for _, f := range rule.Files {
		if f == file || f == absFile || f == fileBase {
			fileMatch = true
			break
		}
		matched, _ := filepath.Match(f, fileBase)
		if matched {
			fileMatch = true
			break
		}
	}
	return fileMatch
}

func (m *Manager) Filter(errors []types.ValidationError) []types.ValidationError {
	if len(errors) == 0 {
		return errors
	}
	filtered := make([]types.ValidationError, 0, len(errors))
	for _, e := range errors {
		if !m.ShouldIgnore(e.File, e.Column, e.RuleID) {
			filtered = append(filtered, e)
		}
	}
	return filtered
}

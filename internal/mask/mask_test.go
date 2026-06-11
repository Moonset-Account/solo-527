package mask

import "testing"

func TestShouldMask(t *testing.T) {
	m := New([]string{"PASSWORD", "SECRET", "TOKEN", "KEY"})

	tests := []struct {
		key      string
		expected bool
	}{
		{"DATABASE_PASSWORD", true},
		{"API_KEY", true},
		{"SECRET_TOKEN", true},
		{"APP_NAME", false},
		{"password", true},
		{"MySecret", true},
	}

	for _, tt := range tests {
		result := m.ShouldMask(tt.key)
		if result != tt.expected {
			t.Errorf("ShouldMask(%q) = %v, want %v", tt.key, result, tt.expected)
		}
	}
}

func TestMaskValue_ShortValue(t *testing.T) {
	m := New([]string{"KEY"})
	result := m.MaskValue("API_KEY", "ab")
	if result != "****" {
		t.Errorf("short values should be fully masked, got %q", result)
	}
}

func TestMaskValue_LongValue(t *testing.T) {
	m := New([]string{"KEY"})
	result := m.MaskValue("API_KEY", "sk-1234567890abcdef")
	if result == "sk-1234567890abcdef" {
		t.Error("long value should be partially masked")
	}
	if len(result) != len("sk-1234567890abcdef") {
		t.Errorf("masked value length should match original, got %d vs %d", len(result), len("sk-1234567890abcdef"))
	}
}

func TestMaskValue_NoMasking(t *testing.T) {
	m := New([]string{"PASSWORD"})
	result := m.MaskValue("APP_NAME", "myapp")
	if result != "myapp" {
		t.Errorf("non-sensitive value should not be masked, got %q", result)
	}
}

func TestMaskMap(t *testing.T) {
	m := New([]string{"PASSWORD", "KEY"})
	vars := map[string]string{
		"DB_PASSWORD": "secret123",
		"APP_NAME":    "myapp",
	}
	result := m.MaskMap(vars)
	if result["APP_NAME"] != "myapp" {
		t.Error("APP_NAME should not be masked")
	}
	if result["DB_PASSWORD"] == "secret123" {
		t.Error("DB_PASSWORD should be masked")
	}
}

func TestNew_EmptyPatterns(t *testing.T) {
	m := New([]string{})
	if len(m.patterns) != 0 {
		t.Error("empty pattern list should produce no patterns")
	}
}

func TestNew_QuoteMetaEscapes(t *testing.T) {
	m := New([]string{"API[KEY]"})
	if len(m.patterns) != 1 {
		t.Fatal("QuoteMeta should make bracket pattern valid")
	}
	if !m.ShouldMask("API[KEY]") {
		t.Error("should match the literal pattern with brackets")
	}
}

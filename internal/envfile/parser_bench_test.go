package envfile

import (
	"strings"
	"testing"
)

func BenchmarkParseReader(b *testing.B) {
	var lines []string
	for i := 0; i < 1000; i++ {
		lines = append(lines, "VAR_"+strings.Repeat("A", 5)+"=value_"+strings.Repeat("B", 20))
	}
	input := strings.Join(lines, "\n")

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = ParseReader(strings.NewReader(input), "bench.env")
	}
}

func BenchmarkParseReaderSmall(b *testing.B) {
	input := "DATABASE_URL=postgres://localhost/mydb\nREDIS_URL=redis://localhost:6379\nAPI_KEY=sk-12345\n"
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = ParseReader(strings.NewReader(input), "bench.env")
	}
}

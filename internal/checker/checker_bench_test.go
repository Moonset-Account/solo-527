package checker

import (
	"fmt"
	"testing"

	"github.com/envcheck/envcheck/internal/envfile"
	"github.com/envcheck/envcheck/internal/mask"
)

func BenchmarkCheck(b *testing.B) {
	m := mask.New([]string{"PASSWORD", "SECRET", "KEY"})

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		chk := New(m, []string{"DATABASE_URL", "REDIS_URL"}, true)
		envVars := make(map[string]string)
		exVars := make(map[string]string)
		for j := 0; j < 100; j++ {
			key := fmt.Sprintf("VAR_%d", j)
			envVars[key] = fmt.Sprintf("value_%d", j)
			exVars[key] = ""
		}
		envVars["DATABASE_URL"] = "postgres://localhost"
		envVars["REDIS_URL"] = "redis://localhost"
		chk.AddEnvFile(makeEnvFile(".env", envVars))
		chk.AddExampleFile(makeEnvFile(".env.example", exVars))
		chk.Check()
	}
}

func makeEnvFileBench(path string, n int) *envfile.EnvFile {
	ef := &envfile.EnvFile{Path: path, Vars: make(map[string]envfile.EnvVar)}
	for i := 0; i < n; i++ {
		key := fmt.Sprintf("VAR_%d", i)
		ef.Vars[key] = envfile.EnvVar{Key: key, Value: fmt.Sprintf("val_%d", i)}
	}
	return ef
}

func BenchmarkCheckLarge(b *testing.B) {
	m := mask.New(nil)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		chk := New(m, nil, false)
		chk.AddEnvFile(makeEnvFileBench(".env", 500))
		chk.AddEnvFile(makeEnvFileBench(".env.prod", 500))
		chk.Check()
	}
}

package validator

import (
	"encoding/csv"
	"os"
	"path/filepath"
	"testing"

	"csvchecker/internal/ignore"
	"csvchecker/internal/types"
)

func boolPtr(b bool) *bool { return &b }

func newTestValidator(s *types.CSVSchema) *Validator {
	return New(s, ignore.NewManager())
}

func writeTempCSV(name string, header []string, rows [][]string) string {
	dir, _ := os.MkdirTemp("", "csv-*")
	path := filepath.Join(dir, name)
	f, _ := os.Create(path)
	defer f.Close()
	w := csv.NewWriter(f)
	if header != nil {
		w.Write(header)
	}
	for _, r := range rows {
		w.Write(r)
	}
	w.Flush()
	return path
}

func TestEmptyFile(t *testing.T) {
	s := &types.CSVSchema{
		Name:      "test",
		HasHeader: boolPtr(true),
		Columns: []types.ColumnSchema{
			{Name: "id", Type: types.TypeString, Required: true, PrimaryKey: true},
		},
		PrimaryKeys: []string{"id"},
	}
	v := newTestValidator(s)

	emptyPath := writeTempCSV("empty.csv", nil, nil)
	defer os.RemoveAll(filepath.Dir(emptyPath))
	// truncate to 0 bytes
	os.Truncate(emptyPath, 0)

	r, err := v.ValidateFile(emptyPath)
	if err != nil {
		t.Fatalf("ValidateFile failed: %v", err)
	}
	found := false
	for _, e := range r.Errors {
		if e.RuleID == types.RuleEmptyFile {
			found = true
			if e.Severity != types.SeverityCritical {
				t.Errorf("expected CRITICAL for empty file, got %s", e.Severity)
			}
		}
	}
	if !found {
		t.Errorf("expected RuleEmptyFile error, got errors: %v", r.Errors)
	}
}

func TestHeaderOnly_NoDataRows(t *testing.T) {
	s := &types.CSVSchema{
		Name:      "test",
		HasHeader: boolPtr(true),
		Columns: []types.ColumnSchema{
			{Name: "id", Type: types.TypeString, Required: true},
		},
	}
	v := newTestValidator(s)
	path := writeTempCSV("hdr.csv", []string{"id"}, nil)
	defer os.RemoveAll(filepath.Dir(path))
	r, err := v.ValidateFile(path)
	if err != nil {
		t.Fatal(err)
	}
	if len(r.Errors) == 0 {
		t.Fatal("expected E006 for no data rows")
	}
}

func TestMissingRequiredColumn(t *testing.T) {
	s := &types.CSVSchema{
		Name:      "test",
		HasHeader: boolPtr(true),
		Columns: []types.ColumnSchema{
			{Name: "id", Type: types.TypeString, Required: true, PrimaryKey: true},
			{Name: "name", Type: types.TypeString, Required: true},
			{Name: "age", Type: types.TypeInt},
		},
		PrimaryKeys: []string{"id"},
	}
	v := newTestValidator(s)
	path := writeTempCSV("miss.csv", []string{"id", "age"}, [][]string{
		{"1", "30"},
	})
	defer os.RemoveAll(filepath.Dir(path))
	r, err := v.ValidateFile(path)
	if err != nil {
		t.Fatal(err)
	}
	found := false
	for _, e := range r.Errors {
		if e.RuleID == types.RuleMissingColumn && e.Column == "name" {
			found = true
		}
	}
	if !found {
		t.Errorf("expected missing 'name' column, got: %+v", r.Errors)
	}
}

func TestTypeMismatch_IntFloatDate(t *testing.T) {
	s := &types.CSVSchema{
		Name:      "test",
		HasHeader: boolPtr(true),
		Columns: []types.ColumnSchema{
			{Name: "id", Type: types.TypeString, Required: true, PrimaryKey: true},
			{Name: "age", Type: types.TypeInt},
			{Name: "score", Type: types.TypeFloat},
			{Name: "birthday", Type: types.TypeDate, DateFormats: []string{"2006-01-02"}},
		},
		PrimaryKeys: []string{"id"},
	}
	v := newTestValidator(s)
	path := writeTempCSV("types.csv",
		[]string{"id", "age", "score", "birthday"},
		[][]string{
			{"1", "abc", "1.5", "2020-01-01"},
			{"2", "25", "not-num", "2020-01-01"},
			{"3", "30", "3.14", "bad-date"},
			{"4", "40", "5", "2020-02-29"}, // valid leap year
		})
	defer os.RemoveAll(filepath.Dir(path))
	r, err := v.ValidateFile(path)
	if err != nil {
		t.Fatal(err)
	}
	counts := map[string]int{}
	for _, e := range r.Errors {
		counts[e.RuleID]++
	}
	if counts[types.RuleTypeMismatch] != 2 {
		t.Errorf("expected 2 TypeMismatch, got %d (errors: %+v)", counts[types.RuleTypeMismatch], r.Errors)
	}
	if counts[types.RuleDateFormatError] != 1 {
		t.Errorf("expected 1 DateFormatError, got %d", counts[types.RuleDateFormatError])
	}
	if r.ValidRows != 1 {
		t.Errorf("expected 1 valid row, got %d", r.ValidRows)
	}
}

func TestEnumOutOfRange(t *testing.T) {
	min := 0.0
	max := 100.0
	s := &types.CSVSchema{
		Name:      "test",
		HasHeader: boolPtr(true),
		Columns: []types.ColumnSchema{
			{Name: "id", Type: types.TypeString, Required: true, PrimaryKey: true},
			{Name: "gender", Type: types.TypeEnum, EnumValues: []string{"M", "F", "O"}},
			{Name: "age", Type: types.TypeInt, Min: &min, Max: &max},
		},
		PrimaryKeys: []string{"id"},
	}
	v := newTestValidator(s)
	path := writeTempCSV("enum.csv",
		[]string{"id", "gender", "age"},
		[][]string{
			{"1", "M", "30"},
			{"2", "X", "50"},    // bad enum
			{"3", "F", "200"},   // exceed max
			{"4", "O", "-10"},   // below min
			{"5", "F", "abc"},   // bad int
		})
	defer os.RemoveAll(filepath.Dir(path))
	r, err := v.ValidateFile(path)
	if err != nil {
		t.Fatal(err)
	}
	counts := map[string]int{}
	for _, e := range r.Errors {
		counts[e.RuleID]++
	}
	if counts[types.RuleEnumOutOfRange] != 1 {
		t.Errorf("expected 1 EnumOutOfRange, got %d", counts[types.RuleEnumOutOfRange])
	}
	if counts[types.RuleTypeMismatch] != 3 {
		t.Errorf("expected 3 TypeMismatch, got %d", counts[types.RuleTypeMismatch])
	}
}

func TestDuplicatePrimaryKey(t *testing.T) {
	s := &types.CSVSchema{
		Name:      "test",
		HasHeader: boolPtr(true),
		Columns: []types.ColumnSchema{
			{Name: "id", Type: types.TypeString, Required: true, PrimaryKey: true},
			{Name: "name", Type: types.TypeString},
		},
		PrimaryKeys: []string{"id"},
	}
	v := newTestValidator(s)
	path := writeTempCSV("dup.csv",
		[]string{"id", "name"},
		[][]string{
			{"A1", "x"},
			{"A2", "y"},
			{"A1", "z"}, // duplicate
			{"A2", "w"}, // duplicate
			{"A3", "v"},
		})
	defer os.RemoveAll(filepath.Dir(path))
	r, err := v.ValidateFile(path)
	if err != nil {
		t.Fatal(err)
	}
	pkCount := 0
	for _, e := range r.Errors {
		if e.RuleID == types.RuleDuplicatePrimary {
			pkCount++
		}
	}
	if pkCount != 2 {
		t.Errorf("expected 2 duplicate PK errors, got %d", pkCount)
	}
}

func TestChineseColumnNames(t *testing.T) {
	s := &types.CSVSchema{
		Name:         "中文列名",
		BusinessLine: "usercenter",
		HasHeader:    boolPtr(true),
		Columns: []types.ColumnSchema{
			{Name: "用户ID", Type: types.TypeString, Required: true, PrimaryKey: true},
			{Name: "手机号", Type: types.TypeString, Required: true, Pattern: `^1[3-9]\d{9}$`},
			{Name: "等级", Type: types.TypeEnum, EnumValues: []string{"普通", "银卡", "金卡"}},
			{Name: "积分", Type: types.TypeInt},
		},
		PrimaryKeys: []string{"用户ID"},
	}
	v := newTestValidator(s)
	path := writeTempCSV("中文.csv",
		[]string{"用户ID", "手机号", "等级", "积分"},
		[][]string{
			{"U001", "13800138000", "金卡", "800"},
			{"U002", "12345", "钻石", "abc"},
			{"U001", "13900139000", "普通", "100"}, // duplicate PK
		})
	defer os.RemoveAll(filepath.Dir(path))
	r, err := v.ValidateFile(path)
	if err != nil {
		t.Fatal(err)
	}
	counts := map[string]int{}
	for _, e := range r.Errors {
		counts[e.RuleID]++
	}
	if counts[types.RuleTypeMismatch] != 2 { // regex + int parse
		t.Errorf("expected 2 type mismatch, got %d. Errors: %+v", counts[types.RuleTypeMismatch], r.Errors)
	}
	if counts[types.RuleEnumOutOfRange] != 1 {
		t.Errorf("expected 1 enum error, got %d", counts[types.RuleEnumOutOfRange])
	}
	if counts[types.RuleDuplicatePrimary] != 1 {
		t.Errorf("expected 1 PK dup, got %d", counts[types.RuleDuplicatePrimary])
	}
}

func TestCompositePrimaryKey(t *testing.T) {
	s := &types.CSVSchema{
		Name:      "composite",
		HasHeader: boolPtr(true),
		Columns: []types.ColumnSchema{
			{Name: "user_id", Type: types.TypeString, PrimaryKey: true},
			{Name: "product_id", Type: types.TypeString, PrimaryKey: true},
			{Name: "rating", Type: types.TypeInt},
		},
		PrimaryKeys: []string{"user_id", "product_id"},
	}
	v := newTestValidator(s)
	path := writeTempCSV("comp.csv",
		[]string{"user_id", "product_id", "rating"},
		[][]string{
			{"U1", "P1", "5"},
			{"U1", "P2", "4"},
			{"U2", "P1", "3"},
			{"U1", "P1", "5"}, // dup composite
		})
	defer os.RemoveAll(filepath.Dir(path))
	r, err := v.ValidateFile(path)
	if err != nil {
		t.Fatal(err)
	}
	dupN := 0
	for _, e := range r.Errors {
		if e.RuleID == types.RuleDuplicatePrimary {
			dupN++
		}
	}
	if dupN != 1 {
		t.Errorf("expected 1 composite dup, got %d", dupN)
	}
}

func TestUnexpectedColumns_Warning(t *testing.T) {
	s := &types.CSVSchema{
		Name:      "test",
		HasHeader: boolPtr(true),
		Columns: []types.ColumnSchema{
			{Name: "id", Type: types.TypeString},
		},
	}
	v := newTestValidator(s)
	path := writeTempCSV("extra.csv",
		[]string{"id", "extra_col", "another"},
		[][]string{{"1", "x", "y"}})
	defer os.RemoveAll(filepath.Dir(path))
	r, err := v.ValidateFile(path)
	if err != nil {
		t.Fatal(err)
	}
	n := 0
	for _, e := range r.Errors {
		if e.RuleID == types.RuleUnexpectedColumn {
			n++
		}
	}
	if n != 2 {
		t.Errorf("expected 2 unexpected columns, got %d", n)
	}
}

func TestMaxErrorsLimit(t *testing.T) {
	s := &types.CSVSchema{
		Name:      "test",
		HasHeader: boolPtr(true),
		Columns: []types.ColumnSchema{
			{Name: "id", Type: types.TypeString, PrimaryKey: true},
			{Name: "num", Type: types.TypeInt},
		},
		PrimaryKeys: []string{"id"},
	}
	v := newTestValidator(s)
	v.SetMaxErrors(3)
	rows := [][]string{}
	for i := 0; i < 100; i++ {
		rows = append(rows, []string{string(rune('A' + i%26)), "not_a_number"})
	}
	path := writeTempCSV("big.csv", []string{"id", "num"}, rows)
	defer os.RemoveAll(filepath.Dir(path))
	r, err := v.ValidateFile(path)
	if err != nil {
		t.Fatal(err)
	}
	if len(r.Errors) > 3 {
		t.Errorf("expected <= 3 errors with max-errors=3, got %d", len(r.Errors))
	}
}

func TestBatchRun(t *testing.T) {
	s := &types.CSVSchema{
		Name:      "test",
		HasHeader: boolPtr(true),
		Columns: []types.ColumnSchema{
			{Name: "id", Type: types.TypeString, PrimaryKey: true},
			{Name: "num", Type: types.TypeInt},
		},
		PrimaryKeys: []string{"id"},
	}
	v := newTestValidator(s)

	good := writeTempCSV("g.csv", []string{"id", "num"}, [][]string{{"1", "10"}})
	bad := writeTempCSV("b.csv", []string{"id"}, nil) // missing col + no data
	defer os.RemoveAll(filepath.Dir(good))
	defer os.RemoveAll(filepath.Dir(bad))

	r := RunBatch(v, []string{good, bad})
	if r.TotalFiles != 2 {
		t.Errorf("expected 2 files, got %d", r.TotalFiles)
	}
	if !r.HasCriticalErr {
		t.Error("expected HasCriticalErr true because of bad file")
	}
	if r.PassedFiles != 1 || r.FailedFiles != 1 {
		t.Errorf("expected 1 passed / 1 failed, got %d/%d", r.PassedFiles, r.FailedFiles)
	}
}

func TestRunBatchLargeDataset(t *testing.T) {
	s := &types.CSVSchema{
		Name:      "perf-test",
		HasHeader: boolPtr(true),
		Columns: []types.ColumnSchema{
			{Name: "id", Type: types.TypeString, PrimaryKey: true},
			{Name: "value", Type: types.TypeInt},
			{Name: "cat", Type: types.TypeEnum, EnumValues: []string{"A", "B", "C"}},
		},
		PrimaryKeys: []string{"id"},
	}
	v := newTestValidator(s)

	n := 10000
	rows := make([][]string, n)
	for i := 0; i < n; i++ {
		cat := "A"
		val := "100"
		if i%500 == 0 {
			cat = "Z"
		}
		if i%700 == 0 {
			val = "not-int"
		}
		rows[i] = []string{string(rune('A' + i%26)) + string(rune('0' + i%10)) + "-" + string(rune(i)), val, cat}
	}
	path := writeTempCSV("perf.csv", []string{"id", "value", "cat"}, rows)
	defer os.RemoveAll(filepath.Dir(path))

	r := RunBatch(v, []string{path})
	if r.TotalRows != n {
		t.Errorf("expected %d rows, got %d", n, r.TotalRows)
	}
}

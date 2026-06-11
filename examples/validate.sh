#!/usr/bin/env bash
set -e

echo "========================================"
echo "  logsum Validation Test Suite"
echo "========================================"
echo ""

PASS=0
FAIL=0
TOTAL=0

run_test() {
    local test_name="$1"
    local cmd="$2"
    local expected_exit_code="$3"
    local description="$4"

    TOTAL=$((TOTAL + 1))
    echo -n "Test $TOTAL: $test_name... "

    local exit_code
    set +e
    eval "$cmd" > /tmp/logsum_test_output.json 2>&1
    exit_code=$?
    set -e

    if [ "$exit_code" -eq "$expected_exit_code" ]; then
        echo -e "\033[32mPASS\033[0m"
        PASS=$((PASS + 1))
    else
        echo -e "\033[31mFAIL\033[0m"
        echo "  Expected exit code: $expected_exit_code, Got: $exit_code"
        echo "  Command: $cmd"
        echo "  Output:"
        cat /tmp/logsum_test_output.json | head -20
        FAIL=$((FAIL + 1))
    fi

    if [ -n "$description" ]; then
        echo "  $description"
    fi
    echo ""
}

validate_json() {
    local test_name="$1"
    local cmd="$2"
    local description="$3"

    TOTAL=$((TOTAL + 1))
    echo -n "Test $TOTAL: $test_name... "

    set +e
    eval "$cmd" > /tmp/logsum_test_output.json 2>&1
    set -e

    if python3 -c "import json; json.load(open('/tmp/logsum_test_output.json'))" 2>/dev/null; then
        echo -e "\033[32mPASS\033[0m"
        PASS=$((PASS + 1))
    else
        echo -e "\033[31mFAIL\033[0m"
        echo "  Output is not valid JSON"
        cat /tmp/logsum_test_output.json
        FAIL=$((FAIL + 1))
    fi

    if [ -n "$description" ]; then
        echo "  $description"
    fi
    echo ""
}

validate_json_field() {
    local test_name="$1"
    local cmd="$2"
    local field="$3"
    local expected_value="$4"

    TOTAL=$((TOTAL + 1))
    echo -n "Test $TOTAL: $test_name... "

    local cmd_exit
    set +e
    eval "$cmd" > /tmp/logsum_test_output.json 2>&1
    cmd_exit=$?
    set -e

    if [ "$cmd_exit" -ne 0 ]; then
        echo -e "\033[31mFAIL\033[0m"
        echo "  Command failed (exit $cmd_exit)"
        echo "  Output:"
        cat /tmp/logsum_test_output.json | head -20
        FAIL=$((FAIL + 1))
        echo ""
        return
    fi

    local actual_value
    local parse_exit
    set +e
    actual_value=$(python3 -c "
import json, sys
data = json.load(open('/tmp/logsum_test_output.json'))
keys = '$field'.split('.')
val = data
for k in keys:
    if k == 'len(Clusters)' or k == 'len(TopErrors)':
        k = k[4:-1]
        val = len(val[k])
    elif k.isdigit():
        val = val[int(k)]
    else:
        val = val[k]
print(val)
" 2>/dev/null)
    parse_exit=$?
    set -e

    if [ "$parse_exit" -ne 0 ] || [ -z "$actual_value" -a -n "$expected_value" ]; then
        echo -e "\033[31mFAIL\033[0m"
        echo "  Failed to parse JSON field: $field"
        FAIL=$((FAIL + 1))
    elif [ "$actual_value" = "$expected_value" ]; then
        echo -e "\033[32mPASS\033[0m"
        PASS=$((PASS + 1))
    else
        echo -e "\033[31mFAIL\033[0m"
        echo "  Field: $field"
        echo "  Expected: $expected_value, Got: $actual_value"
        FAIL=$((FAIL + 1))
    fi
    echo ""
}

echo "Building logsum..."
go build -o /tmp/logsum ./cmd/logsum
echo ""

echo "Running exit code tests..."
echo "----------------------------------------"
run_test "Success - no errors" \
    "/tmp/logsum --input ./testdata --since 24h --json 2>/dev/null | python3 -c \"import json,sys; d=json.load(sys.stdin); sys.exit(1 if d['ErrorEntries']>0 else 0)\"" \
    0 \
    "Should succeed (no data for 24h filter on old data)"

run_test "Invalid time format" \
    "/tmp/logsum --since invalid-time" \
    1 \
    "Exit code 1 for config errors"

run_test "Non-existent input path" \
    "/tmp/logsum --input /nonexistent/path" \
    2 \
    "Exit code 2 for input errors"

run_test "CI mode - data found" \
    "/tmp/logsum --input ./testdata/microservices.sample --ci" \
    11 \
    "Exit code 11 when errors found in CI mode"

run_test "CI mode - no data" \
    "/tmp/logsum --input ./testdata --since 1h --ci 2>/dev/null" \
    10 \
    "Exit code 10 when no data in CI mode"

echo ""
echo "Running JSON output tests..."
echo "----------------------------------------"

validate_json "JSON output format" \
    "/tmp/logsum --input ./testdata/microservices.sample --json" \
    "Output should be valid JSON"

validate_json "JSON output with service filter" \
    "/tmp/logsum --input ./testdata/microservices.sample --service api-gateway --json" \
    "Filtered output should be valid JSON"

validate_json "JSON error format" \
    "/tmp/logsum --since invalid --json 2>&1" \
    "Errors should also be valid JSON with --json"

echo ""
echo "Running report field validation..."
echo "----------------------------------------"

validate_json_field "TotalEntries field" \
    "/tmp/logsum --input ./testdata/microservices.sample --json" \
    "TotalEntries" \
    "11"

validate_json_field "ErrorEntries field" \
    "/tmp/logsum --input ./testdata/microservices.sample --json" \
    "ErrorEntries" \
    "8"

validate_json_field "WarningEntries field" \
    "/tmp/logsum --input ./testdata/microservices.sample --json" \
    "WarningEntries" \
    "3"

validate_json_field "Clusters count" \
    "/tmp/logsum --input ./testdata/microservices.sample --json" \
    "len(Clusters)" \
    "8"

validate_json_field "TopErrors count with --top" \
    "/tmp/logsum --input ./testdata/microservices.sample --top 3 --json" \
    "len(TopErrors)" \
    "3"

validate_json_field "Service filter works" \
    "/tmp/logsum --input ./testdata/microservices.sample --service api-gateway --json" \
    "TotalEntries" \
    "3"

validate_json_field "Cluster count via python subcommand" \
    "/tmp/logsum --input ./testdata/microservices.sample --json" \
    "len(Clusters)" \
    "8"

echo ""
echo "Running multi-file tests..."
echo "----------------------------------------"

validate_json "Multiple input files" \
    "/tmp/logsum --input ./testdata/microservices.sample,./testdata/bracket-format.sample --json" \
    "Should parse multiple files"

validate_json_field "Multi-file total entries" \
    "/tmp/logsum --input ./testdata/microservices.sample,./testdata/bracket-format.sample --json" \
    "TotalEntries" \
    "18"

echo ""
echo "Running CI output tests..."
echo "----------------------------------------"

run_test "CI output contains machine-readable vars" \
    "/tmp/logsum --input ./testdata/microservices.sample --ci 2>&1 | grep -q 'ERROR_COUNT='" \
    0 \
    "CI output should include ERROR_COUNT="

run_test "CI output includes TOP_ERROR" \
    "/tmp/logsum --input ./testdata/microservices.sample --ci 2>&1 | grep -q 'TOP_ERROR='" \
    0 \
    "CI output should include TOP_ERROR="

echo ""
echo "----------------------------------------"
echo "  Test Summary: $PASS/$TOTAL passed"
if [ "$FAIL" -gt 0 ]; then
    echo -e "\033[31m  $FAIL test(s) failed\033[0m"
    exit 1
else
    echo -e "\033[32m  All tests passed!\033[0m"
    exit 0
fi

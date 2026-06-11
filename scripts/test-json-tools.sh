#!/usr/bin/env bash
set -e

SAMPLE='{"exitCode":4,"success":false,"version":"0.1.0"}'
echo "样本: $SAMPLE"
echo ""

echo "1) _json_check: d.exitCode === 4"
echo "$SAMPLE" | node -e '
const fs = require("fs");
const d = JSON.parse(fs.readFileSync("/dev/stdin", "utf8"));
const ok = !!((d.exitCode === 4));
process.exit(ok ? 0 : 1);
'
echo "   通过"
echo ""

echo "2) _json_extract: d.success"
echo "$SAMPLE" | node -e '
const fs = require("fs");
const d = JSON.parse(fs.readFileSync("/dev/stdin", "utf8"));
const val = d.success;
if (val === undefined) { process.stdout.write("undefined"); }
else if (val === null) { process.stdout.write("null"); }
else if (typeof val === "object") { process.stdout.write(JSON.stringify(val)); }
else { process.stdout.write(String(val)); }
'
echo ""
echo "   通过"
echo ""

echo "3) assert_json_field_eq 关键逻辑: (d.exitCode) === (4)"
echo "$SAMPLE" | node -e '
const fs = require("fs");
const d = JSON.parse(fs.readFileSync("/dev/stdin", "utf8"));
const ok = (d.exitCode) === (4);
const ok2 = (d.success) === (false);
console.log("exitCode===4:", ok, " success===false:", ok2);
process.exit((ok && ok2) ? 0 : 1);
'
echo "   通过"

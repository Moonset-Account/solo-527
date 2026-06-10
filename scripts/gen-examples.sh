#!/usr/bin/env bash
set -euo pipefail

echo "创建示例 Schema 和 CSV ..."
mkdir -p examples

cat > examples/schema_users.json <<'SCHEMA'
{
  "name": "UserImportSchema",
  "description": "用户基础信息导入Schema",
  "version": "1.0.0",
  "delimiter": ",",
  "has_header": true,
  "primary_keys": ["user_id"],
  "unique_keys": [["email"]],
  "fields": [
    {"name": "user_id", "type": "string", "required": true, "unique": true, "description": "用户唯一ID"},
    {"name": "username", "type": "string", "required": true, "min_length": 2, "max_length": 50},
    {"name": "email", "type": "email", "required": true},
    {"name": "age", "type": "int", "min_value": 0, "max_value": 150},
    {"name": "role", "type": "enum", "enum_values": ["admin", "editor", "viewer", "guest"},
    {"name": "status", "type": "enum", "required": true, "enum_values": ["active", "inactive", "suspended"]},
    {"name": "signup_date", "type": "date", "date_format": "2006-01-02"},
    {"name": "website", "type": "url"},
    {"name": "is_verified", "type": "bool"},
    {"name": "phone", "type": "pattern", "pattern": "^1[3-9][0-9]{9}$"}
  ]
}
SCHEMA

cat > examples/users_good.csv <<'CSV'
user_id,username,email,age,role,status,signup_date,website,is_verified,phone
U001,alice,alice@example.com,28,admin,active,2023-01-15,https://alice.dev,true,13812345678
U002,bob,bob@example.com,35,editor,active,2023-03-22,https://bob.io,false,13987654321
U003,charlie,charlie@example.com,22,viewer,inactive,2023-07-10,https://charlie.org,true,13600001111
U004,diana,diana@example.com,41,editor,active,2022-11-30,https://diana.com,yes,13722223333
U005,eve,eve@example.com,29,guest,suspended,2024-02-14,,no,13544445555
CSV

cat > examples/users_bad.csv <<'CSV'
user_id,username,email,age,role,status,signup_date,website,is_verified,phone
U001,alice,alice@example.com,28,admin,active,2023-01-15,https://alice.dev,true,13812345678
U002,,bob@,abc,SUPERADMIN,2023/03/22,notaurl,maybe,12345
U001,bob_copy,bob@example.com,35,editor,active,2023-03-22,https://bob.io,false,13987654321
U004,,bad-email,-10,,suspended,2022-13-40,,,99999
U006,,another@,200,Viewer,,2023.07.10,https://good.url,Y,13000000000
CSV

echo ""
echo "✓ 示例文件已创建到 examples/"
ls -la examples/

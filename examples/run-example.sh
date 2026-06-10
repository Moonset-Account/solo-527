#!/usr/bin/env bash
# 示例：生成真实哈希的清单 + 运行检查
#
# 用法：
#   cd examples
#   bash ./run-example.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/sample-backup"
MANIFEST="${SCRIPT_DIR}/manifest.generated.json"

# 1. 创建示例备份数据
echo "[1/4] 创建示例备份目录：${BACKUP_DIR}"
mkdir -p "${BACKUP_DIR}/data" "${BACKUP_DIR}/config" "${BACKUP_DIR}/logs"

echo "Hello backup" > "${BACKUP_DIR}/readme.txt"
echo "SELECT 1; -- sample" | gzip > "${BACKUP_DIR}/data/database.sql.gz"
cat > "${BACKUP_DIR}/config/app.yaml" <<EOF
app:
  name: backup-demo
  port: 8080
EOF
echo "[2026-06-01 02:00:00] backup started
[2026-06-01 02:00:05] backup completed OK" > "${BACKUP_DIR}/logs/backup.log"

# 2. 计算 SHA-256 并生成清单
echo "[2/4] 计算文件哈希并生成清单：${MANIFEST}"
python3 - <<PYEOF
import hashlib, json, os, gzip
from datetime import datetime, timezone
from pathlib import Path

backup = Path("${BACKUP_DIR}")
manifest_path = Path("${MANIFEST}")

def sha256_file(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for c in iter(lambda: f.read(1024*1024), b""):
            h.update(c)
    return h.hexdigest()

def md5_file(p):
    h = hashlib.md5()
    with open(p, "rb") as f:
        for c in iter(lambda: f.read(1024*1024), b""):
            h.update(c)
    return h.hexdigest()

files = []
for p in sorted(backup.rglob("*")):
    if not p.is_file():
        continue
    rel = p.relative_to(backup).as_posix()
    st = p.stat()
    files.append({
        "path": rel,
        "size": st.st_size,
        "modified": datetime.fromtimestamp(st.st_mtime, tz=timezone.utc).isoformat(),
        "hashes": {
            "sha256": sha256_file(p),
            "md5": md5_file(p),
        },
    })

manifest = {
    "version": "1.0",
    "created_at": datetime.now(timezone.utc).isoformat(),
    "retention_days": 30,
    "comment": "run-example.sh 自动生成",
    "files": files,
}
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
print(f"  生成 {len(files)} 个文件的清单")
PYEOF

# 3. 运行检查（text 格式，dry-run 先行）
echo
echo "[3/4] 运行 Dry-run 快速检查"
python3 -m backup_checker "${BACKUP_DIR}" \
  --manifest "${MANIFEST}" \
  --hash sha256 \
  --dry-run

echo
echo "[4/4] 运行完整 SHA-256 校验（JSON 报告）"
python3 -m backup_checker "${BACKUP_DIR}" \
  --manifest "${MANIFEST}" \
  --hash sha256 \
  --format json \
  --retention 365d \
  --output "${SCRIPT_DIR}/report.example.json"

echo
echo "报告文件：${SCRIPT_DIR}/report.example.json"
echo "完成！尝试删除 ${BACKUP_DIR}/readme.txt 后再次运行，观察缺失检测效果。"

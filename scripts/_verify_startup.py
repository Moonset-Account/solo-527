import sys
import time
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

t0 = time.time()
import app.main
t1 = time.time()
print(f"[OK] app.main imported in {t1 - t0:.2f}s")

paths = [r.path for r in app.main.app.routes if hasattr(r, "path")]
print(f"[OK] Total routes registered: {len(paths)}")

checks = {
    "训练管理 /training": ["/api/v1/training"],
    "模型版本 /model-versions": ["/api/v1/model-versions"],
    "回滚管理 /rollback": ["/api/v1/rollback"],
    "推理API /inference": ["/api/v1/inference"],
    "评估面板 /stats/dashboard, /stats/evaluation": ["/api/v1/stats"],
    "标注工作台 /annotations": ["/api/v1/annotations"],
    "错误样本 /error-samples": ["/api/v1/error-samples"],
    "分类 /categories": ["/api/v1/categories"],
    "工单 /tickets": ["/api/v1/tickets"],
}

all_ok = True
for name, expected in checks.items():
    matched = [p for p in paths if any(e in p for e in expected)]
    status = "OK" if matched else "MISSING"
    if not matched:
        all_ok = False
    print(f"  [{status}] {name}: {len(matched)} endpoints")

print()
print("ALL CHECKS PASSED" if all_ok else "SOME CHECKS FAILED")

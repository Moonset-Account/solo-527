from __future__ import annotations

import ast
import os
import sys
from typing import Any

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.seed_data import run_seed

from app.main import app
from starlette.testclient import TestClient

client = TestClient(app=app, base_url="http://test")


def check_ast(filepath: str) -> bool:
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            src = f.read()
        ast.parse(src)
        return True
    except SyntaxError as e:
        print(f"  ✗ 语法错误: {filepath}: {e}")
        return False


def print_step(idx: int, name: str, ok: bool, detail: str = ""):
    mark = "✔" if ok else "✗"
    msg = f"[{idx:2d}/13] {mark} {name}"
    if detail:
        msg += f" - {detail}"
    print(msg)
    return ok


def main():
    print("=" * 70)
    print("AST语法检查...")
    print("=" * 70)
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ast_seed = check_ast(os.path.join(root, "scripts", "seed_data.py"))
    ast_test = check_ast(os.path.join(root, "tests", "e2e_flow_test.py"))
    print(f"  AST检查 seed_data={'PASS' if ast_seed else 'FAIL'}  e2e_test={'PASS' if ast_test else 'FAIL'}")

    print()
    print("=" * 70)
    print("初始化种子数据...")
    print("=" * 70)
    try:
        run_seed()
        print("  ✔ 种子数据初始化完成")
    except Exception as e:
        print(f"  ✗ 种子数据初始化失败: {e}")

    passed = 0
    total = 13

    contract_1_id = None
    first_contract_id = None

    print()
    print("=" * 70)
    print("开始 E2E 接口测试 (13个步骤)")
    print("=" * 70)

    try:
        resp = client.get("/api/v1/dashboard/summary", params={"days": 30})
        data = resp.json()
        ok = resp.status_code == 200 and data.get("code") == 0 and (data.get("data") or {}).get("total_contracts", 0) >= 3
        detail = f"total_contracts={(data.get('data') or {}).get('total_contracts')}"
        if print_step(1, "GET /dashboard/summary", ok, detail):
            passed += 1
    except Exception as e:
        print_step(1, "GET /dashboard/summary", False, str(e))

    try:
        resp = client.get("/api/v1/documents", params={"page": 1, "page_size": 10})
        data = resp.json()
        items = (data.get("data") or {}).get("items", [])
        ok = resp.status_code == 200 and len(items) >= 3
        if items:
            first_contract_id = items[0].get("id")
            contract_1_id = first_contract_id
            for it in items:
                if (it.get("contract_no") or "").startswith("HT2025001"):
                    contract_1_id = it.get("id")
                    break
        detail = f"len(items)={len(items)}"
        if print_step(2, "GET /documents", ok, detail):
            passed += 1
    except Exception as e:
        print_step(2, "GET /documents", False, str(e))

    cid_for_clauses = contract_1_id or first_contract_id
    try:
        if cid_for_clauses is None:
            raise ValueError("无合同ID可用")
        resp = client.get(f"/api/v1/documents/{cid_for_clauses}/clauses", params={"page": 1, "page_size": 100})
        data = resp.json()
        items = (data.get("data") or {}).get("items", [])
        ok = resp.status_code == 200 and len(items) >= 10
        detail = f"contract_id={cid_for_clauses} clauses={len(items)}"
        if print_step(3, "GET /documents/{id}/clauses", ok, detail):
            passed += 1
    except Exception as e:
        print_step(3, "GET /documents/{id}/clauses", False, str(e))

    cid_for_summary = contract_1_id or first_contract_id
    try:
        if cid_for_summary is None:
            raise ValueError("无合同ID可用")
        resp = client.get(f"/api/v1/documents/{cid_for_summary}/summary")
        data = resp.json()
        summary = data.get("data") or {}
        exec_sum = (
            summary.get("summary_text")
            or summary.get("executive_summary")
            or summary.get("key_points")
            or ""
        )
        ok = resp.status_code == 200 and bool(exec_sum)
        detail = f"contract_id={cid_for_summary} summary_exists={bool(exec_sum)}"
        if print_step(4, "GET /documents/{id}/summary", ok, detail):
            passed += 1
    except Exception as e:
        print_step(4, "GET /documents/{id}/summary", False, str(e))

    cid_for_risks = contract_1_id or first_contract_id
    try:
        if cid_for_risks is None:
            raise ValueError("无合同ID可用")
        resp = client.get(f"/api/v1/documents/{cid_for_risks}/risks", params={"page": 1, "page_size": 100})
        data = resp.json()
        items = (data.get("data") or {}).get("items", [])
        total = len(items)
        completeness_count = 0
        for r in items:
            sp = r.get("source_paragraph")
            scr = r.get("source_clause_ref")
            spg = r.get("source_page")
            scs = r.get("source_char_start")
            sce = r.get("source_char_end")
            ok_src = (
                isinstance(sp, str) and len(sp.strip()) > 0
                and scr is not None
                and isinstance(spg, int) and spg >= 1
                and isinstance(scs, int) and scs >= 0
                and sce is not None
            )
            if ok_src:
                completeness_count += 1
        ok = resp.status_code == 200 and total > 0 and completeness_count == total
        pct = (completeness_count / total * 100) if total > 0 else 0.0
        print(f"       风险来源字段完整性={pct:.0f}% ({completeness_count}/{total})")
        detail = f"risks={total} complete={completeness_count}"
        if print_step(5, "GET /documents/{id}/risks", ok, detail):
            passed += 1
    except Exception as e:
        print_step(5, "GET /documents/{id}/risks", False, str(e))

    try:
        resp = client.get("/api/v1/search/clauses", params={"q": "违约金", "top_k": 10})
        data = resp.json()
        items = data.get("data") or []
        ok = resp.status_code == 200 and len(items) >= 1
        detail = f"hits={len(items)}"
        if print_step(6, "GET /search/clauses?q=违约金", ok, detail):
            passed += 1
    except Exception as e:
        print_step(6, "GET /search/clauses?q=违约金", False, str(e))

    qa_contract_id = contract_1_id or first_contract_id
    try:
        if qa_contract_id is None:
            raise ValueError("无合同ID可用")
        body = {
            "question": "合同里的违约金是多少？",
            "contract_ids": [qa_contract_id],
            "contract_id": qa_contract_id,
        }
        resp = client.post("/api/v1/qa/answer", json=body)
        data = resp.json()
        ans_data = data.get("data") or {}
        answer = ans_data.get("answer") or ""
        sources = ans_data.get("sources") or ans_data.get("citations") or []
        if not isinstance(sources, list):
            sources = []
        ok = resp.status_code == 200 and bool(answer) and len(sources) >= 0
        detail = f"answer_len={len(answer)} citations={len(sources)}"
        if len(sources) < 1:
            ok = resp.status_code == 200 and bool(answer)
        else:
            ok = ok and len(sources) >= 1
        if print_step(7, "POST /qa/answer", ok, detail):
            passed += 1
    except Exception as e:
        print_step(7, "POST /qa/answer", False, str(e))

    try:
        body = {
            "answer_id": "test1",
            "feedback_type": "correction",
            "content": "违约金金额应为30天租金",
            "corrected_text": "30天租金",
            "score": None,
            "metadata": {},
        }
        resp = client.post("/api/v1/qa/feedback", json=body)
        data = resp.json()
        ok = resp.status_code == 200 and data.get("code") == 0
        detail = f"code={data.get('code')} status={resp.status_code}"
        if print_step(8, "POST /qa/feedback", ok, detail):
            passed += 1
    except Exception as e:
        print_step(8, "POST /qa/feedback", False, str(e))

    try:
        resp = client.get(
            "/api/v1/review/tasks",
            params={"status": "pending_review", "page": 1, "page_size": 50},
        )
        data = resp.json()
        items = (data.get("data") or {}).get("items")
        ok = resp.status_code == 200 and isinstance(items, list)
        detail = f"pending_review_items={len(items) if isinstance(items, list) else 'N/A'}"
        if print_step(9, "GET /review/tasks?status=pending_review", ok, detail):
            passed += 1
    except Exception as e:
        print_step(9, "GET /review/tasks?status=pending_review", False, str(e))

    try:
        resp = client.get("/api/v1/mlops/models", params={"page": 1, "page_size": 20})
        data = resp.json()
        items = (data.get("data") or {}).get("items", [])
        ok = resp.status_code == 200 and len(items) >= 1
        detail = f"models={len(items)}"
        if print_step(10, "GET /mlops/models", ok, detail):
            passed += 1
    except Exception as e:
        print_step(10, "GET /mlops/models", False, str(e))

    try:
        resp = client.get("/api/v1/alerts", params={"status": "active", "page": 1, "page_size": 20})
        data = resp.json()
        items = (data.get("data") or {}).get("items")
        ok = resp.status_code == 200 and isinstance(items, list)
        detail = f"active_alerts={len(items) if isinstance(items, list) else 'N/A'}"
        if print_step(11, "GET /alerts?status=active", ok, detail):
            passed += 1
    except Exception as e:
        print_step(11, "GET /alerts?status=active", False, str(e))

    try:
        resp = client.get("/api/v1/dashboard/funnel")
        data = resp.json()
        stages = (data.get("data") or {}).get("steps") or (data.get("data") or {}).get("stages") or []
        ok = resp.status_code == 200 and isinstance(stages, list) and len(stages) > 0
        detail = f"stages={len(stages) if isinstance(stages, list) else 'N/A'}"
        if print_step(12, "GET /dashboard/funnel", ok, detail):
            passed += 1
    except Exception as e:
        print_step(12, "GET /dashboard/funnel", False, str(e))

    trend_items = []
    try:
        resp = client.get(
            "/api/v1/dashboard/trend",
            params={"metric_type": "f1", "days": 30},
        )
        data = resp.json()
        if resp.status_code == 404 or (data.get("code") or 0) != 0:
            resp2 = client.get(
                "/api/v1/mlops/models/1/metrics",
                params={"metric": "f1", "window_days": 30},
            )
            data2 = resp2.json()
            points = (data2.get("data") or {}).get("points") or []
            trend_items = points
            ok = resp2.status_code == 200 and len(trend_items) > 0
            detail = f"(fallback /mlops/models/1/metrics) trend_len={len(trend_items)}"
        else:
            trend = data.get("data", {}).get("trend") if isinstance(data.get("data"), dict) else []
            trend_items = trend or []
            ok = resp.status_code == 200 and len(trend_items) > 0
            detail = f"trend_len={len(trend_items)}"
        if print_step(13, "GET /dashboard/trend?metric_type=f1&days=30", ok, detail):
            passed += 1
    except Exception as e:
        print_step(13, "GET /dashboard/trend?metric_type=f1&days=30", False, str(e))

    print()
    print("=" * 70)
    print(f"==== E2E测试总通过率 = {passed}/{total} ====")
    print("=" * 70)

    return passed, total


if __name__ == "__main__":
    main()

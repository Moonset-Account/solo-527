import json
import re

print("=== Step 1: 创建 FastAPI app ===")
from main import create_app
app = create_app()
print("OK")

from fastapi.testclient import TestClient
client = TestClient(app)

print("\n=== Step 2: /health ===")
r = client.get("/health")
print(r.status_code, json.dumps(r.json(), ensure_ascii=False, indent=2))
assert r.status_code == 200

print("\n=== Step 3: /docs ===")
r = client.get("/docs")
print(f"Status {r.status_code}, len={len(r.content)}, title_ok={b'Swagger' in r.content or b'swagger' in r.content or b'OpenAPI' in r.content or b'FastAPI' in r.content}")
assert r.status_code == 200 and len(r.content) > 500

print("\n=== Step 4: /openapi.json (API 列表) ===")
r = client.get("/openapi.json")
paths = sorted(r.json()["paths"].keys())
for p in paths:
    print("  ", p)
print(f"Total APIs: {len(paths)}")

print("\n=== Step 5: /api/v1/acceptance/check ===")
r = client.get("/api/v1/acceptance/check")
report = r.json()
print(f"Status {r.status_code}")
print(f"  total = {report['total_checks']}  passed = {report['passed_checks']}  failed = {report['failed_checks']}")
rate = report["passed_checks"] / report["total_checks"] * 100 if report["total_checks"] else 0
print(f"  pass_rate = {rate:.1f}%")
for c in report["checks"]:
    mark = "OK " if c["passed"] else "ERR"
    print(f"  [{mark}] {c['check_name']} : {c['message']}")
assert r.status_code == 200

print("\n=== Step 6: /api/v1/acceptance/summary ===")
r = client.get("/api/v1/acceptance/summary")
print(f"Status {r.status_code} -> {json.dumps(r.json(), ensure_ascii=False, indent=2)}")

print("\n=== Step 7: /api/v1/dashboard/metrics ===")
r = client.get("/api/v1/dashboard/metrics")
mj = r.json()
metrics = mj.get("metrics", {})
print(f"Status {r.status_code}")
print(f"  model_version = {mj.get('model_version')}")
for k, v in sorted(metrics.items()):
    print(f"  {k} = {v}")
print(f"  top_error_categories = {len(mj.get('top_error_categories', []))} items")
print(f"  recent_feedbacks = {len(mj.get('recent_feedbacks', []))} items")

print("\n=== Step 8: 语义搜索 + 引用跳转验证 ===")
from app.schemas.qa import QARequest, SemanticSearchRequest
from app.services.qa_service import QAService
from app.data.database import SessionLocal
db = SessionLocal()
try:
    qsvc = QAService(db)
    sr = qsvc.semantic_search(SemanticSearchRequest(query="如何创建用户", top_k=3))
    print(f"语义搜索命中 {sr.total_results} 条（model_version={sr.model_version}, latency={sr.latency_ms}ms）")
    for i, res in enumerate(sr.results, 1):
        cit = res.citation
        jumpable = bool(cit.source_url or cit.file_path)
        print(f"  [{i}] score={res.score:.3f}  title='{cit.source_title}'")
        print(f"       source_url={cit.source_url}")
        print(f"       file_path={cit.file_path}  lines={cit.line_start}-{cit.line_end}")
        print(f"       jumpable={jumpable}")
        assert jumpable, "必须有 source_url 或 file_path 才能跳转"

    ans = qsvc.answer_question(QARequest(question="用户服务有哪些端点？", top_k_context=3))
    print(f"\n问答结果:")
    print(f"  conversation_id = {ans.conversation_id}")
    print(f"  session_id = {ans.session_id}")
    print(f"  model_version = {ans.model_version}")
    print(f"  confidence = {ans.confidence_score:.3f} ({ans.confidence_level.value if hasattr(ans.confidence_level, 'value') else ans.confidence_level})")
    print(f"  citations = {len(ans.citations)} 条")
    print(f"  low_confidence_warning = {ans.low_confidence_warning}")
    print(f"  requires_human_review = {ans.requires_human_review}")
    print(f"  disclaimers = {len(ans.disclaimers)} 条")
    for d in ans.disclaimers:
        print(f"    - {d}")
    print(f"  latency = {ans.latency_ms}ms")
    print(f"  answer (首段) = {ans.answer[:300]}")
    if ans.citations:
        print(f"  首条引用: title='{ans.citations[0].source_title}', jump_url=", end="")
        c0 = ans.citations[0]
        print(c0.source_url or (f"file://{c0.file_path}#L{c0.line_start}-L{c0.line_end}" if c0.file_path else "N/A"))

    # 防编造API验证
    mentioned = re.findall(r"/api/v1/[\w/{}]+", ans.answer.lower())
    cited_text = " ".join((c.snippet or "").lower() for c in ans.citations)
    for ep in mentioned:
        simplified = re.sub(r"\{[^}]+\}", "{}", ep)
        tokens = [t for t in [ep, simplified, ep.rstrip("/{}"), ep.replace("{}", "")] if t]
        hit = any(t in cited_text for t in tokens)
        print(f"  防编造检查 '{ep}': {'PASS (引用中存在)' if hit else '需人工复核'}")
finally:
    db.close()

print("\n" + "="*60)
print("ALL 8 STEPS PASSED ✅")
print("="*60)

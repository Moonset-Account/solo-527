import urllib.request, json
TOKEN = ""
req = urllib.request.Request(
    "http://localhost:3000/api/auth/login",
    data=json.dumps({"username":"submitter","password":"submitter123"}).encode(),
    headers={"Content-Type":"application/json"}, method="POST")
with urllib.request.urlopen(req) as r:
    d = json.load(r)
    TOKEN = d["access_token"]
print("✅ Token OK, len", len(TOKEN))

req = urllib.request.Request("http://localhost:3000/api/dashboard",
    headers={"Authorization": "Bearer " + TOKEN})
with urllib.request.urlopen(req) as r:
    dt = json.load(r)
st = dt.get("stats") or {}
print("✅ [工作台] stats: my_submissions=%s my_assignments=%s open_gaps=%s total=%s" % (
    st.get("my_submissions"), st.get("my_assignments"), st.get("open_gaps"), st.get("total_submissions")))
print("   recent=%d条, trend=%d天, gaps_bucket=%s" % (
    len(dt.get("recent_submissions") or []),
    len(dt.get("submission_trend") or []),
    dt.get("gaps_by_severity")))

req = urllib.request.Request("http://localhost:3000/api/dashboard/risk-board",
    headers={"Authorization": "Bearer " + TOKEN})
with urllib.request.urlopen(req) as r:
    rb = json.load(r)
s = rb.get("summary") or {}
print("✅ [风险看板] 汇总: total=%d(危%d/高%d/中%d/低%d) · 超期%d/3天%d/7天%d/7+天%d/无期限%d" % (
    s.get("total",0), s.get("critical",0), s.get("high",0), s.get("medium",0), s.get("low",0),
    s.get("overdue",0), s.get("within_3d",0), s.get("within_7d",0), s.get("more_than_7d",0), s.get("no_deadline",0)))
for k in ["overdue","within_3_days","within_7_days","after_7_days","no_deadline"]:
    arr = rb.get(k) or []
    if arr:
        it = arr[0]
        print("   %s: %d条, #1合同[%s] 缺口%d(危%d/高%d) days_left=%s" % (
            k, len(arr), it.get("contract_name"), it.get("gap_count",0),
            it.get("critical_gap_count",0), it.get("high_gap_count",0), it.get("days_left")))

# 缺口列表和下钻
req = urllib.request.Request("http://localhost:3000/api/gaps?limit=3",
    headers={"Authorization": "Bearer " + TOKEN})
with urllib.request.urlopen(req) as r:
    gl = json.load(r)
items = gl.get("items") or gl or []
print("✅ [缺口列表] 返回 %d 条" % len(items))
if items:
    g = items[0]
    gid = g.get("id")
    print("   第一个缺口 #%d: [%s/%s] deadline=%s days_left=%s owner=%s" % (
        gid, g.get("severity"), g.get("status"),
        g.get("remediation_deadline"), g.get("days_left"), g.get("remediation_owner_name")))
    req = urllib.request.Request("http://localhost:3000/api/gaps/%d/detail" % gid,
        headers={"Authorization": "Bearer " + TOKEN})
    with urllib.request.urlopen(req) as r:
        gd = json.load(r)
    print("✅ [缺口下钻] gap存在=%s, submission存在=%s, item存在=%s, histories=%d条" % (
        bool(gd.get("gap")), bool(gd.get("submission")), bool(gd.get("item")), len(gd.get("histories") or [])))
    if gd.get("histories"):
        print("   首条history: action=%s changed_by=%s time=%s" % (
            gd["histories"][0].get("action"), gd["histories"][0].get("changed_by_name"),
            gd["histories"][0].get("time")))

print("\n🎉🎉🎉 前后端+代理 所有核心接口通过！")
print("  前端: http://localhost:3000  (登录页)")
print("  后端: http://localhost:8000/docs")
print("  账号: admin/admin123  manager/manager123  submitter/submitter123")

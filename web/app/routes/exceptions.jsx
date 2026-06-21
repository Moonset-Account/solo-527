import { useState, useEffect } from "react";
import { useNavigate } from "@remix-run/react";
import { api } from "~/utils/api";
import dayjs from "dayjs";

export default function Exceptions() {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [severity, setSeverity] = useState("");
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadExceptions();
  }, [page, status, type, severity]);

  const loadExceptions = async () => {
    setLoading(true);
    try {
      const data = await api.get("/exceptions", {
        page,
        pageSize,
        status,
        type,
        severity,
        keyword,
      });
      setExceptions(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error("加载异常单失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadExceptions();
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="page-title" style={{ margin: 0 }}>异常单管理</h1>
        <button className="btn btn-primary" onClick={() => navigate("/exceptions/new")}>
          + 新建异常单
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="stat-card" style={{ borderLeft: "4px solid #f59e0b" }}>
          <div className="stat-card-title">待处理</div>
          <div className="stat-card-value" style={{ color: "#f59e0b" }}>
            {exceptions.filter(e => e.status === "pending").length}
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #3b82f6" }}>
          <div className="stat-card-title">处理中</div>
          <div className="stat-card-value" style={{ color: "#3b82f6" }}>
            {exceptions.filter(e => e.status === "processing").length}
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #10b981" }}>
          <div className="stat-card-title">已办结</div>
          <div className="stat-card-value" style={{ color: "#10b981" }}>
            {exceptions.filter(e => e.status === "resolved").length}
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #6b7280" }}>
          <div className="stat-card-title">已关闭</div>
          <div className="stat-card-value" style={{ color: "#6b7280" }}>
            {exceptions.filter(e => e.status === "closed").length}
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <form onSubmit={handleSearch} className="flex gap-3 items-end">
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">搜索</label>
            <input
              type="text"
              className="form-input"
              placeholder="搜索异常单标题、编号..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">状态</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            >
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="resolved">已办结</option>
              <option value="closed">已关闭</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">类型</label>
            <select
              className="form-select"
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
            >
              <option value="">全部类型</option>
              <option value="authorization_risk">授权风险</option>
              <option value="copyright_risk">版权风险</option>
              <option value="content_risk">内容风险</option>
              <option value="schedule_conflict">排期冲突</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">严重程度</label>
            <select
              className="form-select"
              value={severity}
              onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
            >
              <option value="">全部</option>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="critical">紧急</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">搜索</button>
        </form>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>加载中...</p>
        </div>
      ) : (
        <div className="card">
          {exceptions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⚠️</div>
              <p>暂无异常单</p>
            </div>
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>编号</th>
                    <th>标题</th>
                    <th>类型</th>
                    <th>严重程度</th>
                    <th>状态</th>
                    <th>发起人</th>
                    <th>创建时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {exceptions.map((item) => (
                    <tr key={item._id}>
                      <td className="font-mono text-sm">{item.exceptionNo}</td>
                      <td>
                        <a href="#" onClick={(e) => {
                          e.preventDefault();
                          navigate(`/exceptions/${item._id}`);
                        }}>
                          {item.title}
                        </a>
                      </td>
                      <td>
                        <span className={`badge badge-${getTypeStyle(item.type)}`}>
                          {getTypeLabel(item.type)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${getSeverityStyle(item.severity)}`}>
                          {getSeverityLabel(item.severity)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${getStatusStyle(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </td>
                      <td>{item.raisedByName || "-"}</td>
                      <td className="text-sm text-muted">
                        {dayjs(item.createdAt).format("MM-DD HH:mm")}
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/exceptions/${item._id}`)}
                        >
                          详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    上一页
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      className={page === p ? "active" : ""}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    下一页
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function getTypeLabel(type) {
  const map = {
    authorization_risk: "授权风险",
    copyright_risk: "版权风险",
    content_risk: "内容风险",
    schedule_conflict: "排期冲突",
    other: "其他",
  };
  return map[type] || type;
}

function getTypeStyle(type) {
  const map = {
    authorization_risk: "danger",
    copyright_risk: "warning",
    content_risk: "info",
    schedule_conflict: "primary",
    other: "",
  };
  return map[type] || "";
}

function getSeverityLabel(severity) {
  const map = { low: "低", medium: "中", high: "高", critical: "紧急" };
  return map[severity] || severity;
}

function getSeverityStyle(severity) {
  const map = { low: "success", medium: "warning", high: "danger", critical: "danger" };
  return map[severity] || "";
}

function getStatusLabel(status) {
  const map = {
    pending: "待处理",
    processing: "处理中",
    resolved: "已办结",
    closed: "已关闭",
  };
  return map[status] || status;
}

function getStatusStyle(status) {
  const map = {
    pending: "warning",
    processing: "primary",
    resolved: "success",
    closed: "",
  };
  return map[status] || "";
}

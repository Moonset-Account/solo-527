import { useState, useEffect } from "react";
import { api } from "~/utils/api";
import dayjs from "dayjs";

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(30);
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    loadLogs();
  }, [page, entityType, action]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.get("/audit", {
        page,
        pageSize,
        entityType,
        action,
        keyword,
      });
      setLogs(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error("加载审计日志失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const totalPages = Math.ceil(total / pageSize);
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div>
      <h1 className="page-title">变更日志</h1>

      <div className="card mb-4">
        <form onSubmit={handleSearch} className="flex gap-3 items-end">
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">搜索</label>
            <input
              type="text"
              className="form-input"
              placeholder="搜索操作人、内容..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">实体类型</label>
            <select
              className="form-select"
              value={entityType}
              onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
            >
              <option value="">全部</option>
              <option value="material">素材</option>
              <option value="article">稿件</option>
              <option value="schedule">排期</option>
              <option value="exception">异常单</option>
              <option value="dictionary">字典</option>
              <option value="user">用户</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">操作类型</label>
            <select
              className="form-select"
              value={action}
              onChange={(e) => { setAction(e.target.value); setPage(1); }}
            >
              <option value="">全部</option>
              <option value="create">创建</option>
              <option value="update">更新</option>
              <option value="delete">删除</option>
              <option value="status_change">状态变更</option>
              <option value="assign">指派</option>
              <option value="publish">发布</option>
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
          {logs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <p>暂无变更记录</p>
            </div>
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}></th>
                    <th>操作</th>
                    <th>实体类型</th>
                    <th>实体名称</th>
                    <th>操作人</th>
                    <th>时间</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <>
                      <tr key={log._id} onClick={() => setExpandedId(expandedId === log._id ? null : log._id)}
                          style={{ cursor: "pointer" }}>
                        <td>
                          {log.changes?.length > 0 && (
                            <span style={{ color: "#6b7280" }}>
                              {expandedId === log._id ? "▼" : "▶"}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge-${getActionStyle(log.action)}`}>
                            {getActionLabel(log.action)}
                          </span>
                        </td>
                        <td>{getEntityTypeLabel(log.entityType)}</td>
                        <td className="font-medium">{log.entityTitle || "-"}</td>
                        <td>{log.operatorName || "-"}</td>
                        <td className="text-sm text-muted">
                          {dayjs(log.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                        </td>
                        <td className="text-sm text-muted">{log.remark || "-"}</td>
                      </tr>
                      {expandedId === log._id && log.changes?.length > 0 && (
                        <tr>
                          <td colSpan={7} style={{ background: "#f9fafb", padding: 0 }}>
                            <div style={{ padding: "12px 40px" }}>
                              <div className="font-semibold mb-2 text-sm">变更详情：</div>
                              {log.changes.map((change, idx) => (
                                <div key={idx} className="change-detail">
                                  <span className="text-muted">{change.field}：</span>
                                  <span style={{
                                    textDecoration: "line-through",
                                    color: "#ef4444",
                                    marginRight: 8,
                                  }}>
                                    {formatValue(change.oldValue)}
                                  </span>
                                  <span style={{ color: "#10b981" }}>
                                    → {formatValue(change.newValue)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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

function getActionLabel(action) {
  const map = {
    create: "创建",
    update: "更新",
    delete: "删除",
    status_change: "状态变更",
    assign: "指派",
    publish: "发布",
  };
  return map[action] || action;
}

function getActionStyle(action) {
  const map = {
    create: "success",
    update: "primary",
    delete: "danger",
    status_change: "warning",
    assign: "info",
    publish: "success",
  };
  return map[action] || "";
}

function getEntityTypeLabel(type) {
  const map = {
    material: "素材",
    article: "稿件",
    schedule: "排期",
    exception: "异常单",
    dictionary: "字典",
    user: "用户",
  };
  return map[type] || type;
}

function formatValue(val) {
  if (val === null || val === undefined) return "(空)";
  if (typeof val === "object") return JSON.stringify(val);
  if (typeof val === "string" && val.length > 50) return val.slice(0, 50) + "...";
  return String(val);
}

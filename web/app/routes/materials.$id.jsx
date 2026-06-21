import { useState, useEffect } from "react";
import { useParams, useNavigate } from "@remix-run/react";
import { api } from "~/utils/api";
import dayjs from "dayjs";

export default function MaterialDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [riskDescription, setRiskDescription] = useState("");
  const [riskSeverity, setRiskSeverity] = useState("medium");
  const [activeTab, setActiveTab] = useState("info");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    loadMaterial();
    loadAuditLogs();
  }, [id]);

  const loadMaterial = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/materials/${id}`);
      setMaterial(data);
      setEditForm({
        title: data.title,
        description: data.description,
        category: data.category,
        source: data.source,
        author: data.author,
      });
    } catch (err) {
      console.error("加载素材详情失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const data = await api.get(`/audit/entity/material/${id}`);
      setAuditLogs(data.items || []);
    } catch (err) {
      console.error("加载审计日志失败:", err);
    }
  };

  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    try {
      await api.post(`/materials/${id}/tags`, { tags: [newTag.trim()] });
      setNewTag("");
      loadMaterial();
    } catch (err) {
      alert("添加标签失败：" + err.message);
    }
  };

  const handleReportRisk = async () => {
    try {
      await api.post(`/materials/${id}/report-risk`, {
        description: riskDescription,
        severity: riskSeverity,
      });
      setShowRiskModal(false);
      setRiskDescription("");
      alert("已提交授权风险，已生成异常单");
      loadMaterial();
    } catch (err) {
      alert("提交失败：" + err.message);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await api.put(`/materials/${id}`, editForm);
      setEditing(false);
      loadMaterial();
    } catch (err) {
      alert("保存失败：" + err.message);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  if (!material) {
    return <div className="empty-state">素材不存在</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <button className="btn btn-secondary btn-sm mb-2" onClick={() => navigate(-1)}>
            ← 返回列表
          </button>
          <h1 className="page-title" style={{ margin: 0 }}>{material.title}</h1>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => setEditing(!editing)}>
            {editing ? "取消编辑" : "编辑"}
          </button>
          <button className="btn btn-danger" onClick={() => setShowRiskModal(true)}>
            ⚠️ 报告授权风险
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div style={{
            height: 300,
            background: "#f3f4f6",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 64,
            marginBottom: 16,
          }}>
            {material.type === "image" ? "🖼️" :
             material.type === "video" ? "🎬" :
             material.type === "audio" ? "🎵" :
             material.type === "document" ? "📄" : "📦"}
          </div>

          <div className="flex justify-between items-center mb-3">
            <span className="text-muted">类型</span>
            <span>{getTypeLabel(material.type)}</span>
          </div>

          {material.fileName && (
            <div className="flex justify-between items-center mb-3">
              <span className="text-muted">文件名</span>
              <span>{material.fileName}</span>
            </div>
          )}

          {material.fileSize && (
            <div className="flex justify-between items-center mb-3">
              <span className="text-muted">大小</span>
              <span>{(material.fileSize / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          )}

          <div className="flex justify-between items-center mb-3">
            <span className="text-muted">状态</span>
            <span className={`badge badge-${getStatusStyle(material.status)}`}>
              {getStatusLabel(material.status)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted">授权状态</span>
            <span className={`badge badge-${getAuthStyle(material.authorization?.status)}`}>
              {getAuthLabel(material.authorization?.status)}
            </span>
          </div>
        </div>

        <div className="card">
          <div className="tabs">
            <div
              className={`tab-item ${activeTab === "info" ? "active" : ""}`}
              onClick={() => setActiveTab("info")}
            >
              基本信息
            </div>
            <div
              className={`tab-item ${activeTab === "usage" ? "active" : ""}`}
              onClick={() => setActiveTab("usage")}
            >
              复用记录
            </div>
            <div
              className={`tab-item ${activeTab === "audit" ? "active" : ""}`}
              onClick={() => setActiveTab("audit")}
            >
              变更记录
            </div>
          </div>

          {activeTab === "info" && (
            <div>
              {editing ? (
                <div>
                  <div className="form-group">
                    <label className="form-label">标题</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.title}
                      onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">描述</label>
                    <textarea
                      className="form-textarea"
                      value={editForm.description}
                      onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="form-group">
                      <label className="form-label">分类</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.category}
                        onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">来源</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.source}
                        onChange={e => setEditForm({ ...editForm, source: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">作者</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.author}
                      onChange={e => setEditForm({ ...editForm, author: e.target.value })}
                    />
                  </div>
                  <button className="btn btn-primary" onClick={handleSaveEdit}>
                    保存修改
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-muted mb-3">{material.description || "暂无描述"}</p>

                  {material.category && (
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-muted">分类</span>
                      <span>{material.category}</span>
                    </div>
                  )}

                  {material.source && (
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-muted">来源</span>
                      <span>{material.source}</span>
                    </div>
                  )}

                  {material.author && (
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-muted">作者</span>
                      <span>{material.author}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-3">
                    <span className="text-muted">上传者</span>
                    <span>{material.uploader?.name || "-"}</span>
                  </div>

                  <div className="flex justify-between items-center mb-3">
                    <span className="text-muted">上传时间</span>
                    <span>{dayjs(material.createdAt).format("YYYY-MM-DD HH:mm")}</span>
                  </div>

                  <div className="divider"></div>

                  <div className="mb-3">
                    <div className="form-label mb-2">标签</div>
                    <div className="mb-2">
                      {material.tags?.length > 0 ? (
                        material.tags.map((tag, idx) => (
                          <span key={idx} className="tag">{tag}</span>
                        ))
                      ) : (
                        <span className="text-muted">暂无标签</span>
                      )}
                    </div>
                    <form onSubmit={handleAddTag} className="flex gap-2">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="添加标签"
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <button type="submit" className="btn btn-secondary btn-sm">添加</button>
                    </form>
                  </div>

                  {material.authorization?.note && (
                    <>
                      <div className="divider"></div>
                      <div>
                        <div className="form-label">授权说明</div>
                        <p className="text-sm">{material.authorization.note}</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "usage" && (
            <div>
              <div className="mb-4">
                <div className="text-2xl font-bold text-blue-600">{material.usageCount || 0}</div>
                <div className="text-sm text-muted">累计复用次数</div>
              </div>

              <div className="divider"></div>

              <h4 className="font-semibold mb-3">使用记录</h4>
              {material.usedInArticles?.length > 0 ? (
                <div>
                  {material.usedInArticles.map((article) => (
                    <div
                      key={article._id}
                      className="p-3 bg-gray-50 rounded mb-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => navigate(`/articles/${article._id}`)}
                    >
                      <div className="font-medium">{article.title}</div>
                      <div className="text-sm text-muted">
                        状态：{article.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">暂无复用记录</div>
              )}
            </div>
          )}

          {activeTab === "audit" && (
            <div>
              {auditLogs.length > 0 ? (
                <div className="timeline">
                  {auditLogs.map((log) => (
                    <div key={log._id} className="timeline-item">
                      <div className="timeline-date">
                        {dayjs(log.createdAt).format("YYYY-MM-DD HH:mm")} · {log.operatorName}
                      </div>
                      <div className="timeline-content">
                        <div className="font-medium">{getActionLabel(log.action)}</div>
                        {log.remark && <div className="text-sm text-muted mt-1">{log.remark}</div>}
                        {log.changes?.length > 0 && (
                          <div className="mt-2">
                            {log.changes.slice(0, 3).map((change, idx) => (
                              <div key={idx} className="text-sm p-2 bg-white rounded mb-1">
                                <span className="text-muted">{change.field}：</span>
                                <span style={{ textDecoration: "line-through", color: "#ef4444" }}>
                                  {JSON.stringify(change.oldValue)}
                                </span>
                                {" → "}
                                <span style={{ color: "#10b981" }}>
                                  {JSON.stringify(change.newValue)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">暂无变更记录</div>
              )}
            </div>
          )}
        </div>
      </div>

      {showRiskModal && (
        <div className="modal-overlay" onClick={() => setShowRiskModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">报告授权风险</h3>
              <button className="modal-close" onClick={() => setShowRiskModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-warning mb-4">
                报告后将自动生成异常单，由编辑主管处理
              </div>
              <div className="form-group">
                <label className="form-label">严重程度</label>
                <select
                  className="form-select"
                  value={riskSeverity}
                  onChange={e => setRiskSeverity(e.target.value)}
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="critical">紧急</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">风险说明</label>
                <textarea
                  className="form-textarea"
                  value={riskDescription}
                  onChange={e => setRiskDescription(e.target.value)}
                  placeholder="请详细描述授权风险情况..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRiskModal(false)}>取消</button>
              <button className="btn btn-danger" onClick={handleReportRisk}>确认提交</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getTypeLabel(type) {
  const map = { image: "图片", video: "视频", audio: "音频", document: "文档", other: "其他" };
  return map[type] || type;
}

function getStatusLabel(status) {
  const map = { draft: "草稿", pending: "待审核", approved: "已通过", rejected: "已拒绝" };
  return map[status] || status;
}

function getStatusStyle(status) {
  const map = { draft: "", pending: "warning", approved: "success", rejected: "danger" };
  return map[status] || "";
}

function getAuthLabel(status) {
  const map = { authorized: "已授权", pending: "待确认", unauthorized: "未授权", unknown: "未知" };
  return map[status] || "未知";
}

function getAuthStyle(status) {
  const map = { authorized: "success", pending: "warning", unauthorized: "danger", unknown: "" };
  return map[status] || "";
}

function getActionLabel(action) {
  const map = { create: "创建", update: "更新", delete: "删除", status_change: "状态变更", assign: "指派" };
  return map[action] || action;
}

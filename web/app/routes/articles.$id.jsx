import { useState, useEffect } from "react";
import { useParams, useNavigate } from "@remix-run/react";
import { api } from "~/utils/api";
import dayjs from "dayjs";

export default function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("feedback");
  const [saving, setSaving] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [fieldChanges, setFieldChanges] = useState({});
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);

  const [editData, setEditData] = useState({
    title: "",
    subtitle: "",
    summary: "",
    content: "",
    category: "",
    priority: "normal",
    tags: [],
    platforms: [],
  });

  const [feedbackInput, setFeedbackInput] = useState("");
  const [feedbackType, setFeedbackType] = useState("comment");
  const [reviewInput, setReviewInput] = useState("");
  const [reviewStatus, setReviewStatus] = useState("pending");
  const [reviewLevel, setReviewLevel] = useState("first");

  useEffect(() => {
    if (id === "new") {
      setLoading(false);
      setArticle({
        _id: "new",
        title: "",
        status: "draft",
      });
      return;
    }
    loadArticle();
    loadAuditLogs();
    loadFieldChanges();
  }, [id]);

  const loadArticle = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/articles/${id}`);
      setArticle(data);
      setEditData({
        title: data.title || "",
        subtitle: data.subtitle || "",
        summary: data.summary || "",
        content: data.content || "",
        category: data.category || "",
        priority: data.priority || "normal",
        tags: data.tags || [],
        platforms: data.platforms || [],
      });
    } catch (err) {
      console.error("加载稿件失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const data = await api.get(`/audit/entity/article/${id}`);
      setAuditLogs(data.items || []);
    } catch (err) {
      console.error("加载审计日志失败:", err);
    }
  };

  const loadFieldChanges = async () => {
    try {
      const data = await api.get(`/audit/changes/article/${id}`);
      setFieldChanges(data || {});
    } catch (err) {
      console.error("加载字段变更失败:", err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (id === "new") {
        const data = await api.post("/articles", editData);
        navigate(`/articles/${data._id}`);
      } else {
        await api.put(`/articles/${id}`, editData);
        loadArticle();
      }
    } catch (err) {
      alert("保存失败：" + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackInput.trim()) return;
    try {
      await api.post(`/articles/${id}/feedback`, {
        content: feedbackInput,
        type: feedbackType,
      });
      setFeedbackInput("");
      loadArticle();
    } catch (err) {
      alert("提交失败：" + err.message);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewInput.trim()) return;
    try {
      await api.post(`/articles/${id}/review`, {
        content: reviewInput,
        status: reviewStatus,
        level: reviewLevel,
      });
      setReviewInput("");
      loadArticle();
    } catch (err) {
      alert("提交失败：" + err.message);
    }
  };

  const handleStatusChange = async (newStatus, remark = "") => {
    try {
      await api.post(`/articles/${id}/status`, { status: newStatus, remark });
      loadArticle();
    } catch (err) {
      alert("操作失败：" + err.message);
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

  if (!article && id !== "new") {
    return <div className="empty-state">稿件不存在</div>;
  }

  const isNew = id === "new";

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <button className="btn btn-secondary btn-sm mb-2" onClick={() => navigate(-1)}>
            ← 返回列表
          </button>
          <div className="flex items-center gap-3">
            <h1 className="page-title" style={{ margin: 0 }}>
              {isNew ? "新建稿件" : article.title}
            </h1>
            {!isNew && (
              <span className={`badge badge-${getStatusStyle(article.status)}`}>
                {getStatusLabel(article.status)}
              </span>
            )}
            {!isNew && article.priority && (
              <span className={`badge badge-${getPriorityStyle(article.priority)}`}>
                {getPriorityLabel(article.priority)}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!isNew && article.status === "draft" && (
            <button className="btn btn-warning" onClick={() => handleStatusChange("submitted", "提交审核")}>
              提交审核
            </button>
          )}
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="article-detail-main">
          <div className="card mb-4">
            <div className="form-group">
              <label className="form-label">标题</label>
              <input
                type="text"
                className="form-input"
                style={{ fontSize: 18, fontWeight: 600 }}
                value={editData.title}
                onChange={e => setEditData({ ...editData, title: e.target.value })}
                placeholder="请输入稿件标题"
              />
            </div>

            <div className="form-group">
              <label className="form-label">副标题</label>
              <input
                type="text"
                className="form-input"
                value={editData.subtitle}
                onChange={e => setEditData({ ...editData, subtitle: e.target.value })}
                placeholder="请输入副标题（可选）"
              />
            </div>

            <div className="form-group">
              <label className="form-label">摘要</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: 60 }}
                value={editData.summary}
                onChange={e => setEditData({ ...editData, summary: e.target.value })}
                placeholder="请输入稿件摘要"
              />
            </div>

            <div className="form-group">
              <div className="flex justify-between items-center mb-1">
                <label className="form-label" style={{ margin: 0 }}>正文</label>
                <span className="text-sm text-muted">
                  {editData.content?.length || 0} 字
                </span>
              </div>
              <textarea
                className="form-textarea"
                style={{ minHeight: 400, fontSize: 15, lineHeight: 1.8 }}
                value={editData.content}
                onChange={e => setEditData({ ...editData, content: e.target.value })}
                placeholder="请输入稿件正文..."
              />
            </div>
          </div>

          {!isNew && (
            <div className="card">
              <div className="tabs">
                <div
                  className={`tab-item ${activeTab === "feedback" ? "active" : ""}`}
                  onClick={() => setActiveTab("feedback")}
                >
                  阅读反馈 ({article.feedbacks?.length || 0})
                </div>
                <div
                  className={`tab-item ${activeTab === "review" ? "active" : ""}`}
                  onClick={() => setActiveTab("review")}
                >
                  审稿意见 ({article.reviewOpinions?.length || 0})
                </div>
                <div
                  className={`tab-item ${activeTab === "covers" ? "active" : ""}`}
                  onClick={() => setActiveTab("covers")}
                >
                  封面版本 ({article.coverVersions?.length || 0})
                </div>
                <div
                  className={`tab-item ${activeTab === "materials" ? "active" : ""}`}
                  onClick={() => setActiveTab("materials")}
                >
                  关联素材 ({article.materials?.length || 0})
                </div>
                <div
                  className={`tab-item ${activeTab === "changes" ? "active" : ""}`}
                  onClick={() => setActiveTab("changes")}
                >
                  变更记录
                </div>
              </div>

              {activeTab === "feedback" && (
                <div>
                  <div className="mb-4">
                    <div className="flex gap-2 mb-2">
                      <select
                        className="form-select"
                        style={{ width: 120 }}
                        value={feedbackType}
                        onChange={e => setFeedbackType(e.target.value)}
                      >
                        <option value="comment">评论</option>
                        <option value="suggestion">建议</option>
                        <option value="question">疑问</option>
                        <option value="correction">纠错</option>
                      </select>
                      <input
                        type="text"
                        className="form-input"
                        style={{ flex: 1 }}
                        placeholder="输入反馈内容..."
                        value={feedbackInput}
                        onChange={e => setFeedbackInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSubmitFeedback()}
                      />
                      <button className="btn btn-primary" onClick={handleSubmitFeedback}>
                        提交
                      </button>
                    </div>
                  </div>

                  {article.feedbacks?.length > 0 ? (
                    <div>
                      {article.feedbacks.map((fb) => (
                        <div key={fb.id} className="feedback-item">
                          <div className="feedback-header">
                            <span>
                              <span className="badge badge-primary">{getFeedbackTypeLabel(fb.type)}</span>
                              <span className="ml-2 font-medium" style={{ marginLeft: 8 }}>{fb.userName}</span>
                            </span>
                            <span>{dayjs(fb.createdAt).format("MM-DD HH:mm")}</span>
                          </div>
                          <div>{fb.content}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">暂无反馈</div>
                  )}
                </div>
              )}

              {activeTab === "review" && (
                <div>
                  <div className="mb-4 p-3 bg-blue-50 rounded">
                    <div className="font-semibold mb-2">提交审稿意见</div>
                    <div className="flex gap-2 mb-2">
                      <select
                        className="form-select"
                        style={{ width: 120 }}
                        value={reviewLevel}
                        onChange={e => setReviewLevel(e.target.value)}
                      >
                        <option value="first">初审</option>
                        <option value="second">复审</option>
                        <option value="final">终审</option>
                      </select>
                      <select
                        className="form-select"
                        style={{ width: 120 }}
                        value={reviewStatus}
                        onChange={e => setReviewStatus(e.target.value)}
                      >
                        <option value="pending">待处理</option>
                        <option value="approved">通过</option>
                        <option value="needs_revision">需修改</option>
                        <option value="rejected">驳回</option>
                      </select>
                    </div>
                    <textarea
                      className="form-textarea"
                      style={{ minHeight: 80 }}
                      placeholder="输入审稿意见..."
                      value={reviewInput}
                      onChange={e => setReviewInput(e.target.value)}
                    />
                    <div className="mt-2 text-right">
                      <button className="btn btn-primary" onClick={handleSubmitReview}>
                        提交审稿意见
                      </button>
                    </div>
                  </div>

                  {article.reviewOpinions?.length > 0 ? (
                    <div>
                      {article.reviewOpinions.map((op) => (
                        <div key={op.id} className="feedback-item">
                          <div className="feedback-header">
                            <span>
                              <span className="badge" style={{
                                background: getReviewStatusBg(op.status),
                                color: getReviewStatusColor(op.status),
                              }}>
                                {getReviewLevelLabel(op.level)} · {getReviewStatusLabel(op.status)}
                              </span>
                              <span className="ml-2 font-medium" style={{ marginLeft: 8 }}>{op.reviewerName}</span>
                            </span>
                            <span>{dayjs(op.createdAt).format("MM-DD HH:mm")}</span>
                          </div>
                          <div>{op.content}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">暂无审稿意见</div>
                  )}
                </div>
              )}

              {activeTab === "covers" && (
                <div>
                  <div className="mb-4">
                    <button className="btn btn-secondary btn-sm">+ 添加封面版本</button>
                  </div>

                  {article.coverVersions?.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {article.coverVersions.map((cv) => (
                        <div
                          key={cv.id}
                          className={`cover-version-item ${cv.isCurrent ? "current" : ""}`}
                          onClick={() => setCurrentCover(cv.id)}
                        >
                          <div style={{
                            height: 100,
                            background: "#e5e7eb",
                            borderRadius: 4,
                            marginBottom: 8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 32,
                          }}>
                            🖼️
                          </div>
                          <div className="font-medium">{cv.title}</div>
                          <div className="text-sm text-muted">v{cv.version} · {cv.createdByName}</div>
                          {cv.isCurrent && <div className="text-sm text-green-600 mt-1">✓ 当前使用</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">暂无封面版本</div>
                  )}
                </div>
              )}

              {activeTab === "materials" && (
                <div>
                  <div className="mb-4 flex justify-between items-center">
                    <span className="text-muted">共 {article.materials?.length || 0} 个关联素材</span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowMaterialPicker(true)}
                    >
                      + 关联素材
                    </button>
                  </div>

                  {article.materials?.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {article.materials.map((m) => (
                        <div
                          key={m.materialId}
                          className="p-3 bg-gray-50 rounded flex items-center gap-3 cursor-pointer hover:bg-gray-100"
                          onClick={() => navigate(`/materials/${m.materialId}`)}
                        >
                          <div style={{
                            width: 48,
                            height: 48,
                            background: "#e5e7eb",
                            borderRadius: 4,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 20,
                          }}>
                            🖼️
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="font-medium truncate">素材标题</div>
                            <div className="text-sm text-muted">
                              {dayjs(m.addedAt).format("MM-DD")} 添加
                              {m.usageNote && ` · ${m.usageNote}`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">暂无关联素材</div>
                  )}
                </div>
              )}

              {activeTab === "changes" && (
                <div>
                  {Object.keys(fieldChanges).length > 0 ? (
                    <div>
                      {Object.entries(fieldChanges).map(([field, changes]) => (
                        <div key={field} className="mb-4">
                          <h4 className="font-semibold mb-2">{field}</h4>
                          <div className="timeline">
                            {changes.map((change, idx) => (
                              <div key={idx} className="timeline-item">
                                <div className="timeline-date">
                                  {dayjs(change.changedAt).format("YYYY-MM-DD HH:mm")} · {change.operatorName}
                                </div>
                                <div className="timeline-content">
                                  <div>
                                    <span style={{
                                      textDecoration: "line-through",
                                      color: "#ef4444",
                                      marginRight: 12,
                                    }}>
                                      {formatValue(change.oldValue)}
                                    </span>
                                    <span style={{ color: "#10b981" }}>
                                      → {formatValue(change.newValue)}
                                    </span>
                                  </div>
                                  {change.remark && (
                                    <div className="text-sm text-muted mt-1">{change.remark}</div>
                                  )}
                                </div>
                              </div>
                            ))}
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
          )}
        </div>

        <div className="article-detail-sidebar">
          <h3 className="font-semibold mb-3">稿件信息</h3>

          <div className="form-group">
            <label className="form-label">分类</label>
            <select
              className="form-select"
              value={editData.category}
              onChange={e => setEditData({ ...editData, category: e.target.value })}
            >
              <option value="">请选择</option>
              <option value="politics">时政新闻</option>
              <option value="finance">财经新闻</option>
              <option value="society">社会新闻</option>
              <option value="tech">科技新闻</option>
              <option value="entertainment">文化娱乐</option>
              <option value="sports">体育新闻</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">优先级</label>
            <select
              className="form-select"
              value={editData.priority}
              onChange={e => setEditData({ ...editData, priority: e.target.value })}
            >
              <option value="normal">普通</option>
              <option value="important">重要</option>
              <option value="urgent">紧急</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">标签</label>
            <input
              type="text"
              className="form-input"
              value={editData.tags?.join(", ")}
              onChange={e => setEditData({
                ...editData,
                tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean)
              })}
              placeholder="逗号分隔"
            />
          </div>

          <div className="form-group">
            <label className="form-label">发布平台</label>
            <div className="flex flex-wrap gap-2">
              {["wechat", "weibo", "toutiao", "douyin", "website", "app"].map(p => (
                <label key={p} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={editData.platforms?.includes(p)}
                    onChange={e => {
                      const platforms = editData.platforms || [];
                      if (e.target.checked) {
                        setEditData({ ...editData, platforms: [...platforms, p] });
                      } else {
                        setEditData({ ...editData, platforms: platforms.filter(x => x !== p) });
                      }
                    }}
                  />
                  {getPlatformLabel(p)}
                </label>
              ))}
            </div>
          </div>

          <div className="divider"></div>

          {!isNew && (
            <>
              <div className="flex justify-between mb-2">
                <span className="text-muted">作者</span>
                <span>{article.authorName || "-"}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-muted">字数</span>
                <span>{article.wordCount || 0} 字</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-muted">创建时间</span>
                <span>{dayjs(article.createdAt).format("MM-DD HH:mm")}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-muted">更新时间</span>
                <span>{dayjs(article.updatedAt).format("MM-DD HH:mm")}</span>
              </div>
              {article.scheduledTime && (
                <div className="flex justify-between mb-2">
                  <span className="text-muted">排期时间</span>
                  <span>{dayjs(article.scheduledTime).format("MM-DD HH:mm")}</span>
                </div>
              )}

              <div className="divider"></div>

              <div className="mb-3">
                <h4 className="font-semibold mb-2">快捷操作</h4>
                <div className="grid grid-cols-2 gap-2">
                  {article.status === "submitted" && (
                    <button className="btn btn-success btn-sm" onClick={() => handleStatusChange("reviewing")}>
                      开始审核
                    </button>
                  )}
                  {article.status === "reviewing" && (
                    <button className="btn btn-success btn-sm" onClick={() => handleStatusChange("approved")}>
                      审核通过
                    </button>
                  )}
                  {(article.status === "approved" || article.status === "revised") && (
                    <button className="btn btn-primary btn-sm" onClick={() => handleStatusChange("published")}>
                      发布
                    </button>
                  )}
                  {article.status !== "draft" && (
                    <button className="btn btn-warning btn-sm" onClick={() => handleStatusChange("revised")}>
                      退回修改
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showMaterialPicker && (
        <MaterialPickerModal
          onClose={() => setShowMaterialPicker(false)}
          onSelect={(materialId) => {
            handleAddMaterial(materialId);
            setShowMaterialPicker(false);
          }}
        />
      )}
    </div>
  );

  async function setCurrentCover(coverId) {
    try {
      await api.put(`/articles/${id}/cover/${coverId}/current`);
      loadArticle();
    } catch (err) {
      alert("设置失败：" + err.message);
    }
  }

  async function handleAddMaterial(materialId) {
    try {
      await api.post(`/articles/${id}/materials`, { materialId });
      loadArticle();
    } catch (err) {
      alert("关联失败：" + err.message);
    }
  }
}

function MaterialPickerModal({ onClose, onSelect }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    loadMaterials();
  }, [keyword]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const data = await api.get("/materials", { pageSize: 50, keyword });
      setMaterials(data.items);
    } catch (err) {
      console.error("加载素材失败:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 800 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">选择素材</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <input
            type="text"
            className="form-input mb-3"
            placeholder="搜索素材..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
          {loading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : (
            <div className="material-grid" style={{ maxHeight: 400, overflowY: "auto" }}>
              {materials.map((m) => (
                <div
                  key={m._id}
                  className="material-card"
                  onClick={() => onSelect(m._id)}
                >
                  <div className="material-card-thumbnail" style={{ height: 100, fontSize: 32 }}>
                    {m.type === "image" ? "🖼️" : m.type === "video" ? "🎬" : m.type === "audio" ? "🎵" : "📄"}
                  </div>
                  <div className="material-card-body">
                    <div className="material-card-title" style={{ fontSize: 13 }}>{m.title}</div>
                    <div className="text-sm text-muted">
                      复用 {m.usageCount || 0} 次
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getStatusLabel(status) {
  const map = {
    draft: "草稿", submitted: "已提交", reviewing: "审核中",
    revised: "待修改", approved: "已通过", published: "已发布", rejected: "已拒绝",
  };
  return map[status] || status;
}

function getStatusStyle(status) {
  const map = {
    draft: "", submitted: "primary", reviewing: "warning",
    revised: "danger", approved: "success", published: "success", rejected: "danger",
  };
  return map[status] || "";
}

function getPriorityLabel(p) {
  const map = { normal: "普通", important: "重要", urgent: "紧急" };
  return map[p] || p;
}

function getPriorityStyle(p) {
  const map = { normal: "", important: "primary", urgent: "danger" };
  return map[p] || "";
}

function getFeedbackTypeLabel(type) {
  const map = { comment: "评论", suggestion: "建议", question: "疑问", correction: "纠错" };
  return map[type] || type;
}

function getReviewLevelLabel(level) {
  const map = { first: "初审", second: "复审", final: "终审" };
  return map[level] || level;
}

function getReviewStatusLabel(status) {
  const map = { pending: "待处理", approved: "通过", needs_revision: "需修改", rejected: "驳回" };
  return map[status] || status;
}

function getReviewStatusBg(status) {
  const map = {
    pending: "#e5e7eb",
    approved: "#d1fae5",
    needs_revision: "#fef3c7",
    rejected: "#fee2e2",
  };
  return map[status] || "#e5e7eb";
}

function getReviewStatusColor(status) {
  const map = {
    pending: "#374151",
    approved: "#065f46",
    needs_revision: "#92400e",
    rejected: "#991b1b",
  };
  return map[status] || "#374151";
}

function getPlatformLabel(platform) {
  const map = {
    wechat: "微信公众号", weibo: "微博", toutiao: "今日头条",
    douyin: "抖音", website: "官网", app: "APP",
  };
  return map[platform] || platform;
}

function formatValue(val) {
  if (val === null || val === undefined) return "(空)";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

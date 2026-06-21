import { useState, useEffect } from "react";
import { useParams, useNavigate } from "@remix-run/react";
import { api } from "~/utils/api";
import { useDictionary } from "~/utils/useDictionary";
import dayjs from "dayjs";

export default function ExceptionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exception, setException] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noteInput, setNoteInput] = useState("");
  const [noteStatus, setNoteStatus] = useState("");
  const [resolution, setResolution] = useState("");
  const [closingRemark, setClosingRemark] = useState("");
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignee, setAssignee] = useState("");
  const [assigneeName, setAssigneeName] = useState("");
  const [auditLogs, setAuditLogs] = useState([]);

  const { options: typeOptions, getLabel: getTypeLabel, getColor: getTypeColor } = useDictionary("exception_type");
  const { options: severityOptions, getLabel: getSeverityLabelDict, getColor: getSeverityColor } = useDictionary("exception_severity");
  const { options: statusOptions, getLabel: getStatusLabelDict } = useDictionary("exception_status");

  useEffect(() => {
    if (id === "new") {
      setLoading(false);
      setException({
        _id: "new",
        type: "authorization_risk",
        severity: "medium",
        status: "pending",
      });
      return;
    }
    loadException();
    loadAuditLogs();
  }, [id]);

  const loadException = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/exceptions/${id}`);
      setException(data);
    } catch (err) {
      console.error("加载异常单失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const data = await api.get(`/audit/entity/exception/${id}`);
      setAuditLogs(data.items || []);
    } catch (err) {
      console.error("加载审计日志失败:", err);
    }
  };

  const handleAddNote = async () => {
    if (!noteInput.trim()) return;
    try {
      await api.post(`/exceptions/${id}/note`, {
        note: noteInput,
        status: noteStatus || undefined,
      });
      setNoteInput("");
      setNoteStatus("");
      loadException();
    } catch (err) {
      alert("添加失败：" + err.message);
    }
  };

  const handleResolve = async () => {
    if (!resolution.trim()) {
      alert("请填写处理说明");
      return;
    }
    try {
      await api.post(`/exceptions/${id}/resolve`, { resolution });
      setShowResolveModal(false);
      setResolution("");
      loadException();
      loadAuditLogs();
    } catch (err) {
      alert("办结失败：" + err.message);
    }
  };

  const handleClose = async () => {
    try {
      await api.post(`/exceptions/${id}/close`, { closingRemark });
      setShowCloseModal(false);
      setClosingRemark("");
      loadException();
      loadAuditLogs();
    } catch (err) {
      alert("关闭失败：" + err.message);
    }
  };

  const handleAssign = async () => {
    if (!assigneeName.trim()) {
      alert("请填写处理人");
      return;
    }
    try {
      await api.post(`/exceptions/${id}/assign`, {
        assignee: assignee || null,
        assigneeName,
      });
      setShowAssignModal(false);
      setAssignee("");
      setAssigneeName("");
      loadException();
      loadAuditLogs();
    } catch (err) {
      alert("指派失败：" + err.message);
    }
  };

  const handleCreateNew = async () => {
    try {
      const data = await api.post("/exceptions", newException);
      navigate(`/exceptions/${data._id}`);
    } catch (err) {
      alert("创建失败：" + err.message);
    }
  };

  const [newException, setNewException] = useState({
    type: "authorization_risk",
    severity: "medium",
    title: "",
    description: "",
    relatedType: "",
    relatedId: "",
    relatedTitle: "",
  });

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  if (!exception) {
    return <div className="empty-state">异常单不存在</div>;
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
              {isNew ? "新建异常单" : exception.title}
            </h1>
            {!isNew && (
              <>
                <span className={`badge badge-${getSeverityStyle(exception.severity)}`}>
                  {getSeverityLabel(exception.severity)}
                </span>
                <span className={`badge badge-${getStatusStyle(exception.status)}`}>
                  {getStatusLabel(exception.status)}
                </span>
              </>
            )}
          </div>
          {!isNew && (
            <div className="text-sm text-muted mt-1">
              编号：{exception.exceptionNo}
            </div>
          )}
        </div>
        {!isNew && (
          <div className="flex gap-2">
            {exception.status === "pending" && (
              <button className="btn btn-primary" onClick={() => setShowAssignModal(true)}>
                指派处理
              </button>
            )}
            {(exception.status === "pending" || exception.status === "processing") && (
              <button className="btn btn-success" onClick={() => setShowResolveModal(true)}>
                办结
              </button>
            )}
            {exception.status === "resolved" && (
              <button className="btn btn-secondary" onClick={() => setShowCloseModal(true)}>
                关闭
              </button>
            )}
          </div>
        )}
      </div>

      {isNew ? (
        <div className="card">
          <div className="form-group">
            <label className="form-label">异常类型</label>
            <select
              className="form-select"
              value={newException.type}
              onChange={e => setNewException({ ...newException, type: e.target.value })}
            >
              {typeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">严重程度</label>
            <select
              className="form-select"
              value={newException.severity}
              onChange={e => setNewException({ ...newException, severity: e.target.value })}
            >
              {severityOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">标题</label>
            <input
              type="text"
              className="form-input"
              value={newException.title}
              onChange={e => setNewException({ ...newException, title: e.target.value })}
              placeholder="请输入异常单标题"
            />
          </div>

          <div className="form-group">
            <label className="form-label">详细描述</label>
            <textarea
              className="form-textarea"
              value={newException.description}
              onChange={e => setNewException({ ...newException, description: e.target.value })}
              placeholder="请详细描述异常情况..."
            />
          </div>

          <div className="flex justify-end">
            <button className="btn btn-primary" onClick={handleCreateNew}>
              创建异常单
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div style={{ gridColumn: "span 2" }}>
            <div className="card mb-4">
              <h3 className="font-semibold mb-3">异常详情</h3>
              <div className="mb-4">
                <div className="text-muted mb-2">描述</div>
                <p>{exception.description || "暂无描述"}</p>
              </div>

              {exception.relatedTitle && (
                <div className="p-3 bg-blue-50 rounded mb-4">
                  <div className="text-sm text-muted mb-1">关联对象</div>
                  <div className="font-medium">{exception.relatedType}</div>
                  <div>{exception.relatedTitle}</div>
                </div>
              )}

              {exception.resolution && (
                <div className="p-3 bg-green-50 rounded mb-4">
                  <div className="text-sm text-green-700 font-semibold mb-1">处理结果</div>
                  <p className="text-green-800">{exception.resolution}</p>
                </div>
              )}

              {exception.closingRemark && (
                <div className="p-3 bg-gray-100 rounded">
                  <div className="text-sm text-muted mb-1">关闭备注</div>
                  <p>{exception.closingRemark}</p>
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="font-semibold mb-3">处理记录</h3>

              {(exception.status === "pending" || exception.status === "processing") && (
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <div className="flex gap-2 mb-2">
                    <select
                      className="form-select"
                      style={{ width: 120 }}
                      value={noteStatus}
                      onChange={e => setNoteStatus(e.target.value)}
                    >
                      <option value="">状态不变</option>
                      <option value="processing">处理中</option>
                      <option value="pending">待处理</option>
                    </select>
                    <input
                      type="text"
                      className="form-input"
                      style={{ flex: 1 }}
                      placeholder="添加处理备注..."
                      value={noteInput}
                      onChange={e => setNoteInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleAddNote()}
                    />
                    <button className="btn btn-primary" onClick={handleAddNote}>
                      添加
                    </button>
                  </div>
                </div>
              )}

              {exception.handlingNotes?.length > 0 ? (
                <div className="timeline">
                  {exception.handlingNotes.map((note) => (
                    <div key={note.id} className="timeline-item">
                      <div className="timeline-date">
                        {dayjs(note.createdAt).format("YYYY-MM-DD HH:mm")} · {note.userName}
                        {note.status && (
                          <span className="badge badge-primary" style={{ marginLeft: 8 }}>
                            {getStatusLabel(note.status)}
                          </span>
                        )}
                      </div>
                      <div className="timeline-content">
                        {note.note}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">暂无处理记录</div>
              )}
            </div>
          </div>

          <div>
            <div className="card mb-4">
              <h3 className="font-semibold mb-3">基本信息</h3>

              <div className="flex justify-between mb-2">
                <span className="text-muted">异常类型</span>
                <span className={`badge badge-${getTypeStyle(exception.type)}`}>
                  {getTypeLabel(exception.type)}
                </span>
              </div>

              <div className="flex justify-between mb-2">
                <span className="text-muted">严重程度</span>
                <span className={`badge badge-${getSeverityStyle(exception.severity)}`}>
                  {getSeverityLabel(exception.severity)}
                </span>
              </div>

              <div className="flex justify-between mb-2">
                <span className="text-muted">当前状态</span>
                <span className={`badge badge-${getStatusStyle(exception.status)}`}>
                  {getStatusLabel(exception.status)}
                </span>
              </div>

              <div className="divider"></div>

              <div className="flex justify-between mb-2">
                <span className="text-muted">发起人</span>
                <span>{exception.raisedByName || "-"}</span>
              </div>

              <div className="flex justify-between mb-2">
                <span className="text-muted">发起时间</span>
                <span>{dayjs(exception.createdAt).format("MM-DD HH:mm")}</span>
              </div>

              {exception.assigneeName && (
                <div className="flex justify-between mb-2">
                  <span className="text-muted">处理人</span>
                  <span>{exception.assigneeName}</span>
                </div>
              )}

              {exception.resolvedAt && (
                <div className="flex justify-between mb-2">
                  <span className="text-muted">办结时间</span>
                  <span>{dayjs(exception.resolvedAt).format("MM-DD HH:mm")}</span>
                </div>
              )}

              {exception.resolvedByName && (
                <div className="flex justify-between mb-2">
                  <span className="text-muted">办结人</span>
                  <span>{exception.resolvedByName}</span>
                </div>
              )}

              {exception.closedAt && (
                <div className="flex justify-between mb-2">
                  <span className="text-muted">关闭时间</span>
                  <span>{dayjs(exception.closedAt).format("MM-DD HH:mm")}</span>
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="font-semibold mb-3">变更日志</h3>
              {auditLogs.length > 0 ? (
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  {auditLogs.map((log) => (
                    <div key={log._id} className="mb-3 pb-3 border-b border-gray-100">
                      <div className="text-sm text-muted">
                        {dayjs(log.createdAt).format("MM-DD HH:mm")}
                      </div>
                      <div className="font-medium text-sm">{getActionLabel(log.action)}</div>
                      {log.operatorName && (
                        <div className="text-sm text-muted">操作人：{log.operatorName}</div>
                      )}
                      {log.remark && (
                        <div className="text-sm text-gray-600 mt-1">{log.remark}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted">暂无变更记录</div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">指派处理人</h3>
              <button className="modal-close" onClick={() => setShowAssignModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">处理人姓名</label>
                <input
                  type="text"
                  className="form-input"
                  value={assigneeName}
                  onChange={e => setAssigneeName(e.target.value)}
                  placeholder="请输入处理人姓名"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleAssign}>确认指派</button>
            </div>
          </div>
        </div>
      )}

      {showResolveModal && (
        <div className="modal-overlay" onClick={() => setShowResolveModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">办结异常单</h3>
              <button className="modal-close" onClick={() => setShowResolveModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-success mb-4">
                办结后异常单状态将变为"已办结"，请填写处理说明。
              </div>
              <div className="form-group">
                <label className="form-label">处理说明</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: 120 }}
                  value={resolution}
                  onChange={e => setResolution(e.target.value)}
                  placeholder="请详细描述处理过程和结果..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowResolveModal(false)}>取消</button>
              <button className="btn btn-success" onClick={handleResolve}>确认办结</button>
            </div>
          </div>
        </div>
      )}

      {showCloseModal && (
        <div className="modal-overlay" onClick={() => setShowCloseModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">关闭异常单</h3>
              <button className="modal-close" onClick={() => setShowCloseModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info mb-4">
                只有已办结的异常单才能关闭，关闭后不可再修改。
              </div>
              <div className="form-group">
                <label className="form-label">关闭备注（可选）</label>
                <textarea
                  className="form-textarea"
                  value={closingRemark}
                  onChange={e => setClosingRemark(e.target.value)}
                  placeholder="关闭备注..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCloseModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleClose}>确认关闭</button>
            </div>
          </div>
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

function getActionLabel(action) {
  const map = { create: "创建", update: "更新", delete: "删除", assign: "指派", status_change: "状态变更" };
  return map[action] || action;
}

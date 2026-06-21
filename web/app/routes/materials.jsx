import { useState, useEffect } from "react";
import { useNavigate } from "@remix-run/react";
import { api } from "~/utils/api";
import { useDictionary } from "~/utils/useDictionary";
import dayjs from "dayjs";

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [authStatus, setAuthStatus] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const navigate = useNavigate();

  const { options: typeOptions } = useDictionary("material_type");
  const { options: authStatusOptions } = useDictionary("material_auth_status");

  useEffect(() => {
    loadMaterials();
  }, [page, type, status, authStatus]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const data = await api.get("/materials", {
        page,
        pageSize,
        keyword,
        type,
        status,
        authStatus,
      });
      setMaterials(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error("加载素材失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadMaterials();
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="page-title" style={{ margin: 0 }}>素材库</h1>
        <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
          + 上传素材
        </button>
      </div>

      <div className="card mb-4">
        <form onSubmit={handleSearch} className="flex gap-3 items-end">
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">搜索</label>
            <input
              type="text"
              className="form-input"
              placeholder="搜索素材标题、标签..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">类型</label>
            <select
              className="form-select"
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
            >
              <option value="">全部类型</option>
              {typeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">状态</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            >
              <option value="">全部状态</option>
              <option value="draft">草稿</option>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">授权状态</label>
            <select
              className="form-select"
              value={authStatus}
              onChange={(e) => { setAuthStatus(e.target.value); setPage(1); }}
            >
              <option value="">全部</option>
              {authStatusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
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
        <>
          {materials.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🖼️</div>
              <p>暂无素材，点击右上角"上传素材"添加</p>
            </div>
          ) : (
            <div className="material-grid">
              {materials.map((item) => (
                <div
                  key={item._id}
                  className="material-card"
                  onClick={() => navigate(`/materials/${item._id}`)}
                >
                  <div className="material-card-thumbnail">
                    {item.type === "image" ? "🖼️" :
                     item.type === "video" ? "🎬" :
                     item.type === "audio" ? "🎵" :
                     item.type === "document" ? "📄" : "📦"}
                  </div>
                  <div className="material-card-body">
                    <div className="material-card-title">{item.title}</div>
                    <div className="flex justify-between items-center">
                      <span className="badge" style={{
                        background: getAuthStatusBg(item.authorization?.status),
                        color: getAuthStatusColor(item.authorization?.status),
                      }}>
                        {getAuthStatusLabel(item.authorization?.status)}
                      </span>
                      <span className="text-sm text-muted">复用 {item.usageCount || 0} 次</span>
                    </div>
                    <div className="mt-2">
                      {item.tags?.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="tag">{tag}</span>
                      ))}
                    </div>
                    <div className="text-sm text-muted mt-2">
                      {dayjs(item.createdAt).format("YYYY-MM-DD")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

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

      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onSuccess={() => {
          setShowUpload(false);
          loadMaterials();
        }} />
      )}
    </div>
  );
}

function UploadModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "image",
    tags: "",
    category: "",
    source: "",
    author: "",
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("请选择文件");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", formData.title || file.name);
      fd.append("description", formData.description);
      fd.append("type", formData.type);
      fd.append("tags", formData.tags);
      fd.append("category", formData.category);
      fd.append("source", formData.source);
      fd.append("author", formData.author);

      await api.upload("/materials", fd);
      onSuccess();
    } catch (err) {
      alert("上传失败：" + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">上传素材</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div
              className="upload-zone mb-4"
              onClick={() => document.getElementById("fileInput").click()}
            >
              <input
                id="fileInput"
                type="file"
                style={{ display: "none" }}
                onChange={(e) => setFile(e.target.files[0])}
              />
              <div className="upload-zone-icon">📁</div>
              <p className="font-semibold">点击或拖拽文件到此处上传</p>
              <p className="text-sm text-muted mt-1">支持图片、视频、音频、文档等格式</p>
              {file && (
                <div className="mt-3 p-2 bg-gray-50 rounded">
                  已选择：{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">标题</label>
              <input
                type="text"
                className="form-input"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="素材标题"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">类型</label>
                <select
                  className="form-select"
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="image">图片</option>
                  <option value="video">视频</option>
                  <option value="audio">音频</option>
                  <option value="document">文档</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">分类</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  placeholder="如：时政、财经"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">标签（逗号分隔）</label>
              <input
                type="text"
                className="form-input"
                value={formData.tags}
                onChange={e => setFormData({ ...formData, tags: e.target.value })}
                placeholder="如：新闻,采访,配图"
              />
            </div>

            <div className="form-group">
              <label className="form-label">描述</label>
              <textarea
                className="form-textarea"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="素材描述"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">来源</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.source}
                  onChange={e => setFormData({ ...formData, source: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">作者</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.author}
                  onChange={e => setFormData({ ...formData, author: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? "上传中..." : "上传"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getAuthStatusLabel(status) {
  const map = {
    authorized: "已授权",
    pending: "待确认",
    unauthorized: "未授权",
    unknown: "未知",
  };
  return map[status] || "未知";
}

function getAuthStatusBg(status) {
  const map = {
    authorized: "#d1fae5",
    pending: "#fef3c7",
    unauthorized: "#fee2e2",
    unknown: "#f3f4f6",
  };
  return map[status] || "#f3f4f6";
}

function getAuthStatusColor(status) {
  const map = {
    authorized: "#065f46",
    pending: "#92400e",
    unauthorized: "#991b1b",
    unknown: "#4b5563",
  };
  return map[status] || "#4b5563";
}

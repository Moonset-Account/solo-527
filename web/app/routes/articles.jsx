import { useState, useEffect } from "react";
import { useNavigate } from "@remix-run/react";
import { api } from "~/utils/api";
import dayjs from "dayjs";

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadArticles();
  }, [page, status, category, priority]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await api.get("/articles", {
        page,
        pageSize,
        keyword,
        status,
        category,
        priority,
      });
      setArticles(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error("加载稿件失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadArticles();
  };

  const handleCreate = () => {
    navigate("/articles/new");
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="page-title" style={{ margin: 0 }}>稿件管理</h1>
        <button className="btn btn-primary" onClick={handleCreate}>
          + 新建稿件
        </button>
      </div>

      <div className="card mb-4">
        <form onSubmit={handleSearch} className="flex gap-3 items-end">
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">搜索</label>
            <input
              type="text"
              className="form-input"
              placeholder="搜索稿件标题..."
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
              <option value="draft">草稿</option>
              <option value="submitted">已提交</option>
              <option value="reviewing">审核中</option>
              <option value="revised">待修改</option>
              <option value="approved">已通过</option>
              <option value="published">已发布</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">分类</label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            >
              <option value="">全部分类</option>
              <option value="politics">时政新闻</option>
              <option value="finance">财经新闻</option>
              <option value="society">社会新闻</option>
              <option value="tech">科技新闻</option>
              <option value="entertainment">文化娱乐</option>
              <option value="sports">体育新闻</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">优先级</label>
            <select
              className="form-select"
              value={priority}
              onChange={(e) => { setPriority(e.target.value); setPage(1); }}
            >
              <option value="">全部</option>
              <option value="normal">普通</option>
              <option value="important">重要</option>
              <option value="urgent">紧急</option>
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
          {articles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <p>暂无稿件，点击"新建稿件"开始</p>
            </div>
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>标题</th>
                    <th>分类</th>
                    <th>状态</th>
                    <th>优先级</th>
                    <th>作者</th>
                    <th>字数</th>
                    <th>更新时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article) => (
                    <tr key={article._id}>
                      <td>
                        <a href="#" onClick={(e) => {
                          e.preventDefault();
                          navigate(`/articles/${article._id}`);
                        }}>
                          {article.title}
                        </a>
                        {article.subtitle && (
                          <div className="text-sm text-muted">{article.subtitle}</div>
                        )}
                      </td>
                      <td>{article.category || "-"}</td>
                      <td>
                        <span className={`badge badge-${getStatusStyle(article.status)}`}>
                          {getStatusLabel(article.status)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${getPriorityStyle(article.priority)}`}>
                          {getPriorityLabel(article.priority)}
                        </span>
                      </td>
                      <td>{article.authorName || "-"}</td>
                      <td>{article.wordCount || 0}</td>
                      <td className="text-sm text-muted">
                        {dayjs(article.updatedAt).format("MM-DD HH:mm")}
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/articles/${article._id}`)}
                        >
                          处理
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

function getStatusLabel(status) {
  const map = {
    draft: "草稿",
    submitted: "已提交",
    reviewing: "审核中",
    revised: "待修改",
    approved: "已通过",
    published: "已发布",
    rejected: "已拒绝",
  };
  return map[status] || status;
}

function getStatusStyle(status) {
  const map = {
    draft: "",
    submitted: "primary",
    reviewing: "warning",
    revised: "danger",
    approved: "success",
    published: "success",
    rejected: "danger",
  };
  return map[status] || "";
}

function getPriorityLabel(priority) {
  const map = { normal: "普通", important: "重要", urgent: "紧急" };
  return map[priority] || priority;
}

function getPriorityStyle(priority) {
  const map = { normal: "", important: "primary", urgent: "danger" };
  return map[priority] || "";
}

import { useState, useEffect } from "react";
import { api } from "~/utils/api";

export default function Stats() {
  const [reuseStats, setReuseStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("reuse");

  useEffect(() => {
    loadReuseStats();
  }, []);

  const loadReuseStats = async () => {
    setLoading(true);
    try {
      const data = await api.get("/stats/materials/reuse", { limit: 20 });
      setReuseStats(data);
    } catch (err) {
      console.error("加载统计数据失败:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">数据统计</h1>

      <div className="tabs">
        <div
          className={`tab-item ${activeTab === "reuse" ? "active" : ""}`}
          onClick={() => setActiveTab("reuse")}
        >
          素材复用统计
        </div>
        <div
          className={`tab-item ${activeTab === "article" ? "active" : ""}`}
          onClick={() => setActiveTab("article")}
        >
          稿件统计
        </div>
      </div>

      {activeTab === "reuse" && (
        <div>
          {loading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="stat-card">
                  <div className="stat-card-title">素材总数</div>
                  <div className="stat-card-value">{reuseStats?.summary?.total || 0}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-title">已复用素材</div>
                  <div className="stat-card-value" style={{ color: "#10b981" }}>
                    {reuseStats?.summary?.reused || 0}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-title">复用率</div>
                  <div className="stat-value" style={{ fontSize: 28, fontWeight: 700 }}>
                    {reuseStats?.summary?.reuseRate || 0}%
                  </div>
                </div>
              </div>

              <div className="card mb-4">
                <h3 className="font-semibold text-lg mb-4">按类型统计</h3>
                <div className="grid grid-cols-3 gap-4">
                  {reuseStats?.byType?.map((item) => (
                    <div key={item.type} className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-lg font-semibold">{getTypeLabel(item.type)}</div>
                      <div className="text-2xl font-bold text-blue-600 mt-2">{item.total}</div>
                      <div className="text-sm text-muted mt-1">
                        已复用 {item.reused} · 复用率 {item.reuseRate}%
                      </div>
                      <div className="text-sm text-muted">
                        累计使用 {item.totalUsage} 次
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="font-semibold text-lg mb-4">素材复用排行榜 TOP 20</h3>
                {reuseStats?.topReused?.length > 0 ? (
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: 60 }}>排名</th>
                        <th>素材标题</th>
                        <th style={{ width: 100 }}>类型</th>
                        <th style={{ width: 100 }}>分类</th>
                        <th style={{ width: 100 }}>复用次数</th>
                        <th style={{ width: 200 }}>标签</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reuseStats.topReused.map((item, index) => (
                        <tr key={item._id}>
                          <td>
                            <span className="badge" style={{
                              background: index < 3 ? "#f59e0b" : "#e5e7eb",
                              color: index < 3 ? "white" : "#374151",
                            }}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="font-medium">{item.title}</td>
                          <td>{getTypeLabel(item.type)}</td>
                          <td>{item.category || "-"}</td>
                          <td>
                            <span className="text-lg font-bold text-blue-600">
                              {item.usageCount}
                            </span>
                          </td>
                          <td>
                            {item.tags?.slice(0, 3).map((tag, idx) => (
                              <span key={idx} className="tag">{tag}</span>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">暂无数据</div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "article" && (
        <div>
          <div className="card">
            <h3 className="font-semibold text-lg mb-4">稿件统计</h3>
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <p>稿件统计功能开发中...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getTypeLabel(type) {
  const map = {
    image: "图片",
    video: "视频",
    audio: "音频",
    document: "文档",
    other: "其他",
  };
  return map[type] || type;
}

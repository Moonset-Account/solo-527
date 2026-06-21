import { useState, useEffect } from "react";
import { useNavigate } from "@remix-run/react";
import { api } from "~/utils/api";
import dayjs from "dayjs";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.get("/stats/dashboard");
      setStats(data);
    } catch (err) {
      console.error("加载统计数据失败:", err);
    } finally {
      setLoading(false);
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

  return (
    <div>
      <h1 className="page-title">工作台</h1>

      <div className="grid grid-cols-4 mb-4">
        <div className="stat-card" onClick={() => navigate("/materials")} style={{ cursor: "pointer" }}>
          <div className="stat-card-title">素材总数</div>
          <div className="stat-card-value">{stats?.summary?.totalMaterials || 0}</div>
          <div className="text-sm text-muted mt-2">点击查看素材库</div>
        </div>

        <div className="stat-card" onClick={() => navigate("/articles")} style={{ cursor: "pointer" }}>
          <div className="stat-card-title">稿件总数</div>
          <div className="stat-card-value">{stats?.summary?.totalArticles || 0}</div>
          <div className="text-sm text-muted mt-2">点击查看稿件</div>
        </div>

        <div className="stat-card" onClick={() => navigate("/exceptions")} style={{ cursor: "pointer" }}>
          <div className="stat-card-title">异常单总数</div>
          <div className="stat-card-value">{stats?.summary?.totalExceptions || 0}</div>
          <div className="text-sm text-muted mt-2">点击查看异常单</div>
        </div>

        <div className="stat-card" onClick={() => navigate("/exceptions?status=pending")} style={{ cursor: "pointer", borderLeft: "4px solid #ef4444" }}>
          <div className="stat-card-title">待处理异常</div>
          <div className="stat-card-value" style={{ color: "#ef4444" }}>{stats?.summary?.pendingExceptions || 0}</div>
          <div className="text-sm text-muted mt-2">需要及时处理</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-semibold text-lg mb-4">素材类型分布</h2>
          {stats?.materialStats?.byType?.length > 0 ? (
            <div>
              {stats.materialStats.byType.map((item) => (
                <div key={item.type} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span>{getTypeLabel(item.type)}</span>
                    <span className="text-muted">{item.count}</span>
                  </div>
                  <div style={{ height: 8, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        background: "#3b82f6",
                        width: `${(item.count / (stats?.summary?.totalMaterials || 1)) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">暂无数据</div>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-lg mb-4">稿件状态分布</h2>
          {stats?.articleStats?.byStatus?.length > 0 ? (
            <div>
              {stats.articleStats.byStatus.map((item) => (
                <div key={item.status} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span>
                      <span className="badge" style={{ marginRight: 8 }}>{getStatusLabel(item.status)}</span>
                    </span>
                    <span className="text-muted">{item.count}</span>
                  </div>
                  <div style={{ height: 8, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        background: getStatusColor(item.status),
                        width: `${(item.count / (stats?.summary?.totalArticles || 1)) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">暂无数据</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">素材复用排行</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate("/stats")}>
              查看更多
            </button>
          </div>
          {stats?.materialStats?.topReused?.length > 0 ? (
            <div>
              {stats.materialStats.topReused.slice(0, 5).map((item, index) => (
                <div key={item._id} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="badge" style={{
                      background: index < 3 ? "#f59e0b" : "#e5e7eb",
                      color: index < 3 ? "white" : "#374151",
                    }}>
                      {index + 1}
                    </span>
                    <span>{item.title}</span>
                  </div>
                  <span className="text-muted">复用 {item.usageCount} 次</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">暂无数据</div>
          )}
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">今日排期</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate("/schedule")}>
              查看排期
            </button>
          </div>
          {stats?.todaySchedules?.length > 0 ? (
            <div>
              {stats.todaySchedules.map((item) => (
                <div key={item._id} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold">{item.platform}</span>
                    <span className="text-muted">{item.itemCount} 条</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">今日暂无排期</div>
          )}
        </div>
      </div>

      <div className="card mt-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">异常单概览</h2>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate("/exceptions")}>
            查看全部
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {stats?.exceptionStats?.byStatus?.map((item) => (
            <div key={item.status} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold" style={{ color: getExceptionStatusColor(item.status) }}>
                {item.count}
              </div>
              <div className="text-sm text-muted">{getExceptionStatusLabel(item.status)}</div>
            </div>
          ))}
        </div>
      </div>
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

function getStatusColor(status) {
  const map = {
    draft: "#9ca3af",
    submitted: "#3b82f6",
    reviewing: "#f59e0b",
    revised: "#ef4444",
    approved: "#10b981",
    published: "#059669",
    rejected: "#dc2626",
  };
  return map[status] || "#9ca3af";
}

function getExceptionStatusLabel(status) {
  const map = {
    pending: "待处理",
    processing: "处理中",
    resolved: "已办结",
    closed: "已关闭",
  };
  return map[status] || status;
}

function getExceptionStatusColor(status) {
  const map = {
    pending: "#f59e0b",
    processing: "#3b82f6",
    resolved: "#10b981",
    closed: "#6b7280",
  };
  return map[status] || "#9ca3af";
}

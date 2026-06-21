import { useState, useEffect } from "react";
import { useNavigate } from "@remix-run/react";
import { api } from "~/utils/api";
import dayjs from "dayjs";

export default function Schedule() {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedPlatform, setSelectedPlatform] = useState("wechat");
  const [scheduleItems, setScheduleItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [articles, setArticles] = useState([]);
  const navigate = useNavigate();

  const platforms = [
    { value: "wechat", label: "微信公众号" },
    { value: "weibo", label: "微博" },
    { value: "toutiao", label: "今日头条" },
    { value: "douyin", label: "抖音" },
    { value: "website", label: "官方网站" },
    { value: "app", label: "APP客户端" },
  ];

  useEffect(() => {
    loadSchedule();
  }, [currentDate, selectedPlatform]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const startOfMonth = currentDate.startOf("month").format("YYYY-MM-DD");
      const endOfMonth = currentDate.endOf("month").format("YYYY-MM-DD");

      const data = await api.get("/schedules", {
        startDate: startOfMonth,
        endDate: endOfMonth,
        platform: selectedPlatform,
      });

      const items = [];
      for (const schedule of data) {
        for (const item of schedule.items || []) {
          items.push({
            ...item,
            date: dayjs(schedule.date).format("YYYY-MM-DD"),
            scheduleId: schedule._id,
          });
        }
      }
      setScheduleItems(items);
    } catch (err) {
      console.error("加载排期失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadArticles = async () => {
    try {
      const data = await api.get("/articles", { pageSize: 50, status: "approved" });
      setArticles(data.items || []);
    } catch (err) {
      console.error("加载稿件失败:", err);
    }
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    loadArticles();
    setShowAddModal(true);
  };

  const handleAddSchedule = async (articleId) => {
    const article = articles.find(a => a._id === articleId);
    if (!article) return;

    try {
      await api.post(`/schedules/${selectedDate}/${selectedPlatform}/items`, {
        articleId,
        articleTitle: article.title,
        priority: article.priority || "normal",
      });
      setShowAddModal(false);
      loadSchedule();
    } catch (err) {
      alert("添加排期失败：" + err.message);
    }
  };

  const handleDeleteItem = async (itemId, date) => {
    if (!confirm("确定要删除这条排期吗？")) return;
    try {
      await api.delete(`/schedules/${date}/${selectedPlatform}/items/${itemId}`);
      loadSchedule();
    } catch (err) {
      alert("删除失败：" + err.message);
    }
  };

  const getDaysInMonth = () => {
    const startOfMonth = currentDate.startOf("month");
    const endOfMonth = currentDate.endOf("month");
    const startDay = startOfMonth.day();
    const daysInMonth = endOfMonth.date();

    const days = [];

    const prevMonth = startOfMonth.subtract(1, "month");
    const prevMonthDays = prevMonth.daysInMonth();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: prevMonth.date(prevMonthDays - i),
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: startOfMonth.date(i),
        isCurrentMonth: true,
      });
    }

    const remaining = 42 - days.length;
    const nextMonth = endOfMonth.add(1, "month");
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: nextMonth.date(i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const getItemsForDate = (dateStr) => {
    return scheduleItems.filter(item => item.date === dateStr);
  };

  const days = getDaysInMonth();
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="page-title" style={{ margin: 0 }}>排期日历</h1>
        <div className="flex gap-2">
          {platforms.map(p => (
            <button
              key={p.value}
              className={`btn btn-sm ${selectedPlatform === p.value ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setSelectedPlatform(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="calendar-header">
          <button className="btn btn-secondary btn-sm" onClick={() => setCurrentDate(currentDate.subtract(1, "month"))}>
            ← 上月
          </button>
          <h2 className="text-xl font-semibold">
            {currentDate.format("YYYY年 M月")}
          </h2>
          <button className="btn btn-secondary btn-sm" onClick={() => setCurrentDate(currentDate.add(1, "month"))}>
            下月 →
          </button>
        </div>

        <div className="calendar-weekdays">
          {weekdays.map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
        </div>

        <div className="calendar-grid">
          {days.map(({ date, isCurrentMonth }, index) => {
            const dateStr = date.format("YYYY-MM-DD");
            const items = getItemsForDate(dateStr);
            const isToday = date.format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD");

            return (
              <div
                key={index}
                className={`calendar-day ${!isCurrentMonth ? "other-month" : ""} ${isToday ? "today" : ""}`}
                onClick={() => isCurrentMonth && handleDateClick(dateStr)}
              >
                <div className="calendar-day-number">{date.date()}</div>
                {items.slice(0, 3).map(item => (
                  <div
                    key={item.id}
                    className="calendar-item"
                    style={{ background: getPriorityBg(item.priority) }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.articleId) {
                        navigate(`/articles/${item.articleId}`);
                      }
                    }}
                  >
                    {item.articleTitle?.slice(0, 10) || item.title?.slice(0, 10)}
                  </div>
                ))}
                {items.length > 3 && (
                  <div className="text-xs text-muted">+{items.length - 3} 更多</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card mt-4">
        <h3 className="font-semibold mb-3">本月排期概览</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-blue-600">{scheduleItems.length}</div>
            <div className="text-sm text-muted">总排期数</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-green-600">
              {scheduleItems.filter(i => i.status === "published").length}
            </div>
            <div className="text-sm text-muted">已发布</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-yellow-600">
              {scheduleItems.filter(i => i.status === "scheduled").length}
            </div>
            <div className="text-sm text-muted">待发布</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-red-600">
              {scheduleItems.filter(i => i.status === "delayed").length}
            </div>
            <div className="text-sm text-muted">已延迟</div>
          </div>
        </div>
      </div>

      {showAddModal && selectedDate && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {selectedDate} · {platforms.find(p => p.value === selectedPlatform)?.label}
              </h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <h4 className="font-semibold mb-3">选择稿件加入排期</h4>
              {articles.length > 0 ? (
                <div style={{ maxHeight: 400, overflowY: "auto" }}>
                  {articles.map(article => (
                    <div
                      key={article._id}
                      className="p-3 bg-gray-50 rounded mb-2 cursor-pointer hover:bg-gray-100 flex justify-between items-center"
                      onClick={() => handleAddSchedule(article._id)}
                    >
                      <div>
                        <div className="font-medium">{article.title}</div>
                        <div className="text-sm text-muted">{article.category} · {article.authorName}</div>
                      </div>
                      <button className="btn btn-primary btn-sm">添加</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">暂无已通过的稿件</div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getPriorityBg(priority) {
  const map = {
    normal: "#e5e7eb",
    important: "#dbeafe",
    urgent: "#fee2e2",
  };
  return map[priority] || "#e5e7eb";
}

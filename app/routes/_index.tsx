import { useLoaderData, Link } from "@remix-run/react";
import { json } from "@remix-run/node";
import dayjs from "dayjs";

export async function loader() {
  try {
    const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";
    const [statsRes, todayRes, trendRes] = await Promise.all([
      fetch(`${baseUrl}/api/dashboard/stats`),
      fetch(`${baseUrl}/api/appointments?startDate=${dayjs().format("YYYY-MM-DD")}&endDate=${dayjs().format("YYYY-MM-DD")}&pageSize=10`),
      fetch(`${baseUrl}/api/dashboard/revenue/trend?days=7`),
    ]);

    const statsData = await statsRes.json();
    const todayData = await todayRes.json();
    const trendData = await trendRes.json();

    return json({
      stats: statsData.data || {
        today: { appointments: 0, revenue: 0, onDuty: 0 },
        month: { appointments: 0, revenue: 0 },
        total: { technicians: 0, customers: 0 },
        pending: { leaves: 0 },
      },
      todayAppointments: todayData.data?.list || [],
      trend: trendData.data || [],
    });
  } catch (error) {
    return json({
      stats: {
        today: { appointments: 0, revenue: 0, onDuty: 0 },
        month: { appointments: 0, revenue: 0 },
        total: { technicians: 0, customers: 0 },
        pending: { leaves: 0 },
      },
      todayAppointments: [],
      trend: [],
    });
  }
}

export default function Dashboard() {
  const { stats, todayAppointments, trend } = useLoaderData<typeof loader>();

  const statCards = [
    {
      label: "今日预约",
      value: stats.today.appointments,
      icon: "📅",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      label: "今日营收",
      value: `¥${stats.today.revenue.toFixed(2)}`,
      icon: "💰",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      label: "本月预约",
      value: stats.month.appointments,
      icon: "📊",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      label: "本月营收",
      value: `¥${stats.month.revenue.toFixed(2)}`,
      icon: "📈",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
    {
      label: "在职技师",
      value: stats.total.technicians,
      icon: "👩",
      bgColor: "bg-pink-50",
      textColor: "text-pink-600",
    },
    {
      label: "客户总数",
      value: stats.total.customers,
      icon: "👥",
      bgColor: "bg-cyan-50",
      textColor: "text-cyan-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, index) => (
          <div key={index} className={`card p-5 ${card.bgColor}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{card.label}</p>
                <p className={`text-2xl font-bold mt-1 ${card.textColor}`}>
                  {card.value}
                </p>
              </div>
              <span className="text-3xl">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">近7日营收趋势</h3>
            <Link to="/appointments" className="text-sm text-primary-600 hover:text-primary-700">
              查看全部 →
            </Link>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {trend.length > 0 ? (
              trend.map((item: any, index: number) => {
                const maxValue = Math.max(...trend.map((t: any) => t.revenue), 1);
                const height = (item.revenue / maxValue) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex justify-center items-end h-48">
                      <div
                        className="w-full max-w-8 bg-gradient-to-t from-primary-500 to-primary-300 rounded-t-lg transition-all hover:from-primary-600 hover:to-primary-400"
                        style={{ height: `${Math.max(height, 5)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {dayjs(item.date).format("MM/DD")}
                    </p>
                    <p className="text-xs font-medium text-gray-700">
                      ¥{item.revenue.toFixed(0)}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="w-full flex items-center justify-center text-gray-400">
                暂无数据
              </div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">待办提醒</h3>
            {stats.pending.leaves > 0 && (
              <span className="badge badge-danger">{stats.pending.leaves}条待审批</span>
            )}
          </div>
          <div className="space-y-3">
            <Link
              to="/schedules"
              className="flex items-center p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <span className="text-2xl mr-3">🏖️</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">请假审批</p>
                <p className="text-xs text-gray-500">
                  {stats.pending.leaves} 条请假申请待审批
                </p>
              </div>
              <span className="text-gray-400">→</span>
            </Link>
            <Link
              to="/reminders"
              className="flex items-center p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <span className="text-2xl mr-3">🔔</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">提醒中心</p>
                <p className="text-xs text-gray-500">查看所有提醒消息</p>
              </div>
              <span className="text-gray-400">→</span>
            </Link>
            <Link
              to="/material-usages"
              className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <span className="text-2xl mr-3">📦</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">耗材消耗</p>
                <p className="text-xs text-gray-500">记录和查看耗材使用</p>
              </div>
              <span className="text-gray-400">→</span>
            </Link>
            <Link
              to="/commissions"
              className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <span className="text-2xl mr-3">💰</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">提成结算</p>
                <p className="text-xs text-gray-500">技师和顾问提成管理</p>
              </div>
              <span className="text-gray-400">→</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">今日预约</h3>
          <div className="flex gap-2">
            <Link to="/cashier" className="btn btn-primary">
              <span className="mr-1">➕</span> 新增预约
            </Link>
            <Link to="/appointments" className="btn btn-secondary">
              查看全部 →
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  时间
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  客户
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  项目
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  技师
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {todayAppointments.length > 0 ? (
                todayAppointments.slice(0, 8).map((appt: any) => (
                  <tr key={appt._id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      {appt.startTime} - {appt.endTime}
                    </td>
                    <td className="table-cell">
                      <div>
                        <p className="font-medium">{appt.customerName}</p>
                        <p className="text-xs text-gray-500">{appt.customerPhone}</p>
                      </div>
                    </td>
                    <td className="table-cell">{appt.treatmentName}</td>
                    <td className="table-cell">{appt.technicianName}</td>
                    <td className="table-cell">
                      <span
                        className={`badge ${
                          appt.status === "已完成"
                            ? "badge-success"
                            : appt.status === "已取消"
                            ? "badge-gray"
                            : appt.status === "服务中"
                            ? "badge-warning"
                            : appt.status === "已确认"
                            ? "badge-info"
                            : "badge-warning"
                        }`}
                      >
                        {appt.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      <Link
                        to={`/appointments/${appt._id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm"
                      >
                        查看
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    今日暂无预约
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

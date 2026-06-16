import {
  Car,
  ClipboardList,
  Package,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ChevronRight,
  Plus,
  Calendar,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

async function getDashboardData() {
  return {
    todayWorkOrders: 12,
    pendingQualityChecks: 5,
    lowStockParts: 8,
    delayedOrders: 2,
    totalVehicles: 256,
    totalParts: 1248,
    thisMonthOrders: 156,
    completedOrders: 132,
  };
}

async function getTodaySchedule() {
  return [
    {
      id: "1",
      time: "08:30",
      workOrder: { orderNo: "WO202606170001", vehicle: { plateNumber: "京A12345", brand: "丰田", model: "凯美瑞" } },
      team: { name: "机修一组" },
      status: "IN_PROGRESS",
    },
    {
      id: "2",
      time: "09:00",
      workOrder: { orderNo: "WO202606170002", vehicle: { plateNumber: "京B67890", brand: "大众", model: "帕萨特" } },
      team: { name: "机修二组" },
      status: "SCHEDULED",
    },
    {
      id: "3",
      time: "10:30",
      workOrder: { orderNo: "WO202606170003", vehicle: { plateNumber: "京C11111", brand: "本田", model: "雅阁" } },
      team: { name: "钣金组" },
      status: "SCHEDULED",
    },
    {
      id: "4",
      time: "13:30",
      workOrder: { orderNo: "WO202606170004", vehicle: { plateNumber: "京D22222", brand: "奥迪", model: "A6L" } },
      team: { name: "机修一组" },
      status: "SCHEDULED",
    },
    {
      id: "5",
      time: "14:00",
      workOrder: { orderNo: "WO202606170005", vehicle: { plateNumber: "京E33333", brand: "宝马", model: "3系" } },
      team: { name: "美容组" },
      status: "SCHEDULED",
    },
  ];
}

const quickActions = [
  { icon: Plus, label: "登记车辆", href: "/vehicles/new", color: "bg-blue-500" },
  { icon: ClipboardList, label: "新建工单", href: "/workorders/new", color: "bg-emerald-500" },
  { icon: Package, label: "配件入库", href: "/parts?action=inbound", color: "bg-amber-500" },
  { icon: Calendar, label: "排班调度", href: "/schedule", color: "bg-purple-500" },
];

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-slate-400",
  IN_PROGRESS: "bg-emerald-500",
  COMPLETED: "bg-blue-500",
  CANCELLED: "bg-rose-500",
};

const statusText: Record<string, string> = {
  SCHEDULED: "待开始",
  IN_PROGRESS: "进行中",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

export default async function DashboardPage() {
  const stats = await getDashboardData();
  const schedule = await getTodaySchedule();

  const statCards = [
    {
      title: "今日工单",
      value: stats.todayWorkOrders,
      icon: ClipboardList,
      color: "from-blue-500 to-blue-600",
      subtitle: `本月 ${stats.thisMonthOrders} 单`,
      href: "/workorders",
    },
    {
      title: "待质检",
      value: stats.pendingQualityChecks,
      icon: ShieldCheck,
      color: "from-amber-500 to-amber-600",
      subtitle: "需尽快处理",
      href: "/quality",
    },
    {
      title: "库存预警",
      value: stats.lowStockParts,
      icon: AlertTriangle,
      color: "from-rose-500 to-rose-600",
      subtitle: "低于安全库存",
      href: "/parts?stockStatus=LOW",
    },
    {
      title: "延期工单",
      value: stats.delayedOrders,
      icon: Clock,
      color: "from-orange-500 to-orange-600",
      subtitle: "需要跟进",
      href: "/quality/delay",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">工作台</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">欢迎回来，今天也要加油哦</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="group bg-white dark:bg-slate-800 rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all duration-200 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-slate-500 dark:text-slate-400">{card.title}</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
                    {card.value}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{card.subtitle}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-slate-400 group-hover:text-primary-500 transition-colors">
                <span>查看详情</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">今日排期</h2>
              <Link
                href="/schedule"
                className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
              >
                查看全部
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="p-5">
              <div className="space-y-3">
                {schedule.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="text-center min-w-[60px]">
                      <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                        {item.time}
                      </p>
                    </div>
                    <div className={`w-1.5 h-12 rounded-full ${statusColors[item.status]}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {item.workOrder.vehicle.plateNumber} - {item.workOrder.vehicle.brand}{" "}
                        {item.workOrder.vehicle.model}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {item.workOrder.orderNo} · {item.team.name}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        item.status === "IN_PROGRESS"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {statusText[item.status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">快捷操作</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                    >
                      <div className={`p-3 rounded-xl ${action.color} shadow-md`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                        {action.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-slate-200 dark:border-slate-700">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">数据概览</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Car className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-300">在档车辆</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {stats.totalVehicles}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-300">配件种类</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {stats.totalParts}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-300">本月完成率</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {stats.thisMonthOrders > 0
                    ? Math.round((stats.completedOrders / stats.thisMonthOrders) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

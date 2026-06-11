"use client";

import { useState } from "react";
import {
  Settings,
  Clock,
  Thermometer,
  Bell,
  Truck,
  Warehouse,
  Save,
  RefreshCw,
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  Sliders,
  AlertCircle,
  User,
  Phone,
  MapPin,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/utils/cn";
import { Rider, Site } from "@/types";
import { mockRiders, mockSites } from "@/data/mockData";

interface SettingSection {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const sections: SettingSection[] = [
  { id: "timeout", label: "履约时效配置", icon: <Clock className="h-5 w-5" /> },
  { id: "temperature", label: "温控参数配置", icon: <Thermometer className="h-5 w-5" /> },
  { id: "notification", label: "通知设置", icon: <Bell className="h-5 w-5" /> },
  { id: "riders", label: "骑手管理", icon: <Truck className="h-5 w-5" /> },
  { id: "sites", label: "站点管理", icon: <Warehouse className="h-5 w-5" /> },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("timeout");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [timeoutSettings, setTimeoutSettings] = useState({
    deliveryTimeout: 45,
    pickupTimeout: 15,
    warningThreshold: 80,
    autoAssign: true,
    maxOrdersPerRider: 8,
  });

  const [temperatureSettings, setTemperatureSettings] = useState({
    coldMin: 2,
    coldMax: 8,
    frozenMin: -18,
    frozenMax: -12,
    alertEnabled: true,
    alertInterval: 5,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    timeoutAlert: true,
    temperatureAlert: true,
    discrepancyAlert: true,
    exceptionAlert: true,
    smsNotification: false,
    emailNotification: true,
  });

  const [riders, setRiders] = useState<Rider[]>(mockRiders);
  const [sites, setSites] = useState<Site[]>(mockSites);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const renderTimeoutSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-brand-500" />
                时效阈值
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                配送超时阈值（分钟）
              </label>
              <input
                type="number"
                value={timeoutSettings.deliveryTimeout}
                onChange={(e) =>
                  setTimeoutSettings({ ...timeoutSettings, deliveryTimeout: Number(e.target.value) })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
              />
              <p className="text-xs text-slate-500 mt-1">超过此时长将标记为超时订单</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                取货超时阈值（分钟）
              </label>
              <input
                type="number"
                value={timeoutSettings.pickupTimeout}
                onChange={(e) =>
                  setTimeoutSettings({ ...timeoutSettings, pickupTimeout: Number(e.target.value) })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                预警阈值（%）
              </label>
              <input
                type="number"
                value={timeoutSettings.warningThreshold}
                onChange={(e) =>
                  setTimeoutSettings({ ...timeoutSettings, warningThreshold: Number(e.target.value) })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
              />
              <p className="text-xs text-slate-500 mt-1">履约率低于此值时触发预警</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-brand-500" />
                调度配置
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">自动分配骑手</p>
                <p className="text-xs text-slate-500">系统自动为新订单分配合适的骑手</p>
              </div>
              <button
                onClick={() =>
                  setTimeoutSettings({ ...timeoutSettings, autoAssign: !timeoutSettings.autoAssign })
                }
                className={cn(
                  "relative w-12 h-6 rounded-full transition-colors",
                  timeoutSettings.autoAssign ? "bg-brand-500" : "bg-slate-600"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                    timeoutSettings.autoAssign ? "left-7" : "left-1"
                  )}
                />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                单骑手最大订单数
              </label>
              <input
                type="number"
                value={timeoutSettings.maxOrdersPerRider}
                onChange={(e) =>
                  setTimeoutSettings({
                    ...timeoutSettings,
                    maxOrdersPerRider: Number(e.target.value),
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderTemperatureSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-blue-400" />
                冷藏温度范围
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  最低温度（°C）
                </label>
                <input
                  type="number"
                  value={temperatureSettings.coldMin}
                  onChange={(e) =>
                    setTemperatureSettings({
                      ...temperatureSettings,
                      coldMin: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  最高温度（°C）
                </label>
                <input
                  type="number"
                  value={temperatureSettings.coldMax}
                  onChange={(e) =>
                    setTemperatureSettings({
                      ...temperatureSettings,
                      coldMax: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
            <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-800/30">
              <div className="flex items-center gap-2 text-blue-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">当前范围</span>
              </div>
              <p className="text-2xl font-bold font-display text-blue-300 mt-1">
                {temperatureSettings.coldMin}°C ~ {temperatureSettings.coldMax}°C
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-cyan-400" />
                冷冻温度范围
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  最低温度（°C）
                </label>
                <input
                  type="number"
                  value={temperatureSettings.frozenMin}
                  onChange={(e) =>
                    setTemperatureSettings({
                      ...temperatureSettings,
                      frozenMin: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  最高温度（°C）
                </label>
                <input
                  type="number"
                  value={temperatureSettings.frozenMax}
                  onChange={(e) =>
                    setTemperatureSettings({
                      ...temperatureSettings,
                      frozenMax: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
            <div className="p-3 bg-cyan-900/20 rounded-lg border border-cyan-800/30">
              <div className="flex items-center gap-2 text-cyan-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">当前范围</span>
              </div>
              <p className="text-2xl font-bold font-display text-cyan-300 mt-1">
                {temperatureSettings.frozenMin}°C ~ {temperatureSettings.frozenMax}°C
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-warning-400" />
              报警配置
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div>
              <p className="text-sm font-medium">温度异常报警</p>
              <p className="text-xs text-slate-500">超出温度范围时立即触发报警</p>
            </div>
            <button
              onClick={() =>
                setTemperatureSettings({
                  ...temperatureSettings,
                  alertEnabled: !temperatureSettings.alertEnabled,
                })
              }
              className={cn(
                "relative w-12 h-6 rounded-full transition-colors",
                temperatureSettings.alertEnabled ? "bg-brand-500" : "bg-slate-600"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                  temperatureSettings.alertEnabled ? "left-7" : "left-1"
                )}
              />
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              报警间隔（分钟）
            </label>
            <input
              type="number"
              value={temperatureSettings.alertInterval}
              onChange={(e) =>
                setTemperatureSettings({
                  ...temperatureSettings,
                  alertInterval: Number(e.target.value),
                })
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderNotificationSection = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-brand-500" />
              预警通知设置
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              key: "timeoutAlert",
              label: "超时预警通知",
              desc: "订单即将超时时发送通知",
              color: "text-warning-400",
            },
            {
              key: "temperatureAlert",
              label: "温度异常通知",
              desc: "温控数据异常时发送通知",
              color: "text-blue-400",
            },
            {
              key: "discrepancyAlert",
              label: "签收差异通知",
              desc: "出现签收差异时发送通知",
              color: "text-orange-400",
            },
            {
              key: "exceptionAlert",
              label: "异常事件通知",
              desc: "发生配送异常时发送通知",
              color: "text-danger-400",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className={item.color}>
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </div>
              <button
                onClick={() =>
                  setNotificationSettings({
                    ...notificationSettings,
                    [item.key]: !notificationSettings[item.key as keyof typeof notificationSettings],
                  })
                }
                className={cn(
                  "relative w-12 h-6 rounded-full transition-colors",
                  notificationSettings[item.key as keyof typeof notificationSettings]
                    ? "bg-brand-500"
                    : "bg-slate-600"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                    notificationSettings[item.key as keyof typeof notificationSettings]
                      ? "left-7"
                      : "left-1"
                  )}
                />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-brand-500" />
              通知渠道
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div>
              <p className="text-sm font-medium">短信通知</p>
              <p className="text-xs text-slate-500">通过手机短信接收紧急通知</p>
            </div>
            <button
              onClick={() =>
                setNotificationSettings({
                  ...notificationSettings,
                  smsNotification: !notificationSettings.smsNotification,
                })
              }
              className={cn(
                "relative w-12 h-6 rounded-full transition-colors",
                notificationSettings.smsNotification ? "bg-brand-500" : "bg-slate-600"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                  notificationSettings.smsNotification ? "left-7" : "left-1"
                )}
              />
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div>
              <p className="text-sm font-medium">邮件通知</p>
              <p className="text-xs text-slate-500">通过邮件接收详细报告和通知</p>
            </div>
            <button
              onClick={() =>
                setNotificationSettings({
                  ...notificationSettings,
                  emailNotification: !notificationSettings.emailNotification,
                })
              }
              className={cn(
                "relative w-12 h-6 rounded-full transition-colors",
                notificationSettings.emailNotification ? "bg-brand-500" : "bg-slate-600"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                  notificationSettings.emailNotification ? "left-7" : "left-1"
                )}
              />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRidersSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">骑手列表</h2>
          <p className="text-sm text-slate-500">管理平台注册的所有骑手</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
          添加骑手
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <tr className="border-b border-slate-700">
                <TableHead>骑手信息</TableHead>
                <TableHead>联系方式</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>评分</TableHead>
                <TableHead>累计配送</TableHead>
                <TableHead>操作</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {riders.map((rider) => (
                <TableRow key={rider.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-medium">
                        {rider.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{rider.name}</p>
                        <p className="text-xs text-slate-500">ID: {rider.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-500" />
                      <span className="font-mono text-sm">{rider.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={rider.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-warning-400">★</span>
                      <span className="font-medium">{rider.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono">{rider.totalDeliveries} 单</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" leftIcon={<Edit3 className="h-4 w-4" />}>
                        编辑
                      </Button>
                      <Button variant="ghost" size="sm" className="text-danger-400" leftIcon={<Trash2 className="h-4 w-4" />}>
                        删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderSitesSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">站点列表</h2>
          <p className="text-sm text-slate-500">管理所有配送站点信息</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
          添加站点
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {sites.map((site) => (
          <Card key={site.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-900/30 flex items-center justify-center">
                    <Warehouse className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium">{site.name}</p>
                    <p className="text-xs text-slate-500">ID: {site.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <span className="truncate">{site.address}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
                  <span>纬度: {site.lat.toFixed(4)}</span>
                  <span>经度: {site.lng.toFixed(4)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case "timeout":
        return renderTimeoutSection();
      case "temperature":
        return renderTemperatureSection();
      case "notification":
        return renderNotificationSection();
      case "riders":
        return renderRidersSection();
      case "sites":
        return renderSitesSection();
      default:
        return renderTimeoutSection();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">系统设置</h1>
          <p className="text-sm text-slate-500 mt-1">
            配置平台参数、管理骑手和站点信息
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-900/30 border border-emerald-800/50 rounded-lg text-emerald-400 text-sm">
              <CheckCircle className="h-4 w-4" />
              保存成功
            </div>
          )}
          <Button
            variant="outline"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={() => window.location.reload()}
          >
            重置
          </Button>
          <Button
            variant="primary"
            leftIcon={isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "保存中..." : "保存设置"}
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-56 flex-shrink-0">
          <Card>
            <CardContent className="p-2">
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left",
                      activeSection === section.id
                        ? "bg-brand-500/10 text-brand-500"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    )}
                  >
                    <span className={activeSection === section.id ? "text-brand-500" : ""}>
                      {section.icon}
                    </span>
                    <span className="text-sm font-medium">{section.label}</span>
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1">{renderSection()}</div>
      </div>
    </div>
  );
}

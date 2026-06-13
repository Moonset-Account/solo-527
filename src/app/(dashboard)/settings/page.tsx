"use client";

import { useState } from "react";
import {
  Shield,
  Users,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Wrench,
  X,
  Calculator,
  Database,
  Clock,
  Mail,
  UserCog,
} from "lucide-react";
import { mockData } from "@/utils/mockData";
import { formatDateTime } from "@/utils/format";
import { useNotificationStore } from "@/store/notificationStore";

type TabKey = "permissions" | "metrics";
type CaliberField = "description" | "formula" | "dataSource";

const roles = [
  {
    id: "director",
    name: "销售总监",
    description: "全局数据查看与审批权限",
    userCount: 2,
    color: "from-primary-500 to-primary-700",
    bgColor: "bg-primary-50",
    textColor: "text-primary-700",
    borderColor: "border-primary-100",
    permissions: [
      "查看所有指标数据",
      "管理告警规则",
      "审批口径变更",
      "查看异常中心",
      "导出报表",
      "管理团队成员",
    ],
  },
  {
    id: "manager",
    name: "销售经理",
    description: "团队数据查看与异常处理权限",
    userCount: 5,
    color: "from-emerald-500 to-emerald-700",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-100",
    permissions: [
      "查看所辖团队指标",
      "处理异常工单",
      "查看告警通知",
      "导出团队报表",
    ],
  },
  {
    id: "operator",
    name: "数据运营",
    description: "数据维护与口径管理权限",
    userCount: 3,
    color: "from-amber-500 to-amber-700",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-100",
    permissions: [
      "查看所有指标数据",
      "提交口径变更申请",
      "管理指标字典",
      "查看异常中心",
    ],
  },
];

const users = [
  {
    id: "u1",
    name: "王建国",
    email: "wangjg@company.com",
    role: "销售总监",
    roleColor: "badge-info",
    lastLogin: "2024-03-20T09:15:00Z",
  },
  {
    id: "u2",
    name: "李明辉",
    email: "limh@company.com",
    role: "销售总监",
    roleColor: "badge-info",
    lastLogin: "2024-03-19T16:42:00Z",
  },
  {
    id: "u3",
    name: "张丽华",
    email: "zhanglh@company.com",
    role: "销售经理",
    roleColor: "badge-success",
    lastLogin: "2024-03-20T08:30:00Z",
  },
  {
    id: "u4",
    name: "陈志远",
    email: "chenzy@company.com",
    role: "销售经理",
    roleColor: "badge-success",
    lastLogin: "2024-03-20T10:05:00Z",
  },
  {
    id: "u5",
    name: "刘芳",
    email: "liuf@company.com",
    role: "销售经理",
    roleColor: "badge-success",
    lastLogin: "2024-03-18T14:20:00Z",
  },
  {
    id: "u6",
    name: "赵鹏程",
    email: "zhaopc@company.com",
    role: "销售经理",
    roleColor: "badge-success",
    lastLogin: "2024-03-19T11:30:00Z",
  },
  {
    id: "u7",
    name: "孙婷婷",
    email: "suntt@company.com",
    role: "销售经理",
    roleColor: "badge-success",
    lastLogin: "2024-03-17T09:45:00Z",
  },
  {
    id: "u8",
    name: "周文博",
    email: "zhouwb@company.com",
    role: "数据运营",
    roleColor: "badge-warning",
    lastLogin: "2024-03-20T11:20:00Z",
  },
  {
    id: "u9",
    name: "吴晓梅",
    email: "wuxm@company.com",
    role: "数据运营",
    roleColor: "badge-warning",
    lastLogin: "2024-03-20T07:50:00Z",
  },
  {
    id: "u10",
    name: "郑凯",
    email: "zhengk@company.com",
    role: "数据运营",
    roleColor: "badge-warning",
    lastLogin: "2024-03-19T15:10:00Z",
  },
];

const caliberFieldLabels: Record<CaliberField, string> = {
  description: "指标描述",
  formula: "计算公式",
  dataSource: "数据来源",
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("permissions");
  const [expandedMetricId, setExpandedMetricId] = useState<string | null>(null);
  const [caliberModalMetricId, setCaliberModalMetricId] = useState<string | null>(null);
  const [caliberField, setCaliberField] = useState<CaliberField>("description");
  const [caliberNewValue, setCaliberNewValue] = useState("");
  const [caliberReason, setCaliberReason] = useState("");
  const [userRoles, setUserRoles] = useState<Record<string, string>>(
    Object.fromEntries(users.map((u) => [u.id, u.role]))
  );

  const addCaliberChangeAlert = useNotificationStore((s) => s.addCaliberChangeAlert);

  const tabs: { key: TabKey; label: string; icon: typeof Shield }[] = [
    { key: "permissions", label: "权限管理", icon: Shield },
    { key: "metrics", label: "指标字典", icon: BookOpen },
  ];

  const handleCaliberSubmit = () => {
    if (!caliberModalMetricId || !caliberNewValue.trim()) return;

    const metric = mockData.metrics.find((m) => m.id === caliberModalMetricId);
    if (!metric) return;

    const oldValue = metric[caliberField];

    addCaliberChangeAlert({
      id: `caliber-${Date.now()}`,
      metricId: metric.id,
      metricName: metric.name,
      proposedChange: `将「${caliberFieldLabels[caliberField]}」从「${oldValue}」修改为「${caliberNewValue}」。原因：${caliberReason}`,
      requestedBy: "数据运营",
      requestedAt: new Date().toISOString(),
      status: "pending",
    });

    setCaliberModalMetricId(null);
    setCaliberNewValue("");
    setCaliberReason("");
    setCaliberField("description");
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    setUserRoles((prev) => ({ ...prev, [userId]: newRole }));
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-neutral-900">系统设置</h1>
        <p className="text-sm text-neutral-500 mt-1">管理平台权限与指标口径</p>
      </div>

      <div className="flex gap-1 border-b border-neutral-200 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                isActive ? "text-primary-700" : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {activeTab === "permissions" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary-600" />
              角色列表
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {roles.map((role) => (
                <div key={role.id} className="card p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${role.color} flex items-center justify-center`}
                    >
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-800">{role.name}</h3>
                      <p className="text-xs text-neutral-500">{role.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm text-neutral-600">{role.userCount} 人</span>
                  </div>

                  <div className={`p-3 rounded-lg ${role.bgColor} ${role.borderColor} border`}>
                    <p className="text-xs font-medium text-neutral-600 mb-2">权限列表</p>
                    <ul className="space-y-1.5">
                      {role.permissions.map((perm) => (
                        <li key={perm} className="flex items-center gap-2">
                          <Check className={`w-3.5 h-3.5 ${role.textColor}`} />
                          <span className="text-xs text-neutral-700">{perm}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-base font-semibold text-neutral-800 mb-4 flex items-center gap-2">
              <UserCog className="w-4 h-4 text-primary-600" />
              用户列表
            </h2>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-100">
                      <th className="text-left px-4 py-3 font-medium text-neutral-600">姓名</th>
                      <th className="text-left px-4 py-3 font-medium text-neutral-600">邮箱</th>
                      <th className="text-left px-4 py-3 font-medium text-neutral-600">角色</th>
                      <th className="text-left px-4 py-3 font-medium text-neutral-600">最近登录</th>
                      <th className="text-left px-4 py-3 font-medium text-neutral-600">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium text-xs">
                              {user.name.slice(0, 1)}
                            </div>
                            <span className="font-medium text-neutral-800">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5 text-neutral-600">
                            <Mail className="w-3.5 h-3.5 text-neutral-400" />
                            {user.email}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${user.roleColor}`}>{userRoles[user.id]}</span>
                        </td>
                        <td className="px-4 py-3 text-neutral-500">
                          {formatDateTime(user.lastLogin)}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            className="select !w-auto !py-1.5 !px-2 text-xs"
                            value={userRoles[user.id]}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          >
                            <option value="销售总监">销售总监</option>
                            <option value="销售经理">销售经理</option>
                            <option value="数据运营">数据运营</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "metrics" && (
        <div className="space-y-3">
          {mockData.metrics.map((metric) => {
            const isExpanded = expandedMetricId === metric.id;
            return (
              <div key={metric.id} className="card">
                <button
                  onClick={() => setExpandedMetricId(isExpanded ? null : metric.id)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-sky-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-neutral-800">{metric.name}</span>
                        <span className="badge badge-neutral font-mono">{metric.code}</span>
                        <span className="badge badge-info">{metric.category}</span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1 truncate">{metric.description}</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-neutral-100">
                    <div className="pt-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 bg-neutral-50 rounded-lg">
                          <div className="text-xs text-neutral-500 mb-1">指标描述</div>
                          <div className="text-sm text-neutral-700">{metric.description}</div>
                        </div>
                        <div className="p-3 bg-neutral-50 rounded-lg">
                          <div className="text-xs text-neutral-500 mb-1">数据分类</div>
                          <div className="text-sm text-neutral-700">{metric.category}</div>
                        </div>
                      </div>

                      <div className="p-4 bg-gradient-to-br from-primary-50 to-sky-50 rounded-xl border border-primary-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Calculator className="w-4 h-4 text-primary-600" />
                          <span className="text-sm font-medium text-primary-800">计算公式</span>
                        </div>
                        <div className="p-3 bg-white/70 rounded-lg font-mono text-sm text-neutral-700">
                          {metric.formula}
                        </div>
                      </div>

                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <div className="flex items-center gap-2 mb-1">
                          <Database className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-800">数据来源</span>
                        </div>
                        <p className="text-sm text-amber-700">{metric.dataSource}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2 text-xs text-neutral-400">
                          <Clock className="w-3 h-3" />
                          <span>最后更新：{formatDateTime(metric.updatedAt)}</span>
                        </div>
                        <button
                          onClick={() => {
                            setCaliberModalMetricId(metric.id);
                            setCaliberField("description");
                            setCaliberNewValue("");
                            setCaliberReason("");
                          }}
                          className="btn btn-secondary text-xs !py-1.5 !px-3"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          维护口径
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {caliberModalMetricId && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40 animate-fade-in"
            onClick={() => setCaliberModalMetricId(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white rounded-xl shadow-xl w-full max-w-lg animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between h-14 px-5 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-primary-600" />
                  <h3 className="font-semibold text-neutral-800">维护口径</h3>
                </div>
                <button
                  onClick={() => setCaliberModalMetricId(null)}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <X className="w-4 h-4 text-neutral-500" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {(() => {
                  const metric = mockData.metrics.find(
                    (m) => m.id === caliberModalMetricId
                  );
                  if (!metric) return null;
                  return (
                    <>
                      <div className="p-3 bg-neutral-50 rounded-lg">
                        <div className="text-xs text-neutral-500 mb-1">当前指标</div>
                        <div className="text-sm font-medium text-neutral-800">
                          {metric.name}
                          <span className="ml-2 badge badge-neutral font-mono">
                            {metric.code}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                          变更字段
                        </label>
                        <select
                          className="select"
                          value={caliberField}
                          onChange={(e) =>
                            setCaliberField(e.target.value as CaliberField)
                          }
                        >
                          <option value="description">指标描述</option>
                          <option value="formula">计算公式</option>
                          <option value="dataSource">数据来源</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                          原值
                        </label>
                        <input
                          type="text"
                          className="input bg-neutral-50 cursor-not-allowed"
                          value={metric[caliberField]}
                          readOnly
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                          新值
                        </label>
                        <input
                          type="text"
                          className="input"
                          placeholder="请输入新的值"
                          value={caliberNewValue}
                          onChange={(e) => setCaliberNewValue(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                          变更说明
                        </label>
                        <textarea
                          className="input min-h-[80px] resize-none"
                          placeholder="请说明变更原因..."
                          value={caliberReason}
                          onChange={(e) => setCaliberReason(e.target.value)}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-neutral-100">
                <button
                  onClick={() => setCaliberModalMetricId(null)}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button
                  onClick={handleCaliberSubmit}
                  disabled={!caliberNewValue.trim()}
                  className="btn btn-primary disabled:opacity-50"
                >
                  提交审批
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

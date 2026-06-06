"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChartCard } from "@/components/ui/ChartCard";
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  Building2,
  Clock,
  Search,
  ChevronDown,
  Check,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn, maskName, formatDateTime } from "@/utils";

interface SystemUser {
  id: string;
  username: string;
  realNameMasked: string;
  roleId: string;
  roleName: string;
  departmentScopes: string[];
  departmentNames: string[];
  createdAt: string;
  lastLogin: string | null;
  isActive: boolean;
}

interface Role {
  id: string;
  roleName: string;
  permissions: string[];
  description: string;
}

const mockUsers: SystemUser[] = [
  {
    id: "user-001",
    username: "admin",
    realNameMasked: "管***",
    roleId: "role-001",
    roleName: "系统管理员",
    departmentScopes: [],
    departmentNames: ["全部科室"],
    createdAt: "2023-12-01 09:00:00",
    lastLogin: "2024-01-31 18:30:00",
    isActive: true,
  },
  {
    id: "user-002",
    username: "analyst01",
    realNameMasked: "李***",
    roleId: "role-002",
    roleName: "运营分析员",
    departmentScopes: ["dept-001", "dept-002", "dept-003"],
    departmentNames: ["内科", "外科", "儿科"],
    createdAt: "2024-01-05 10:00:00",
    lastLogin: "2024-01-31 17:45:00",
    isActive: true,
  },
  {
    id: "user-003",
    username: "dept_head_internal",
    realNameMasked: "王***",
    roleId: "role-003",
    roleName: "科室主任",
    departmentScopes: ["dept-001"],
    departmentNames: ["内科"],
    createdAt: "2024-01-10 14:00:00",
    lastLogin: "2024-01-30 09:15:00",
    isActive: true,
  },
  {
    id: "user-004",
    username: "analyst02",
    realNameMasked: "张***",
    roleId: "role-002",
    roleName: "运营分析员",
    departmentScopes: ["dept-004", "dept-005"],
    departmentNames: ["妇产科", "心内科"],
    createdAt: "2024-01-15 11:30:00",
    lastLogin: "2024-01-28 16:20:00",
    isActive: true,
  },
  {
    id: "user-005",
    username: "dept_head_surgery",
    realNameMasked: "刘***",
    roleId: "role-003",
    roleName: "科室主任",
    departmentScopes: ["dept-002"],
    departmentNames: ["外科"],
    createdAt: "2024-01-20 08:45:00",
    lastLogin: null,
    isActive: false,
  },
];

const mockRoles: Role[] = [
  {
    id: "role-001",
    roleName: "系统管理员",
    description: "拥有系统所有权限",
    permissions: [
      "dashboard:view",
      "analysis:view",
      "data:import",
      "data:export",
      "dictionary:manage",
      "users:manage",
      "roles:manage",
      "annotations:manage",
    ],
  },
  {
    id: "role-002",
    roleName: "运营分析员",
    description: "数据分析和导出权限",
    permissions: [
      "dashboard:view",
      "analysis:view",
      "data:export",
      "annotations:create",
      "annotations:view",
    ],
  },
  {
    id: "role-003",
    roleName: "科室主任",
    description: "仅可查看本科室数据",
    permissions: [
      "dashboard:view",
      "analysis:view",
      "data:export",
      "annotations:view",
    ],
  },
];

const allDepartments = [
  { id: "dept-001", name: "内科" },
  { id: "dept-002", name: "外科" },
  { id: "dept-003", name: "儿科" },
  { id: "dept-004", name: "妇产科" },
  { id: "dept-005", name: "心内科" },
  { id: "dept-006", name: "神经内科" },
  { id: "dept-007", name: "骨科" },
  { id: "dept-008", name: "眼科" },
];

const permissionGroups = [
  {
    groupName: "数据看板",
    permissions: [
      { key: "dashboard:view", name: "查看看板", description: "查看数据看板和KPI指标" },
    ],
  },
  {
    groupName: "分析功能",
    permissions: [
      { key: "analysis:view", name: "分析查看", description: "使用流程分析、对比分析、趋势分析" },
    ],
  },
  {
    groupName: "数据管理",
    permissions: [
      { key: "data:import", name: "数据导入", description: "批量导入就诊数据" },
      { key: "data:export", name: "数据导出", description: "导出CSV和PDF报告" },
      { key: "dictionary:manage", name: "数据字典管理", description: "维护数据字典和指标口径" },
    ],
  },
  {
    groupName: "用户管理",
    permissions: [
      { key: "users:manage", name: "用户管理", description: "创建、编辑、删除用户" },
      { key: "roles:manage", name: "角色管理", description: "管理角色和权限配置" },
    ],
  },
  {
    groupName: "标注管理",
    permissions: [
      { key: "annotations:create", name: "创建标注", description: "添加异常点标注" },
      { key: "annotations:view", name: "查看标注", description: "查看异常点标注" },
      { key: "annotations:manage", name: "管理标注", description: "编辑和删除所有标注" },
    ],
  },
];

export default function UserManagementPage() {
  const [activeTab, setActiveTab] = useState<"users" | "roles">("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<SystemUser[]>(mockUsers);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.realNameMasked.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.roleName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, isActive: !u.isActive } : u
      )
    );
  };

  const handleEditUser = (user: SystemUser) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setShowUserModal(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-500" />
              用户权限管理
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              管理系统用户、角色和数据访问权限
            </p>
          </div>
          <button
            onClick={handleAddUser}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            添加用户
          </button>
        </div>

        <div className="flex items-center gap-1 bg-neutral-100 rounded-md p-0.5 w-fit">
          <button
            onClick={() => setActiveTab("users")}
            className={cn(
              "px-4 py-2 text-sm rounded transition-colors",
              activeTab === "users"
                ? "bg-white text-primary-600 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              用户列表
            </span>
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={cn(
              "px-4 py-2 text-sm rounded transition-colors",
              activeTab === "roles"
                ? "bg-white text-primary-600 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              角色权限
            </span>
          </button>
        </div>

        {activeTab === "users" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="搜索用户名、姓名或角色..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <span className="text-sm text-neutral-500">
                共 {filteredUsers.length} 个用户
              </span>
            </div>

            <ChartCard title="用户列表">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 font-medium text-neutral-600">
                        用户信息
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-600">
                        角色
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-600">
                        数据范围
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-600">
                        最后登录
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-600">
                        状态
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-neutral-600">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium">
                              {user.realNameMasked.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-neutral-800">
                                {user.username}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {user.realNameMasked}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-xs px-2 py-1 rounded",
                              user.roleId === "role-001" &&
                                "bg-danger-50 text-danger-600",
                              user.roleId === "role-002" &&
                                "bg-primary-50 text-primary-600",
                              user.roleId === "role-003" &&
                                "bg-success-50 text-success-600"
                            )}
                          >
                            <Shield className="w-3 h-3" />
                            {user.roleName}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-xs text-neutral-600">
                            <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                            <span className="max-w-[150px] truncate">
                              {user.departmentNames.join("、")}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-xs text-neutral-500">
                            <Clock className="w-3.5 h-3.5" />
                            {user.lastLogin
                              ? formatDateTime(user.lastLogin)
                              : "从未登录"}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleUserStatus(user.id)}
                            className={cn(
                              "inline-flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors",
                              user.isActive
                                ? "bg-success-50 text-success-600 hover:bg-success-100"
                                : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                            )}
                          >
                            {user.isActive ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <X className="w-3 h-3" />
                            )}
                            {user.isActive ? "启用" : "禁用"}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-1.5 text-neutral-400 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors"
                              title="编辑"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1.5 text-neutral-400 hover:text-danger-500 hover:bg-danger-50 rounded transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
        ) : (
          <div className="space-y-4">
            {mockRoles.map((role) => (
              <ChartCard
                key={role.id}
                title={
                  <div className="flex items-center gap-2">
                    <Shield
                      className={cn(
                        "w-5 h-5",
                        role.id === "role-001" && "text-danger-500",
                        role.id === "role-002" && "text-primary-500",
                        role.id === "role-003" && "text-success-500"
                      )}
                    />
                    <span>{role.roleName}</span>
                    <span className="text-xs font-normal text-neutral-500">
                      {role.description}
                    </span>
                    <span className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded">
                      {role.permissions.length} 个权限
                    </span>
                  </div>
                }
                actions={
                  <button className="text-xs text-primary-500 hover:text-primary-600">
                    编辑角色
                  </button>
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {permissionGroups.map((group) => (
                    <div
                      key={group.groupName}
                      className="p-3 bg-neutral-50 rounded-lg"
                    >
                      <h4 className="text-sm font-medium text-neutral-800 mb-2">
                        {group.groupName}
                      </h4>
                      <div className="space-y-1.5">
                        {group.permissions.map((perm) => {
                          const hasPermission =
                            role.permissions.includes(perm.key);
                          return (
                            <div
                              key={perm.key}
                              className="flex items-start gap-2"
                            >
                              <div
                                className={cn(
                                  "mt-0.5 w-4 h-4 rounded flex items-center justify-center",
                                  hasPermission
                                    ? "bg-success-500"
                                    : "bg-neutral-200"
                                )}
                              >
                                {hasPermission && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <div>
                                <p
                                  className={cn(
                                    "text-xs",
                                    hasPermission
                                      ? "text-neutral-800 font-medium"
                                      : "text-neutral-400"
                                  )}
                                >
                                  {perm.name}
                                </p>
                                <p className="text-xs text-neutral-400">
                                  {perm.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ChartCard>
            ))}

            <ChartCard title="数据权限说明" subtitle="科室数据访问范围控制机制">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-neutral-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-danger-50 rounded-lg">
                      <Shield className="w-5 h-5 text-danger-500" />
                    </div>
                    <h4 className="font-medium text-neutral-800">系统管理员</h4>
                  </div>
                  <p className="text-sm text-neutral-500">
                    可访问所有科室的数据，不受数据范围限制
                  </p>
                </div>
                <div className="p-4 border border-neutral-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-primary-50 rounded-lg">
                      <Users className="w-5 h-5 text-primary-500" />
                    </div>
                    <h4 className="font-medium text-neutral-800">运营分析员</h4>
                  </div>
                  <p className="text-sm text-neutral-500">
                    可访问授权范围内的多个科室数据
                  </p>
                </div>
                <div className="p-4 border border-neutral-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-success-50 rounded-lg">
                      <Building2 className="w-5 h-5 text-success-500" />
                    </div>
                    <h4 className="font-medium text-neutral-800">科室主任</h4>
                  </div>
                  <p className="text-sm text-neutral-500">
                    仅可访问所在科室的数据，严格的数据隔离
                  </p>
                </div>
              </div>
            </ChartCard>
          </div>
        )}

        {showUserModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-lg mx-4 shadow-xl">
              <div className="flex items-center justify-between p-4 border-b border-neutral-200">
                <h3 className="font-semibold text-neutral-800">
                  {editingUser ? "编辑用户" : "添加用户"}
                </h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    用户名
                  </label>
                  <input
                    type="text"
                    defaultValue={editingUser?.username || ""}
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    placeholder="请输入用户名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    真实姓名（脱敏）
                  </label>
                  <input
                    type="text"
                    defaultValue={editingUser?.realNameMasked || ""}
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    placeholder="请输入姓名，系统将自动脱敏"
                  />
                </div>
                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      初始密码
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="w-full px-3 py-2 pr-10 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        placeholder="请输入初始密码"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    用户角色
                  </label>
                  <select
                    defaultValue={editingUser?.roleId || ""}
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  >
                    <option value="">请选择角色</option>
                    {mockRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.roleName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    数据范围（科室）
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {allDepartments.map((dept) => (
                      <label
                        key={dept.id}
                        className="flex items-center gap-2 p-2 border border-neutral-200 rounded-md hover:border-primary-300 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          defaultChecked={editingUser?.departmentScopes.includes(
                            dept.id
                          )}
                          className="rounded text-primary-500 focus:ring-primary-500"
                        />
                        <span className="text-sm text-neutral-700">
                          {dept.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 p-4 border-t border-neutral-200">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 text-sm text-neutral-600 bg-neutral-100 rounded-md hover:bg-neutral-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 text-sm text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

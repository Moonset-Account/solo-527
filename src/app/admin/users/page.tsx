"use client";

import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { api } from "@/lib/trpc/client";
import { StatusBadge } from "@/components/status-badge";
import { Pagination } from "@/components/pagination";
import { FilterBar } from "@/components/filter-bar";
import { Modal } from "@/components/modal";
import { formatDate } from "@/lib/utils";
import { userRoleConfig } from "@/lib/status-config";
import {
  Users,
  Eye,
  Edit3,
  User,
  Wrench,
  FileText,
  DollarSign,
  TrendingUp,
  Shield,
  ShieldAlert,
  Crown,
} from "lucide-react";
import { UserRole } from "@prisma/client";

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, any>>({
    pageSize: 20,
  });
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<UserRole>("STUDENT");

  const { data, isLoading, refetch } = api.user.list.useQuery(
    { page, ...filters },
    { keepPreviousData: true }
  );

  const updateRole = api.user.updateRole.useMutation({
    onSuccess: () => {
      setShowRoleModal(false);
      setSelectedUser(null);
      setNewRole("STUDENT");
      refetch();
    },
  });

  const filterConfig = [
    {
      key: "role",
      label: "角色",
      type: "select" as const,
      options: Object.entries(userRoleConfig).map(([value, { label }]) => ({
        label,
        value,
      })),
    },
    {
      key: "dormNumber",
      label: "宿舍楼",
      type: "text" as const,
      placeholder: "如：1号楼",
    },
    {
      key: "search",
      label: "搜索",
      type: "search" as const,
      placeholder: "搜索姓名、邮箱、学号...",
    },
  ];

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleReset = () => {
    setFilters({ pageSize: 20 });
    setPage(1);
  };

  const handleUpdateRole = () => {
    if (!selectedUser) return;
    updateRole.mutate({
      userId: selectedUser,
      role: newRole,
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Crown className="h-4 w-4 text-red-500" />;
      case "DORM_MANAGER":
        return <Shield className="h-4 w-4 text-purple-500" />;
      default:
        return <User className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">用户管理</h1>
            <p className="text-zinc-500 mt-1">管理系统用户和权限</p>
          </div>
        </div>

        <FilterBar
          filters={filterConfig}
          values={filters}
          onChange={handleFilterChange}
          onReset={handleReset}
        />

        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-zinc-500">加载中...</div>
          ) : data?.items.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-zinc-300" />
              <p className="text-zinc-500">暂无用户</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        用户信息
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        角色
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        宿舍
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        统计
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        注册时间
                      </th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {data?.items.map((user) => (
                      <tr key={user.id} className="hover:bg-zinc-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-100 rounded-lg">
                              {getRoleIcon(user.role)}
                            </div>
                            <div>
                              <p className="font-medium text-zinc-900">{user.name}</p>
                              <p className="text-xs text-zinc-500">{user.email}</p>
                              {user.studentId && (
                                <p className="text-xs text-zinc-400">学号: {user.studentId}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            user.role === "ADMIN" ? "bg-red-100 text-red-700" :
                            user.role === "DORM_MANAGER" ? "bg-purple-100 text-purple-700" :
                            "bg-blue-100 text-blue-700"
                          }`}>
                            {getRoleIcon(user.role)}
                            {userRoleConfig[user.role]?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-700">
                            {user.dormNumber && user.roomNumber
                              ? `${user.dormNumber} ${user.roomNumber}`
                              : "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 text-xs text-zinc-500">
                            <span className="flex items-center gap-1">
                              <Wrench className="h-3 w-3" />
                              {user._count.repairRequests}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {user._count.complaints}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {user._count.refunds}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-500">
                            {formatDate(user.createdAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user.id);
                                setNewRole(user.role);
                                setShowRoleModal(true);
                              }}
                              className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                              title="修改角色"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data && data.totalPages > 1 && (
                <div className="p-4 border-t border-zinc-200">
                  <Pagination
                    page={page}
                    totalPages={data.totalPages}
                    pageSize={filters.pageSize}
                    total={data.total}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title="修改用户角色"
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowRoleModal(false)}
              className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleUpdateRole}
              disabled={updateRole.isLoading}
              className="px-4 py-2 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateRole.isLoading ? "保存中..." : "确认修改"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              选择角色
            </label>
            <div className="space-y-2">
              {[
                { role: UserRole.STUDENT, label: "学生", desc: "普通用户，可提交报修、发布交易", icon: User, color: "blue" },
                { role: UserRole.DORM_MANAGER, label: "宿管老师", desc: "可处理报修、审批退款", icon: Shield, color: "purple" },
                { role: UserRole.ADMIN, label: "系统管理员", desc: "拥有所有权限，可管理用户", icon: Crown, color: "red" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setNewRole(item.role)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-start gap-3 ${
                      newRole === item.role
                        ? `border-${item.color}-500 bg-${item.color}-50`
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <div className={`p-2 rounded-lg bg-${item.color}-100`}>
                      <Icon className={`h-5 w-5 text-${item.color}-600`} />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900">{item.label}</p>
                      <p className="text-xs text-zinc-500">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}

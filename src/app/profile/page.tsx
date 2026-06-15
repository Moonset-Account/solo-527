"use client";

import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { api } from "@/lib/trpc/client";
import { formatDate, formatCurrency } from "@/lib/utils";
import { userRoleConfig } from "@/lib/status-config";
import { Pagination } from "@/components/pagination";
import {
  User,
  Settings,
  Wrench,
  DollarSign,
  FileText,
  Award,
  History,
  Edit3,
  Save,
  X,
  Calendar,
  MapPin,
  Phone,
  Hash,
} from "lucide-react";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    phone: "",
    studentId: "",
    dormNumber: "",
    roomNumber: "",
  });
  const [page, setPage] = useState(1);

  const { data: user, isLoading, refetch } = api.user.me.useQuery();
  const { data: activities } = api.user.getActivities.useQuery(
    { page, pageSize: 10 },
    { enabled: !!user }
  );

  const updateProfile = api.user.updateProfile.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      refetch();
    },
  });

  const handleEdit = () => {
    setEditData({
      name: user?.name || "",
      phone: user?.phone || "",
      studentId: user?.studentId || "",
      dormNumber: user?.dormNumber || "",
      roomNumber: user?.roomNumber || "",
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateProfile.mutate(editData);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const stats = [
    { label: "报修记录", value: user?._count?.repairRequests || 0, icon: Wrench, color: "bg-blue-500" },
    { label: "举报记录", value: user?._count?.complaints || 0, icon: FileText, color: "bg-orange-500" },
    { label: "退款申请", value: user?._count?.refunds || 0, icon: DollarSign, color: "bg-red-500" },
    { label: "交易记录", value: (user?._count?.trades || 0) + (user?._count?.listedTrades || 0), icon: DollarSign, color: "bg-green-500" },
  ];

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-500">加载中...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">个人中心</h1>
            <p className="text-zinc-500 mt-1">管理您的个人信息和活动记录</p>
          </div>
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              编辑资料
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
              >
                <X className="h-4 w-4" />
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={updateProfile.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {updateProfile.isPending ? "保存中..." : "保存"}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-24 h-24 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
                  <User className="h-12 w-12 text-zinc-400" />
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="text-xl font-bold text-zinc-900 text-center border-b border-zinc-200 focus:outline-none focus:border-zinc-900"
                  />
                ) : (
                  <h2 className="text-xl font-bold text-zinc-900">{user?.name || "未设置"}</h2>
                )}
                <p className="text-sm text-zinc-500 mt-1">{user?.email}</p>
                <span className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                  user?.role === "ADMIN" ? "bg-red-100 text-red-700" :
                  user?.role === "DORM_MANAGER" ? "bg-purple-100 text-purple-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {userRoleConfig[user?.role || "STUDENT"]?.label}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Hash className="h-5 w-5 text-zinc-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-zinc-500">学号</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.studentId}
                        onChange={(e) => setEditData({ ...editData, studentId: e.target.value })}
                        className="w-full text-zinc-900 border-b border-zinc-200 focus:outline-none focus:border-zinc-900"
                      />
                    ) : (
                      <p className="text-zinc-700">{user?.studentId || "未设置"}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-zinc-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-zinc-500">电话</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.phone}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        className="w-full text-zinc-900 border-b border-zinc-200 focus:outline-none focus:border-zinc-900"
                      />
                    ) : (
                      <p className="text-zinc-700">{user?.phone || "未设置"}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-zinc-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-zinc-500">宿舍</p>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editData.dormNumber}
                          onChange={(e) => setEditData({ ...editData, dormNumber: e.target.value })}
                          placeholder="楼号"
                          className="flex-1 text-zinc-900 border-b border-zinc-200 focus:outline-none focus:border-zinc-900"
                        />
                        <input
                          type="text"
                          value={editData.roomNumber}
                          onChange={(e) => setEditData({ ...editData, roomNumber: e.target.value })}
                          placeholder="房间号"
                          className="flex-1 text-zinc-900 border-b border-zinc-200 focus:outline-none focus:border-zinc-900"
                        />
                      </div>
                    ) : (
                      <p className="text-zinc-700">
                        {user?.dormNumber && user?.roomNumber
                          ? `${user.dormNumber} ${user.roomNumber}`
                          : "未设置"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-zinc-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-zinc-500">注册时间</p>
                    <p className="text-zinc-700">{formatDate(user?.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-zinc-200 p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  活动积分
                </h3>
                <span className="text-2xl font-bold text-yellow-600">
                  {activities?.totalPoints || 0}
                </span>
              </div>
              <p className="text-sm text-zinc-500">
                参与报修、交易等活动可获得积分
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="bg-white rounded-xl border border-zinc-200 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-zinc-500">{stat.label}</p>
                        <p className="text-2xl font-bold text-zinc-900 mt-1">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${stat.color}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <h3 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                <History className="h-5 w-5" />
                活动记录
              </h3>

              {activities?.items.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <Award className="h-12 w-12 mx-auto mb-3 text-zinc-300" />
                  <p>暂无活动记录</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {activities?.items.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-100 rounded-lg">
                            <Award className="h-4 w-4 text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-medium text-zinc-700">{activity.activityName}</p>
                            <p className="text-xs text-zinc-500">{formatDate(activity.createdAt)}</p>
                            {activity.repairRequest && (
                              <p className="text-xs text-blue-600">
                                关联报修: {activity.repairRequest.title}
                              </p>
                            )}
                            {activity.trade && (
                              <p className="text-xs text-green-600">
                                关联交易: {activity.trade.title}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-yellow-600">+{activity.points}</span>
                      </div>
                    ))}
                  </div>

                  {activities && activities.totalPages > 1 && (
                    <div className="mt-4 pt-4 border-t border-zinc-200">
                      <Pagination
                        page={page}
                        totalPages={activities.totalPages}
                        pageSize={10}
                        total={activities.total}
                        onPageChange={setPage}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield,
  Search,
  Check,
  X,
  Eye,
  Clock,
  CheckCircle,
} from "lucide-react";
import { formatDateTime, getStatusText } from "@/lib/utils";
import { useIdentityVerifications } from "@/lib/hooks";
import { createClient } from "@/lib/supabase/client";

const tabs = [
  { key: "all", label: "全部" },
  { key: "pending", label: "待审核" },
  { key: "approved", label: "已通过" },
  { key: "rejected", label: "已拒绝" },
];

const typeLabels: Record<string, string> = {
  student: "学生认证",
  club_leader: "社团负责人认证",
  department: "部门认证",
  admin: "管理员认证",
};

const typeColors: Record<string, string> = {
  student: "bg-blue-100 text-blue-700",
  club_leader: "bg-purple-100 text-purple-700",
  department: "bg-orange-100 text-orange-700",
  admin: "bg-red-100 text-red-700",
};

export default function VerificationsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [reviewComment, setReviewComment] = useState("");

  const filterStatus = activeTab === "all" ? undefined : activeTab;
  const { data: verifications, loading, refetch } = useIdentityVerifications({ status: filterStatus });

  const filteredVerifications = (verifications || []).filter((v: any) => {
    const name = (v.real_name || v.user_name || "").toLowerCase();
    const sid = (v.student_id || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || sid.includes(query);
  });

  const handleView = (verification: any) => {
    setSelectedVerification(verification);
    setReviewComment("");
    setShowDetailDialog(true);
  };

  const handleApprove = async (id: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from("identity_verifications")
      .update({
        status: "approved",
        review_comment: reviewComment || null,
        reviewed_by: user?.id || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    setShowDetailDialog(false);
    refetch();
  };

  const handleReject = async (id: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from("identity_verifications")
      .update({
        status: "rejected",
        review_comment: reviewComment || null,
        reviewed_by: user?.id || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    setShowDetailDialog(false);
    refetch();
  };

  const allVerifications = verifications || [];
  const stats = {
    total: allVerifications.length,
    pending: allVerifications.filter((v: any) => v.status === "pending").length,
    approved: allVerifications.filter((v: any) => v.status === "approved").length,
    rejected: allVerifications.filter((v: any) => v.status === "rejected").length,
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">加载中...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">身份审核</h1>
            <p className="mt-1 text-gray-500">审核用户身份认证申请</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">总申请数</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Shield className="h-8 w-8 text-primary-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">待审核</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">已通过</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">已拒绝</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <X className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
              <div className="flex space-x-1 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? "bg-primary-100 text-primary-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {tab.label}
                    {tab.key === "pending" && stats.pending > 0 && (
                      <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">
                        {stats.pending}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="搜索姓名、学号..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-3 font-medium">用户信息</th>
                    <th className="pb-3 font-medium">认证类型</th>
                    <th className="pb-3 font-medium">所属部门/社团</th>
                    <th className="pb-3 font-medium">提交时间</th>
                    <th className="pb-3 font-medium">审核人</th>
                    <th className="pb-3 font-medium">状态</th>
                    <th className="pb-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVerifications.map((v: any) => (
                    <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-700">
                              {v.real_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{v.real_name}</p>
                            <p className="text-xs text-gray-500">{v.student_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            typeColors[v.type] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {typeLabels[v.type]}
                        </span>
                      </td>
                      <td className="py-3 text-gray-600">
                        {v.department}
                        {v.club_name && (
                          <span className="text-xs text-gray-400"> / {v.club_name}</span>
                        )}
                      </td>
                      <td className="py-3 text-gray-500">
                        {formatDateTime(v.submitted_at)}
                      </td>
                      <td className="py-3 text-gray-500">
                        {v.reviewed_by_name || "-"}
                      </td>
                      <td className="py-3">
                        <Badge status={v.status} />
                      </td>
                      <td className="py-3">
                        <Button variant="ghost" size="sm" onClick={() => handleView(v)}>
                          <Eye className="mr-1 h-4 w-4" />
                          审核
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredVerifications.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                <Shield className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2">暂无认证申请</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
        title="身份审核详情"
      >
        {selectedVerification && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-lg font-medium text-primary-700">
                    {selectedVerification.real_name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold">{selectedVerification.real_name}</h3>
                  <p className="text-sm text-gray-500">{selectedVerification.email}</p>
                </div>
              </div>
              <Badge status={selectedVerification.status} />
            </div>

            <div
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                typeColors[selectedVerification.type] || "bg-gray-100 text-gray-700"
              }`}
            >
              <Shield className="mr-1.5 h-4 w-4" />
              {typeLabels[selectedVerification.type]}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">学号</p>
                <p className="font-medium">{selectedVerification.student_id}</p>
              </div>
              <div>
                <p className="text-gray-500">所属部门</p>
                <p className="font-medium">{selectedVerification.department}</p>
              </div>
              {selectedVerification.club_name && (
                <div>
                  <p className="text-gray-500">所属社团</p>
                  <p className="font-medium">{selectedVerification.club_name}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500">提交时间</p>
                <p className="font-medium">{formatDateTime(selectedVerification.submitted_at)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">证件照片</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="aspect-[4/3] rounded-md border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Eye className="mx-auto h-6 w-6" />
                    <p className="mt-1 text-xs">身份证正面</p>
                  </div>
                </div>
                <div className="aspect-[4/3] rounded-md border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Eye className="mx-auto h-6 w-6" />
                    <p className="mt-1 text-xs">身份证反面</p>
                  </div>
                </div>
              </div>
            </div>

            {selectedVerification.status !== "pending" && (
              <div className="rounded-md bg-gray-50 p-3">
                <p className="text-sm font-medium text-gray-700">
                  审核结果：{getStatusText(selectedVerification.status)}
                </p>
                {selectedVerification.review_comment && (
                  <p className="mt-1 text-sm text-gray-500">
                    审核意见：{selectedVerification.review_comment}
                  </p>
                )}
                {selectedVerification.reviewed_by_name && (
                  <p className="mt-1 text-xs text-gray-400">
                    审核人：{selectedVerification.reviewed_by_name} ·{" "}
                    {formatDateTime(selectedVerification.reviewed_at)}
                  </p>
                )}
              </div>
            )}

            {selectedVerification.status === "pending" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">审核意见</label>
                <Textarea
                  placeholder="请输入审核意见（拒绝时必填）"
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
            关闭
          </Button>
          {selectedVerification?.status === "pending" && (
            <>
              <Button
                variant="destructive"
                onClick={() => handleReject(selectedVerification.id)}
              >
                <X className="mr-2 h-4 w-4" />
                拒绝
              </Button>
              <Button onClick={() => handleApprove(selectedVerification.id)}>
                <Check className="mr-2 h-4 w-4" />
                通过
              </Button>
            </>
          )}
        </DialogFooter>
      </Dialog>
    </AdminLayout>
  );
}

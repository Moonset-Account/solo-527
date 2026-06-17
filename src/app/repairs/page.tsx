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
  Wrench,
  Search,
  Plus,
  Clock,
  MapPin,
  User,
  Calendar,
  Check,
  ArrowUp,
  Link2,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useRepairRequests } from "@/lib/hooks";
import { createClient } from "@/lib/supabase/client";

const tabs = [
  { key: "all", label: "全部" },
  { key: "pending", label: "待处理" },
  { key: "processing", label: "处理中" },
  { key: "completed", label: "已完成" },
  { key: "cancelled", label: "已取消" },
];

const categories = ["全部", "水电", "电器", "家具", "门窗", "其他"];

export default function RepairsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState("全部");

  const filterStatus = activeTab === "all" ? undefined : activeTab;
  const { data: repairs, loading, refetch } = useRepairRequests({
    status: filterStatus,
    category: selectedCategory === "全部" ? undefined : selectedCategory,
  });

  const filteredRepairs = (repairs || []).filter((repair: any) => {
    const matchesSearch =
      repair.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (repair.reporter_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (repair.room_number || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleView = (repair: any) => {
    setSelectedRepair(repair);
    setShowDetailDialog(true);
  };

  const handleAssign = async (id: string) => {
    const supabase = createClient();
    await supabase
      .from("repair_requests")
      .update({ status: "processing", handler_id: "current_user", updated_at: new Date().toISOString() })
      .eq("id", id);
    setShowDetailDialog(false);
    refetch();
  };

  const handleComplete = async (id: string) => {
    const supabase = createClient();
    await supabase
      .from("repair_requests")
      .update({ status: "completed", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", id);
    setShowDetailDialog(false);
    refetch();
  };

  const stats = {
    total: (repairs || []).length,
    pending: (repairs || []).filter((r: any) => r.status === "pending").length,
    processing: (repairs || []).filter((r: any) => r.status === "processing").length,
    completed: (repairs || []).filter((r: any) => r.status === "completed").length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">宿舍报修</h1>
            <p className="mt-1 text-gray-500">管理和处理宿舍报修请求</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            提交报修
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">总报修数</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Wrench className="h-8 w-8 text-primary-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">待处理</p>
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
                  <p className="text-sm text-gray-500">处理中</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
                </div>
                <ArrowUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">已完成</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <Check className="h-8 w-8 text-green-500" />
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
                  </button>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-9 rounded-md border border-gray-200 px-3 text-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="搜索报修..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-48"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-gray-500">
                <Wrench className="mx-auto h-12 w-12 animate-pulse text-gray-300" />
                <p className="mt-2">加载中...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRepairs.map((repair: any) => (
                  <div
                    key={repair.id}
                    className="rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow cursor-pointer"
                    onClick={() => handleView(repair)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-gray-900">{repair.title}</h3>
                          <Badge status={repair.status} />
                          <Badge
                            variant={
                              repair.priority === "high"
                                ? "destructive"
                                : repair.priority === "medium"
                                ? "warning"
                                : "secondary"
                            }
                          >
                            {repair.priority === "high" ? "高优先级" : repair.priority === "medium" ? "中优先级" : "低优先级"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 line-clamp-1">{repair.description}</p>

                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                          <span className="flex items-center">
                            <MapPin className="mr-1.5 h-4 w-4" />
                            {repair.dormitory} {repair.room_number}
                          </span>
                          <span className="flex items-center">
                            <Wrench className="mr-1.5 h-4 w-4" />
                            {repair.category}
                          </span>
                          <span className="flex items-center">
                            <User className="mr-1.5 h-4 w-4" />
                            报修人：{repair.reporter_name}
                          </span>
                          {repair.handler_name && (
                            <span className="flex items-center">
                              <User className="mr-1.5 h-4 w-4" />
                              处理人：{repair.handler_name}
                            </span>
                          )}
                          <span className="flex items-center">
                            <Calendar className="mr-1.5 h-4 w-4" />
                            {formatDateTime(repair.created_at)}
                          </span>
                        </div>

                        {repair.related_activity_id && (
                          <div className="mt-3 flex items-center text-sm">
                            <Link2 className="mr-2 h-4 w-4 text-primary-500" />
                            <span className="text-gray-500">关联活动：</span>
                            <span className="ml-1 text-primary-600 hover:underline">
                              {repair.related_activity_title}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredRepairs.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                <Wrench className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2">暂无报修记录</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        title="提交报修"
        description="请填写报修信息"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">报修标题</label>
            <Input placeholder="请输入报修标题" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">楼栋</label>
              <select className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm">
                <option>1号楼</option>
                <option>2号楼</option>
                <option>3号楼</option>
                <option>4号楼</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">房间号</label>
              <Input placeholder="如 302" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">优先级</label>
              <select className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm">
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">报修类别</label>
            <select className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm">
              <option>水电</option>
              <option>电器</option>
              <option>家具</option>
              <option>门窗</option>
              <option>其他</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">关联活动（可选）</label>
            <select className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm">
              <option value="">无</option>
              <option value="1">春季团建活动</option>
              <option value="2">编程技术分享会</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">详细描述</label>
            <Textarea placeholder="请详细描述报修内容" rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
            取消
          </Button>
          <Button onClick={() => setShowCreateDialog(false)}>提交报修</Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        open={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
        title={selectedRepair?.title}
      >
        {selectedRepair && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Badge status={selectedRepair.status} />
              <Badge
                variant={
                  selectedRepair.priority === "high"
                    ? "destructive"
                    : selectedRepair.priority === "medium"
                    ? "warning"
                    : "secondary"
                }
              >
                {selectedRepair.priority === "high" ? "高优先级" : selectedRepair.priority === "medium" ? "中优先级" : "低优先级"}
              </Badge>
              <span className="text-sm text-gray-500">{selectedRepair.category}</span>
            </div>

            <p className="text-gray-600">{selectedRepair.description}</p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">报修位置</p>
                <p className="font-medium">
                  {selectedRepair.dormitory} {selectedRepair.room_number}
                </p>
              </div>
              <div>
                <p className="text-gray-500">报修人</p>
                <p className="font-medium">{selectedRepair.reporter_name}</p>
              </div>
              <div>
                <p className="text-gray-500">提交时间</p>
                <p className="font-medium">{formatDateTime(selectedRepair.created_at)}</p>
              </div>
              {selectedRepair.handler_name && (
                <div>
                  <p className="text-gray-500">处理人</p>
                  <p className="font-medium">{selectedRepair.handler_name}</p>
                </div>
              )}
              {selectedRepair.completed_at && (
                <div>
                  <p className="text-gray-500">完成时间</p>
                  <p className="font-medium">{formatDateTime(selectedRepair.completed_at)}</p>
                </div>
              )}
            </div>

            {selectedRepair.related_activity_id && (
              <div className="rounded-md bg-blue-50 p-3">
                <div className="flex items-center text-sm">
                  <Link2 className="mr-2 h-4 w-4 text-blue-500" />
                  <span className="text-blue-700">关联活动：{selectedRepair.related_activity_title}</span>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700">处理记录</h4>
              <div className="mt-3 space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="h-2 w-2 mt-2 rounded-full bg-green-500" />
                  <div>
                    <p className="text-sm">报修单提交</p>
                    <p className="text-xs text-gray-500">
                      {selectedRepair.reporter_name} · {formatDateTime(selectedRepair.created_at)}
                    </p>
                  </div>
                </div>
                {selectedRepair.status !== "pending" && (
                  <div className="flex items-start space-x-3">
                    <div className="h-2 w-2 mt-2 rounded-full bg-blue-500" />
                    <div>
                      <p className="text-sm">开始处理</p>
                      <p className="text-xs text-gray-500">
                        {selectedRepair.handler_name} · {formatDateTime(selectedRepair.updated_at)}
                      </p>
                    </div>
                  </div>
                )}
                {selectedRepair.status === "completed" && (
                  <div className="flex items-start space-x-3">
                    <div className="h-2 w-2 mt-2 rounded-full bg-green-500" />
                    <div>
                      <p className="text-sm">处理完成</p>
                      <p className="text-xs text-gray-500">
                        {selectedRepair.handler_name} · {formatDateTime(selectedRepair.completed_at!)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
            关闭
          </Button>
          {selectedRepair?.status === "pending" && (
            <Button onClick={() => handleAssign(selectedRepair.id)}>
              指派处理
            </Button>
          )}
          {selectedRepair?.status === "processing" && (
            <Button onClick={() => handleComplete(selectedRepair.id)}>
              标记完成
            </Button>
          )}
        </DialogFooter>
      </Dialog>
    </AdminLayout>
  );
}

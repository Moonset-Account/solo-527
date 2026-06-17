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
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  MapPin,
  Users,
  Edit,
  Trash2,
  Eye,
  Check,
  X,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { useActivities } from "@/lib/hooks";
import { createClient } from "@/lib/supabase/client";

const tabs = [
  { key: "all", label: "全部" },
  { key: "pending", label: "待审核" },
  { key: "approved", label: "已通过" },
  { key: "ongoing", label: "进行中" },
  { key: "completed", label: "已完成" },
  { key: "rejected", label: "已拒绝" },
  { key: "draft", label: "草稿" },
];

export default function ActivitiesPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const { data: activities, loading, refetch } = useActivities();

  const filteredActivities = (activities || []).filter((activity) => {
    const matchesTab = activeTab === "all" || activity.status === activeTab;
    const matchesSearch =
      (activity.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (activity.club_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleView = (activity: any) => {
    setSelectedActivity(activity);
    setShowDetailDialog(true);
    setShowMenu(null);
  };

  const handleApprove = async (id: string) => {
    const supabase = createClient();
    await supabase.from("activities").update({ status: "approved", updated_at: new Date().toISOString() }).eq("id", id);
    await supabase.from("audit_logs").insert({ entity_type: "activity", entity_id: id, action: "approve", user_id: "current", details: "活动审核通过" });
    refetch();
    setShowMenu(null);
  };

  const handleReject = async (id: string) => {
    const supabase = createClient();
    await supabase.from("activities").update({ status: "rejected", updated_at: new Date().toISOString() }).eq("id", id);
    await supabase.from("audit_logs").insert({ entity_type: "activity", entity_id: id, action: "reject", user_id: "current", details: "活动审核拒绝" });
    refetch();
    setShowMenu(null);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24">
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
            <h1 className="text-2xl font-bold text-gray-900">活动管理</h1>
            <p className="mt-1 text-gray-500">管理和审核所有社团活动</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            发布活动
          </Button>
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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="搜索活动..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  筛选
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredActivities.map((activity) => (
                <Card key={activity.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-32 bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center">
                    <Calendar className="h-12 w-12 text-white/80" />
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                        <p className="text-sm text-gray-500">{activity.club_name}</p>
                      </div>
                      <Badge status={activity.status} />
                    </div>

                    <div className="mt-3 space-y-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4" />
                        {activity.location}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        {formatDate(activity.start_time)}
                      </div>
                      <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        {activity.current_participants}/{activity.max_participants} 人
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-xs text-gray-500">
                        <span>报名进度</span>
                        <span>{Math.round((activity.current_participants / activity.max_participants) * 100)}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-primary-500"
                          style={{
                            width: `${(activity.current_participants / activity.max_participants) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <Link href={`/activities/${activity.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="mr-1 h-4 w-4" />
                          详情
                        </Button>
                      </Link>
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowMenu(showMenu === activity.id ? null : activity.id)}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        {showMenu === activity.id && (
                          <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                            {activity.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleApprove(activity.id)}
                                  className="flex w-full items-center px-3 py-2 text-sm text-green-600 hover:bg-gray-50"
                                >
                                  <Check className="mr-2 h-4 w-4" />
                                  通过
                                </button>
                                <button
                                  onClick={() => handleReject(activity.id)}
                                  className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-gray-50"
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  拒绝
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleView(activity)}
                              className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              编辑
                            </button>
                            <button className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-gray-50">
                              <Trash2 className="mr-2 h-4 w-4" />
                              删除
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredActivities.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                <Calendar className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2">暂无活动</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        title="发布新活动"
        description="填写活动信息，提交后等待审核"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">活动标题</label>
            <Input placeholder="请输入活动标题" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">所属社团</label>
              <select className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
                <option>请选择社团</option>
                <option>篮球社</option>
                <option>计算机协会</option>
                <option>音乐社</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">活动分类</label>
              <select className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500">
                <option>请选择分类</option>
                <option>体育</option>
                <option>学术</option>
                <option>文艺</option>
                <option>实践</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">活动地点</label>
            <Input placeholder="请输入活动地点" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">开始时间</label>
              <Input type="datetime-local" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">结束时间</label>
              <Input type="datetime-local" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">最大参与人数</label>
            <Input type="number" placeholder="请输入最大参与人数" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">活动描述</label>
            <Textarea placeholder="请输入活动详细描述" rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
            取消
          </Button>
          <Button onClick={() => setShowCreateDialog(false)}>提交审核</Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        open={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
        title={selectedActivity?.title}
      >
        {selectedActivity && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Badge status={selectedActivity.status} />
              <span className="text-sm text-gray-500">{selectedActivity.club_name}</span>
            </div>
            <p className="text-gray-600">{selectedActivity.description}</p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">活动地点</p>
                <p className="font-medium">{selectedActivity.location}</p>
              </div>
              <div>
                <p className="text-gray-500">活动分类</p>
                <p className="font-medium">{selectedActivity.category}</p>
              </div>
              <div>
                <p className="text-gray-500">开始时间</p>
                <p className="font-medium">{formatDateTime(selectedActivity.start_time)}</p>
              </div>
              <div>
                <p className="text-gray-500">结束时间</p>
                <p className="font-medium">{formatDateTime(selectedActivity.end_time)}</p>
              </div>
              <div>
                <p className="text-gray-500">报名人数</p>
                <p className="font-medium">
                  {selectedActivity.current_participants}/{selectedActivity.max_participants}
                </p>
              </div>
              <div>
                <p className="text-gray-500">发布人</p>
                <p className="font-medium">{selectedActivity.created_by}</p>
              </div>
            </div>

            <div className="flex space-x-2">
              <Link href={`/activities/${selectedActivity.id}`} className="flex-1">
                <Button className="w-full">查看详情</Button>
              </Link>
            </div>
          </div>
        )}
      </Dialog>
    </AdminLayout>
  );
}

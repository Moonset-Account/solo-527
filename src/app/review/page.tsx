"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileBarChart,
  Download,
  Users,
  Calendar,
  Clock,
  Check,
  X,
  AlertTriangle,
  MessageSquare,
  Wrench,
  ShoppingBag,
  Shield,
  ArrowRight,
  ChevronDown,
  TrendingUp,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useActivities, useActivityReview } from "@/lib/hooks";
import { exportToExcel, formatReviewExport } from "@/lib/export";
import Link from "next/link";

const tabs = [
  { key: "overview", label: "数据概览" },
  { key: "activities", label: "活动复盘" },
  { key: "cross-dept", label: "跨部门核对" },
];

export default function ReviewPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const { data: activities, loading: activitiesLoading } = useActivities();
  const { data: reviewData, loading: reviewLoading } = useActivityReview(selectedActivityId || "");

  const handleViewActivity = (activityId: string) => {
    setSelectedActivityId(activityId);
    setExpandedSection(null);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleExportReport = () => {
    if (reviewData) {
      const exportData = formatReviewExport(reviewData);
      exportToExcel(exportData, `活动复盘_${reviewData.activity?.title || "报告"}`);
    }
  };

  const groupedByDepartment = activities.reduce((acc: Record<string, any[]>, a: any) => {
    const dept = a.club_department || a.clubs?.department || "未分组";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(a);
    return acc;
  }, {});

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">复盘与核对</h1>
            <p className="mt-1 text-gray-500">活动复盘、跨部门核对与责任追溯</p>
          </div>
          <div className="flex space-x-2">
            {reviewData && (
              <Button variant="outline" onClick={handleExportReport}>
                <Download className="mr-2 h-4 w-4" />
                导出报告
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">总活动数</p>
                  <p className="text-xl font-bold text-gray-900">{activities.length}</p>
                </div>
                <Calendar className="h-6 w-6 text-primary-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">总参与人次</p>
                  <p className="text-xl font-bold text-blue-600">
                    {activities.reduce((s: number, a: any) => s + (a.current_participants || 0), 0)}
                  </p>
                </div>
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">已完成</p>
                  <p className="text-xl font-bold text-green-600">
                    {activities.filter((a: any) => a.status === "completed").length}
                  </p>
                </div>
                <Check className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">进行中</p>
                  <p className="text-xl font-bold text-primary-600">
                    {activities.filter((a: any) => a.status === "ongoing").length}
                  </p>
                </div>
                <Clock className="h-6 w-6 text-primary-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">待审核</p>
                  <p className="text-xl font-bold text-yellow-600">
                    {activities.filter((a: any) => a.status === "pending").length}
                  </p>
                </div>
                <Shield className="h-6 w-6 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">已拒绝</p>
                  <p className="text-xl font-bold text-red-600">
                    {activities.filter((a: any) => a.status === "rejected").length}
                  </p>
                </div>
                <X className="h-6 w-6 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? "bg-primary-100 text-primary-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === "overview" && (
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-0 shadow-none">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-base">活动报名情况</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <div className="space-y-3">
                      {activitiesLoading && <p className="text-sm text-gray-500">加载中...</p>}
                      {activities.slice(0, 10).map((activity: any) => (
                        <div key={activity.id}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{activity.title}</span>
                            <span className="font-medium">
                              {activity.current_participants}/{activity.max_participants}
                            </span>
                          </div>
                          <div className="mt-1 h-2 rounded-full bg-gray-200">
                            <div
                              className="h-full rounded-full bg-primary-500"
                              style={{
                                width: `${activity.max_participants > 0 ? (activity.current_participants / activity.max_participants) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-none">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-base">部门分布</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <div className="space-y-3">
                      {Object.entries(groupedByDepartment).map(([dept, acts]: [string, any]) => (
                        <div key={dept} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                          <span className="text-sm font-medium text-gray-700">{dept}</span>
                          <span className="text-sm text-gray-500">{acts.length} 场活动</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "activities" && (
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-500">选择活动</h3>
                  {activitiesLoading && <p className="text-sm text-gray-500">加载中...</p>}
                  {activities.map((activity: any) => (
                    <div
                      key={activity.id}
                      onClick={() => handleViewActivity(activity.id)}
                      className={`cursor-pointer rounded-lg border p-3 transition-colors hover:bg-gray-50 ${
                        selectedActivityId === activity.id ? "border-primary-300 bg-primary-50" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{activity.title}</span>
                        <Badge status={activity.status} />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{activity.club_name}</p>
                    </div>
                  ))}
                </div>

                <div className="lg:col-span-2">
                  {!selectedActivityId && (
                    <div className="flex h-64 items-center justify-center text-gray-400">
                      <div className="text-center">
                        <FileBarChart className="mx-auto h-12 w-12" />
                        <p className="mt-2">请选择一个活动查看复盘详情</p>
                      </div>
                    </div>
                  )}

                  {selectedActivityId && reviewLoading && (
                    <div className="flex h-64 items-center justify-center text-gray-400">
                      <p>加载中...</p>
                    </div>
                  )}

                  {selectedActivityId && !reviewLoading && reviewData && (
                    <div className="space-y-4">
                      {reviewData.activity && (
                        <div className="rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold">{reviewData.activity.title}</h3>
                            <Badge status={reviewData.activity.status} />
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            {reviewData.activity.club_name} · {reviewData.activity.club_department}
                          </p>
                          <div className="mt-2 grid grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500">报名人数</p>
                              <p className="font-medium">{reviewData.activity.current_participants}/{reviewData.activity.max_participants}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">签到人数</p>
                              <p className="font-medium">{reviewData.checkIns.length}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">报名记录</p>
                              <p className="font-medium">{reviewData.registrations.length}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">签到率</p>
                              <p className="font-medium">
                                {reviewData.activity.current_participants > 0
                                  ? Math.round((reviewData.checkIns.length / reviewData.activity.current_participants) * 100)
                                  : 0}%
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div
                          className="flex cursor-pointer items-center justify-between rounded-lg bg-blue-50 p-3"
                          onClick={() => toggleSection("messages")}
                        >
                          <div className="flex items-center space-x-3">
                            <MessageSquare className="h-5 w-5 text-blue-500" />
                            <span className="font-medium">消息触达记录</span>
                            <Badge variant="secondary">{reviewData.messages.length}</Badge>
                          </div>
                          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedSection === "messages" ? "rotate-180" : ""}`} />
                        </div>
                        {expandedSection === "messages" && (
                          <div className="space-y-2 pl-8">
                            {reviewData.messages.length === 0 && <p className="text-sm text-gray-400">暂无消息记录</p>}
                            {reviewData.messages.map((msg: any) => (
                              <div key={msg.id} className="rounded-md border border-gray-100 p-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium">{msg.title}</p>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant={msg.is_read ? "success" : "warning"}>
                                      {msg.is_read ? "已读" : "未读"}
                                    </Badge>
                                    <span className="text-xs text-gray-400">{msg.created_at ? formatDateTime(msg.created_at) : "-"}</span>
                                  </div>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">{msg.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div
                          className="flex cursor-pointer items-center justify-between rounded-lg bg-orange-50 p-3"
                          onClick={() => toggleSection("repairs")}
                        >
                          <div className="flex items-center space-x-3">
                            <Wrench className="h-5 w-5 text-orange-500" />
                            <span className="font-medium">关联报修单</span>
                            <Badge variant="secondary">{reviewData.repairs.length}</Badge>
                          </div>
                          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedSection === "repairs" ? "rotate-180" : ""}`} />
                        </div>
                        {expandedSection === "repairs" && (
                          <div className="space-y-2 pl-8">
                            {reviewData.repairs.length === 0 && <p className="text-sm text-gray-400">暂无关联报修</p>}
                            {reviewData.repairs.map((repair: any) => (
                              <div key={repair.id} className="rounded-md border border-gray-100 p-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium">{repair.title}</p>
                                  <Badge status={repair.status} />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                  报修人：{repair.reporter_name || "-"} · 优先级：{repair.priority} · {repair.created_at ? formatDateTime(repair.created_at) : "-"}
                                </p>
                                {repair.completed_at && (
                                  <p className="text-xs text-green-600">完成时间：{formatDateTime(repair.completed_at)}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div
                          className="flex cursor-pointer items-center justify-between rounded-lg bg-purple-50 p-3"
                          onClick={() => toggleSection("trades")}
                        >
                          <div className="flex items-center space-x-3">
                            <ShoppingBag className="h-5 w-5 text-purple-500" />
                            <span className="font-medium">关联二手交易</span>
                            <Badge variant="secondary">{reviewData.trades.length}</Badge>
                          </div>
                          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedSection === "trades" ? "rotate-180" : ""}`} />
                        </div>
                        {expandedSection === "trades" && (
                          <div className="space-y-2 pl-8">
                            {reviewData.trades.length === 0 && <p className="text-sm text-gray-400">暂无关联交易</p>}
                            {reviewData.trades.map((trade: any) => (
                              <div key={trade.id} className="rounded-md border border-gray-100 p-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium">{trade.title}</p>
                                  <Badge status={trade.status} />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                  卖家：{trade.seller_name || "-"} · ¥{trade.price} · {trade.created_at ? formatDateTime(trade.created_at) : "-"}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div
                          className="flex cursor-pointer items-center justify-between rounded-lg bg-green-50 p-3"
                          onClick={() => toggleSection("verifications")}
                        >
                          <div className="flex items-center space-x-3">
                            <Shield className="h-5 w-5 text-green-500" />
                            <span className="font-medium">身份审核记录</span>
                            <Badge variant="secondary">{reviewData.verifications.length}</Badge>
                          </div>
                          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedSection === "verifications" ? "rotate-180" : ""}`} />
                        </div>
                        {expandedSection === "verifications" && (
                          <div className="space-y-2 pl-8">
                            {reviewData.verifications.length === 0 && (
                              <p className="text-sm text-gray-400">暂无审核记录</p>
                            )}
                            {reviewData.verifications.map((v: any) => (
                              <div key={v.id} className="rounded-md border border-gray-100 p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <p className="text-sm font-medium">{v.user_name || "-"}</p>
                                    <Badge status={v.status} />
                                  </div>
                                  <span className="text-xs text-gray-400">{v.submitted_at ? formatDateTime(v.submitted_at) : "-"}</span>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                  学号：{v.student_id || "-"} · 邮箱：{v.email || "-"} · 类型：
                                  {v.type === "student" ? "学生认证" : v.type === "club_leader" ? "社团负责人" : v.type === "department" ? "部门负责人" : "管理员"}
                                </p>
                                {v.review_comment && (
                                  <p className="mt-1 text-xs text-gray-600">审核意见：{v.review_comment}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div
                          className="flex cursor-pointer items-center justify-between rounded-lg bg-red-50 p-3"
                          onClick={() => toggleSection("violations")}
                        >
                          <div className="flex items-center space-x-3">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            <span className="font-medium">座位违约记录</span>
                            <Badge variant="destructive">{reviewData.violations.length}</Badge>
                          </div>
                          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedSection === "violations" ? "rotate-180" : ""}`} />
                        </div>
                        {expandedSection === "violations" && (
                          <div className="space-y-2 pl-8">
                            {reviewData.violations.length === 0 && <p className="text-sm text-gray-400">暂无违约记录</p>}
                            {reviewData.violations.map((v: any) => (
                              <div key={v.id} className="rounded-md border border-gray-100 p-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium">{v.user_name || "-"}</p>
                                  <Badge variant="destructive">
                                    {v.type === "no_show" ? "未到场" : v.type === "late" ? "迟到" : "迟到取消"}
                                  </Badge>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                  学号：{v.student_id || "-"} · 累计 {v.count} 次 · {v.created_at ? formatDateTime(v.created_at) : "-"}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div
                          className="flex cursor-pointer items-center justify-between rounded-lg bg-gray-50 p-3"
                          onClick={() => toggleSection("audit")}
                        >
                          <div className="flex items-center space-x-3">
                            <Clock className="h-5 w-5 text-gray-500" />
                            <span className="font-medium">最近处理记录</span>
                            <Badge variant="secondary">{reviewData.auditLogs.length}</Badge>
                          </div>
                          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expandedSection === "audit" ? "rotate-180" : ""}`} />
                        </div>
                        {expandedSection === "audit" && (
                          <div className="space-y-2 pl-8">
                            {reviewData.auditLogs.length === 0 && <p className="text-sm text-gray-400">暂无处理记录</p>}
                            {reviewData.auditLogs.map((log: any) => (
                              <div key={log.id} className="border-l-2 border-gray-200 pl-4 py-2">
                                <p className="text-sm font-medium">{log.action}</p>
                                <p className="text-xs text-gray-500">
                                  操作人：{log.user_name || "-"} · {log.created_at ? formatDateTime(log.created_at) : "-"}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline" onClick={handleExportReport}>
                          <Download className="mr-2 h-4 w-4" />
                          导出复盘报告
                        </Button>
                        <Link href={`/activities/${selectedActivityId}`}>
                          <Button>查看活动详情</Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "cross-dept" && (
              <div className="space-y-6">
                {Object.entries(groupedByDepartment).map(([dept, acts]: [string, any]) => (
                  <div key={dept} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{dept}</h3>
                        <p className="text-sm text-gray-500">共 {acts.length} 场活动</p>
                      </div>
                      <Badge variant="secondary">{acts.length} 场</Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">总参与人次</p>
                        <p className="font-medium">{acts.reduce((s: number, a: any) => s + (a.current_participants || 0), 0)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">已完成</p>
                        <p className="font-medium">{acts.filter((a: any) => a.status === "completed").length}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">进行中</p>
                        <p className="font-medium">{acts.filter((a: any) => a.status === "ongoing" || a.status === "approved").length}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">待审核</p>
                        <p className="font-medium">{acts.filter((a: any) => a.status === "pending").length}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {Object.keys(groupedByDepartment).length === 0 && !activitiesLoading && (
                  <div className="py-12 text-center text-gray-500">
                    <FileBarChart className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-2">暂无部门数据</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

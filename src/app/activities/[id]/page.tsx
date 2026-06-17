"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Clock,
  Download,
  QrCode,
  Mail,
  MessageSquare,
  Edit,
  Check,
  X,
  AlertTriangle,
  UserPlus,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { useActivityReview, sendRemindersClient, submitRegistrationClient } from "@/lib/hooks";
import { exportToExcel, formatRegistrationExport, formatReviewExport } from "@/lib/export";
import { createClient } from "@/lib/supabase/client";

export default function ActivityDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState("participants");
  const [showSendReminder, setShowSendReminder] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [reminderContent, setReminderContent] = useState("");
  const [sendingReminder, setSendingReminder] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [registerStudentId, setRegisterStudentId] = useState("");
  const [registerError, setRegisterError] = useState(false);
  const [registerResult, setRegisterResult] = useState<{ registered?: boolean; error?: string | null } | null>(null);
  const [registering, setRegistering] = useState(false);

  const { data: reviewData, loading, refetch } = useActivityReview(params.id);

  const activity = reviewData?.activity;
  const registrations = reviewData?.registrations || [];
  const checkIns = reviewData?.checkIns || [];
  const repairs = reviewData?.repairs || [];
  const trades = reviewData?.trades || [];
  const auditLogs = reviewData?.auditLogs || [];

  const relatedRecords = [
    ...repairs.map((r: any) => ({ ...r, type: "repair" as const, handler: r.reporter_name, time: r.created_at })),
    ...trades.map((t: any) => ({ ...t, type: "trade" as const, handler: t.seller_name, time: t.created_at })),
  ];

  const registeredCount = registrations.filter((r: any) => r.status === "registered" || r.status === "checked_in").length;
  const waitlistCount = registrations.filter((r: any) => r.status === "waitlisted").length;
  const cancelledCount = registrations.filter((r: any) => r.status === "cancelled").length;
  const totalRegistrations = registrations.length;

  const registrationRate = activity?.max_participants ? Math.round((activity.current_participants / activity.max_participants) * 100) : 0;
  const reminderRate = registrations.filter((r: any) => r.has_reminder).length > 0
    ? Math.round((registrations.filter((r: any) => r.reminder_sent).length / registrations.filter((r: any) => r.has_reminder).length) * 100)
    : 0;
  const cancelRate = totalRegistrations > 0 ? Math.round((cancelledCount / totalRegistrations) * 100) : 0;

  const tabs = [
    { key: "participants", label: "报名名单" },
    { key: "checkin", label: "签到记录" },
    { key: "related", label: "关联记录" },
    { key: "audit", label: "操作日志" },
  ];

  const handleSendReminder = async () => {
    if (!activity) return;
    setSendingReminder(true);
    const title = `【活动提醒】您报名的「${activity.title}」即将开始`;
    const content = reminderContent || `您报名的「${activity.title}」将于${formatDateTime(activity.start_time)}在${activity.location}开始，请准时参加。`;
    await sendRemindersClient(params.id, title, content);
    setSendingReminder(false);
    setShowSendReminder(false);
    setReminderContent("");
    refetch();
  };

  const handleExportRegistrations = () => {
    const exportData = formatRegistrationExport(
      registrations.map((r: any) => ({ ...r, activity_title: activity?.title }))
    );
    exportToExcel(exportData, `${activity?.title || "活动"}_报名名单`, "报名名单");
  };

  const handleExportReview = () => {
    const exportData = formatReviewExport(reviewData);
    exportToExcel(exportData, `${activity?.title || "活动"}_审核报告`, "审核报告");
  };

  const handleCancelActivity = async () => {
    setCancelling(true);
    const supabase = createClient();
    await supabase
      .from("activities")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", params.id);
    setCancelling(false);
    setShowCancelDialog(false);
    refetch();
  };

  const handleRegister = async () => {
    if (!registerStudentId.trim()) {
      setRegisterError(true);
      setRegisterResult({ registered: false, error: "请输入学号或用户ID" });
      return;
    }

    setRegistering(true);
    setRegisterError(false);
    setRegisterResult(null);

    try {
      const supabase = createClient();
      let userId = registerStudentId.trim();

      const { data: userByStudentId } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("student_id", userId)
        .single();

      if (userByStudentId) {
        userId = userByStudentId.id;
      } else {
        const { data: userById } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("id", userId)
          .single();

        if (!userById) {
          setRegisterError(true);
          setRegisterResult({ registered: false, error: "未找到该用户，请检查学号或用户ID" });
          setRegistering(false);
          return;
        }
        userId = userById.id;
      }

      const result = await submitRegistrationClient(params.id, userId);

      if (result.error) {
        setRegisterError(true);
        setRegisterResult({ registered: false, error: result.error });
      } else {
        setRegisterResult({ registered: true, error: null });
        setRegisterStudentId("");
        refetch();
      }
    } catch (e: any) {
      setRegisterError(true);
      setRegisterResult({ registered: false, error: e.message || "报名失败" });
    }

    setRegistering(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
            <p className="mt-2 text-gray-500">加载中...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!activity) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <p className="text-gray-500">活动不存在</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/activities">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">{activity.title}</h1>
              <Badge status={activity.status} />
            </div>
            <p className="mt-1 text-gray-500">{activity.club_name} · {activity.category}</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => setShowQrDialog(true)}>
              <QrCode className="mr-2 h-4 w-4" />
              签到码
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSendReminder(true)}>
              <Mail className="mr-2 h-4 w-4" />
              发送提醒
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportRegistrations}>
              <Download className="mr-2 h-4 w-4" />
              导出名单
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              编辑
            </Button>
          </div>
        </div>

        <Card className="bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                  <UserPlus className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">报名参加</h3>
                  <p className="text-sm text-gray-500">输入学号或用户ID为用户快速报名</p>
                </div>
              </div>
              <div className="flex-1 flex flex-col sm:flex-row gap-3">
                <Input
                  type="text"
                  placeholder="请输入学号或用户ID"
                  value={registerStudentId}
                  onChange={(e) => {
                    setRegisterStudentId(e.target.value);
                    if (registerError) setRegisterError(false);
                    if (registerResult) setRegisterResult(null);
                  }}
                  className={registerError ? "border-red-500 focus-visible:ring-red-500" : ""}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRegister();
                  }}
                />
                <Button onClick={handleRegister} disabled={registering}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {registering ? "报名中..." : "立即报名"}
                </Button>
              </div>
            </div>
            {registerResult && (
              <div className={`mt-4 p-3 rounded-md text-sm ${registerResult.registered ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {registerResult.registered ? "报名成功！" : registerResult.error}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>活动详情</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <MapPin className="mt-0.5 h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">活动地点</p>
                        <p className="font-medium">{activity.location}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">开始时间</p>
                        <p className="font-medium">{formatDateTime(activity.start_time)}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Clock className="mt-0.5 h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">结束时间</p>
                        <p className="font-medium">{formatDateTime(activity.end_time)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Users className="mt-0.5 h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">报名人数</p>
                        <p className="font-medium">
                          {activity.current_participants}/{activity.max_participants} 人
                          <span className="ml-2 text-sm text-gray-500">
                            (候补 {waitlistCount} 人)
                          </span>
                        </p>
                        <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-primary-500"
                            style={{
                              width: `${registrationRate}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MessageSquare className="mt-0.5 h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">审核意见</p>
                        <p className="font-medium">{activity.review_comment}</p>
                        <p className="text-xs text-gray-400">审核人：{activity.reviewed_by}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-medium text-gray-900">活动介绍</h3>
                  <p className="mt-2 text-gray-600 leading-relaxed">{activity.description}</p>
                </div>
              </CardContent>
            </Card>

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
                {activeTab === "participants" && (
                  <div className="space-y-3">
                    {registrations.map((p: any) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-lg border border-gray-100 p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-700">
                              {(p.user_name || "").charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{p.user_name}</p>
                            <p className="text-sm text-gray-500">
                              {p.student_id} · {p.department}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            {p.seat_number && (
                              <p className="text-sm text-gray-900">座位号: {p.seat_number}</p>
                            )}
                            <p className="text-xs text-gray-500">{p.phone}</p>
                          </div>
                          <Badge status={p.status} />
                          <div className="flex space-x-1">
                            {p.has_reminder && (
                              <span className={`inline-flex h-2 w-2 rounded-full ${p.reminder_sent ? "bg-green-500" : "bg-gray-300"}`} title={p.reminder_sent ? "提醒已发送" : "提醒未发送"} />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {registrations.length === 0 && (
                      <div className="py-8 text-center text-gray-500">暂无报名记录</div>
                    )}
                  </div>
                )}

                {activeTab === "checkin" && (
                  <div className="space-y-3">
                    {checkIns.map((c: any) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between rounded-lg border border-gray-100 p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <Check className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{c.user_name}</p>
                            <p className="text-sm text-gray-500">{c.student_id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-900">{formatDateTime(c.check_in_time)}</p>
                          <p className="text-xs text-gray-500">
                            {c.check_in_method === "qrcode" ? "扫码签到" : c.check_in_method === "gps" ? "GPS签到" : "手动签到"}
                            {c.location && ` · ${c.location}`}
                          </p>
                        </div>
                      </div>
                    ))}
                    {checkIns.length === 0 && (
                      <div className="py-8 text-center text-gray-500">
                        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400" />
                        <p className="mt-2">暂无签到记录</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "related" && (
                  <div className="space-y-3">
                    {relatedRecords.map((record: any) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between rounded-lg border border-gray-100 p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          {record.type === "repair" ? (
                            <div className="rounded-lg bg-orange-100 p-2">
                              <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                          ) : (
                            <div className="rounded-lg bg-green-100 p-2">
                              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                              </svg>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{record.title}</p>
                            <p className="text-sm text-gray-500">
                              处理人：{record.handler} · {formatDateTime(record.time)}
                            </p>
                          </div>
                        </div>
                        <Badge status={record.status} />
                      </div>
                    ))}
                    {relatedRecords.length === 0 && (
                      <div className="py-8 text-center text-gray-500">暂无关联记录</div>
                    )}
                  </div>
                )}

                {activeTab === "audit" && (
                  <div className="space-y-3">
                    {auditLogs.map((log: any) => (
                      <div
                        key={log.id}
                        className="flex items-start space-x-4 border-l-2 border-gray-200 pl-4 py-2"
                      >
                        <div className="mt-1 h-2 w-2 rounded-full bg-primary-500 -ml-[21px]" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900">{log.action}</p>
                            <p className="text-sm text-gray-500">{formatDateTime(log.created_at)}</p>
                          </div>
                          <p className="text-sm text-gray-500">操作人：{log.user_name}</p>
                          {log.details && (
                            <p className="mt-1 text-sm text-gray-600">
                              {typeof log.details === "string" ? log.details : JSON.stringify(log.details)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {auditLogs.length === 0 && (
                      <div className="py-8 text-center text-gray-500">暂无操作日志</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>快捷报名</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">学号/用户ID</label>
                  <Input
                    type="text"
                    placeholder="请输入学号或用户ID"
                    value={registerStudentId}
                    onChange={(e) => {
                      setRegisterStudentId(e.target.value);
                      if (registerError) setRegisterError(false);
                      if (registerResult) setRegisterResult(null);
                    }}
                    className={registerError ? "border-red-500 focus-visible:ring-red-500" : ""}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRegister();
                    }}
                  />
                </div>
                <Button className="w-full" onClick={handleRegister} disabled={registering}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {registering ? "报名中..." : "立即报名"}
                </Button>
                {registerResult && (
                  <div className={`text-sm ${registerResult.registered ? "text-green-600" : "text-red-600"}`}>
                    {registerResult.registered ? "报名成功！" : registerResult.error}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>快捷操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => setShowQrDialog(true)}>
                  <QrCode className="mr-2 h-4 w-4" />
                  生成签到二维码
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setShowSendReminder(true)}>
                  <Mail className="mr-2 h-4 w-4" />
                  批量发送提醒
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleExportRegistrations}>
                  <Download className="mr-2 h-4 w-4" />
                  导出报名数据
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleExportReview}>
                  <Download className="mr-2 h-4 w-4" />
                  导出审核报告
                </Button>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={activity.status === "cancelled"}
                >
                  <X className="mr-2 h-4 w-4" />
                  取消活动
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>统计概览</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">报名率</span>
                    <span className="font-medium">{registrationRate}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-gray-200">
                    <div className="h-full rounded-full bg-primary-500" style={{ width: `${registrationRate}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">提醒发送率</span>
                    <span className="font-medium">{reminderRate}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-gray-200">
                    <div className="h-full rounded-full bg-green-500" style={{ width: `${reminderRate}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">取消率</span>
                    <span className="font-medium">{cancelRate}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-gray-200">
                    <div className="h-full rounded-full bg-red-500" style={{ width: `${cancelRate}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog
        open={showSendReminder}
        onClose={() => setShowSendReminder(false)}
        title="发送活动提醒"
        description="向所有已报名的参与者发送活动提醒消息"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">提醒内容</label>
            <textarea
              className="h-24 w-full rounded-md border border-gray-300 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={reminderContent}
              onChange={(e) => setReminderContent(e.target.value)}
              placeholder={`【活动提醒】您报名的「${activity?.title}」将于${formatDateTime(activity?.start_time)}在${activity?.location}开始，请准时参加。`}
            />
          </div>
          <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">
            <p>将向 <span className="font-medium text-gray-900">{registeredCount + waitlistCount}</span> 位已报名用户发送提醒</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowSendReminder(false)}>取消</Button>
          <Button onClick={handleSendReminder} disabled={sendingReminder}>
            {sendingReminder ? "发送中..." : "发送提醒"}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        title="取消活动"
        description="确定要取消这个活动吗？取消后所有报名用户将收到通知。"
      >
        <div className="space-y-4">
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">注意</h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc space-y-1 pl-5">
                    <li>活动取消后不可恢复</li>
                    <li>所有报名用户将收到取消通知</li>
                    <li>已发送的提醒将自动失效</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">取消原因</label>
            <textarea
              className="h-20 w-full rounded-md border border-gray-300 p-3 text-sm"
              placeholder="请输入取消原因（将通知给报名用户）"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCancelDialog(false)}>保留活动</Button>
          <Button variant="destructive" onClick={handleCancelActivity} disabled={cancelling}>
            {cancelling ? "取消中..." : "确认取消"}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        open={showQrDialog}
        onClose={() => setShowQrDialog(false)}
        title="活动签到二维码"
        description="让参与者扫描二维码完成签到"
      >
        <div className="flex flex-col items-center">
          <div className="flex h-64 w-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
            <div className="text-center">
              <QrCode className="mx-auto h-24 w-24 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">二维码预览区域</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            活动ID: {params.id}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowQrDialog(false)}>关闭</Button>
          <Button onClick={() => setShowQrDialog(false)}>下载二维码</Button>
        </DialogFooter>
      </Dialog>
    </AdminLayout>
  );
}

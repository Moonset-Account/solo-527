"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";

const mockActivity = {
  id: "1",
  title: "春季团建活动",
  description: "一年一度的春季团建活动，增进社团成员之间的友谊。活动内容包括篮球比赛、趣味游戏、团队建设等环节。通过本次活动，期望能够增强社团凝聚力，提升成员间的默契度。",
  club: "篮球社",
  club_id: "1",
  location: "学校体育馆",
  start_time: "2026-06-20T14:00:00",
  end_time: "2026-06-20T18:00:00",
  max_participants: 50,
  current_participants: 45,
  waitlist_count: 8,
  status: "approved",
  category: "体育",
  cover_image: "",
  created_by: "张三",
  created_by_id: "user1",
  reviewed_by: "李老师",
  review_comment: "活动内容丰富，符合社团宗旨，同意举办。",
  created_at: "2026-06-10T10:00:00",
  updated_at: "2026-06-12T15:30:00",
};

const participants = [
  { id: "1", name: "张三", student_id: "2023001", department: "计算机学院", phone: "13800138001", status: "registered", registered_at: "2026-06-11T10:00:00", seat_number: 1, has_reminder: true, reminder_sent: true },
  { id: "2", name: "李四", student_id: "2023002", department: "经济学院", phone: "13800138002", status: "registered", registered_at: "2026-06-11T10:05:00", seat_number: 2, has_reminder: true, reminder_sent: true },
  { id: "3", name: "王五", student_id: "2023003", department: "管理学院", phone: "13800138003", status: "registered", registered_at: "2026-06-11T10:10:00", seat_number: 3, has_reminder: false, reminder_sent: false },
  { id: "4", name: "赵六", student_id: "2023004", department: "文学院", phone: "13800138004", status: "registered", registered_at: "2026-06-11T10:15:00", seat_number: 4, has_reminder: true, reminder_sent: true },
  { id: "5", name: "钱七", student_id: "2023005", department: "理学院", phone: "13800138005", status: "waitlisted", registered_at: "2026-06-11T10:20:00", seat_number: null, has_reminder: true, reminder_sent: false },
  { id: "6", name: "孙八", student_id: "2023006", department: "工学院", phone: "13800138006", status: "waitlisted", registered_at: "2026-06-11T10:25:00", seat_number: null, has_reminder: true, reminder_sent: false },
  { id: "7", name: "周九", student_id: "2023007", department: "法学院", phone: "13800138007", status: "cancelled", registered_at: "2026-06-11T10:30:00", cancelled_at: "2026-06-15T09:00:00", seat_number: null, has_reminder: false, reminder_sent: false },
];

const relatedRecords = [
  { id: "r1", type: "repair", title: "体育馆灯光维修", status: "completed", handler: "物业王师傅", time: "2026-06-18 10:00" },
  { id: "r2", type: "trade", title: "二手篮球出售", status: "sold", handler: "张三", time: "2026-06-16 14:30" },
];

const auditLogs = [
  { id: "1", action: "创建活动", user: "张三", time: "2026-06-10 10:00:00", details: "创建了春季团建活动" },
  { id: "2", action: "提交审核", user: "张三", time: "2026-06-11 09:00:00", details: "提交活动审核" },
  { id: "3", action: "审核通过", user: "李老师", time: "2026-06-12 15:30:00", details: "活动内容丰富，符合社团宗旨" },
];

export default function ActivityDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState("participants");
  const [showSendReminder, setShowSendReminder] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showQrDialog, setShowQrDialog] = useState(false);

  const tabs = [
    { key: "participants", label: "报名名单" },
    { key: "checkin", label: "签到记录" },
    { key: "related", label: "关联记录" },
    { key: "audit", label: "操作日志" },
  ];

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
              <h1 className="text-2xl font-bold text-gray-900">{mockActivity.title}</h1>
              <Badge status={mockActivity.status} />
            </div>
            <p className="mt-1 text-gray-500">{mockActivity.club} · {mockActivity.category}</p>
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
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              导出名单
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              编辑
            </Button>
          </div>
        </div>

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
                        <p className="font-medium">{mockActivity.location}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">开始时间</p>
                        <p className="font-medium">{formatDateTime(mockActivity.start_time)}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Clock className="mt-0.5 h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">结束时间</p>
                        <p className="font-medium">{formatDateTime(mockActivity.end_time)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Users className="mt-0.5 h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">报名人数</p>
                        <p className="font-medium">
                          {mockActivity.current_participants}/{mockActivity.max_participants} 人
                          <span className="ml-2 text-sm text-gray-500">
                            (候补 {mockActivity.waitlist_count} 人)
                          </span>
                        </p>
                        <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-primary-500"
                            style={{
                              width: `${(mockActivity.current_participants / mockActivity.max_participants) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MessageSquare className="mt-0.5 h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">审核意见</p>
                        <p className="font-medium">{mockActivity.review_comment}</p>
                        <p className="text-xs text-gray-400">审核人：{mockActivity.reviewed_by}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-medium text-gray-900">活动介绍</h3>
                  <p className="mt-2 text-gray-600 leading-relaxed">{mockActivity.description}</p>
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
                    {participants.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-lg border border-gray-100 p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-700">
                              {p.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{p.name}</p>
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
                  </div>
                )}

                {activeTab === "checkin" && (
                  <div className="py-8 text-center text-gray-500">
                    <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400" />
                    <p className="mt-2">活动尚未开始，暂无签到记录</p>
                  </div>
                )}

                {activeTab === "related" && (
                  <div className="space-y-3">
                    {relatedRecords.map((record) => (
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
                              处理人：{record.handler} · {record.time}
                            </p>
                          </div>
                        </div>
                        <Badge status={record.status} />
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "audit" && (
                  <div className="space-y-3">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start space-x-4 border-l-2 border-gray-200 pl-4 py-2"
                      >
                        <div className="mt-1 h-2 w-2 rounded-full bg-primary-500 -ml-[21px]" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900">{log.action}</p>
                            <p className="text-sm text-gray-500">{log.time}</p>
                          </div>
                          <p className="text-sm text-gray-500">操作人：{log.user}</p>
                          <p className="mt-1 text-sm text-gray-600">{log.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
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
                <Button variant="outline" className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  导出报名数据
                </Button>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={() => setShowCancelDialog(true)}
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
                    <span className="font-medium">90%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-gray-200">
                    <div className="h-full w-[90%] rounded-full bg-primary-500" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">提醒发送率</span>
                    <span className="font-medium">75%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-gray-200">
                    <div className="h-full w-[75%] rounded-full bg-green-500" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">取消率</span>
                    <span className="font-medium">6.5%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-gray-200">
                    <div className="h-full w-[6.5%] rounded-full bg-red-500" />
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
              defaultValue="【活动提醒】您报名的「春季团建活动」将于明天下午2点在学校体育馆开始，请准时参加。"
            />
          </div>
          <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">
            <p>将向 <span className="font-medium text-gray-900">45</span> 位已报名用户发送提醒</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowSendReminder(false)}>取消</Button>
          <Button onClick={() => setShowSendReminder(false)}>发送提醒</Button>
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
          <Button variant="destructive" onClick={() => setShowCancelDialog(false)}>确认取消</Button>
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

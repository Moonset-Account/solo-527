"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FileBarChart,
  Search,
  Filter,
  Download,
  Users,
  Calendar,
  Clock,
  Check,
  X,
  AlertTriangle,
  User,
  MessageSquare,
  Wrench,
  ShoppingBag,
  Shield,
  ArrowRight,
  ChevronDown,
  BarChart3,
  PieChart,
  TrendingUp,
} from "lucide-react";
import { formatDateTime, getStatusText } from "@/lib/utils";

const mockActivities = [
  {
    id: "1",
    title: "春季团建活动",
    club: "篮球社",
    department: "体育部",
    start_time: "2026-06-20T14:00:00",
    end_time: "2026-06-20T18:00:00",
    max_participants: 50,
    current_participants: 45,
    checked_in_count: 42,
    status: "approved",
    created_by: "张三",
    reviewed_by: "李老师",
    created_at: "2026-06-10T10:00:00",
    approved_at: "2026-06-12T15:30:00",
    repair_count: 1,
    trade_count: 1,
    message_count: 3,
    seat_violations: 2,
    no_show_count: 3,
  },
  {
    id: "5",
    title: "摄影作品展",
    club: "摄影协会",
    department: "文艺部",
    start_time: "2026-06-15T09:00:00",
    end_time: "2026-06-15T18:00:00",
    max_participants: 200,
    current_participants: 200,
    checked_in_count: 185,
    status: "completed",
    created_by: "钱七",
    reviewed_by: "王主任",
    created_at: "2026-06-01T10:00:00",
    approved_at: "2026-06-03T14:00:00",
    repair_count: 0,
    trade_count: 0,
    message_count: 5,
    seat_violations: 8,
    no_show_count: 15,
  },
  {
    id: "3",
    title: "校园歌手大赛",
    club: "音乐社",
    department: "文艺部",
    start_time: "2026-06-25T19:00:00",
    end_time: "2026-06-25T22:00:00",
    max_participants: 150,
    current_participants: 120,
    checked_in_count: 0,
    status: "approved",
    created_by: "王五",
    reviewed_by: "王主任",
    created_at: "2026-06-08T09:00:00",
    approved_at: "2026-06-10T11:00:00",
    repair_count: 2,
    trade_count: 1,
    message_count: 2,
    seat_violations: 0,
    no_show_count: 0,
  },
];

const relatedRecords = {
  messages: [
    { id: "m1", title: "活动审核通过", type: "review", time: "2026-06-12 15:30", is_read: true },
    { id: "m2", title: "活动开始提醒", type: "reminder", time: "2026-06-19 09:00", is_read: true },
    { id: "m3", title: "报名成功通知", type: "activity", time: "2026-06-11 10:00", is_read: true },
  ],
  repairs: [
    { id: "r1", title: "体育馆灯光维修", status: "completed", handler: "物业王师傅", time: "2026-06-18 10:00" },
  ],
  trades: [
    { id: "t1", title: "二手篮球出售", status: "sold", seller: "张三", time: "2026-06-16 14:30" },
  ],
  violations: [
    { id: "v1", user_name: "赵六", type: "no_show", count: 1, time: "2026-06-20" },
    { id: "v2", user_name: "周九", type: "late", count: 1, time: "2026-06-20" },
  ],
};

const tabs = [
  { key: "overview", label: "数据概览" },
  { key: "activities", label: "活动复盘" },
  { key: "cross-dept", label: "跨部门核对" },
];

export default function ReviewPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [showActivityDetail, setShowActivityDetail] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const handleViewActivity = (activity: any) => {
    setSelectedActivity(activity);
    setShowActivityDetail(true);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const stats = {
    total_activities: 28,
    total_participants: 1256,
    avg_check_in_rate: 85.5,
    total_repairs: 15,
    total_trades: 42,
    total_violations: 23,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">复盘与核对</h1>
            <p className="mt-1 text-gray-500">活动复盘、跨部门核对与责任追溯</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              导出报告
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">总活动数</p>
                  <p className="text-xl font-bold text-gray-900">{stats.total_activities}</p>
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
                  <p className="text-xl font-bold text-blue-600">{stats.total_participants}</p>
                </div>
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">平均签到率</p>
                  <p className="text-xl font-bold text-green-600">{stats.avg_check_in_rate}%</p>
                </div>
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">报修单</p>
                  <p className="text-xl font-bold text-orange-600">{stats.total_repairs}</p>
                </div>
                <Wrench className="h-6 w-6 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">二手交易</p>
                  <p className="text-xl font-bold text-purple-600">{stats.total_trades}</p>
                </div>
                <ShoppingBag className="h-6 w-6 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">违约记录</p>
                  <p className="text-xl font-bold text-red-600">{stats.total_violations}</p>
                </div>
                <AlertTriangle className="h-6 w-6 text-red-500" />
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
                    <CardTitle className="text-base">活动签到情况</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <div className="space-y-3">
                      {mockActivities.map((activity) => (
                        <div key={activity.id}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{activity.title}</span>
                            <span className="font-medium">
                              {activity.checked_in_count}/{activity.current_participants}
                            </span>
                          </div>
                          <div className="mt-1 h-2 rounded-full bg-gray-200">
                            <div
                              className="h-full rounded-full bg-primary-500"
                              style={{
                                width: `${activity.current_participants > 0 ? (activity.checked_in_count / activity.current_participants) * 100 : 0}%`,
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
                    <CardTitle className="text-base">关联业务统计</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-blue-50 p-4">
                        <div className="flex items-center space-x-3">
                          <MessageSquare className="h-6 w-6 text-blue-600" />
                          <div>
                            <p className="text-2xl font-bold text-blue-700">156</p>
                            <p className="text-xs text-blue-600">消息触达</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg bg-orange-50 p-4">
                        <div className="flex items-center space-x-3">
                          <Wrench className="h-6 w-6 text-orange-600" />
                          <div>
                            <p className="text-2xl font-bold text-orange-700">15</p>
                            <p className="text-xs text-orange-600">相关报修</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg bg-purple-50 p-4">
                        <div className="flex items-center space-x-3">
                          <ShoppingBag className="h-6 w-6 text-purple-600" />
                          <div>
                            <p className="text-2xl font-bold text-purple-700">42</p>
                            <p className="text-xs text-purple-600">关联交易</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg bg-red-50 p-4">
                        <div className="flex items-center space-x-3">
                          <AlertTriangle className="h-6 w-6 text-red-600" />
                          <div>
                            <p className="text-2xl font-bold text-red-700">23</p>
                            <p className="text-xs text-red-600">座位违约</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "activities" && (
              <div className="space-y-4">
                {mockActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow cursor-pointer"
                    onClick={() => handleViewActivity(activity)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                          <Badge status={activity.status} />
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {activity.club} · {activity.department}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                          <span>发起人：{activity.created_by}</span>
                          <span>审核人：{activity.reviewed_by}</span>
                          <span>创建时间：{formatDateTime(activity.created_at)}</span>
                          <span>审核时间：{formatDateTime(activity.approved_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {activity.checked_in_count}/{activity.current_participants}
                          </p>
                          <p className="text-xs text-gray-500">签到/报名</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        <MessageSquare className="mr-1 h-3 w-3" />
                        {activity.message_count} 条消息
                      </span>
                      <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                        <Wrench className="mr-1 h-3 w-3" />
                        {activity.repair_count} 条报修
                      </span>
                      <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                        <ShoppingBag className="mr-1 h-3 w-3" />
                        {activity.trade_count} 笔交易
                      </span>
                      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        {activity.no_show_count} 次违约
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "cross-dept" && (
              <div className="space-y-6">
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">文艺部 - 6月活动核对</h3>
                      <p className="text-sm text-gray-500">共 12 场活动，涉及 3 个社团</p>
                    </div>
                    <Badge variant="warning">待核对</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">总参与人次</p>
                      <p className="font-medium">856</p>
                    </div>
                    <div>
                      <p className="text-gray-500">关联报修</p>
                      <p className="font-medium">8 单</p>
                    </div>
                    <div>
                      <p className="text-gray-500">关联交易</p>
                      <p className="font-medium">15 笔</p>
                    </div>
                    <div>
                      <p className="text-gray-500">违约记录</p>
                      <p className="font-medium">12 次</p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button size="sm" variant="outline">查看详情</Button>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">体育部 - 6月活动核对</h3>
                      <p className="text-sm text-gray-500">共 8 场活动，涉及 5 个社团</p>
                    </div>
                    <Badge variant="success">已核对</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">总参与人次</p>
                      <p className="font-medium">400</p>
                    </div>
                    <div>
                      <p className="text-gray-500">关联报修</p>
                      <p className="font-medium">5 单</p>
                    </div>
                    <div>
                      <p className="text-gray-500">关联交易</p>
                      <p className="font-medium">20 笔</p>
                    </div>
                    <div>
                      <p className="text-gray-500">违约记录</p>
                      <p className="font-medium">8 次</p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button size="sm" variant="outline">查看详情</Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedActivity && (
        <div
          className={`fixed inset-y-0 right-0 z-50 w-full max-w-xl transform bg-white shadow-xl transition-transform duration-300 ease-in-out ${
            showActivityDetail ? "translate-x-0" : "translate-x-full"
          }`}
          style={{ display: showActivityDetail ? "block" : "none" }}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold">{selectedActivity.title}</h2>
                <p className="text-sm text-gray-500">活动复盘详情</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowActivityDetail(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-3">
                <div
                  className="flex cursor-pointer items-center justify-between rounded-lg bg-gray-50 p-3"
                  onClick={() => toggleSection("basic")}
                >
                  <div className="flex items-center space-x-3">
                    <FileBarChart className="h-5 w-5 text-primary-500" />
                    <span className="font-medium">基本信息</span>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      expandedSection === "basic" ? "rotate-180" : ""
                    }`}
                  />
                </div>
                {expandedSection === "basic" && (
                  <div className="space-y-3 pl-8 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-gray-500">所属社团</p>
                        <p className="font-medium">{selectedActivity.club}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">所属部门</p>
                        <p className="font-medium">{selectedActivity.department}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">发起人</p>
                        <p className="font-medium">{selectedActivity.created_by}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">审核人</p>
                        <p className="font-medium">{selectedActivity.reviewed_by}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">创建时间</p>
                        <p className="font-medium">{formatDateTime(selectedActivity.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">审核通过时间</p>
                        <p className="font-medium">{formatDateTime(selectedActivity.approved_at)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div
                  className="flex cursor-pointer items-center justify-between rounded-lg bg-blue-50 p-3"
                  onClick={() => toggleSection("messages")}
                >
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">消息触达记录</span>
                    <Badge variant="secondary">{relatedRecords.messages.length}</Badge>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      expandedSection === "messages" ? "rotate-180" : ""
                    }`}
                  />
                </div>
                {expandedSection === "messages" && (
                  <div className="space-y-2 pl-8">
                    {relatedRecords.messages.map((msg) => (
                      <div key={msg.id} className="rounded-md border border-gray-100 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{msg.title}</p>
                          <span className="text-xs text-gray-400">{msg.time}</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          类型：{msg.type === "review" ? "审核通知" : msg.type === "reminder" ? "活动提醒" : "活动通知"}
                        </p>
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
                    <Badge variant="secondary">{relatedRecords.repairs.length}</Badge>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      expandedSection === "repairs" ? "rotate-180" : ""
                    }`}
                  />
                </div>
                {expandedSection === "repairs" && (
                  <div className="space-y-2 pl-8">
                    {relatedRecords.repairs.map((repair) => (
                      <div key={repair.id} className="rounded-md border border-gray-100 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{repair.title}</p>
                          <Badge status={repair.status} />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          处理人：{repair.handler} · {repair.time}
                        </p>
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
                    <Badge variant="secondary">{relatedRecords.trades.length}</Badge>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      expandedSection === "trades" ? "rotate-180" : ""
                    }`}
                  />
                </div>
                {expandedSection === "trades" && (
                  <div className="space-y-2 pl-8">
                    {relatedRecords.trades.map((trade) => (
                      <div key={trade.id} className="rounded-md border border-gray-100 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{trade.title}</p>
                          <Badge status={trade.status} />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          卖家：{trade.seller} · {trade.time}
                        </p>
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
                    <Badge variant="destructive">{relatedRecords.violations.length}</Badge>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      expandedSection === "violations" ? "rotate-180" : ""
                    }`}
                  />
                </div>
                {expandedSection === "violations" && (
                  <div className="space-y-2 pl-8">
                    {relatedRecords.violations.map((v) => (
                      <div key={v.id} className="rounded-md border border-gray-100 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{v.user_name}</p>
                          <Badge variant="destructive">
                            {v.type === "no_show" ? "未到场" : "迟到"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          累计 {v.count} 次 · {v.time}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div
                  className="flex cursor-pointer items-center justify-between rounded-lg bg-green-50 p-3"
                  onClick={() => toggleSection("audit")}
                >
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-green-500" />
                    <span className="font-medium">最近处理记录</span>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      expandedSection === "audit" ? "rotate-180" : ""
                    }`}
                  />
                </div>
                {expandedSection === "audit" && (
                  <div className="space-y-3 pl-8">
                    <div className="border-l-2 border-gray-200 pl-4">
                      <div className="relative pb-4">
                        <div className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-green-500" />
                        <p className="text-sm font-medium">活动审核通过</p>
                        <p className="text-xs text-gray-500">
                          {selectedActivity.reviewed_by} · {formatDateTime(selectedActivity.approved_at)}
                        </p>
                      </div>
                      <div className="relative pb-4">
                        <div className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-blue-500" />
                        <p className="text-sm font-medium">提交审核</p>
                        <p className="text-xs text-gray-500">
                          {selectedActivity.created_by} · {formatDateTime(selectedActivity.created_at)}
                        </p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-gray-400" />
                        <p className="text-sm font-medium">创建活动</p>
                        <p className="text-xs text-gray-500">
                          {selectedActivity.created_by} · {formatDateTime(selectedActivity.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t px-6 py-4">
              <div className="flex justify-end space-x-2">
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  导出报告
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

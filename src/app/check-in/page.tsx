"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import {
  QrCode,
  Search,
  Filter,
  Download,
  CheckSquare,
  Users,
  Clock,
  Check,
  X,
  MapPin,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { formatDateTime, formatTime } from "@/lib/utils";
import Link from "next/link";

const mockActivities = [
  {
    id: "4",
    title: "读书分享会",
    club: "文学社",
    location: "图书馆会议室",
    start_time: "2026-06-18T15:00:00",
    end_time: "2026-06-18T17:00:00",
    max_participants: 30,
    current_participants: 28,
    checked_in_count: 22,
    status: "ongoing",
    check_in_rate: 78.6,
  },
  {
    id: "5",
    title: "摄影作品展",
    club: "摄影协会",
    location: "美术馆",
    start_time: "2026-06-15T09:00:00",
    end_time: "2026-06-15T18:00:00",
    max_participants: 200,
    current_participants: 200,
    checked_in_count: 185,
    status: "completed",
    check_in_rate: 92.5,
  },
  {
    id: "1",
    title: "春季团建活动",
    club: "篮球社",
    location: "学校体育馆",
    start_time: "2026-06-20T14:00:00",
    end_time: "2026-06-20T18:00:00",
    max_participants: 50,
    current_participants: 45,
    checked_in_count: 0,
    status: "approved",
    check_in_rate: 0,
  },
  {
    id: "2",
    title: "编程技术分享会",
    club: "计算机协会",
    location: "教学楼A101",
    start_time: "2026-06-22T19:00:00",
    end_time: "2026-06-22T21:00:00",
    max_participants: 100,
    current_participants: 78,
    checked_in_count: 0,
    status: "pending",
    check_in_rate: 0,
  },
];

const mockCheckIns = [
  {
    id: "1",
    user_name: "钱七",
    student_id: "2023005",
    activity_title: "读书分享会",
    activity_id: "4",
    check_in_time: "2026-06-18T14:55:00",
    check_in_method: "qrcode",
    location: "图书馆会议室",
  },
  {
    id: "2",
    user_name: "孙八",
    student_id: "2023006",
    activity_title: "读书分享会",
    activity_id: "4",
    check_in_time: "2026-06-18T15:02:00",
    check_in_method: "qrcode",
    location: "图书馆会议室",
  },
  {
    id: "3",
    user_name: "周九",
    student_id: "2023007",
    activity_title: "摄影作品展",
    activity_id: "5",
    check_in_time: "2026-06-15T09:15:00",
    check_in_method: "manual",
    location: "美术馆入口",
  },
  {
    id: "4",
    user_name: "吴十",
    student_id: "2023008",
    activity_title: "摄影作品展",
    activity_id: "5",
    check_in_time: "2026-06-15T09:20:00",
    check_in_method: "qrcode",
    location: "美术馆入口",
  },
];

const tabs = [
  { key: "activities", label: "按活动查看" },
  { key: "records", label: "签到记录" },
];

export default function CheckInPage() {
  const [activeTab, setActiveTab] = useState("activities");
  const [searchQuery, setSearchQuery] = useState("");
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [showManualCheckIn, setShowManualCheckIn] = useState(false);
  const [manualStudentId, setManualStudentId] = useState("");

  const handleGenerateQr = (activity: any) => {
    setSelectedActivity(activity);
    setShowQrDialog(true);
  };

  const handleManualCheckIn = (activity: any) => {
    setSelectedActivity(activity);
    setShowManualCheckIn(true);
  };

  const stats = {
    total_checked_in: 207,
    today_checked_in: 22,
    avg_check_in_rate: 85.5,
    no_show_count: 21,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">签到管理</h1>
            <p className="mt-1 text-gray-500">管理活动签到和查看签到记录</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              导出数据
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">总签到人数</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_checked_in}</p>
                </div>
                <CheckSquare className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">今日签到</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.today_checked_in}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">平均签到率</p>
                  <p className="text-2xl font-bold text-green-600">{stats.avg_check_in_rate}%</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">未到场人数</p>
                  <p className="text-2xl font-bold text-red-600">{stats.no_show_count}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="搜索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === "activities" && (
              <div className="space-y-4">
                {mockActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="rounded-lg bg-primary-100 p-3">
                          <CheckSquare className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                            <Badge status={activity.status} />
                          </div>
                          <p className="text-sm text-gray-500">{activity.club}</p>
                          <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <MapPin className="mr-1 h-3 w-3" />
                              {activity.location}
                            </span>
                            <span className="flex items-center">
                              <Clock className="mr-1 h-3 w-3" />
                              {formatTime(activity.start_time)} - {formatTime(activity.end_time)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">
                            {activity.checked_in_count}/{activity.current_participants}
                          </p>
                          <p className="text-xs text-gray-500">签到/报名</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-lg font-bold ${
                            activity.check_in_rate >= 80 ? "text-green-600" :
                            activity.check_in_rate >= 60 ? "text-yellow-600" : "text-red-600"
                          }`}>
                            {activity.check_in_rate}%
                          </p>
                          <p className="text-xs text-gray-500">签到率</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateQr(activity)}
                          >
                            <QrCode className="mr-2 h-4 w-4" />
                            签到码
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManualCheckIn(activity)}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            手动签到
                          </Button>
                          <Link href={`/activities/${activity.id}`}>
                            <Button variant="ghost" size="sm">
                              详情
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full ${
                            activity.check_in_rate >= 80 ? "bg-green-500" :
                            activity.check_in_rate >= 60 ? "bg-yellow-500" : "bg-red-500"
                          }`}
                          style={{ width: `${activity.check_in_rate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "records" && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="pb-3 font-medium">用户</th>
                      <th className="pb-3 font-medium">学号</th>
                      <th className="pb-3 font-medium">活动</th>
                      <th className="pb-3 font-medium">签到时间</th>
                      <th className="pb-3 font-medium">签到方式</th>
                      <th className="pb-3 font-medium">地点</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockCheckIns.map((record) => (
                      <tr key={record.id} className="border-b border-gray-100">
                        <td className="py-3">
                          <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-xs font-medium text-primary-700">
                                {record.user_name.charAt(0)}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900">{record.user_name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-gray-500">{record.student_id}</td>
                        <td className="py-3">
                          <Link href={`/activities/${record.activity_id}`} className="text-primary-600 hover:underline">
                            {record.activity_title}
                          </Link>
                        </td>
                        <td className="py-3 text-gray-500">
                          {formatDateTime(record.check_in_time)}
                        </td>
                        <td className="py-3">
                          <Badge variant={record.check_in_method === "qrcode" ? "success" : "secondary"}>
                            {record.check_in_method === "qrcode" ? "二维码" : "手动"}
                          </Badge>
                        </td>
                        <td className="py-3 text-gray-500">{record.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={showQrDialog}
        onClose={() => setShowQrDialog(false)}
        title="活动签到二维码"
        description={selectedActivity?.title}
      >
        <div className="flex flex-col items-center py-4">
          <div className="flex h-64 w-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
            <div className="text-center">
              <QrCode className="mx-auto h-24 w-24 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">签到二维码</p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              让参与者扫描二维码完成签到
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowQrDialog(false)}>关闭</Button>
          <Button onClick={() => setShowQrDialog(false)}>下载二维码</Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        open={showManualCheckIn}
        onClose={() => setShowManualCheckIn(false)}
        title="手动签到"
        description={selectedActivity?.title}
      >
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">学号</label>
            <Input
              placeholder="请输入学号"
              value={manualStudentId}
              onChange={(e) => setManualStudentId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">或选择用户</label>
            <select className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm">
              <option>请选择用户</option>
              <option>张三 - 2023001</option>
              <option>李四 - 2023002</option>
              <option>王五 - 2023003</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowManualCheckIn(false)}>取消</Button>
          <Button
            onClick={() => {
              alert("签到成功");
              setShowManualCheckIn(false);
              setManualStudentId("");
            }}
          >
            确认签到
          </Button>
        </DialogFooter>
      </Dialog>
    </AdminLayout>
  );
}

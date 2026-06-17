"use client";

import { useState, useCallback } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import {
  QrCode,
  Search,
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
import { useActivities, useCheckIns, checkInUserClient } from "@/lib/hooks";
import { exportToExcel, formatCheckInExport } from "@/lib/export";
import Link from "next/link";

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
  const [checkInResult, setCheckInResult] = useState<{ success?: boolean; error?: string } | null>(null);

  const { data: activities, loading: activitiesLoading, refetch: refetchActivities } = useActivities();
  const { data: checkIns, loading: checkInsLoading, refetch: refetchCheckIns } = useCheckIns();

  const handleGenerateQr = (activity: any) => {
    setSelectedActivity(activity);
    setShowQrDialog(true);
  };

  const handleManualCheckIn = (activity: any) => {
    setSelectedActivity(activity);
    setManualStudentId("");
    setCheckInResult(null);
    setShowManualCheckIn(true);
  };

  const handleCheckInSubmit = async () => {
    if (!selectedActivity || !manualStudentId) return;
    const result = await checkInUserClient(selectedActivity.id, manualStudentId, "manual");
    setCheckInResult(result);
    if (result.data) {
      refetchCheckIns();
      refetchActivities();
    }
  };

  const handleExport = () => {
    const exportData = formatCheckInExport(checkIns);
    exportToExcel(exportData, "签到记录");
  };

  const stats = {
    total_checked_in: checkIns.length,
    avg_check_in_rate: activities.length > 0
      ? Math.round(
          (activities.reduce((sum, a) => sum + (a.current_participants > 0 ? (checkIns.filter(c => c.activity_id === a.id).length / a.current_participants) * 100 : 0), 0) /
          activities.filter(a => a.current_participants > 0).length)
        )
      : 0,
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
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              导出数据
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
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
                  <p className="text-sm text-gray-500">活动总数</p>
                  <p className="text-2xl font-bold text-blue-600">{activities.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
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
                {activitiesLoading && <p className="text-center text-gray-500 py-8">加载中...</p>}
                {!activitiesLoading && activities.length === 0 && (
                  <div className="py-12 text-center text-gray-500">
                    <CheckSquare className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-2">暂无活动</p>
                  </div>
                )}
                {activities.map((activity: any) => {
                  const activityCheckIns = checkIns.filter((c: any) => c.activity_id === activity.id);
                  const checkInRate = activity.current_participants > 0
                    ? Math.round((activityCheckIns.length / activity.current_participants) * 100)
                    : 0;
                  return (
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
                            <p className="text-sm text-gray-500">{activity.club_name}</p>
                            <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center">
                                <MapPin className="mr-1 h-3 w-3" />
                                {activity.location}
                              </span>
                              <span className="flex items-center">
                                <Clock className="mr-1 h-3 w-3" />
                                {activity.start_time ? formatTime(activity.start_time) : ""} - {activity.end_time ? formatTime(activity.end_time) : ""}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <p className="text-lg font-bold text-gray-900">
                              {activityCheckIns.length}/{activity.current_participants}
                            </p>
                            <p className="text-xs text-gray-500">签到/报名</p>
                          </div>
                          <div className="text-center">
                            <p className={`text-lg font-bold ${
                              checkInRate >= 80 ? "text-green-600" :
                              checkInRate >= 60 ? "text-yellow-600" : "text-red-600"
                            }`}>
                              {checkInRate}%
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
                              <Button variant="ghost" size="sm">详情</Button>
                            </Link>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div
                            className={`h-full rounded-full ${
                              checkInRate >= 80 ? "bg-green-500" :
                              checkInRate >= 60 ? "bg-yellow-500" : "bg-red-500"
                            }`}
                            style={{ width: `${checkInRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                    {checkInsLoading && (
                      <tr><td colSpan={6} className="py-8 text-center text-gray-500">加载中...</td></tr>
                    )}
                    {checkIns.map((record: any) => (
                      <tr key={record.id} className="border-b border-gray-100">
                        <td className="py-3">
                          <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-xs font-medium text-primary-700">
                                {(record.user_name || "?").charAt(0)}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900">{record.user_name || "-"}</span>
                          </div>
                        </td>
                        <td className="py-3 text-gray-500">{record.student_id || "-"}</td>
                        <td className="py-3">
                          <Link href={`/activities/${record.activity_id}`} className="text-primary-600 hover:underline">
                            {record.activity_title || "-"}
                          </Link>
                        </td>
                        <td className="py-3 text-gray-500">
                          {record.check_in_time ? formatDateTime(record.check_in_time) : "-"}
                        </td>
                        <td className="py-3">
                          <Badge variant={record.check_in_method === "qrcode" ? "success" : "secondary"}>
                            {record.check_in_method === "qrcode" ? "二维码" : "手动"}
                          </Badge>
                        </td>
                        <td className="py-3 text-gray-500">{record.location || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!checkInsLoading && checkIns.length === 0 && (
                  <div className="py-12 text-center text-gray-500">
                    <CheckSquare className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-2">暂无签到记录</p>
                  </div>
                )}
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
            <label className="text-sm font-medium text-gray-700">用户ID（学号或UUID）</label>
            <Input
              placeholder="请输入用户ID"
              value={manualStudentId}
              onChange={(e) => setManualStudentId(e.target.value)}
            />
          </div>
          {checkInResult?.success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
              签到成功！
            </div>
          )}
          {checkInResult?.error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {checkInResult.error}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowManualCheckIn(false)}>取消</Button>
          <Button onClick={handleCheckInSubmit}>确认签到</Button>
        </DialogFooter>
      </Dialog>
    </AdminLayout>
  );
}

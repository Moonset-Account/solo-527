"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import {
  Search,
  Filter,
  Download,
  Users,
  Calendar,
  Check,
  X,
  Mail,
  Phone,
  User,
  BookOpen,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";

const mockRegistrations = [
  {
    id: "1",
    user_name: "张三",
    student_id: "2023001",
    department: "计算机学院",
    phone: "13800138001",
    activity_title: "春季团建活动",
    activity_id: "1",
    club: "篮球社",
    status: "registered",
    registered_at: "2026-06-11T10:00:00",
    seat_number: 1,
    has_reminder: true,
    reminder_sent: true,
    check_in_status: "not_checked",
  },
  {
    id: "2",
    user_name: "李四",
    student_id: "2023002",
    department: "经济学院",
    phone: "13800138002",
    activity_title: "春季团建活动",
    activity_id: "1",
    club: "篮球社",
    status: "registered",
    registered_at: "2026-06-11T10:05:00",
    seat_number: 2,
    has_reminder: true,
    reminder_sent: true,
    check_in_status: "not_checked",
  },
  {
    id: "3",
    user_name: "王五",
    student_id: "2023003",
    department: "管理学院",
    phone: "13800138003",
    activity_title: "编程技术分享会",
    activity_id: "2",
    club: "计算机协会",
    status: "waitlisted",
    registered_at: "2026-06-12T14:30:00",
    seat_number: null,
    has_reminder: true,
    reminder_sent: false,
    check_in_status: "not_checked",
  },
  {
    id: "4",
    user_name: "赵六",
    student_id: "2023004",
    department: "文学院",
    phone: "13800138004",
    activity_title: "校园歌手大赛",
    activity_id: "3",
    club: "音乐社",
    status: "registered",
    registered_at: "2026-06-08T09:00:00",
    seat_number: 15,
    has_reminder: true,
    reminder_sent: true,
    check_in_status: "not_checked",
  },
  {
    id: "5",
    user_name: "钱七",
    student_id: "2023005",
    department: "理学院",
    phone: "13800138005",
    activity_title: "读书分享会",
    activity_id: "4",
    club: "文学社",
    status: "checked_in",
    registered_at: "2026-06-05T11:00:00",
    seat_number: 8,
    has_reminder: true,
    reminder_sent: true,
    check_in_status: "checked",
    check_in_time: "2026-06-18T14:55:00",
    check_in_method: "qrcode",
  },
  {
    id: "6",
    user_name: "孙八",
    student_id: "2023006",
    department: "工学院",
    phone: "13800138006",
    activity_title: "读书分享会",
    activity_id: "4",
    club: "文学社",
    status: "registered",
    registered_at: "2026-06-06T10:00:00",
    seat_number: 9,
    has_reminder: false,
    reminder_sent: false,
    check_in_status: "not_checked",
  },
  {
    id: "7",
    user_name: "周九",
    student_id: "2023007",
    department: "法学院",
    phone: "13800138007",
    activity_title: "春季团建活动",
    activity_id: "1",
    club: "篮球社",
    status: "cancelled",
    registered_at: "2026-06-11T10:30:00",
    cancelled_at: "2026-06-15T09:00:00",
    seat_number: null,
    has_reminder: false,
    reminder_sent: false,
    check_in_status: "cancelled",
  },
  {
    id: "8",
    user_name: "吴十",
    student_id: "2023008",
    department: "外国语学院",
    phone: "13800138008",
    activity_title: "摄影作品展",
    activity_id: "5",
    club: "摄影协会",
    status: "checked_in",
    registered_at: "2026-06-01T10:00:00",
    seat_number: 45,
    has_reminder: true,
    reminder_sent: true,
    check_in_status: "checked",
    check_in_time: "2026-06-15T09:15:00",
    check_in_method: "manual",
  },
];

const tabs = [
  { key: "all", label: "全部" },
  { key: "registered", label: "已报名" },
  { key: "waitlisted", label: "候补" },
  { key: "checked_in", label: "已签到" },
  { key: "cancelled", label: "已取消" },
];

export default function RegistrationsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);

  const filteredRegistrations = mockRegistrations.filter((reg) => {
    const matchesTab = activeTab === "all" || reg.status === activeTab;
    const matchesSearch =
      reg.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.activity_title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleView = (reg: any) => {
    setSelectedRegistration(reg);
    setShowDetailDialog(true);
  };

  const stats = {
    total: mockRegistrations.length,
    registered: mockRegistrations.filter((r) => r.status === "registered").length,
    waitlisted: mockRegistrations.filter((r) => r.status === "waitlisted").length,
    checked_in: mockRegistrations.filter((r) => r.status === "checked_in").length,
    cancelled: mockRegistrations.filter((r) => r.status === "cancelled").length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">报名管理</h1>
            <p className="mt-1 text-gray-500">查看和管理所有活动报名记录</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              导出数据
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">总报名数</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-primary-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">已报名</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.registered}</p>
                </div>
                <Check className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">候补</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.waitlisted}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">已签到</p>
                  <p className="text-2xl font-bold text-green-600">{stats.checked_in}</p>
                </div>
                <Check className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">已取消</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.cancelled}</p>
                </div>
                <X className="h-8 w-8 text-gray-400" />
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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="搜索姓名、学号、活动..."
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-3 font-medium">用户信息</th>
                    <th className="pb-3 font-medium">活动名称</th>
                    <th className="pb-3 font-medium">社团</th>
                    <th className="pb-3 font-medium">报名时间</th>
                    <th className="pb-3 font-medium">座位号</th>
                    <th className="pb-3 font-medium">提醒状态</th>
                    <th className="pb-3 font-medium">状态</th>
                    <th className="pb-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.map((reg) => (
                    <tr key={reg.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary-700">
                              {reg.user_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{reg.user_name}</p>
                            <p className="text-xs text-gray-500">{reg.student_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <Link href={`/activities/${reg.activity_id}`} className="text-primary-600 hover:underline">
                          {reg.activity_title}
                        </Link>
                      </td>
                      <td className="py-3 text-gray-600">{reg.club}</td>
                      <td className="py-3 text-gray-500">
                        {formatDateTime(reg.registered_at)}
                      </td>
                      <td className="py-3">
                        {reg.seat_number ? (
                          <span className="font-medium text-gray-900">#{reg.seat_number}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3">
                        {reg.has_reminder ? (
                          <div className="flex items-center">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                reg.reminder_sent ? "bg-green-500" : "bg-gray-300"
                              }`}
                            />
                            <span className="ml-2 text-xs text-gray-500">
                              {reg.reminder_sent ? "已发送" : "待发送"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">未开启</span>
                        )}
                      </td>
                      <td className="py-3">
                        <Badge status={reg.status} />
                      </td>
                      <td className="py-3">
                        <Button variant="ghost" size="sm" onClick={() => handleView(reg)}>
                          查看
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRegistrations.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                <Users className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2">暂无报名记录</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
        title="报名详情"
      >
        {selectedRegistration && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-xl font-medium text-primary-700">
                  {selectedRegistration.user_name.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">{selectedRegistration.user_name}</h3>
                <p className="text-sm text-gray-500">{selectedRegistration.student_id}</p>
                <Badge status={selectedRegistration.status} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">学院：</span>
                <span className="font-medium">{selectedRegistration.department}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">电话：</span>
                <span className="font-medium">{selectedRegistration.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">报名时间：</span>
                <span className="font-medium">{formatDateTime(selectedRegistration.registered_at)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">座位号：</span>
                <span className="font-medium">
                  {selectedRegistration.seat_number || "无"}
                </span>
              </div>
            </div>

            <div className="rounded-md bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-700">
                活动：{selectedRegistration.activity_title}
              </p>
              <p className="text-sm text-gray-500">
                {selectedRegistration.club}
              </p>
            </div>

            {selectedRegistration.check_in_status === "checked" && (
              <div className="rounded-md bg-green-50 p-3">
                <p className="text-sm font-medium text-green-700">
                  已签到
                </p>
                <p className="text-sm text-green-600">
                  签到时间：{formatDateTime(selectedRegistration.check_in_time)}
                </p>
                <p className="text-sm text-green-600">
                  签到方式：{selectedRegistration.check_in_method === "qrcode" ? "二维码" : "手动"}
                </p>
              </div>
            )}

            {selectedRegistration.status === "cancelled" && (
              <div className="rounded-md bg-gray-50 p-3">
                <p className="text-sm font-medium text-gray-700">
                  已取消报名
                </p>
                <p className="text-sm text-gray-500">
                  取消时间：{formatDateTime(selectedRegistration.cancelled_at)}
                </p>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
            关闭
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              alert("已发送提醒");
              setShowDetailDialog(false);
            }}
          >
            <Mail className="mr-2 h-4 w-4" />
            发送提醒
          </Button>
        </DialogFooter>
      </Dialog>
    </AdminLayout>
  );
}

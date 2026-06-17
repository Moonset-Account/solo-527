"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  CheckSquare,
  Bell,
  TrendingUp,
  Activity,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useActivities } from "@/lib/hooks";
import Link from "next/link";

export default function DashboardPage() {
  const { data: activitiesData } = useActivities();
  const recentActivities = activitiesData.slice(0, 5);

  const [dashboardStats, setDashboardStats] = useState({
    totalActivities: 0,
    totalRegistrations: 0,
    checkInRate: "0%",
    pendingMessages: 0,
  });
  const [recentRegs, setRecentRegs] = useState<any[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<any[]>([]);
  const [pendingItems, setPendingItems] = useState({
    activities: 0,
    verifications: 0,
    repairs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      const supabase = createClient();

      const [
        actRes,
        regRes,
        checkInRes,
        msgRes,
        regListRes,
        upcomingRes,
        pendingActRes,
        pendingVerRes,
        pendingRepairRes,
      ] = await Promise.all([
        supabase.from("activities").select("id", { count: "exact", head: true }),
        supabase.from("registrations").select("id", { count: "exact", head: true }),
        supabase
          .from("registrations")
          .select("id", { count: "exact", head: true })
          .eq("status", "checked_in"),
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("is_read", false),
        supabase
          .from("registrations")
          .select("*, user_profiles(name, student_id), activities(title)")
          .order("registered_at", { ascending: false })
          .limit(5),
        supabase
          .from("activities")
          .select("id, title, start_time")
          .gte("start_time", new Date().toISOString())
          .order("start_time", { ascending: true })
          .limit(5),
        supabase
          .from("activities")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("identity_verifications")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("repair_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);

      const totalRegs = regRes.count || 0;
      const checkedIn = checkInRes.count || 0;
      const rate = totalRegs > 0 ? ((checkedIn / totalRegs) * 100).toFixed(1) : "0";

      setDashboardStats({
        totalActivities: actRes.count || 0,
        totalRegistrations: totalRegs,
        checkInRate: `${rate}%`,
        pendingMessages: msgRes.count || 0,
      });

      setRecentRegs(
        (regListRes.data || []).map((r: any) => ({
          id: r.id,
          userName: r.user_profiles?.name,
          studentId: r.user_profiles?.student_id,
          activity: r.activities?.title,
          time: formatDateTime(r.registered_at),
          status: r.status,
        }))
      );

      setUpcomingActivities(
        (upcomingRes.data || []).map((a: any) => ({
          id: a.id,
          title: a.title,
          time: formatDateTime(a.start_time),
          type: "activity",
        }))
      );

      setPendingItems({
        activities: pendingActRes.count || 0,
        verifications: pendingVerRes.count || 0,
        repairs: pendingRepairRes.count || 0,
      });

      setLoading(false);
    }

    fetchDashboardData();
  }, []);

  const stats = [
    {
      title: "总活动数",
      value: dashboardStats.totalActivities.toLocaleString(),
      change: "+12%",
      icon: Calendar,
      trend: "up",
    },
    {
      title: "总报名人数",
      value: dashboardStats.totalRegistrations.toLocaleString(),
      change: "+8%",
      icon: Users,
      trend: "up",
    },
    {
      title: "签到率",
      value: dashboardStats.checkInRate,
      change: "+3.2%",
      icon: CheckSquare,
      trend: "up",
    },
    {
      title: "待处理消息",
      value: dashboardStats.pendingMessages.toLocaleString(),
      change: "-5%",
      icon: Bell,
      trend: "down",
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <p className="text-gray-500">加载中...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
          <p className="mt-1 text-gray-500">欢迎回来，今天是 {formatDate(new Date())}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p
                      className={`mt-1 text-xs ${
                        stat.trend === "up" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      <TrendingUp className="mr-1 inline h-3 w-3" />
                      {stat.change} 较上月
                    </p>
                  </div>
                  <div className="rounded-lg bg-primary-100 p-3">
                    <stat.icon className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>最近活动</CardTitle>
                  <CardDescription>查看和管理所有活动</CardDescription>
                </div>
                <Link href="/activities">
                  <button className="text-sm text-primary-600 hover:underline">查看全部</button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="rounded-lg bg-primary-100 p-2">
                        <Activity className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-500">
                          {activity.club_name} · {activity.start_time ? formatDate(activity.start_time) : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.current_participants}/{activity.max_participants}
                        </p>
                        <p className="text-xs text-gray-500">报名人数</p>
                      </div>
                      <Badge status={activity.status} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">即将开始</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingActivities.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex items-center space-x-3 rounded-md p-2 hover:bg-gray-50"
                    >
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {reminder.title}
                        </p>
                        <p className="text-xs text-gray-500">{reminder.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">待处理事项</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 rounded-md p-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{pendingItems.activities} 个活动待审核</p>
                      <p className="text-xs text-gray-500">需要您的审批</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 rounded-md p-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{pendingItems.verifications} 个身份待审核</p>
                      <p className="text-xs text-gray-500">新提交的认证申请</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 rounded-md p-2">
                    <AlertTriangle className="h-4 w-4 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{pendingItems.repairs} 条报修待处理</p>
                      <p className="text-xs text-gray-500">宿舍维修请求</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>最新报名</CardTitle>
                <CardDescription>查看最近的报名记录</CardDescription>
              </div>
              <Link href="/registrations">
                <button className="text-sm text-primary-600 hover:underline">查看全部</button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-3 font-medium">姓名</th>
                    <th className="pb-3 font-medium">学号</th>
                    <th className="pb-3 font-medium">活动名称</th>
                    <th className="pb-3 font-medium">报名时间</th>
                    <th className="pb-3 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRegs.map((reg) => (
                    <tr key={reg.id} className="border-b border-gray-100">
                      <td className="py-3 font-medium text-gray-900">{reg.userName}</td>
                      <td className="py-3 text-gray-500">{reg.studentId}</td>
                      <td className="py-3 text-gray-700">{reg.activity}</td>
                      <td className="py-3 text-gray-500">{reg.time}</td>
                      <td className="py-3">
                        <Badge status={reg.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

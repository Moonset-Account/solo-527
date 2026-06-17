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
import { formatDate } from "@/lib/utils";
import Link from "next/link";

const stats = [
  {
    title: "总活动数",
    value: "128",
    change: "+12%",
    icon: Calendar,
    trend: "up",
  },
  {
    title: "总报名人数",
    value: "3,456",
    change: "+8%",
    icon: Users,
    trend: "up",
  },
  {
    title: "签到率",
    value: "89.5%",
    change: "+3.2%",
    icon: CheckSquare,
    trend: "up",
  },
  {
    title: "待处理消息",
    value: "23",
    change: "-5%",
    icon: Bell,
    trend: "down",
  },
];

const recentActivities = [
  {
    id: "1",
    title: "春季团建活动",
    club: "篮球社",
    date: "2026-06-20",
    status: "approved",
    participants: 45,
    maxParticipants: 50,
  },
  {
    id: "2",
    title: "编程技术分享会",
    club: "计算机协会",
    date: "2026-06-22",
    status: "pending",
    participants: 78,
    maxParticipants: 100,
  },
  {
    id: "3",
    title: "校园歌手大赛",
    club: "音乐社",
    date: "2026-06-25",
    status: "approved",
    participants: 120,
    maxParticipants: 150,
  },
  {
    id: "4",
    title: "读书分享会",
    club: "文学社",
    date: "2026-06-18",
    status: "ongoing",
    participants: 28,
    maxParticipants: 30,
  },
  {
    id: "5",
    title: "摄影作品展",
    club: "摄影协会",
    date: "2026-06-15",
    status: "completed",
    participants: 200,
    maxParticipants: 200,
  },
];

const recentRegistrations = [
  {
    id: "1",
    userName: "张三",
    studentId: "2023001",
    activity: "春季团建活动",
    time: "10分钟前",
    status: "registered",
  },
  {
    id: "2",
    userName: "李四",
    studentId: "2023002",
    activity: "编程技术分享会",
    time: "25分钟前",
    status: "registered",
  },
  {
    id: "3",
    userName: "王五",
    studentId: "2023003",
    activity: "校园歌手大赛",
    time: "1小时前",
    status: "waitlisted",
  },
  {
    id: "4",
    userName: "赵六",
    studentId: "2023004",
    activity: "读书分享会",
    time: "2小时前",
    status: "registered",
  },
];

const upcomingReminders = [
  {
    id: "1",
    title: "春季团建活动",
    time: "明天 14:00",
    type: "activity",
  },
  {
    id: "2",
    title: "编程技术分享会",
    time: "后天 19:00",
    type: "activity",
  },
  {
    id: "3",
    title: "宿舍报修 #1234",
    time: "今天 16:00",
    type: "repair",
  },
];

export default function DashboardPage() {
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
                          {activity.club} · {activity.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.participants}/{activity.maxParticipants}
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
                  {upcomingReminders.map((reminder) => (
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
                      <p className="text-sm font-medium text-gray-900">3 个活动待审核</p>
                      <p className="text-xs text-gray-500">需要您的审批</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 rounded-md p-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">5 个身份待审核</p>
                      <p className="text-xs text-gray-500">新提交的认证申请</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 rounded-md p-2">
                    <AlertTriangle className="h-4 w-4 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">8 条报修待处理</p>
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
                  {recentRegistrations.map((reg) => (
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

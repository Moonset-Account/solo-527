import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Wrench,
  MessageSquare,
  FileText,
  BarChart as BarChartIcon,
  LayoutDashboard,
} from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="flex">
      <Sidebar role="ADMIN" unreadNotifications={0} />
      <main className="flex-1 p-8 overflow-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">管理后台</h1>
          <p className="text-muted-foreground">
            项目总览、预算追踪、返修管理、客户反馈和报表中心
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5" />
                项目管理
              </CardTitle>
              <CardDescription>
                查看和管理所有项目，追踪项目进度
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/projects">
                <Button className="w-full">进入项目管理</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                预算追踪
              </CardTitle>
              <CardDescription>
                实时监控所有项目预算变更，追踪超支情况
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/budget">
                <Button className="w-full">进入预算追踪</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                返修管理
              </CardTitle>
              <CardDescription>
                管理返修任务，超时时自动提醒老板
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/repairs">
                <Button className="w-full">进入返修管理</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                客户反馈
              </CardTitle>
              <CardDescription>
                汇总客户反馈，及时处理并跟进
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/feedbacks">
                <Button className="w-full">进入反馈管理</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChartIcon className="h-5 w-5" />
                报表中心
              </CardTitle>
              <CardDescription>
                查看月度运营数据，支持导出 Excel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/reports">
                <Button className="w-full">进入报表中心</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                报价管理
              </CardTitle>
              <CardDescription>
                查看所有项目报价和增项记录
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/designer/quotes">
                <Button variant="outline" className="w-full">
                  查看报价列表
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">
              系统核心功能
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-blue-700 mb-2">预算变化追踪</h4>
              <p className="text-sm text-blue-600">
                每次报价确认、增项确认都会自动记录预算变更，生成完整的变更历史
              </p>
            </div>
              <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-blue-700 mb-2">版本追溯</h4>
              <p className="text-sm text-blue-600">
                材料清单、现场照片、合同附件都支持版本追溯，可查看原始记录和备注
              </p>
            </div>
              <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-blue-700 mb-2">超时提醒</h4>
              <p className="text-sm text-blue-600">
                返修任务超时时自动提醒装修公司老板，确保及时处理
              </p>
            </div>
              <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-blue-700 mb-2">报表导出</h4>
              <p className="text-sm text-blue-600">
                支持导出 Excel 报表，方便月底复盘和数据分析
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
    </div>
  );
}

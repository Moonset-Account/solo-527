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
  FileText,
  PlusCircle,
  LayoutDashboard,
  BarChart3,
} from "lucide-react";

export default function DesignerDashboardPage() {
  return (
    <div className="flex">
      <Sidebar role="DESIGNER" unreadNotifications={0} />
      <main className="flex-1 p-8 overflow-auto">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">设计师工作台</h1>
            <p className="text-muted-foreground">
              管理您负责的项目报价和增项
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  报价管理
                </CardTitle>
                <CardDescription>
                  创建和管理项目报价，确认后自动更新预算
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/designer/quotes">
                  <Button className="w-full">
                    查看报价列表
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlusCircle className="h-5 w-5" />
                  增项管理
                </CardTitle>
                <CardDescription>
                  处理项目增项，记录变更原因和金额
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/designer/addons">
                  <Button className="w-full">
                    查看增项列表
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  数据统计
                </CardTitle>
                <CardDescription>
                  查看您负责项目的预算和进度统计
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/budget">
                  <Button variant="outline" className="w-full">
                    查看预算追踪
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              快速操作指南
            </h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">1.</span>
                在「报价管理」中创建项目报价，提交客户确认后系统自动记录预算变更
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">2.</span>
                在「增项管理」中处理项目增项，记录原因并提交确认
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">3.</span>
                所有预算变更都会自动记录，支持完整的版本追溯
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">4.</span>
                返修任务超时时，系统会自动提醒老板，请及时处理
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

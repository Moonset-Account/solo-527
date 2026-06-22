import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Wrench,
  MessageSquare,
  BarChart3,
  Building2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">设计验收门户</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/designer">
              <Button variant="outline">设计师入口</Button>
            </Link>
            <Link href="/admin">
              <Button>管理后台</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            设计图纸客户验收平台
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            一站式装修项目管理系统，支持报价确认、增项管理、预算追踪、返修提醒和版本追溯
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>报价管理</CardTitle>
              <CardDescription>
                创建和确认项目报价，自动记录预算变更
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  多版本报价管理
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  在线确认流程
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  自动更新项目预算
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center mb-4">
                <PlusCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <CardTitle>增项管理</CardTitle>
              <CardDescription>
                管理项目增项，记录变更原因和金额
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                  增项原因记录
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                  审批流程追踪
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                  预算变更自动关联
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>预算追踪</CardTitle>
              <CardDescription>
                实时监控预算变化，生成变更记录
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  实时预算监控
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  变更历史追溯
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  超支预警提醒
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center mb-4">
                <Wrench className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>返修管理</CardTitle>
              <CardDescription>
                追踪返修任务，超时时自动提醒老板
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  返修任务追踪
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  超时自动提醒
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  照片凭证管理
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>客户反馈</CardTitle>
              <CardDescription>
                收集和处理客户反馈，提升服务质量
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                  多类别反馈管理
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                  满意度评分
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                  处理进度追踪
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                <LayoutDashboard className="h-6 w-6 text-indigo-600" />
              </div>
              <CardTitle>版本追溯</CardTitle>
              <CardDescription>
                完整记录所有变更，支持还原原始记录
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  完整版本历史
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  版本对比功能
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  操作人记录
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <h3 className="text-2xl font-bold mb-6 text-center">系统技术架构</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { name: "Next.js 14", desc: "App Router" },
              { name: "TypeScript", desc: "类型安全" },
              { name: "Prisma", desc: "ORM 框架" },
              { name: "PostgreSQL", desc: "关系数据库" },
              { name: "Redis", desc: "缓存层" },
            ].map((tech) => (
              <div
                key={tech.name}
                className="text-center p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="font-bold text-lg">{tech.name}</div>
                <div className="text-sm text-muted-foreground">{tech.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              多角色权限管理
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              数据可视化报表
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Excel 报表导出
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t bg-white">
        <div className="container mx-auto px-6 py-8 text-center text-sm text-muted-foreground">
          <p>设计图纸客户验收门户 © 2024</p>
          <p className="mt-2">
            技术栈: Next.js + TypeScript + Prisma + PostgreSQL + Redis
          </p>
        </div>
      </footer>
    </div>
  );
}

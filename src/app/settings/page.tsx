"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Settings,
  User,
  Users,
  Bell,
  Shield,
  Download,
  Database,
  Palette,
  Globe,
  Save,
  ChevronDown,
  Calendar,
} from "lucide-react";

const sections = [
  { key: "profile", label: "个人设置", icon: User },
  { key: "notifications", label: "通知设置", icon: Bell },
  { key: "permissions", label: "权限管理", icon: Shield },
  { key: "export", label: "数据导出", icon: Download },
  { key: "system", label: "系统设置", icon: Settings },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
          <p className="mt-1 text-gray-500">管理账号和系统偏好设置</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.key}
                        onClick={() => setActiveSection(section.key)}
                        className={`flex w-full items-center space-x-3 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                          activeSection === section.key
                            ? "bg-primary-100 text-primary-700"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{section.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            {activeSection === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle>个人设置</CardTitle>
                  <CardDescription>管理您的个人信息和账号</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-6">
                    <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-2xl font-medium text-primary-700">管</span>
                    </div>
                    <Button variant="outline" size="sm">
                      更换头像
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">姓名</label>
                      <Input defaultValue="管理员" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">邮箱</label>
                      <Input defaultValue="admin@club.com" type="email" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">手机号</label>
                      <Input defaultValue="13800138000" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">学号</label>
                      <Input defaultValue="2020001" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">所属部门</label>
                    <Input defaultValue="学生工作处" />
                  </div>

                  <div className="flex justify-end">
                    <Button>
                      <Save className="mr-2 h-4 w-4" />
                      保存更改
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>通知设置</CardTitle>
                  <CardDescription>管理您接收通知的方式和内容</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {[
                      { title: "活动审核通知", desc: "有新的活动需要审核时通知", default: true },
                      { title: "报名提醒", desc: "活动开始前发送提醒", default: true },
                      { title: "身份审核通知", desc: "有新的身份认证申请时通知", default: true },
                      { title: "报修通知", desc: "有新的报修单时通知", default: false },
                      { title: "系统通知", desc: "系统维护和重要公告", default: true },
                      { title: "消息提醒", desc: "收到新消息时的推送通知", default: true },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-gray-100 p-4"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-500">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            defaultChecked={item.default}
                            className="peer sr-only"
                          />
                          <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "permissions" && (
              <Card>
                <CardHeader>
                  <CardTitle>权限管理</CardTitle>
                  <CardDescription>查看和管理用户角色与权限</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {[
                      { role: "超级管理员", desc: "拥有系统所有权限", count: 2, color: "bg-red-100 text-red-700" },
                      { role: "部门负责人", desc: "管理本部门的活动和审核", count: 8, color: "bg-orange-100 text-orange-700" },
                      { role: "社团负责人", desc: "发布和管理本社团活动", count: 25, color: "bg-blue-100 text-blue-700" },
                      { role: "普通成员", desc: "报名活动和使用基本功能", count: 328, color: "bg-green-100 text-green-700" },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-gray-100 p-4"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`rounded-lg p-2 ${item.color}`}>
                            <Shield className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.role}</p>
                            <p className="text-sm text-gray-500">{item.desc}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{item.count} 人</p>
                          <button className="text-sm text-primary-600 hover:underline">
                            管理
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "export" && (
              <Card>
                <CardHeader>
                  <CardTitle>数据导出</CardTitle>
                  <CardDescription>导出各类数据记录为 Excel 或 CSV 格式</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {[
                      { title: "活动数据", desc: "导出所有活动记录和统计数据", icon: Calendar },
                      { title: "报名数据", desc: "导出活动报名和签到数据", icon: Users },
                      { title: "报修数据", desc: "导出所有报修工单记录", icon: Settings },
                      { title: "交易数据", desc: "导出二手物品交易记录", icon: Database },
                      { title: "用户数据", desc: "导出用户信息和认证状态", icon: User },
                      { title: "消息数据", desc: "导出消息发送和阅读记录", icon: Bell },
                    ].map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border border-gray-100 p-4"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="rounded-lg bg-primary-100 p-2">
                              <Icon className="h-5 w-5 text-primary-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{item.title}</p>
                              <p className="text-sm text-gray-500">{item.desc}</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <select className="h-9 rounded-md border border-gray-200 px-2 text-sm">
                              <option>Excel</option>
                              <option>CSV</option>
                              <option>PDF</option>
                            </select>
                            <Button variant="outline" size="sm">
                              <Download className="mr-2 h-4 w-4" />
                              导出
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-md bg-blue-50 p-4">
                    <div className="flex">
                      <Database className="h-5 w-5 text-blue-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">数据导出说明</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <ul className="list-disc space-y-1 pl-5">
                            <li>导出数据包含当前筛选条件下的所有记录</li>
                            <li>敏感信息（如密码）不会被导出</li>
                            <li>大量数据导出可能需要等待一段时间</li>
                            <li>导出记录会保留在系统中 30 天</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "system" && (
              <Card>
                <CardHeader>
                  <CardTitle>系统设置</CardTitle>
                  <CardDescription>管理系统全局配置和参数</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">系统名称</label>
                      <Input defaultValue="社团活动管理系统" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">默认语言</label>
                      <select className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm">
                        <option>简体中文</option>
                        <option>English</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">活动审核开关</label>
                      <select className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm">
                        <option>开启（所有活动需审核）</option>
                        <option>关闭（社团直接发布）</option>
                        <option>部分开启（仅大型活动需审核）</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">提醒提前时间</label>
                      <select className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm">
                        <option>活动前 1 天</option>
                        <option>活动前 2 天</option>
                        <option>活动前 1 小时</option>
                        <option>自定义</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">座位违约惩罚</label>
                    <select className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm">
                      <option>累计 3 次禁用报名 1 周</option>
                      <option>累计 5 次禁用报名 1 个月</option>
                      <option>不做惩罚</option>
                    </select>
                  </div>

                  <div className="flex justify-end">
                    <Button>
                      <Save className="mr-2 h-4 w-4" />
                      保存设置
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

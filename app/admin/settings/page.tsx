'use client';

import AppLayout from '@/components/AppLayout';
import { useStore } from '@/store/useStore';
import {
  Settings,
  Database,
  Shield,
  Mail,
  Bell,
  Info,
} from 'lucide-react';

export default function SettingsPage() {
  const currentUser = useStore((state) => state.currentUser);

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Settings className="w-7 h-7 text-primary-900" />
          系统设置
        </h1>
        <p className="text-gray-500">管理系统全局配置和参数</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-primary-900" />
            系统信息
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">系统名称</span>
              <span className="font-medium text-gray-900">周会事项状态看板</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">版本</span>
              <span className="font-medium text-gray-900">v1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">技术栈</span>
              <span className="font-medium text-gray-900">Next.js + Supabase</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">当前用户</span>
              <span className="font-medium text-gray-900">{currentUser?.name}</span>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-primary-900" />
            数据库配置
          </h3>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              当前使用模拟数据进行演示
            </p>
            <div className="text-xs text-gray-400 space-y-1">
              <p>• 数据库: PostgreSQL</p>
              <p>• 认证: Supabase Auth</p>
              <p>• 存储: Supabase Storage</p>
              <p>• 实时订阅: Supabase Realtime</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-900" />
            安全设置
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">行级安全 (RLS)</p>
                <p className="text-sm text-gray-500">数据库层面的数据隔离</p>
              </div>
              <div className="h-6 w-11 bg-success-500 rounded-full relative">
                <span className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">操作审计日志</p>
                <p className="text-sm text-gray-500">记录所有用户操作</p>
              </div>
              <div className="h-6 w-11 bg-success-500 rounded-full relative">
                <span className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full" />
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary-900" />
            邮件通知
          </h3>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              邮件通知配置将在接入真实 Supabase 项目后启用。
              支持发送催办提醒、逾期通知、评论提及等邮件。
            </p>
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary-900" />
            关于此项目
          </h3>
          <div className="p-4 bg-primary-50 rounded-lg">
            <h4 className="font-medium text-primary-900 mb-2">周会事项状态看板系统</h4>
            <p className="text-sm text-gray-600 mb-3">
              这是一个完整的周会事项管理系统，旨在帮助行政负责人跟踪周会待办事项的执行情况。
              系统支持事项认领、进度更新、附件上传、评论交流、催办提醒等功能。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-3 rounded-lg">
                <p className="font-medium text-gray-900 mb-1">核心功能</p>
                <ul className="text-gray-500 space-y-0.5">
                  <li>• 看板视图管理</li>
                  <li>• 事项认领分配</li>
                  <li>• 进度跟踪更新</li>
                  <li>• 附件版本管理</li>
                </ul>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="font-medium text-gray-900 mb-1">权限体系</p>
                <ul className="text-gray-500 space-y-0.5">
                  <li>• 系统管理员</li>
                  <li>• 部门主管</li>
                  <li>• 普通用户</li>
                  <li>• 行级数据隔离</li>
                </ul>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="font-medium text-gray-900 mb-1">统计分析</p>
                <ul className="text-gray-500 space-y-0.5">
                  <li>• 部门闭环率</li>
                  <li>• 延期事项追踪</li>
                  <li>• 操作审计日志</li>
                  <li>• 数据可视化</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

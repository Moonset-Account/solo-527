'use client'

import { AdminLayout } from '@/components/AdminLayout'
import { Settings, User, Bell, Palette, Shield, Database } from 'lucide-react'

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">系统设置</h1>
          <p className="text-gray-500 mt-1">配置系统参数和偏好</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: User, title: '个人设置', desc: '修改个人信息和密码' },
            { icon: Bell, title: '通知设置', desc: '配置短信、邮件提醒' },
            { icon: Palette, title: '界面设置', desc: '主题、语言、显示选项' },
            { icon: Shield, title: '权限管理', desc: '用户角色和权限配置' },
            { icon: Database, title: '数据管理', desc: '备份、导出、清理数据' },
            { icon: Settings, title: '系统参数', desc: '棚位、价格、超时规则' },
          ].map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className={`w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4`}>
                <item.icon size={24} className="text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}

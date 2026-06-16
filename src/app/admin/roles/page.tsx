'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Shield, Check, Lock, Users, BarChart3, Settings } from 'lucide-react';
import { roleLabel } from '@/lib/utils';

const roles = [
  {
    key: 'super_admin',
    color: 'bg-red-50 text-red-700 border-red-200',
    desc: '拥有系统全部权限，可管理所有用户和配置',
    permissions: [
      { name: '用户管理', enabled: true },
      { name: '角色权限', enabled: true },
      { name: '系统设置', enabled: true },
      { name: '查看全部线索', enabled: true },
      { name: '分配/回收线索', enabled: true },
      { name: '修改跟进阶段', enabled: true },
      { name: '成交预测看板', enabled: true },
      { name: '回访报表', enabled: true },
      { name: '数据导出', enabled: true },
    ],
  },
  {
    key: 'sales_manager',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    desc: '管理销售团队，分配线索，查看团队数据',
    permissions: [
      { name: '用户管理', enabled: false },
      { name: '角色权限', enabled: false },
      { name: '系统设置', enabled: true },
      { name: '查看全部线索', enabled: true },
      { name: '分配/回收线索', enabled: true },
      { name: '修改跟进阶段', enabled: true },
      { name: '成交预测看板', enabled: true },
      { name: '回访报表', enabled: true },
      { name: '数据导出', enabled: true },
    ],
  },
  {
    key: 'sales_consultant',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    desc: '跟进自己负责的线索，上传量房和合同信息',
    permissions: [
      { name: '用户管理', enabled: false },
      { name: '角色权限', enabled: false },
      { name: '系统设置', enabled: false },
      { name: '查看全部线索', enabled: false },
      { name: '分配/回收线索', enabled: false },
      { name: '修改跟进阶段', enabled: false },
      { name: '成交预测看板', enabled: false },
      { name: '回访报表', enabled: false },
      { name: '数据导出', enabled: false },
    ],
  },
  {
    key: 'analyst',
    color: 'bg-green-50 text-green-700 border-green-200',
    desc: '查看数据报表，导出分析数据',
    permissions: [
      { name: '用户管理', enabled: false },
      { name: '角色权限', enabled: false },
      { name: '系统设置', enabled: false },
      { name: '查看全部线索', enabled: true },
      { name: '分配/回收线索', enabled: false },
      { name: '修改跟进阶段', enabled: false },
      { name: '成交预测看板', enabled: true },
      { name: '回访报表', enabled: true },
      { name: '数据导出', enabled: true },
    ],
  },
];

export default function RolesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary-500" />
              角色权限管理
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">查看各角色的权限配置，权限配置由超级管理员统一维护</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-5">
              {roles.map((r) => (
                <div key={r.key} className="border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="p-4 bg-gray-50/80 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${r.color}`}>
                        <Shield className="h-3 w-3 mr-1" />
                        {roleLabel(r.key)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{r.desc}</p>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-3 gap-2">
                      {r.permissions.map((p) => (
                        <div
                          key={p.name}
                          className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs ${
                            p.enabled ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'
                          }`}
                        >
                          {p.enabled ? (
                            <Check className="h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <Lock className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span className="truncate">{p.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

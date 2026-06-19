'use client';

import {
  LayoutDashboard,
  Car,
  Package,
  ClipboardList,
  Factory,
  ShieldCheck,
  GitBranch,
  Activity,
  Settings,
  Check,
  Crown,
  Warehouse,
  SearchCheck,
  Users,
  PhoneCall,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/DataTable';
import { roleLabel, cn } from '@/lib/utils';
import type { UserRole } from '@/lib/types';

const PERMISSION_GROUPS = [
  { key: 'dashboard', label: '工作台', icon: LayoutDashboard },
  { key: 'vehicles', label: '车辆', icon: Car },
  { key: 'parts', label: '配件', icon: Package },
  { key: 'workorders', label: '工单', icon: ClipboardList },
  { key: 'production', label: '生产', icon: Factory },
  { key: 'quality', label: '质检', icon: ShieldCheck },
  { key: 'changes', label: '变更', icon: GitBranch },
  { key: 'monitor', label: '监控', icon: Activity },
  { key: 'system', label: '系统', icon: Settings },
] as const;

type PermissionGroup = (typeof PERMISSION_GROUPS)[number]['key'];

const ROLE_PERMISSIONS: Record<UserRole, PermissionGroup[]> = {
  store_manager: [
    'dashboard',
    'vehicles',
    'parts',
    'workorders',
    'production',
    'quality',
    'changes',
    'monitor',
    'system',
  ],
  warehouse: ['dashboard', 'parts'],
  inspector: ['dashboard', 'workorders', 'production', 'quality'],
  team_lead: ['dashboard', 'workorders', 'production'],
  reception: ['dashboard', 'vehicles', 'workorders'],
};

const ROLE_META: Record<
  UserRole,
  { icon: typeof Crown; gradient: string; description: string }
> = {
  store_manager: {
    icon: Crown,
    gradient: 'from-amber-400 to-orange-500',
    description: '拥有系统全部权限，负责门店整体运营管理。',
  },
  warehouse: {
    icon: Warehouse,
    gradient: 'from-emerald-400 to-teal-500',
    description: '负责配件库存管理、出入库操作及库存调拨。',
  },
  inspector: {
    icon: SearchCheck,
    gradient: 'from-purple-400 to-violet-500',
    description: '负责维修质量检验、记录质检结果及返工管理。',
  },
  team_lead: {
    icon: Users,
    gradient: 'from-brand-400 to-brand-600',
    description: '负责派工、生产进度跟踪及班组人员调度。',
  },
  reception: {
    icon: PhoneCall,
    gradient: 'from-sky-400 to-cyan-500',
    description: '负责客户接待、车辆登记、工单创建与客户沟通。',
  },
};

const ROLE_ORDER: UserRole[] = [
  'store_manager',
  'warehouse',
  'inspector',
  'team_lead',
  'reception',
];

export default function RolesPage() {
  return (
    <div>
      <PageHeader
        title="角色权限"
        description="查看系统各角色的功能权限分配（只读展示）。"
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 animate-fade-in-up">
        {ROLE_ORDER.map((role) => {
          const meta = ROLE_META[role];
          const Icon = meta.icon;
          const permissions = ROLE_PERMISSIONS[role];
          const isManager = role === 'store_manager';

          return (
            <div key={role} className="card overflow-hidden">
              <div
                className={cn(
                  'px-6 py-5 bg-gradient-to-r',
                  meta.gradient,
                  'text-white',
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold tracking-tight">
                        {roleLabel[role]}
                      </h3>
                      {isManager && (
                        <Badge className="bg-white/25 text-white backdrop-blur">
                          <Crown className="w-3 h-3 mr-0.5" />
                          超级权限
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-white/85 mt-0.5">{meta.description}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">功能权限</span>
                  <Badge className="bg-slate-100 text-slate-600">
                    {permissions.length} / {PERMISSION_GROUPS.length} 个模块
                  </Badge>
                </div>

                <div className="space-y-2.5">
                  {PERMISSION_GROUPS.map((group) => {
                    const GroupIcon = group.icon;
                    const allowed = permissions.includes(group.key);
                    return (
                      <div
                        key={group.key}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border transition',
                          allowed
                            ? 'border-emerald-200 bg-emerald-50/50'
                            : 'border-slate-200 bg-slate-50/50 opacity-70',
                        )}
                      >
                        <div
                          className={cn(
                            'w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0',
                            allowed
                              ? 'bg-emerald-100 text-emerald-600'
                              : 'bg-slate-100 text-slate-400',
                          )}
                        >
                          <GroupIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div
                            className={cn(
                              'text-sm font-medium',
                              allowed ? 'text-slate-800' : 'text-slate-500',
                            )}
                          >
                            {group.label}
                          </div>
                          <div className="text-xs text-slate-400">
                            {allowed ? '拥有访问权限' : '无访问权限'}
                          </div>
                        </div>
                        <div
                          className={cn(
                            'w-5 h-5 rounded flex items-center justify-center flex-shrink-0',
                            allowed
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-200 text-slate-400',
                          )}
                        >
                          {allowed ? (
                            <Check className="w-3.5 h-3.5" strokeWidth={3} />
                          ) : (
                            <div className="w-2 h-0.5 bg-slate-400 rounded-full" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

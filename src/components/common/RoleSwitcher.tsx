import React from 'react';
import { Users, UserCog, UserCheck } from 'lucide-react';
import { usePermissionStore } from '@/store/usePermissionStore';
import { UserRole } from '@/types';

export const RoleSwitcher: React.FC = () => {
  const { role, setRole } = usePermissionStore();

  const roles: { id: UserRole; name: string; icon: React.ReactNode; description: string }[] = [
    { id: 'public', name: '公众用户', icon: <Users size={14} />, description: '公开数据浏览' },
    { id: 'researcher', name: '研究团队', icon: <UserCheck size={14} />, description: '数据导出+详情' },
    { id: 'admin', name: '管理员', icon: <UserCog size={14} />, description: '全部权限' }
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500">当前角色:</span>
      <div className="flex items-center gap-1">
        {roles.map(r => (
          <button
            key={r.id}
            onClick={() => setRole(r.id)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
              role === r.id
                ? 'bg-blue-100 text-blue-700'
                : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'
            }`}
            title={r.description}
          >
            {r.icon}
            <span>{r.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

import { create } from 'zustand';
import { User, ContractStatus, ContractType, UrgencyLevel } from '../types';
import { authApi, notificationApi } from '../api';

interface AppState {
  token: string | null;
  user: User | null;
  unreadCount: number;
  mobileView: boolean;

  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  fetchUnread: () => Promise<void>;
  initFromStorage: () => void;
  checkPermission: (perm: string) => boolean;
}

export const useAppStore = create<AppState>((set, get) => ({
  token: null,
  user: null,
  unreadCount: 0,
  mobileView: typeof window !== 'undefined' ? window.innerWidth < 768 : false,

  login: async (username: string, password: string) => {
    const res = await authApi.login(username, password) as any;
    localStorage.setItem('legal_token', res.token);
    localStorage.setItem('legal_user', JSON.stringify(res.user));
    set({ token: res.token, user: res.user });
    get().fetchUnread();
  },

  logout: () => {
    localStorage.removeItem('legal_token');
    localStorage.removeItem('legal_user');
    set({ token: null, user: null, unreadCount: 0 });
    window.location.href = '/login';
  },

  setUser: (user) => set({ user }),

  fetchUnread: async () => {
    try {
      const res = await notificationApi.unreadCount() as any;
      set({ unreadCount: res.count || 0 });
    } catch {}
  },

  initFromStorage: () => {
    const token = localStorage.getItem('legal_token');
    const userStr = localStorage.getItem('legal_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ token, user });
        get().fetchUnread();
      } catch {}
    }
    const onResize = () => set({ mobileView: window.innerWidth < 768 });
    window.addEventListener('resize', onResize);
  },

  checkPermission: (perm: string) => {
    const { user } = get();
    if (!user) return false;
    if (user.roles.includes('super_admin')) return true;
    return user.permissions.includes(perm);
  },
}));

export const contractStatusMap: Record<ContractStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: '#d9d9d9' },
  pending: { label: '待提交', color: '#faad14' },
  approving: { label: '审批中', color: '#1677ff' },
  approved: { label: '已批准', color: '#52c41a' },
  rejected: { label: '已退回', color: '#ff4d4f' },
  signing: { label: '签署中', color: '#722ed1' },
  signed: { label: '已签署', color: '#13c2c2' },
  archived: { label: '已归档', color: '#8c8c8c' },
  cancelled: { label: '已取消', color: '#bfbfbf' },
};

export const contractTypeMap: Record<ContractType, string> = {
  purchase: '采购合同',
  sale: '销售合同',
  service: '服务合同',
  labor: '劳动合同',
  cooperation: '合作协议',
  confidential: '保密协议',
  other: '其他',
};

export const urgencyMap: Record<UrgencyLevel, { label: string; color: string }> = {
  normal: { label: '普通', color: '#52c41a' },
  urgent: { label: '紧急', color: '#fa8c16' },
  very_urgent: { label: '特急', color: '#ff4d4f' },
};

export const approvalStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待审批', color: '#1677ff' },
  approved: { label: '已通过', color: '#52c41a' },
  rejected: { label: '已拒绝', color: '#ff4d4f' },
  returned: { label: '已退回', color: '#fa8c16' },
  transferred: { label: '已转交', color: '#722ed1' },
  skipped: { label: '已跳过', color: '#8c8c8c' },
};

export const conflictStatusMap: Record<string, { label: string; color: string }> = {
  open: { label: '待处理', color: '#ff4d4f' },
  assigned: { label: '已指派', color: '#1677ff' },
  resolving: { label: '处理中', color: '#fa8c16' },
  resolved: { label: '已解决', color: '#52c41a' },
  escalated: { label: '已升级', color: '#722ed1' },
  closed: { label: '已关闭', color: '#8c8c8c' },
};

export const conflictSeverityMap: Record<string, { label: string; color: string }> = {
  low: { label: '低', color: '#52c41a' },
  medium: { label: '中', color: '#fa8c16' },
  high: { label: '高', color: '#fa541c' },
  critical: { label: '严重', color: '#ff4d4f' },
};

export const conflictTypeMap: Record<string, string> = {
  number_conflict: '编号冲突',
  file_lock: '文件锁定',
  amount_discrepancy: '金额差异',
  party_conflict: '签约方冲突',
  date_overlap: '日期重叠',
  deadlock: '审批死锁',
  permission_denied: '权限不足',
  other: '其他',
};

export const callbackStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待执行', color: '#faad14' },
  processing: { label: '执行中', color: '#1677ff' },
  success: { label: '成功', color: '#52c41a' },
  failed: { label: '失败', color: '#ff4d4f' },
  retrying: { label: '重试中', color: '#fa8c16' },
  cancelled: { label: '已取消', color: '#8c8c8c' },
  timeout: { label: '超时', color: '#ff4d4f' },
};

export const formatSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
};

export const formatDate = (d: string | Date | undefined, fmt = 'YYYY-MM-DD HH:mm'): string => {
  if (!d) return '-';
  const date = new Date(d);
  const pad = (n: number) => String(n).padStart(2, '0');
  const map: Record<string, string> = {
    YYYY: String(date.getFullYear()),
    MM: pad(date.getMonth() + 1),
    DD: pad(date.getDate()),
    HH: pad(date.getHours()),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
  };
  return fmt.replace(/YYYY|MM|DD|HH|mm|ss/g, (m) => map[m]);
};

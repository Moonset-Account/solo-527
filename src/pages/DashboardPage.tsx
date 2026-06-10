import { useState, useMemo } from 'react';
import {
  Calendar,
  Users,
  Wrench,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Car,
  Package,
  Star,
  Edit3,
  X,
  TrendingUp,
  TrendingDown,
  Settings,
  Sparkles,
  Eye,
  UserCheck,
  CalendarClock,
  FileText,
  Tag,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import Timeline from '@/components/ui/Timeline';
import { appointments, workstations, technicians, customers, vehicles, memberPackages } from '@/data/mockData';
import { Appointment, Workstation, WorkstationStatus, AppointmentStatus } from '@/types';
import { cn } from '@/lib/utils';

function getStatusBadgeType(status: string): 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'gray' {
  switch (status) {
    case AppointmentStatus.Completed:
      return 'success';
    case AppointmentStatus.InService:
      return 'warning';
    case AppointmentStatus.Confirmed:
      return 'info';
    case AppointmentStatus.Pending:
      return 'primary';
    case AppointmentStatus.Cancelled:
      return 'danger';
    case AppointmentStatus.NoShow:
      return 'gray';
    default:
      return 'gray';
  }
}

function getWorkstationStatusType(status: string | undefined): 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case WorkstationStatus.Available:
      return 'success';
    case WorkstationStatus.Occupied:
      return 'warning';
    case WorkstationStatus.Maintenance:
      return 'danger';
    default:
      return 'info';
  }
}

function getWorkstationStatusColor(status: string | undefined): string {
  switch (status) {
    case WorkstationStatus.Available:
      return 'bg-success';
    case WorkstationStatus.Occupied:
      return 'bg-accent-500';
    case WorkstationStatus.Maintenance:
      return 'bg-danger';
    default:
      return 'bg-gray-400';
  }
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  change: number;
  changeLabel: string;
  color: 'primary' | 'accent' | 'success' | 'info';
}

function StatCard({ title, value, icon, change, changeLabel, color }: StatCardProps) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    accent: 'bg-accent-50 text-accent-600',
    success: 'bg-green-50 text-green-600',
    info: 'bg-blue-50 text-blue-600',
  };

  const isPositive = change >= 0;

  return (
    <div className="bg-white rounded-xl shadow-card p-5 hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={cn('p-3 rounded-xl', colorClasses[color])}>
          {icon}
        </div>
      </div>
      <div className="flex items-center gap-1 mt-4">
        {isPositive ? (
          <TrendingUp className="w-4 h-4 text-green-500" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-500" />
        )}
        <span className={cn('text-sm font-medium', isPositive ? 'text-green-600' : 'text-red-600')}>
          {isPositive ? '+' : ''}{change}%
        </span>
        <span className="text-sm text-gray-400">{changeLabel}</span>
      </div>
    </div>
  );
}

interface WorkstationCardProps {
  workstation: Workstation;
  isExpanded: boolean;
  onToggle: () => void;
}

function WorkstationCard({ workstation, isExpanded, onToggle }: WorkstationCardProps) {
  const currentAppointment = appointments.find(
    (a) => a.workstationId === workstation.id && a.status === AppointmentStatus.InService
  );

  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-card overflow-hidden transition-all cursor-pointer border-l-4',
        workstation.status === WorkstationStatus.Available && 'border-l-success',
        workstation.status === WorkstationStatus.Occupied && 'border-l-accent-500',
        workstation.status === WorkstationStatus.Maintenance && 'border-l-danger'
      )}
      onClick={onToggle}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-3 h-3 rounded-full',
                getWorkstationStatusColor(workstation.status)
              )}
            />
            <div>
              <h3 className="font-semibold text-gray-900">{workstation.name}</h3>
              <p className="text-xs text-gray-500">{workstation.type}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge
              status={getWorkstationStatusType(workstation.status)}
              text={workstation.status || '未知'}
              dot
            />
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>

        {currentAppointment && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">
                {workstation.currentTechnician?.name || '未分配'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm mt-1">
              <Wrench className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">
                {currentAppointment.servicePackage?.name || '无服务'}
              </span>
            </div>
          </div>
        )}

        {!currentAppointment && workstation.status === WorkstationStatus.Available && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-400">当前空闲，可立即安排</p>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-100">
          <div className="text-xs space-y-1">
            <p className="text-gray-500">
              <span className="font-medium text-gray-700">设备：</span>
              {workstation.equipment || '暂无'}
            </p>
            <p className="text-gray-500">
              <span className="font-medium text-gray-700">说明：</span>
              {workstation.description || '暂无'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface AppointmentDetailPanelProps {
  appointment: Appointment | null;
  onClose: () => void;
}

function AppointmentDetailPanel({ appointment, onClose }: AppointmentDetailPanelProps) {
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  if (!appointment) {
    return (
      <div className="bg-white rounded-xl shadow-card p-8 h-full flex flex-col items-center justify-center text-gray-400">
        <Eye className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm">选择预约查看详情</p>
      </div>
    );
  }

  const memberPackage = appointment.customer?.memberPackage;
  const vehicle = appointment.vehicle;
  const customer = appointment.customer;

  const testDriveTimeline: {
    title: string;
    description: string;
    time: string;
    status: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'default';
  }[] = [
    {
      title: '预约确认',
      description: '预约已确认，等待到店',
      time: appointment.startTime ? `${appointment.startTime} 前` : '--',
      status: 'success',
    },
    {
      title: '到店接待',
      description: '客户到店，确认服务项目',
      time: appointment.arrivalTime ? new Date(appointment.arrivalTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '待到达',
      status: appointment.arrivalTime ? 'success' : 'default',
    },
    {
      title: '服务中',
      description: '技师正在进行服务',
      time: appointment.startServiceTime ? new Date(appointment.startServiceTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '待开始',
      status: appointment.startServiceTime ? 'warning' : 'default',
    },
    {
      title: '服务完成',
      description: '服务完成，等待交车',
      time: appointment.endServiceTime ? new Date(appointment.endServiceTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '待完成',
      status: appointment.endServiceTime ? 'success' : 'default',
    },
  ];

  const handleEditNote = (type: string, currentValue: string) => {
    setEditingNote(type);
    setNoteText(currentValue);
  };

  const handleSaveNote = () => {
    setEditingNote(null);
  };

  const getMemberLevelBadge = (level?: number) => {
    switch (level) {
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white';
      case 2:
        return 'bg-gradient-to-r from-yellow-300 to-amber-400 text-white';
      case 1:
        return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getMemberLevelName = (level?: number) => {
    switch (level) {
      case 3:
        return '钻石会员';
      case 2:
        return '金卡会员';
      case 1:
        return '银卡会员';
      default:
        return '普通客户';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-card h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-primary-500 to-primary-600">
        <div>
          <h3 className="font-semibold text-white">预约详情</h3>
          <p className="text-xs text-primary-100 mt-0.5">{appointment.appointmentNo}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-primary-500" />
            客户信息
          </h4>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{customer?.name || '未知客户'}</span>
              {memberPackage ? (
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', getMemberLevelBadge(memberPackage.memberLevel))}>
                  {getMemberLevelName(memberPackage.memberLevel)}
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
                  普通客户
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">{customer?.phone || '--'}</p>
          </div>
        </div>

        {memberPackage && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-accent-500" />
              会员套餐
            </h4>
            <div className="bg-gradient-to-br from-accent-50 to-orange-50 rounded-lg p-3 border border-accent-100">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800">{memberPackage.name}</span>
                <span className="text-xs text-accent-600 font-medium">
                  剩余 {memberPackage.totalTimes - 3} 次
                </span>
              </div>
              <div className="w-full bg-white rounded-full h-2 mb-2">
                <div
                  className="bg-gradient-to-r from-accent-400 to-accent-500 h-2 rounded-full"
                  style={{ width: `${((memberPackage.totalTimes - 3) / memberPackage.totalTimes) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                有效期至：{new Date(Date.now() + memberPackage.validityDays * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
            <Car className="w-4 h-4 text-primary-500" />
            车辆信息
          </h4>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-sm font-mono font-medium">
                {vehicle?.plateNumber || '--'}
              </span>
              <span className="text-sm text-gray-600">
                {vehicle?.brand} {vehicle?.model}
              </span>
            </div>
            <p className="text-xs text-gray-500">{vehicle?.color || '--'}</p>
            {vehicle?.tags && (
              <div className="flex gap-1 mt-2">
                {vehicle.tags.split(',').map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-0.5 bg-white text-gray-600 rounded-full border border-gray-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-primary-500" />
            服务项目
          </h4>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800">
                {appointment.servicePackage?.name || '--'}
              </span>
              <span className="text-accent-600 font-semibold">
                ¥{appointment.estimatedPrice}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              预计 {appointment.servicePackage?.durationMinutes || 0} 分钟
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-500" />
              备注信息
            </h4>
            {editingNote !== 'remarks' && (
              <button
                onClick={() => handleEditNote('remarks', appointment.remarks || '')}
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                编辑
              </button>
            )}
          </div>
          {editingNote === 'remarks' ? (
            <div className="space-y-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
                placeholder="输入备注信息..."
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setEditingNote(null)}
                  className="text-xs px-3 py-1 text-gray-500 hover:text-gray-700"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveNote}
                  className="text-xs px-3 py-1 bg-primary-500 text-white rounded hover:bg-primary-600"
                >
                  保存
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                {appointment.remarks || '暂无备注'}
              </p>
            </div>
          )}
        </div>

        {vehicle?.notes && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Tag className="w-4 h-4 text-accent-500" />
                车辆特殊说明
              </h4>
              {editingNote !== 'vehicleNotes' && (
                <button
                  onClick={() => handleEditNote('vehicleNotes', vehicle.notes || '')}
                  className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  编辑
                </button>
              )}
            </div>
            {editingNote === 'vehicleNotes' ? (
              <div className="space-y-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={2}
                  placeholder="输入车辆特殊说明..."
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setEditingNote(null)}
                    className="text-xs px-3 py-1 text-gray-500 hover:text-gray-700"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveNote}
                    className="text-xs px-3 py-1 bg-primary-500 text-white rounded hover:bg-primary-600"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-accent-50 rounded-lg p-3 border border-accent-100">
                <p className="text-sm text-gray-700">{vehicle.notes}</p>
              </div>
            )}
          </div>
        )}

        <div>
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
            <CalendarClock className="w-4 h-4 text-primary-500" />
            服务时间线
          </h4>
          <div className="bg-gray-50 rounded-lg p-3">
            <Timeline items={testDriveTimeline} />
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
        {appointment.status === AppointmentStatus.Confirmed && (
          <button className="flex-1 py-2 bg-accent-500 text-white rounded-lg text-sm font-medium hover:bg-accent-600 transition-colors flex items-center justify-center gap-2">
            <UserCheck className="w-4 h-4" />
            标记到店
          </button>
        )}
        {appointment.status === AppointmentStatus.InService && (
          <button className="flex-1 py-2 bg-success text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            完成服务
          </button>
        )}
        <button className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
          <Settings className="w-4 h-4" />
          安排技师
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [expandedWorkstation, setExpandedWorkstation] = useState<string | null>(null);

  const todayAppointments = useMemo(() => {
    const today = new Date();
    const todayStr = today.toDateString();
    return appointments.filter(
      (a) => new Date(a.appointmentDate).toDateString() === todayStr
    );
  }, []);

  const filteredAppointments = useMemo(() => {
    if (selectedFilter === 'all') return todayAppointments;
    return todayAppointments.filter((a) => a.status === selectedFilter);
  }, [todayAppointments, selectedFilter]);

  const selectedAppointment = useMemo(
    () => appointments.find((a) => a.id === selectedAppointmentId) || null,
    [selectedAppointmentId]
  );

  const stats = useMemo(() => {
    const today = todayAppointments;
    return {
      total: today.length,
      arrived: today.filter((a) => a.arrivalTime).length,
      inService: today.filter((a) => a.status === AppointmentStatus.InService).length,
      completed: today.filter((a) => a.status === AppointmentStatus.Completed).length,
    };
  }, [todayAppointments]);

  const filters = [
    { key: 'all', label: '全部', count: todayAppointments.length },
    { key: AppointmentStatus.Confirmed, label: '已确认', count: todayAppointments.filter(a => a.status === AppointmentStatus.Confirmed).length },
    { key: AppointmentStatus.InService, label: '服务中', count: todayAppointments.filter(a => a.status === AppointmentStatus.InService).length },
    { key: AppointmentStatus.Completed, label: '已完成', count: todayAppointments.filter(a => a.status === AppointmentStatus.Completed).length },
  ];

  const handleAppointmentClick = (id: string) => {
    setSelectedAppointmentId(id === selectedAppointmentId ? null : id);
  };

  return (
    <AdminLayout title="门店仪表盘" className="bg-gray-50">
      <div className="space-y-6 h-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="今日预约"
            value={stats.total}
            icon={<Calendar className="w-6 h-6" />}
            change={12.5}
            changeLabel="较昨日"
            color="primary"
          />
          <StatCard
            title="已到店"
            value={stats.arrived}
            icon={<Users className="w-6 h-6" />}
            change={8.3}
            changeLabel="较昨日"
            color="success"
          />
          <StatCard
            title="服务中"
            value={stats.inService}
            icon={<Wrench className="w-6 h-6" />}
            change={-2.1}
            changeLabel="较昨日"
            color="accent"
          />
          <StatCard
            title="已完成"
            value={stats.completed}
            icon={<CheckCircle className="w-6 h-6" />}
            change={15.2}
            changeLabel="较昨日"
            color="info"
          />
        </div>

        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary-500" />
              工位状态
            </h2>
            <span className="text-sm text-gray-500">
              共 {workstations.length} 个工位
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {workstations.map((ws) => (
              <WorkstationCard
                key={ws.id}
                workstation={ws}
                isExpanded={expandedWorkstation === ws.id}
                onToggle={() => setExpandedWorkstation(expandedWorkstation === ws.id ? null : ws.id)}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-card flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-500" />
                  今日预约
                </h2>
                <span className="text-sm text-gray-500">
                  共 {todayAppointments.length} 条
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {filters.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setSelectedFilter(filter.key)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                      selectedFilter === filter.key
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {filter.label}
                    <span className="ml-1.5 text-xs opacity-75">({filter.count})</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      时间
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      顾客
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      车牌
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      服务项目
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                        暂无预约数据
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((apt) => (
                      <tr
                        key={apt.id}
                        onClick={() => handleAppointmentClick(apt.id)}
                        className={cn(
                          'cursor-pointer transition-colors',
                          selectedAppointmentId === apt.id
                            ? 'bg-primary-50'
                            : 'hover:bg-gray-50'
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {apt.startTime}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary-600" />
                            </div>
                            <span className="text-sm text-gray-900">
                              {apt.customer?.name || '未知'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-mono">
                            {apt.vehicle?.plateNumber || '--'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">
                            {apt.servicePackage?.name || '--'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            status={getStatusBadgeType(apt.status as string)}
                            text={apt.status as string}
                            dot
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {apt.status === AppointmentStatus.Confirmed && (
                              <button className="p-1.5 text-accent-600 hover:bg-accent-50 rounded-lg transition-colors" title="标记到店">
                                <UserCheck className="w-4 h-4" />
                              </button>
                            )}
                            {apt.status === AppointmentStatus.Pending && (
                              <button className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="安排技师">
                                <Settings className="w-4 h-4" />
                              </button>
                            )}
                            <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="查看详情">
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-1 min-h-[500px]">
            <AppointmentDetailPanel
              appointment={selectedAppointment}
              onClose={() => setSelectedAppointmentId(null)}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

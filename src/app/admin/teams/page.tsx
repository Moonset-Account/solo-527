'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Search,
  MapPin,
  User,
  Phone,
  Clock,
  X
} from 'lucide-react';
import type { Team, TeamStatus } from '@/lib/types';

const mockTeams: Team[] = [
  {
    _id: '1',
    seasonId: 's1',
    name: '猛虎队',
    city: '北京',
    coach: '张三',
    contactName: '李四',
    contactPhone: '13800138001',
    status: 'PENDING',
    registeredAt: new Date('2024-01-10T10:00:00'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '2',
    seasonId: 's1',
    name: '飞鹰队',
    city: '上海',
    coach: '王五',
    contactName: '赵六',
    contactPhone: '13800138002',
    status: 'PENDING',
    registeredAt: new Date('2024-01-11T14:30:00'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '3',
    seasonId: 's1',
    name: '烈焰队',
    city: '广州',
    coach: '孙七',
    contactName: '周八',
    contactPhone: '13800138003',
    status: 'PENDING',
    registeredAt: new Date('2024-01-12T09:15:00'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '4',
    seasonId: 's1',
    name: '闪电队',
    city: '深圳',
    coach: '吴九',
    contactName: '郑十',
    contactPhone: '13800138004',
    status: 'APPROVED',
    registeredAt: new Date('2024-01-08T16:00:00'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockPlayers = [
  { _id: 'p1', name: '球员1', jerseyNumber: 1, position: 'PG' },
  { _id: 'p2', name: '球员2', jerseyNumber: 3, position: 'SG' },
  { _id: 'p3', name: '球员3', jerseyNumber: 5, position: 'SF' },
  { _id: 'p4', name: '球员4', jerseyNumber: 7, position: 'PF' },
  { _id: 'p5', name: '球员5', jerseyNumber: 11, position: 'C' },
];

const statusLabels: Record<TeamStatus, string> = {
  PENDING: '待审核',
  APPROVED: '已通过',
  REJECTED: '已拒绝',
};

const statusStyles: Record<TeamStatus, string> = {
  PENDING: 'bg-warning/10 text-warning',
  APPROVED: 'bg-success/10 text-success',
  REJECTED: 'bg-danger/10 text-danger',
};

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>(mockTeams);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      const data = await res.json();
      if (data.success && data.data) {
        setTeams(data.data);
      }
    } catch (error) {
      console.error('获取球队列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || team.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (teamId: string) => {
    setProcessingId(teamId);
    try {
      await fetch(`/api/teams/${teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      setTeams((prev) =>
        prev.map((t) => (t._id === teamId ? { ...t, status: 'APPROVED' } : t))
      );
      setSelectedTeam(null);
    } catch (error) {
      console.error('审核失败:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedTeam || !rejectReason.trim()) return;
    setProcessingId(selectedTeam._id);
    try {
      await fetch(`/api/teams/${selectedTeam._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', rejectReason }),
      });
      setTeams((prev) =>
        prev.map((t) =>
          t._id === selectedTeam._id
            ? { ...t, status: 'REJECTED', rejectReason }
            : t
        )
      );
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedTeam(null);
    } catch (error) {
      console.error('拒绝失败:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (team: Team) => {
    setSelectedTeam(team);
    setShowRejectModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-text-primary flex items-center gap-3">
          <Users className="w-8 h-8 text-secondary" />
          报名审核
        </h1>
        <p className="text-text-secondary mt-1">
          审核球队报名申请
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="搜索球队名称或城市..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer min-w-[140px]"
        >
          <option value="ALL">全部状态</option>
          <option value="PENDING">待审核</option>
          <option value="APPROVED">已通过</option>
          <option value="REJECTED">已拒绝</option>
        </select>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-surface rounded-xl border border-border p-5">
              <div className="skeleton h-6 w-24 mb-3 rounded" />
              <div className="space-y-2">
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-4 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredTeams.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team) => (
            <div
              key={team._id}
              className="bg-surface rounded-xl border border-border p-5 card-hover"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-text-primary text-lg">
                    {team.name}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-text-secondary mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {team.city}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[team.status]}`}>
                  {statusLabels[team.status]}
                </span>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center gap-2 text-text-secondary">
                  <User className="w-4 h-4" />
                  <span>教练: {team.coach}</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <User className="w-4 h-4" />
                  <span>联系人: {team.contactName}</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <Phone className="w-4 h-4" />
                  <span>{team.contactPhone}</span>
                </div>
                <div className="flex items-center gap-2 text-text-muted text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    报名时间: {new Date(team.registeredAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>

              {team.rejectReason && (
                <div className="mb-4 p-2 bg-danger/5 rounded-lg text-xs text-danger">
                  拒绝原因: {team.rejectReason}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedTeam(team)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 border border-border rounded-lg text-sm text-text-primary hover:bg-surface-hover transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  详情
                </button>
                {team.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleApprove(team._id)}
                      disabled={processingId === team._id}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-success hover:bg-success/90 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      通过
                    </button>
                    <button
                      onClick={() => openRejectModal(team)}
                      disabled={processingId === team._id}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-danger hover:bg-danger/90 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      拒绝
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <Users className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-30" />
          <h3 className="font-bold text-text-primary text-lg mb-2">暂无球队</h3>
          <p className="text-text-secondary">
            {searchTerm ? '没有找到匹配的球队' : '没有待审核的球队'}
          </p>
        </div>
      )}

      {selectedTeam && !showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-text-primary">球队详情</h2>
                <button
                  onClick={() => setSelectedTeam(null)}
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-gradient-primary p-5 rounded-lg text-white mb-6">
                <h3 className="text-xl font-bold">{selectedTeam.name}</h3>
                <p className="text-white/80 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-4 h-4" />
                  {selectedTeam.city}
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-text-muted mb-1">主教练</p>
                    <p className="text-sm text-text-primary font-medium">{selectedTeam.coach}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">状态</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[selectedTeam.status]}`}>
                      {statusLabels[selectedTeam.status]}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">联系人</p>
                    <p className="text-sm text-text-primary font-medium">{selectedTeam.contactName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">联系电话</p>
                    <p className="text-sm text-text-primary font-medium">{selectedTeam.contactPhone}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-text-muted mb-2">球员名单</p>
                  <div className="border border-border rounded-lg divide-y divide-border">
                    {mockPlayers.map((player) => (
                      <div key={player._id} className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                            {player.jerseyNumber}
                          </span>
                          <span className="text-sm text-text-primary">{player.name}</span>
                        </div>
                        <span className="text-xs text-text-muted">{player.position}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {selectedTeam.status === 'PENDING' && (
              <div className="p-6 border-t border-border flex gap-3">
                <button
                  onClick={() => handleApprove(selectedTeam._id)}
                  disabled={processingId === selectedTeam._id}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-success hover:bg-success/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  通过审核
                </button>
                <button
                  onClick={() => openRejectModal(selectedTeam)}
                  disabled={processingId === selectedTeam._id}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-danger hover:bg-danger/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  拒绝
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showRejectModal && selectedTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-text-primary">拒绝报名</h2>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm text-text-secondary mb-4">
                确定要拒绝 <span className="font-medium text-text-primary">{selectedTeam.name}</span> 的报名吗？请填写拒绝原因：
              </p>
              <textarea
                rows={4}
                placeholder="请输入拒绝原因..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 resize-none"
              />
            </div>

            <div className="p-6 border-t border-border flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || processingId === selectedTeam._id}
                className="flex-1 py-2.5 bg-danger hover:bg-danger/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

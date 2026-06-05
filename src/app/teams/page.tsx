'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  User, 
  MapPin, 
  Phone, 
  Shield,
  Search,
  Filter
} from 'lucide-react';

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      const data = await res.json();
      if (data.success) {
        setTeams(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || team.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      APPROVED: 'bg-success/10 text-success',
      PENDING: 'bg-warning/10 text-warning',
      REJECTED: 'bg-danger/10 text-danger',
    };
    const labels: Record<string, string> = {
      APPROVED: '已通过',
      PENDING: '审核中',
      REJECTED: '已拒绝',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-text-primary flex items-center gap-3">
            <Users className="w-8 h-8 text-secondary" />
            球队
          </h1>
          <p className="text-text-secondary mt-1">
            共 {teams.length} 支球队参赛
          </p>
        </div>
        <Link
          href="/teams/register"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
        >
          <Shield className="w-4 h-4" />
          球队报名
        </Link>
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
        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="ALL">全部状态</option>
            <option value="APPROVED">已通过</option>
            <option value="PENDING">审核中</option>
            <option value="REJECTED">已拒绝</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-surface p-6 rounded-xl border border-border">
              <div className="skeleton h-16 w-16 rounded-full mx-auto mb-4" />
              <div className="skeleton h-5 w-24 mx-auto mb-2 rounded" />
              <div className="skeleton h-4 w-20 mx-auto mb-4 rounded" />
              <div className="space-y-2">
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-3/4 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredTeams.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTeams.map((team, index) => (
            <div
              key={team._id}
              className="bg-surface rounded-xl border border-border card-hover overflow-hidden group"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="bg-gradient-primary p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mx-auto flex items-center justify-center text-white text-2xl font-bold mb-3 group-hover:scale-110 transition-transform">
                  {team.name?.charAt(0) || '?'}
                </div>
                <h3 className="font-bold text-white text-lg">{team.name || '未命名球队'}</h3>
                <div className="flex items-center justify-center gap-1 text-white/70 text-sm mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {team.city || '未知城市'}
                </div>
              </div>
              
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  {getStatusBadge(team.status)}
                  <span className="text-xs text-text-muted">
                    {new Date(team.registeredAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <User className="w-4 h-4" />
                    <span>教练: {team.coach || '待定'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Users className="w-4 h-4" />
                    <span>联系人: {team.contactName || '待定'}</span>
                  </div>
                </div>

                <button className="w-full mt-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors">
                  查看详情 →
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface p-16 rounded-xl border border-border text-center">
          <Users className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-30" />
          <h3 className="font-bold text-text-primary text-lg mb-2">暂无球队</h3>
          <p className="text-text-secondary mb-4">
            {searchTerm ? '没有找到匹配的球队' : '快来成为第一支报名的球队吧！'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-primary hover:text-primary-dark text-sm font-medium"
            >
              清除搜索
            </button>
          )}
        </div>
      )}
    </div>
  );
}

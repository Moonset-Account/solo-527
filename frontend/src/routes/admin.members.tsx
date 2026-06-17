import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import {
  Users,
  Search,
  Filter,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Award,
} from 'lucide-react';
import type { Member, MemberLevel, PaginatedResponse } from '@shared/types';
import { formatDate, formatNumber } from '@/utils';

export const Route = createFileRoute('/admin/members')({
  component: AdminMembersPage,
});

function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [levels, setLevels] = useState<MemberLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const [keyword, setKeyword] = useState('');
  const [level, setLevel] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [pointModal, setPointModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [pointAdjust, setPointAdjust] = useState({ points: 0, reason: '' });

  useEffect(() => {
    fetchLevels();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMembers();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, keyword, level]);

  const fetchLevels = async () => {
    try {
      const data = await api.get<MemberLevel[]>('/member-levels');
      setLevels(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await api.get<PaginatedResponse<Member> & { filters: any }>('/admin/members', {
        page,
        pageSize,
        keyword: keyword || undefined,
        level: level || undefined,
      });
      setMembers(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openPointModal = (member: Member) => {
    setSelectedMember(member);
    setPointAdjust({ points: 0, reason: '' });
    setPointModal(true);
  };

  const handleAdjustPoints = async () => {
    if (!selectedMember || pointAdjust.points === 0 || !pointAdjust.reason) {
      alert('请填写积分变动数和原因');
      return;
    }

    try {
      await api.post(`/admin/members/${selectedMember.id}/points`, {
        points: pointAdjust.points,
        reason: pointAdjust.reason,
      });
      alert('积分调整成功！');
      setPointModal(false);
      fetchMembers();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">会员管理</h1>
          <p className="text-gray-500 mt-1">共 {total} 位会员</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
              placeholder="搜索昵称、手机号..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
              showFilters ? 'border-brand-400 bg-brand-50 text-brand-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <Filter className="w-4 h-4" />
            筛选
          </button>

          <select
            value={level}
            onChange={(e) => { setLevel(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <option value="">全部等级</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">会员</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">等级</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">积分</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">成长值</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">注册时间</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="inline-block w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">暂无会员数据</p>
                  </td>
                </tr>
              ) : (
                members.map((member, index) => (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors animate-fadeInUp" style={{ animationDelay: `${index * 0.03}s` }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                          <Users className="w-5 h-5 text-brand-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{member.nickname || '未设置'}</p>
                          <p className="text-sm text-gray-500">{member.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                        <Award className="w-3.5 h-3.5" />
                        {member.level?.name || '普通会员'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-brand-600">{formatNumber(member.points)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600">{formatNumber(member.growthValue)}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {formatDate(member.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openPointModal(member)}
                        className="text-brand-600 text-sm font-medium hover:text-brand-700"
                      >
                        调整积分
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              显示 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} 条，共 {total} 条
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-200 rounded-lg hover:border-brand-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-2 text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-gray-200 rounded-lg hover:border-brand-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {pointModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 animate-fadeInUp">
            <h3 className="text-lg font-bold text-gray-800 mb-4">调整积分</h3>

            <div className="mb-4 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">会员</p>
              <p className="font-medium">{selectedMember.nickname || selectedMember.phone}</p>
              <p className="text-sm text-brand-600 mt-1">
                当前积分：{formatNumber(selectedMember.points)}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">积分变动</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPointAdjust({ ...pointAdjust, points: -Math.abs(pointAdjust.points || 100) })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pointAdjust.points < 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Minus className="w-4 h-4 inline mr-1" />
                    扣减
                  </button>
                  <button
                    onClick={() => setPointAdjust({ ...pointAdjust, points: Math.abs(pointAdjust.points || 100) })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pointAdjust.points > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Plus className="w-4 h-4 inline mr-1" />
                    增加
                  </button>
                </div>
                <input
                  type="number"
                  value={pointAdjust.points}
                  onChange={(e) => setPointAdjust({ ...pointAdjust, points: Number(e.target.value) })}
                  className="w-full mt-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">调整原因</label>
                <textarea
                  value={pointAdjust.reason}
                  onChange={(e) => setPointAdjust({ ...pointAdjust, reason: e.target.value })}
                  placeholder="请输入调整原因"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setPointModal(false)}
                className="flex-1 py-2.5 text-gray-600 hover:text-gray-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAdjustPoints}
                className="flex-1 py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-colors"
              >
                确认调整
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

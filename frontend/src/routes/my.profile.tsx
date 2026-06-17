import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { useAuthStore } from "@/stores/authStore";
import { User, Phone, Award, TrendingUp, Clock } from 'lucide-react';
import type { MemberLevel, PointTransaction, PaginatedResponse } from '@shared/types';
import { formatDate, formatNumber } from '@/utils';

export const Route = createFileRoute('/my/profile')({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuthStore();
  const [levels, setLevels] = useState<MemberLevel[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const member = user as any;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!member?.id) return;
    setLoading(true);
    try {
      const [levelsData, pointsData] = await Promise.all([
        api.get<MemberLevel[]>('/member-levels'),
        api.get<PaginatedResponse<PointTransaction>>(`/members/${member.id}/points`, {
          pageSize: 10,
        }),
      ]);
      setLevels(levelsData || []);
      setTransactions(pointsData.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const currentLevel = levels.find((l) => l.id === member?.levelId);
  const nextLevel = levels.find((l) => l.minGrowth > (member?.growthValue || 0));
  const progress = currentLevel && nextLevel
    ? ((member?.growthValue - currentLevel.minGrowth) / (nextLevel.minGrowth - currentLevel.minGrowth)) * 100
    : 100;

  return (
    <div className="animate-fadeIn">
      <h2 className="text-xl font-bold text-gray-800 mb-6">个人中心</h2>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-brand-500" />
            基本信息
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="text-sm text-gray-500 mb-1">昵称</div>
              <div className="font-medium text-gray-800">{member?.nickname || '未设置'}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                手机号
              </div>
              <div className="font-medium text-gray-800">{member?.phone}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-500" />
            会员等级
          </h3>

          <div className="p-5 bg-gradient-to-r from-brand-50 to-pink-50 rounded-xl mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-brand-600 font-bold text-lg">{currentLevel?.name || '普通会员'}</span>
                {nextLevel && (
                  <span className="text-gray-400 text-sm ml-2">→ {nextLevel.name}</span>
                )}
              </div>
              <span className="text-sm text-gray-600">
                成长值 {formatNumber(member?.growthValue || 0)}
              </span>
            </div>
            <div className="h-2 bg-white rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
            {nextLevel && (
              <p className="text-xs text-gray-500 mt-2">
                距离下一等级还需 {formatNumber(nextLevel.minGrowth - (member?.growthValue || 0))} 成长值
              </p>
            )}
          </div>

          <div className="text-sm text-gray-600">
            <div className="font-medium text-gray-700 mb-2">当前等级权益：</div>
            <p>{currentLevel?.benefits || '基础会员权益'}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-500" />
            积分明细
          </h3>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10">
              <Clock className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">暂无积分变动记录</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx, index) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors animate-fadeInUp"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div>
                    <div className="text-sm font-medium text-gray-800">{tx.reason}</div>
                    <div className="text-xs text-gray-400">{formatDate(tx.createdAt)}</div>
                  </div>
                  <div className={`font-semibold ${tx.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.points > 0 ? '+' : ''}{tx.points}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { Package, Clock, Calendar } from 'lucide-react';
import { usePackageStore } from '@/stores/packageStore';
import { useAuthStore } from '@/stores/authStore';
import StatusBadge from '@/components/StatusBadge';

export default function MyPackages() {
  const { user } = useAuthStore();
  const { memberPackages, loading, fetchMemberPackages } = usePackageStore();

  useEffect(() => {
    if (user?.member_id) {
      fetchMemberPackages(user.member_id);
    }
  }, [user?.member_id, fetchMemberPackages]);

  const activePackages = memberPackages.filter((mp) => mp.status === 'active' || mp.status === 'frozen');
  const expiredPackages = memberPackages.filter((mp) => mp.status === 'expired' || mp.status === 'exhausted');

  if (loading && memberPackages.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">我的套餐</h2>
      </div>

      {activePackages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-600 flex items-center gap-2">
            <Package className="w-4 h-4 text-success" />有效套餐
          </h3>
          {activePackages.map((mp) => (
            <div key={mp.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-800">套餐 #{mp.id}</h4>
                    <StatusBadge status={mp.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>有效期: {mp.start_date?.slice(0, 10)} ~ {mp.expiry_date?.slice(0, 10)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>剩余: {mp.remaining_sessions}/{mp.total_sessions} 次</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-500">使用进度</span>
                      <span className="text-gray-700 font-medium">
                        {mp.total_sessions - mp.remaining_sessions}/{mp.total_sessions}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-accent h-2 rounded-full transition-all"
                        style={{ width: `${((mp.total_sessions - mp.remaining_sessions) / mp.total_sessions) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {expiredPackages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-600 flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-400" />历史套餐
          </h3>
          {expiredPackages.map((mp) => (
            <div key={mp.id} className="card p-5 opacity-60">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="text-lg font-semibold text-gray-800">套餐 #{mp.id}</h4>
                <StatusBadge status={mp.status} />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>有效期: {mp.start_date?.slice(0, 10)} ~ {mp.expiry_date?.slice(0, 10)}</div>
                <div>总课时: {mp.total_sessions} 次</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {memberPackages.length === 0 && !loading && (
        <div className="card text-center py-12">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">暂无套餐记录</p>
        </div>
      )}
    </div>
  );
}

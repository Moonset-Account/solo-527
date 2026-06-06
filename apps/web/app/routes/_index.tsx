import { useEffect, useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { useAuth } from '~/contexts/AuthContext';
import { api } from '~/lib/api';
import Layout from '~/components/Layout';

export default function Dashboard() {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>({
    materials: 0,
    activities: 0,
    borrows: 0,
    compensations: 0,
  });
  const [recentBorrows, setRecentBorrows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      if (!token) return;
      
      try {
        const [materials, activities, borrows, compensations] = await Promise.all([
          api.materials.list(token),
          api.activities.list(token),
          api.borrows.list(token),
          api.compensations.list(token, 'pending'),
        ]);
        
        setStats({
          materials: Array.isArray(materials) ? materials.length : 0,
          activities: Array.isArray(activities) ? activities.length : 0,
          borrows: Array.isArray(borrows) ? borrows.length : 0,
          compensations: Array.isArray(compensations) ? compensations.length : 0,
        });
        
        setRecentBorrows(Array.isArray(borrows) ? borrows.slice(0, 5) : []);
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-gray-100 text-gray-600',
  };

  const statusText: Record<string, string> = {
    pending: '待审核',
    approved: '已批准',
    rejected: '已拒绝',
    completed: '已完成',
    cancelled: '已取消',
  };

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">仪表盘</h1>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="text-3xl font-bold text-primary-600">{stats.materials}</div>
                <div className="text-gray-500 mt-1">物资总数</div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="text-3xl font-bold text-green-600">{stats.activities}</div>
                <div className="text-gray-500 mt-1">活动总数</div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="text-3xl font-bold text-blue-600">{stats.borrows}</div>
                <div className="text-gray-500 mt-1">借用申请</div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="text-3xl font-bold text-orange-600">{stats.compensations}</div>
                <div className="text-gray-500 mt-1">待处理赔付</div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">最近借用申请</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">活动名称</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请人</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">借用日期</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentBorrows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          暂无借用申请
                        </td>
                      </tr>
                    ) : (
                      recentBorrows.map((borrow: any) => (
                        <tr key={borrow.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {borrow.activity_title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {borrow.applicant_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {borrow.expected_borrow_date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${statusColors[borrow.status]}`}>
                              {statusText[borrow.status]}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

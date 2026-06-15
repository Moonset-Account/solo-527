import { createLazyFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';

export const Route = createLazyFileRoute('/records')({
  component: RecordsIndex,
});

interface PetRecord {
  id: string;
  name: string;
  species: string;
  breed: string;
  riskLevel: string;
  latestRevisitPlan: {
    id: string;
    plan_date: string;
    plan_type: string;
    status: string;
  } | null;
  latestWashPhoto: {
    id: string;
    url: string;
    thumbnail: string;
    created_at: string;
  } | null;
  vaccineAllergies: Array<{
    id: string;
    type: string;
    name: string;
    reaction: string;
  }>;
}

function RecordsIndex() {
  const [records, setRecords] = useState<PetRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const { data } = await apiClient.get('/records/overview');
      setRecords(data);
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (level: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${colors[level] || colors.normal}`}>
        {level}
      </span>
    );
  };

  const getRevisitStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${colors[status] || colors.pending}`}>
        {status === 'pending' ? '待回访' : status === 'completed' ? '已完成' : '已取消'}
      </span>
    );
  };

  if (loading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">寄养记录管理</h1>
        <div className="flex gap-2">
          <span className="text-sm text-gray-500">共 {records.length} 条记录</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">宠物信息</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">风险等级</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">回访计划</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">疫苗/过敏</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">洗护照片</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-800">{record.name}</div>
                    <div className="text-sm text-gray-500">
                      {record.species} / {record.breed || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-4">{getRiskBadge(record.riskLevel)}</td>
                  <td className="px-4 py-4">
                    {record.latestRevisitPlan ? (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{record.latestRevisitPlan.plan_type}</span>
                          {getRevisitStatusBadge(record.latestRevisitPlan.status)}
                        </div>
                        <div className="text-xs text-gray-500">
                          计划日期: {new Date(record.latestRevisitPlan.plan_date).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">暂无回访计划</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {record.vaccineAllergies?.length > 0 ? (
                      <div className="space-y-1">
                        {record.vaccineAllergies.slice(0, 2).map((va) => (
                          <div key={va.id} className="flex items-center gap-1 text-xs">
                            <span
                              className={`px-1.5 py-0.5 rounded ${
                                va.type === 'vaccine'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {va.type === 'vaccine' ? '疫苗' : '过敏'}
                            </span>
                            <span className="text-gray-600">{va.name}</span>
                          </div>
                        ))}
                        {record.vaccineAllergies.length > 2 && (
                          <span className="text-xs text-gray-400">
                            +{record.vaccineAllergies.length - 2} 更多
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">无记录</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {record.latestWashPhoto ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={record.latestWashPhoto.thumbnail || record.latestWashPhoto.url}
                          alt="洗护照片"
                          className="w-12 h-12 rounded object-cover"
                        />
                        <div>
                          <div className="text-xs text-gray-500">
                            {new Date(record.latestWashPhoto.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">暂无照片</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">查看</button>
                      <button className="text-green-600 hover:text-green-800 text-sm">记录</button>
                    </div>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

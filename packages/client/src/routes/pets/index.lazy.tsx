import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';

export const Route = createLazyFileRoute('/pets/')({
  component: PetsIndex,
});

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  gender: string;
  riskLevel: string;
  status: string;
  ownerName: string;
  createdAt: string;
}

function PetsIndex() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [riskLevel, setRiskLevel] = useState('');

  useEffect(() => {
    loadPets();
  }, [search, status, riskLevel]);

  const loadPets = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (riskLevel) params.append('riskLevel', riskLevel);

      const { data } = await apiClient.get(`/pets?${params.toString()}`);
      setPets(data.items);
    } catch (error) {
      console.error('Failed to load pets:', error);
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

  if (loading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">宠物列表</h1>
        <Link
          to="/pets/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 新增宠物
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="搜索宠物名称/主人"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部状态</option>
            <option value="active">寄养中</option>
            <option value="inactive">已离店</option>
            <option value="adopted">已领养</option>
          </select>
          <select
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部风险等级</option>
            <option value="low">低风险</option>
            <option value="normal">正常</option>
            <option value="high">高风险</option>
            <option value="critical">紧急</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">宠物名称</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">物种/品种</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">主人</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">风险等级</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">创建时间</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {pets.map((pet) => (
              <tr key={pet.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{pet.name}</td>
                <td className="px-4 py-3 text-gray-600">
                  {pet.species} / {pet.breed || '-'}
                </td>
                <td className="px-4 py-3 text-gray-600">{pet.ownerName || '-'}</td>
                <td className="px-4 py-3">{getRiskBadge(pet.riskLevel)}</td>
                <td className="px-4 py-3 text-gray-600">{pet.status}</td>
                <td className="px-4 py-3 text-gray-500 text-sm">
                  {new Date(pet.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <Link
                    to="/pets/$id"
                    params={{ id: pet.id }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    查看
                  </Link>
                </td>
              </tr>
            ))}
            {pets.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

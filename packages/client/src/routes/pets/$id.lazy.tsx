import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';

export const Route = createLazyFileRoute('/pets/$id')({
  component: PetDetail,
});

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  gender: string;
  birthDate: string;
  weight: number;
  ownerName: string;
  ownerPhone: string;
  vaccineRecord: string;
  allergies: string;
  specialNeeds: string;
  riskReason: string;
  riskLevel: string;
  status: string;
  vaccineAllergies: Array<any>;
  createdAt: string;
}

function PetDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    loadPet();
  }, [id]);

  const loadPet = async () => {
    try {
      const { data } = await apiClient.get(`/pets/${id}`);
      setPet(data);
    } catch (error) {
      console.error('Failed to load pet:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">加载中...</div>;
  }

  if (!pet) {
    return <div className="text-center py-12">宠物不存在</div>;
  }

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

  const tabs = [
    { key: 'basic', label: '基本信息' },
    { key: 'health', label: '健康记录' },
    { key: 'photos', label: '照片' },
    { key: 'fostering', label: '寄养记录' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate({ to: '/pets' })}
            className="text-gray-500 hover:text-gray-700"
          >
            ← 返回
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{pet.name}</h1>
          {getRiskBadge(pet.riskLevel)}
        </div>
        <button
          onClick={() => navigate({ to: '/pets/$id/edit', params: { id } })}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          编辑
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'basic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">基本信息</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">物种</span>
                    <span>{pet.species}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">品种</span>
                    <span>{pet.breed || '-'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">性别</span>
                    <span>{pet.gender === 'male' ? '公' : pet.gender === 'female' ? '母' : '未知'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">出生日期</span>
                    <span>{pet.birthDate || '-'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">体重</span>
                    <span>{pet.weight ? `${pet.weight}g` : '-'}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">主人信息</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">姓名</span>
                    <span>{pet.ownerName || '-'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">电话</span>
                    <span>{pet.ownerPhone || '-'}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">风险评估</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">风险等级</span>
                    <span>{getRiskBadge(pet.riskLevel)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">风险原因</span>
                    <span>{pet.riskReason || '-'}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">疫苗/过敏记录</h3>
                {pet.vaccineAllergies?.length > 0 ? (
                  <div className="space-y-2">
                    {pet.vaccineAllergies.map((va) => (
                      <div key={va.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between">
                          <span>
                            <span className="px-2 py-0.5 rounded text-xs mr-2 bg-gray-200">
                              {va.type === 'vaccine' ? '疫苗' : '过敏'}
                            </span>
                            {va.name}
                          </span>
                          <span className="text-gray-500 text-sm">{va.date}</span>
                        </div>
                        {va.reaction && <div className="text-sm text-gray-600 mt-1">{va.reaction}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">暂无记录</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'health' && (
            <div>
              <div className="mb-4">
                <h4 className="font-medium mb-2">疫苗记录</h4>
                <p className="text-gray-600 whitespace-pre-wrap">{pet.vaccineRecord || '暂无记录'}</p>
              </div>
              <div className="mb-4">
                <h4 className="font-medium mb-2">过敏史</h4>
                <p className="text-gray-600 whitespace-pre-wrap">{pet.allergies || '暂无记录'}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">特殊需求</h4>
                <p className="text-gray-600 whitespace-pre-wrap">{pet.specialNeeds || '暂无记录'}</p>
              </div>
            </div>
          )}

          {activeTab === 'photos' && (
            <div>
              <p className="text-gray-500">暂无照片</p>
            </div>
          )}

          {activeTab === 'fostering' && (
            <div>
              <p className="text-gray-500">暂无寄养记录</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

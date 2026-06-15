import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { apiClient } from '../../api/client';

export const Route = createLazyFileRoute('/pets/new')({
  component: PetsNew,
});

function PetsNew() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    species: 'dog',
    breed: '',
    gender: 'unknown',
    birthDate: '',
    weight: '',
    ownerName: '',
    ownerPhone: '',
    vaccineRecord: '',
    allergies: '',
    specialNeeds: '',
    riskReason: '',
    riskLevel: 'normal',
  });
  const [vaccineAllergies, setVaccineAllergies] = useState<
    Array<{ type: string; name: string; date: string; reaction: string; notes: string }>
  >([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const petData = {
        ...formData,
        weight: formData.weight ? parseInt(formData.weight) : undefined,
        birthDate: formData.birthDate || undefined,
      };

      const { data: pet } = await apiClient.post('/pets', petData);

      for (const va of vaccineAllergies) {
        if (va.name) {
          await apiClient.post(`/pets/${pet.id}/vaccine-allergies`, {
            ...va,
            petId: pet.id,
            date: va.date || undefined,
          });
        }
      }

      navigate({ to: '/pets' });
    } catch (err: any) {
      setError(err.response?.data?.error || '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const addVaccineAllergy = () => {
    setVaccineAllergies([...vaccineAllergies, { type: 'vaccine', name: '', date: '', reaction: '', notes: '' }]);
  };

  const updateVaccineAllergy = (index: number, field: string, value: string) => {
    const updated = [...vaccineAllergies];
    updated[index] = { ...updated[index], [field]: value };
    setVaccineAllergies(updated);
  };

  const removeVaccineAllergy = (index: number) => {
    setVaccineAllergies(vaccineAllergies.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">宠物档案登记</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">基本信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">宠物名称 *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">物种 *</label>
              <select
                value={formData.species}
                onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="dog">犬</option>
                <option value="cat">猫</option>
                <option value="rabbit">兔</option>
                <option value="bird">鸟</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">品种</label>
              <input
                type="text"
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="unknown">未知</option>
                <option value="male">公</option>
                <option value="female">母</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">出生日期</label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">体重 (g)</label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">主人信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">主人姓名</label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
              <input
                type="tel"
                value={formData.ownerPhone}
                onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">健康信息</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">疫苗记录</label>
              <textarea
                rows={3}
                value={formData.vaccineRecord}
                onChange={(e) => setFormData({ ...formData, vaccineRecord: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入疫苗接种历史..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">过敏史</label>
              <textarea
                rows={2}
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入已知过敏信息..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">特殊需求</label>
              <textarea
                rows={2}
                value={formData.specialNeeds}
                onChange={(e) => setFormData({ ...formData, specialNeeds: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入特殊照护需求..."
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">疫苗/过敏记录</h2>
            <button
              type="button"
              onClick={addVaccineAllergy}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              + 添加记录
            </button>
          </div>
          {vaccineAllergies.map((va, index) => (
            <div key={index} className="border rounded-lg p-4 mb-4 bg-gray-50">
              <div className="flex justify-between mb-3">
                <div className="flex gap-2">
                  <select
                    value={va.type}
                    onChange={(e) => updateVaccineAllergy(index, 'type', e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="vaccine">疫苗</option>
                    <option value="allergy">过敏</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeVaccineAllergy(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  删除
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="名称"
                  value={va.name}
                  onChange={(e) => updateVaccineAllergy(index, 'name', e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                />
                <input
                  type="date"
                  value={va.date}
                  onChange={(e) => updateVaccineAllergy(index, 'date', e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                />
                <input
                  type="text"
                  placeholder="反应/症状"
                  value={va.reaction}
                  onChange={(e) => updateVaccineAllergy(index, 'reaction', e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">风险评估</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">风险等级</label>
              <select
                value={formData.riskLevel}
                onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value as any })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">低风险</option>
                <option value="normal">正常</option>
                <option value="high">高风险</option>
                <option value="critical">紧急</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">风险原因</label>
              <input
                type="text"
                value={formData.riskReason}
                onChange={(e) => setFormData({ ...formData, riskReason: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="如：老年犬、术后康复等"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: '/pets' })}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存档案'}
          </button>
        </div>
      </form>
    </div>
  );
}

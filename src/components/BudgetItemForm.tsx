import { useState } from 'react';
import useSWR from 'swr';
import { BudgetCategory } from '@prisma/client';

interface BudgetItemFormProps {
  projectId: string;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

const categoryOptions = [
  { value: BudgetCategory.VENUE, label: '场地' },
  { value: BudgetCategory.FLORISTRY, label: '花艺' },
  { value: BudgetCategory.PHOTOGRAPHY, label: '摄影' },
  { value: BudgetCategory.CATERING, label: '餐饮' },
  { value: BudgetCategory.DRESS, label: '婚纱礼服' },
  { value: BudgetCategory.MUSIC, label: '音乐司仪' },
  { value: BudgetCategory.DECORATION, label: '装饰' },
  { value: BudgetCategory.OTHER, label: '其他' },
];

export default function BudgetItemForm({ projectId, onSubmit, onCancel, initialData }: BudgetItemFormProps) {
  const [formData, setFormData] = useState({
    category: initialData?.category || BudgetCategory.OTHER,
    description: initialData?.description || '',
    estimated: initialData?.estimated || 0,
    actual: initialData?.actual || 0,
    isInternal: initialData?.isInternal || false,
    supplierId: initialData?.supplierId || '',
  });

  const { data: suppliers } = useSWR('/api/suppliers');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          费用类别 <span className="text-red-500">*</span>
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="input"
          required
        >
          {categoryOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          费用说明 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="input"
          placeholder="如：婚礼场地租赁"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            预算金额（元）
          </label>
          <input
            type="number"
            name="estimated"
            value={formData.estimated}
            onChange={handleChange}
            className="input"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            实际支出（元）
          </label>
          <input
            type="number"
            name="actual"
            value={formData.actual}
            onChange={handleChange}
            className="input"
            min="0"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          关联供应商
        </label>
        <select
          name="supplierId"
          value={formData.supplierId}
          onChange={handleChange}
          className="input"
        >
          <option value="">无</option>
          {suppliers?.data?.items?.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isInternal"
          name="isInternal"
          checked={formData.isInternal}
          onChange={handleChange}
          className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
        />
        <label htmlFor="isInternal" className="ml-2 text-sm text-gray-700">
          内部费用（对新人隐藏）
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          取消
        </button>
        <button type="submit" className="btn btn-primary">
          {initialData ? '保存修改' : '添加预算项'}
        </button>
      </div>
    </form>
  );
}

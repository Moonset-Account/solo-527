import { useState } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';

interface ProjectFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export default function ProjectForm({ onSubmit, onCancel, initialData }: ProjectFormProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    weddingDate: initialData?.weddingDate ? initialData.weddingDate.slice(0, 16) : '',
    venue: initialData?.venue || '',
    totalBudget: initialData?.totalBudget || 0,
    coupleId: initialData?.coupleId || '',
    status: initialData?.status || 'DRAFT',
  });

  const { data: couples } = useSWR(
    session?.user.role === 'ADMIN' || session?.user.role === 'PLANNER'
      ? '/api/users?role=COUPLE'
      : null
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
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
          项目名称 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="input"
          placeholder="如：张先生 & 王小姐 婚礼"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          项目描述
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="input min-h-[80px]"
          placeholder="简要描述婚礼风格、需求等"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            婚礼日期
          </label>
          <input
            type="datetime-local"
            name="weddingDate"
            value={formData.weddingDate}
            onChange={handleChange}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            婚礼场地
          </label>
          <input
            type="text"
            name="venue"
            value={formData.venue}
            onChange={handleChange}
            className="input"
            placeholder="如：浪漫海岸婚礼会所"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            总预算（元）
          </label>
          <input
            type="number"
            name="totalBudget"
            value={formData.totalBudget}
            onChange={handleChange}
            className="input"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            项目状态
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="input"
          >
            <option value="DRAFT">草稿</option>
            <option value="IN_PROGRESS">进行中</option>
            <option value="COMPLETED">已完成</option>
            <option value="CANCELLED">已取消</option>
          </select>
        </div>
      </div>

      {(session?.user.role === 'ADMIN' || session?.user.role === 'PLANNER') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            关联新人
          </label>
          <select
            name="coupleId"
            value={formData.coupleId}
            onChange={handleChange}
            className="input"
          >
            <option value="">请选择</option>
            {couples?.data?.items?.map((couple: any) => (
              <option key={couple.id} value={couple.id}>
                {couple.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          取消
        </button>
        <button type="submit" className="btn btn-primary">
          {initialData ? '保存修改' : '创建项目'}
        </button>
      </div>
    </form>
  );
}

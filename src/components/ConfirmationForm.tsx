import { useState } from 'react';

interface ConfirmationFormProps {
  projectId: string;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export default function ConfirmationForm({ projectId, onSubmit, onCancel, initialData }: ConfirmationFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          确认单标题 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="input"
          placeholder="如：花艺方案确认"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          确认内容
        </label>
        <textarea
          name="content"
          value={formData.content}
          onChange={handleChange}
          className="input min-h-[120px]"
          placeholder="请详细描述需要确认的内容..."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          取消
        </button>
        <button type="submit" className="btn btn-primary">
          {initialData ? '保存修改' : '发送确认单'}
        </button>
      </div>
    </form>
  );
}

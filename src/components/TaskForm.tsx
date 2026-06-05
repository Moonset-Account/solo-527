import { useState } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';

interface TaskFormProps {
  projectId: string;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export default function TaskForm({ projectId, onSubmit, onCancel, initialData }: TaskFormProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    status: initialData?.status || 'TODO',
    priority: initialData?.priority || 'MEDIUM',
    dueDate: initialData?.dueDate ? initialData.dueDate.slice(0, 10) : '',
    assigneeId: initialData?.assigneeId || '',
  });

  const { data: users } = useSWR('/api/users');
  const { data: project } = useSWR(`/api/projects/${projectId}`);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const assigneeOptions = users?.data?.items?.filter((u: any) => 
    u.role === 'PLANNER' || u.role === 'SUPPLIER' || u.role === 'COUPLE'
  ) || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          任务标题 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="input"
          placeholder="请输入任务标题"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          任务描述
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="input min-h-[80px]"
          placeholder="请输入任务描述"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            状态
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="input"
          >
            <option value="TODO">待开始</option>
            <option value="IN_PROGRESS">进行中</option>
            <option value="REVIEW">待审核</option>
            <option value="APPROVED">已通过</option>
            <option value="COMPLETED">已完成</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            优先级
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="input"
          >
            <option value="LOW">低</option>
            <option value="MEDIUM">中</option>
            <option value="HIGH">高</option>
            <option value="URGENT">紧急</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            截止日期
          </label>
          <input
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            负责人
          </label>
          <select
            name="assigneeId"
            value={formData.assigneeId}
            onChange={handleChange}
            className="input"
          >
            <option value="">请选择</option>
            {assigneeOptions.map((user: any) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.role === 'PLANNER' ? '策划师' : user.role === 'SUPPLIER' ? '供应商' : '新人'})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          取消
        </button>
        <button type="submit" className="btn btn-primary">
          {initialData ? '保存修改' : '创建任务'}
        </button>
      </div>
    </form>
  );
}

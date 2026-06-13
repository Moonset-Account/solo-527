'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { CreateTaskInput, TaskPriority } from '@/types';
import { X, Plus } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const currentUser = useStore((state) => state.currentUser);
  const departments = useStore((state) => state.departments);
  const users = useStore((state) => state.users);
  const createTask = useStore((state) => state.createTask);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateTaskInput>({
    title: '',
    description: '',
    priority: 'medium',
    department_id: currentUser?.department_id || '',
    assignee_id: '',
    deadline: '',
    requires_attachment: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.deadline || !formData.department_id) return;

    setIsSubmitting(true);
    try {
      await createTask(formData);
      onClose();
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        department_id: currentUser?.department_id || '',
        assignee_id: '',
        deadline: '',
        requires_attachment: false,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleDepartments = currentUser?.role === 'admin'
    ? departments
    : departments.filter(d => d.id === currentUser?.department_id);

  const visibleUsers = currentUser?.role === 'admin'
    ? users
    : users.filter(u => u.department_id === currentUser?.department_id);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-xl z-10">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Plus className="w-6 h-6 text-primary-900" />
            新建周会事项
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              事项标题 <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
              placeholder="请输入事项标题"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              事项描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[100px]"
              placeholder="请输入事项详细描述"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                优先级 <span className="text-danger-500">*</span>
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                className="select"
                required
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
                <option value="urgent">紧急</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                截止日期 <span className="text-danger-500">*</span>
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                所属部门 <span className="text-danger-500">*</span>
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="select"
                required
              >
                <option value="">请选择部门</option>
                {visibleDepartments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                责任人
              </label>
              <select
                value={formData.assignee_id}
                onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value || '' })}
                className="select"
              >
                <option value="">暂不指定（参会人认领）</option>
                {visibleUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="requires_attachment"
              checked={formData.requires_attachment}
              onChange={(e) => setFormData({ ...formData, requires_attachment: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="requires_attachment" className="text-sm text-gray-700">
              完成时必须上传附件
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title || !formData.deadline}
              className="btn-primary"
            >
              {isSubmitting ? '创建中...' : '创建事项'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

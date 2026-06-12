import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import { getStatusLabel, getStatusColor, TODO_STATUS, TODO_PRIORITY } from '@/utils/constants';
import SearchFilter from '@/components/SearchFilter';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { useAuthStore } from '@/store/authStore';
import dayjs from 'dayjs';

interface Todo {
  id: number;
  type: string;
  refId: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  dueDate: string;
  closeNote: string;
  closedAt: string;
  createdAt: string;
  assignee: { id: number; name: string };
}

export const Route = createFileRoute('/todos')({
  component: TodosPage,
});

function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [users, setUsers] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [closeFormData, setCloseFormData] = useState({
    closeNote: '',
  });
  const [assignFormData, setAssignFormData] = useState({
    assigneeId: 0,
  });
  const { user } = useAuthStore();

  const fetchTodos = () => {
    setLoading(true);
    apiClient
      .get('/todos', { params: { ...filters, page, pageSize } })
      .then((res) => {
        setTodos(res.data.list);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  };

  const fetchUsers = () => {
    apiClient.get('/users').then((res) => {
      setUsers(res.data.list || res.data);
    });
  };

  useEffect(() => {
    fetchTodos();
  }, [page, pageSize, filters]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleClose = () => {
    if (selectedTodo) {
      apiClient.post(`/todos/${selectedTodo.id}/close`, closeFormData).then(() => {
        setCloseModalOpen(false);
        fetchTodos();
      });
    }
  };

  const handleAssign = () => {
    if (selectedTodo) {
      apiClient.patch(`/todos/${selectedTodo.id}/assign`, assignFormData).then(() => {
        setAssignModalOpen(false);
        fetchTodos();
      });
    }
  };

  const openCloseModal = (todo: Todo) => {
    setSelectedTodo(todo);
    setCloseFormData({
      closeNote: '',
    });
    setCloseModalOpen(true);
  };

  const openAssignModal = (todo: Todo) => {
    setSelectedTodo(todo);
    setAssignFormData({
      assigneeId: todo.assignee?.id || 0,
    });
    setAssignModalOpen(true);
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      deposit_dispute: '押金争议',
      vacancy: '空置跟进',
      followup: '客户跟进',
      viewing: '看房预约',
      other: '其他',
    };
    return types[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      deposit_dispute: 'bg-red-100 text-red-800',
      vacancy: 'bg-yellow-100 text-yellow-800',
      followup: 'bg-blue-100 text-blue-800',
      viewing: 'bg-green-100 text-green-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const typeOptions = [
    { value: 'deposit_dispute', label: '押金争议' },
    { value: 'vacancy', label: '空置跟进' },
    { value: 'followup', label: '客户跟进' },
    { value: 'viewing', label: '看房预约' },
    { value: 'other', label: '其他' },
  ];

  const columns = [
    {
      key: 'priority',
      title: '优先级',
      render: (r: Todo) => (
        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(r.priority, TODO_PRIORITY)}`}>
          {getStatusLabel(r.priority, TODO_PRIORITY)}
        </span>
      ),
    },
    {
      key: 'type',
      title: '类型',
      render: (r: Todo) => (
        <span className={`px-2 py-1 rounded text-xs ${getTypeColor(r.type)}`}>
          {getTypeLabel(r.type)}
        </span>
      ),
    },
    {
      key: 'title',
      title: '标题',
      render: (r: Todo) => (
        <div>
          <div className="font-medium text-gray-800">{r.title}</div>
          {r.description && (
            <div className="text-xs text-gray-500 mt-1 line-clamp-1">{r.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'assignee',
      title: '处理人',
      render: (r: Todo) => r.assignee?.name || '-',
    },
    {
      key: 'status',
      title: '状态',
      render: (r: Todo) => (
        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(r.status, TODO_STATUS)}`}>
          {getStatusLabel(r.status, TODO_STATUS)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      title: '创建时间',
      render: (r: Todo) => dayjs(r.createdAt).format('YYYY-MM-DD HH:mm'),
    },
    {
      key: 'closedAt',
      title: '完成时间',
      render: (r: Todo) => r.closedAt ? dayjs(r.closedAt).format('YYYY-MM-DD HH:mm') : '-',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">待办事项</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">待处理</div>
          <div className="text-2xl font-bold text-red-600">
            {todos.filter((t) => t.status === 'pending').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">处理中</div>
          <div className="text-2xl font-bold text-yellow-600">
            {todos.filter((t) => t.status === 'processing').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">高优先级</div>
          <div className="text-2xl font-bold text-red-600">
            {todos.filter((t) => t.priority === 'high' && t.status !== 'completed').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">已完成</div>
          <div className="text-2xl font-bold text-green-600">
            {todos.filter((t) => t.status === 'completed').length}
          </div>
        </div>
      </div>

      <SearchFilter
        filters={filters}
        onChange={setFilters}
        onSearch={() => setPage(1)}
        statusOptions={TODO_STATUS}
        showDateRange={true}
        showAssignee={true}
        assigneeOptions={users.map((u) => ({ value: u.id, label: u.name }))}
        extraFilters={
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">类型</label>
              <select
                value={(filters.type as string) || ''}
                onChange={(e) => setFilters({ ...filters, type: e.target.value || undefined })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">全部</option>
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">优先级</label>
              <select
                value={(filters.priority as string) || ''}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value || undefined })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">全部</option>
                {TODO_PRIORITY.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={todos}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        rowKey={(r) => r.id}
        rowClassName={(r) => {
          if (r.priority === 'high' && r.status !== 'completed') {
            return 'bg-red-50';
          }
          return '';
        }}
        actions={(r) =>
          r.status !== 'completed' ? (
            <>
              <button
                onClick={() => openCloseModal(r)}
                className="text-green-600 hover:text-green-800"
              >
                完成
              </button>
              {user?.role === 'admin' && (
                <button
                  onClick={() => openAssignModal(r)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  指派
                </button>
              )}
            </>
          ) : (
            <span className="text-gray-400 text-sm">已完成</span>
          )
        }
      />

      <Modal
        open={closeModalOpen}
        title="完成待办"
        onClose={() => setCloseModalOpen(false)}
        width="max-w-2xl"
        footer={
          <>
            <button
              onClick={() => setCloseModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleClose}
              disabled={!closeFormData.closeNote.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              确认完成
            </button>
          </>
        }
      >
        {selectedTodo && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className={`px-2 py-1 rounded text-xs ${getTypeColor(selectedTodo.type)}`}>
                  {getTypeLabel(selectedTodo.type)}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedTodo.priority, TODO_PRIORITY)}`}>
                  {getStatusLabel(selectedTodo.priority, TODO_PRIORITY)}
                </span>
              </div>
              <p className="font-medium text-gray-800">{selectedTodo.title}</p>
              {selectedTodo.description && (
                <p className="text-sm text-gray-600 mt-1">{selectedTodo.description}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                处理说明 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={closeFormData.closeNote}
                onChange={(e) => setCloseFormData({ ...closeFormData, closeNote: e.target.value })}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="请详细说明处理过程和结果，此为必填项..."
                required
              />
              {!closeFormData.closeNote.trim() && (
                <p className="mt-1 text-sm text-red-500">处理说明不能为空，请填写处理结果</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                提示：填写详细的处理说明有助于后续查阅和统计，特别是押金争议类待办必须填写完整的处理过程。
              </p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={assignModalOpen}
        title="指派待办"
        onClose={() => setAssignModalOpen(false)}
        width="max-w-md"
        footer={
          <>
            <button
              onClick={() => setAssignModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleAssign}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              确认指派
            </button>
          </>
        }
      >
        {selectedTodo && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-800">{selectedTodo.title}</p>
              <p className="text-sm text-gray-500 mt-1">
                当前处理人: {selectedTodo.assignee?.name || '未指派'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">选择处理人</label>
              <select
                value={assignFormData.assigneeId}
                onChange={(e) => setAssignFormData({ ...assignFormData, assigneeId: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value={0}>请选择处理人</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

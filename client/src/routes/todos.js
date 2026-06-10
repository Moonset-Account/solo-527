import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import { getStatusLabel, getStatusColor, TODO_STATUS, TODO_PRIORITY } from '@/utils/constants';
import SearchFilter from '@/components/SearchFilter';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { useAuthStore } from '@/store/authStore';
import dayjs from 'dayjs';
export const Route = createFileRoute('/todos')({
    component: TodosPage,
});
function TodosPage() {
    const [todos, setTodos] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [total, setTotal] = useState(0);
    const [closeModalOpen, setCloseModalOpen] = useState(false);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedTodo, setSelectedTodo] = useState(null);
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
    const openCloseModal = (todo) => {
        setSelectedTodo(todo);
        setCloseFormData({
            closeNote: '',
        });
        setCloseModalOpen(true);
    };
    const openAssignModal = (todo) => {
        setSelectedTodo(todo);
        setAssignFormData({
            assigneeId: todo.assignee?.id || 0,
        });
        setAssignModalOpen(true);
    };
    const getTypeLabel = (type) => {
        const types = {
            deposit_dispute: '押金争议',
            vacancy: '空置跟进',
            followup: '客户跟进',
            viewing: '看房预约',
            other: '其他',
        };
        return types[type] || type;
    };
    const getTypeColor = (type) => {
        const colors = {
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
            render: (r) => (_jsx("span", { className: `px-2 py-1 rounded text-xs ${getStatusColor(r.priority, TODO_PRIORITY)}`, children: getStatusLabel(r.priority, TODO_PRIORITY) })),
        },
        {
            key: 'type',
            title: '类型',
            render: (r) => (_jsx("span", { className: `px-2 py-1 rounded text-xs ${getTypeColor(r.type)}`, children: getTypeLabel(r.type) })),
        },
        {
            key: 'title',
            title: '标题',
            render: (r) => (_jsxs("div", { children: [_jsx("div", { className: "font-medium text-gray-800", children: r.title }), r.description && (_jsx("div", { className: "text-xs text-gray-500 mt-1 line-clamp-1", children: r.description }))] })),
        },
        {
            key: 'assignee',
            title: '处理人',
            render: (r) => r.assignee?.name || '-',
        },
        {
            key: 'status',
            title: '状态',
            render: (r) => (_jsx("span", { className: `px-2 py-1 rounded text-xs ${getStatusColor(r.status, TODO_STATUS)}`, children: getStatusLabel(r.status, TODO_STATUS) })),
        },
        {
            key: 'createdAt',
            title: '创建时间',
            render: (r) => dayjs(r.createdAt).format('YYYY-MM-DD HH:mm'),
        },
        {
            key: 'closedAt',
            title: '完成时间',
            render: (r) => r.closedAt ? dayjs(r.closedAt).format('YYYY-MM-DD HH:mm') : '-',
        },
    ];
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsx("h1", { className: "text-2xl font-bold text-gray-800", children: "\u5F85\u529E\u4E8B\u9879" }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-white rounded-lg shadow p-4", children: [_jsx("div", { className: "text-sm text-gray-500", children: "\u5F85\u5904\u7406" }), _jsx("div", { className: "text-2xl font-bold text-red-600", children: todos.filter((t) => t.status === 'pending').length })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-4", children: [_jsx("div", { className: "text-sm text-gray-500", children: "\u5904\u7406\u4E2D" }), _jsx("div", { className: "text-2xl font-bold text-yellow-600", children: todos.filter((t) => t.status === 'processing').length })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-4", children: [_jsx("div", { className: "text-sm text-gray-500", children: "\u9AD8\u4F18\u5148\u7EA7" }), _jsx("div", { className: "text-2xl font-bold text-red-600", children: todos.filter((t) => t.priority === 'high' && t.status !== 'completed').length })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-4", children: [_jsx("div", { className: "text-sm text-gray-500", children: "\u5DF2\u5B8C\u6210" }), _jsx("div", { className: "text-2xl font-bold text-green-600", children: todos.filter((t) => t.status === 'completed').length })] })] }), _jsx(SearchFilter, { filters: filters, onChange: setFilters, onSearch: () => setPage(1), statusOptions: TODO_STATUS, showDateRange: true, showAssignee: true, assigneeOptions: users.map((u) => ({ value: u.id, label: u.name })), extraFilters: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-gray-600 mb-1", children: "\u7C7B\u578B" }), _jsxs("select", { value: filters.type || '', onChange: (e) => setFilters({ ...filters, type: e.target.value || undefined }), className: "px-3 py-2 border border-gray-300 rounded-lg", children: [_jsx("option", { value: "", children: "\u5168\u90E8" }), typeOptions.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-gray-600 mb-1", children: "\u4F18\u5148\u7EA7" }), _jsxs("select", { value: filters.priority || '', onChange: (e) => setFilters({ ...filters, priority: e.target.value || undefined }), className: "px-3 py-2 border border-gray-300 rounded-lg", children: [_jsx("option", { value: "", children: "\u5168\u90E8" }), TODO_PRIORITY.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value)))] })] })] }) }), _jsx(DataTable, { columns: columns, data: todos, loading: loading, total: total, page: page, pageSize: pageSize, onPageChange: setPage, onPageSizeChange: setPageSize, rowKey: (r) => r.id, rowClassName: (r) => {
                    if (r.priority === 'high' && r.status !== 'completed') {
                        return 'bg-red-50';
                    }
                    return '';
                }, actions: (r) => r.status !== 'completed' ? (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => openCloseModal(r), className: "text-green-600 hover:text-green-800", children: "\u5B8C\u6210" }), user?.role === 'admin' && (_jsx("button", { onClick: () => openAssignModal(r), className: "text-blue-600 hover:text-blue-800", children: "\u6307\u6D3E" }))] })) : (_jsx("span", { className: "text-gray-400 text-sm", children: "\u5DF2\u5B8C\u6210" })) }), _jsx(Modal, { open: closeModalOpen, title: "\u5B8C\u6210\u5F85\u529E", onClose: () => setCloseModalOpen(false), width: "max-w-2xl", footer: _jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setCloseModalOpen(false), className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50", children: "\u53D6\u6D88" }), _jsx("button", { onClick: handleClose, disabled: !closeFormData.closeNote.trim(), className: "px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400", children: "\u786E\u8BA4\u5B8C\u6210" })] }), children: selectedTodo && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "p-4 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-2 mb-2", children: [_jsx("span", { className: `px-2 py-1 rounded text-xs ${getTypeColor(selectedTodo.type)}`, children: getTypeLabel(selectedTodo.type) }), _jsx("span", { className: `px-2 py-1 rounded text-xs ${getStatusColor(selectedTodo.priority, TODO_PRIORITY)}`, children: getStatusLabel(selectedTodo.priority, TODO_PRIORITY) })] }), _jsx("p", { className: "font-medium text-gray-800", children: selectedTodo.title }), selectedTodo.description && (_jsx("p", { className: "text-sm text-gray-600 mt-1", children: selectedTodo.description }))] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["\u5904\u7406\u8BF4\u660E ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("textarea", { value: closeFormData.closeNote, onChange: (e) => setCloseFormData({ ...closeFormData, closeNote: e.target.value }), rows: 5, className: "w-full px-3 py-2 border border-gray-300 rounded-lg", placeholder: "\u8BF7\u8BE6\u7EC6\u8BF4\u660E\u5904\u7406\u8FC7\u7A0B\u548C\u7ED3\u679C\uFF0C\u6B64\u4E3A\u5FC5\u586B\u9879...", required: true }), !closeFormData.closeNote.trim() && (_jsx("p", { className: "mt-1 text-sm text-red-500", children: "\u5904\u7406\u8BF4\u660E\u4E0D\u80FD\u4E3A\u7A7A\uFF0C\u8BF7\u586B\u5199\u5904\u7406\u7ED3\u679C" })), _jsx("p", { className: "mt-2 text-xs text-gray-500", children: "\u63D0\u793A\uFF1A\u586B\u5199\u8BE6\u7EC6\u7684\u5904\u7406\u8BF4\u660E\u6709\u52A9\u4E8E\u540E\u7EED\u67E5\u9605\u548C\u7EDF\u8BA1\uFF0C\u7279\u522B\u662F\u62BC\u91D1\u4E89\u8BAE\u7C7B\u5F85\u529E\u5FC5\u987B\u586B\u5199\u5B8C\u6574\u7684\u5904\u7406\u8FC7\u7A0B\u3002" })] })] })) }), _jsx(Modal, { open: assignModalOpen, title: "\u6307\u6D3E\u5F85\u529E", onClose: () => setAssignModalOpen(false), width: "max-w-md", footer: _jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setAssignModalOpen(false), className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50", children: "\u53D6\u6D88" }), _jsx("button", { onClick: handleAssign, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: "\u786E\u8BA4\u6307\u6D3E" })] }), children: selectedTodo && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "p-4 bg-gray-50 rounded-lg", children: [_jsx("p", { className: "font-medium text-gray-800", children: selectedTodo.title }), _jsxs("p", { className: "text-sm text-gray-500 mt-1", children: ["\u5F53\u524D\u5904\u7406\u4EBA: ", selectedTodo.assignee?.name || '未指派'] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u9009\u62E9\u5904\u7406\u4EBA" }), _jsxs("select", { value: assignFormData.assigneeId, onChange: (e) => setAssignFormData({ ...assignFormData, assigneeId: Number(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", children: [_jsx("option", { value: 0, children: "\u8BF7\u9009\u62E9\u5904\u7406\u4EBA" }), users.map((u) => (_jsx("option", { value: u.id, children: u.name }, u.id)))] })] })] })) })] }));
}

import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import SearchFilter from '@/components/SearchFilter';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { useAuthStore } from '@/store/authStore';
import dayjs from 'dayjs';
export const Route = createFileRoute('/reminders')({
    component: RemindersPage,
});
function RemindersPage() {
    const [reminders, setReminders] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [total, setTotal] = useState(0);
    const [processModalOpen, setProcessModalOpen] = useState(false);
    const [selectedReminder, setSelectedReminder] = useState(null);
    const [processFormData, setProcessFormData] = useState({
        note: '',
        action: 'renew',
        createTodo: false,
        todoTitle: '',
        todoAssigneeId: 0,
    });
    const { user } = useAuthStore();
    const fetchReminders = () => {
        setLoading(true);
        apiClient
            .get('/reminders', { params: { ...filters, page, pageSize } })
            .then((res) => {
            setReminders(res.data.list);
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
        fetchReminders();
    }, [page, pageSize, filters]);
    useEffect(() => {
        if (user?.role === 'admin') {
            fetchUsers();
        }
    }, [user]);
    const handleGenerate = () => {
        if (confirm('确定要生成空置提醒吗？系统将自动检查30天内到期的租约并生成提醒。')) {
            apiClient.post('/reminders/generate').then((res) => {
                alert(`成功生成 ${res.data.generated} 条空置提醒`);
                fetchReminders();
            });
        }
    };
    const handleProcess = () => {
        if (selectedReminder) {
            const data = {
                ...processFormData,
                todoAssigneeId: processFormData.todoAssigneeId || undefined,
                todoTitle: processFormData.createTodo ? processFormData.todoTitle : undefined,
            };
            apiClient.post(`/reminders/${selectedReminder.id}/process`, data).then(() => {
                setProcessModalOpen(false);
                fetchReminders();
            });
        }
    };
    const openProcessModal = (reminder) => {
        setSelectedReminder(reminder);
        setProcessFormData({
            note: '',
            action: 'renew',
            createTodo: false,
            todoTitle: '',
            todoAssigneeId: 0,
        });
        setProcessModalOpen(true);
    };
    const getTypeLabel = (type) => {
        const types = {
            upcoming: '即将到期',
            overdue: '已逾期',
            manual: '手动创建',
        };
        return types[type] || type;
    };
    const getTypeColor = (type) => {
        const colors = {
            upcoming: 'bg-yellow-100 text-yellow-800',
            overdue: 'bg-red-100 text-red-800',
            manual: 'bg-blue-100 text-blue-800',
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };
    const columns = [
        {
            key: 'apartment',
            title: '房源',
            render: (r) => `${r.apartment?.building || ''} ${r.apartment?.apartmentNo || ''}`,
        },
        {
            key: 'leaseEndDate',
            title: '租约到期日',
            render: (r) => dayjs(r.leaseEndDate).format('YYYY-MM-DD'),
        },
        {
            key: 'reminderDate',
            title: '提醒日期',
            render: (r) => dayjs(r.reminderDate).format('YYYY-MM-DD'),
        },
        {
            key: 'type',
            title: '类型',
            render: (r) => (_jsx("span", { className: `px-2 py-1 rounded text-xs ${getTypeColor(r.type)}`, children: getTypeLabel(r.type) })),
        },
        {
            key: 'processed',
            title: '状态',
            render: (r) => (_jsx("span", { className: `px-2 py-1 rounded text-xs ${r.processed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`, children: r.processed ? '已处理' : '待处理' })),
        },
        {
            key: 'daysLeft',
            title: '剩余天数',
            render: (r) => {
                const days = dayjs(r.leaseEndDate).diff(dayjs(), 'day');
                if (days < 0) {
                    return _jsxs("span", { className: "text-red-600", children: ["\u5DF2\u903E\u671F ", Math.abs(days), " \u5929"] });
                }
                else if (days <= 7) {
                    return _jsxs("span", { className: "text-orange-600", children: [days, " \u5929"] });
                }
                return _jsxs("span", { className: "text-gray-600", children: [days, " \u5929"] });
            },
        },
        {
            key: 'processedBy',
            title: '处理人',
            render: (r) => r.processedBy?.name || '-',
        },
    ];
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-800", children: "\u7A7A\u7F6E\u63D0\u9192" }), user?.role === 'admin' && (_jsx("button", { onClick: handleGenerate, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: "\uD83D\uDD14 \u751F\u6210\u7A7A\u7F6E\u63D0\u9192" }))] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-white rounded-lg shadow p-4", children: [_jsx("div", { className: "text-sm text-gray-500", children: "\u5F85\u5904\u7406\u63D0\u9192" }), _jsx("div", { className: "text-2xl font-bold text-red-600", children: reminders.filter((r) => !r.processed).length })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-4", children: [_jsx("div", { className: "text-sm text-gray-500", children: "7\u5929\u5185\u5230\u671F" }), _jsx("div", { className: "text-2xl font-bold text-orange-600", children: reminders.filter((r) => dayjs(r.leaseEndDate).diff(dayjs(), 'day') <= 7 && dayjs(r.leaseEndDate).diff(dayjs(), 'day') > 0).length })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-4", children: [_jsx("div", { className: "text-sm text-gray-500", children: "\u5DF2\u903E\u671F" }), _jsx("div", { className: "text-2xl font-bold text-red-600", children: reminders.filter((r) => dayjs(r.leaseEndDate).diff(dayjs(), 'day') < 0).length })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-4", children: [_jsx("div", { className: "text-sm text-gray-500", children: "\u5DF2\u5904\u7406" }), _jsx("div", { className: "text-2xl font-bold text-green-600", children: reminders.filter((r) => r.processed).length })] })] }), _jsx(SearchFilter, { filters: filters, onChange: setFilters, onSearch: () => setPage(1), showDateRange: true, extraFilters: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-gray-600 mb-1", children: "\u5904\u7406\u72B6\u6001" }), _jsxs("select", { value: filters.processed || '', onChange: (e) => setFilters({ ...filters, processed: e.target.value || undefined }), className: "px-3 py-2 border border-gray-300 rounded-lg", children: [_jsx("option", { value: "", children: "\u5168\u90E8" }), _jsx("option", { value: "false", children: "\u5F85\u5904\u7406" }), _jsx("option", { value: "true", children: "\u5DF2\u5904\u7406" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-gray-600 mb-1", children: "\u63D0\u9192\u7C7B\u578B" }), _jsxs("select", { value: filters.type || '', onChange: (e) => setFilters({ ...filters, type: e.target.value || undefined }), className: "px-3 py-2 border border-gray-300 rounded-lg", children: [_jsx("option", { value: "", children: "\u5168\u90E8" }), _jsx("option", { value: "upcoming", children: "\u5373\u5C06\u5230\u671F" }), _jsx("option", { value: "overdue", children: "\u5DF2\u903E\u671F" })] })] })] }) }), _jsx(DataTable, { columns: columns, data: reminders, loading: loading, total: total, page: page, pageSize: pageSize, onPageChange: setPage, onPageSizeChange: setPageSize, rowKey: (r) => r.id, rowClassName: (r) => {
                    if (!r.processed && dayjs(r.leaseEndDate).diff(dayjs(), 'day') < 0) {
                        return 'bg-red-50';
                    }
                    if (!r.processed && dayjs(r.leaseEndDate).diff(dayjs(), 'day') <= 7) {
                        return 'bg-orange-50';
                    }
                    return '';
                }, actions: (r) => !r.processed && (_jsx("button", { onClick: () => openProcessModal(r), className: "text-blue-600 hover:text-blue-800", children: "\u5904\u7406" })) }), _jsx(Modal, { open: processModalOpen, title: "\u5904\u7406\u7A7A\u7F6E\u63D0\u9192", onClose: () => setProcessModalOpen(false), width: "max-w-2xl", footer: _jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setProcessModalOpen(false), className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50", children: "\u53D6\u6D88" }), _jsx("button", { onClick: handleProcess, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: "\u786E\u8BA4\u5904\u7406" })] }), children: selectedReminder && (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "p-4 bg-blue-50 rounded-lg", children: _jsxs("p", { className: "text-sm", children: ["\u623F\u6E90: ", _jsxs("span", { className: "font-medium", children: [selectedReminder.apartment?.building, " ", selectedReminder.apartment?.apartmentNo] }), ' | ', "\u79DF\u7EA6\u5230\u671F\u65E5: ", _jsx("span", { className: "font-medium", children: dayjs(selectedReminder.leaseEndDate).format('YYYY-MM-DD') }), ' | ', "\u5269\u4F59: ", _jsxs("span", { className: "font-medium", children: [dayjs(selectedReminder.leaseEndDate).diff(dayjs(), 'day'), " \u5929"] })] }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u5904\u7406\u65B9\u5F0F" }), _jsxs("select", { value: processFormData.action, onChange: (e) => setProcessFormData({ ...processFormData, action: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", children: [_jsx("option", { value: "renew", children: "\u5BA2\u6237\u7EED\u79DF" }), _jsx("option", { value: "relet", children: "\u91CD\u65B0\u62DB\u79DF" }), _jsx("option", { value: "maintenance", children: "\u7EF4\u4FEE\u6574\u7406" }), _jsx("option", { value: "other", children: "\u5176\u4ED6" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u5904\u7406\u8BF4\u660E" }), _jsx("textarea", { value: processFormData.note, onChange: (e) => setProcessFormData({ ...processFormData, note: e.target.value }), rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-lg", placeholder: "\u8BF7\u586B\u5199\u5904\u7406\u8BF4\u660E..." })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", id: "createTodo", checked: processFormData.createTodo, onChange: (e) => setProcessFormData({ ...processFormData, createTodo: e.target.checked }), className: "rounded" }), _jsx("label", { htmlFor: "createTodo", className: "text-sm text-gray-700", children: "\u521B\u5EFA\u8DDF\u8FDB\u5F85\u529E" })] }), processFormData.createTodo && (_jsxs("div", { className: "pl-6 space-y-4 border-l-2 border-gray-200", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u5F85\u529E\u6807\u9898 *" }), _jsx("input", { type: "text", value: processFormData.todoTitle, onChange: (e) => setProcessFormData({ ...processFormData, todoTitle: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", placeholder: "\u5F85\u529E\u4E8B\u9879\u6807\u9898", required: processFormData.createTodo })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u6307\u6D3E\u7ED9" }), _jsxs("select", { value: processFormData.todoAssigneeId, onChange: (e) => setProcessFormData({ ...processFormData, todoAssigneeId: Number(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", children: [_jsx("option", { value: 0, children: "\u4E0D\u6307\u6D3E\uFF08\u81EA\u5DF1\u5904\u7406\uFF09" }), users.map((u) => (_jsx("option", { value: u.id, children: u.name }, u.id)))] })] })] }))] })] })) })] }));
}

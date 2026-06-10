import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import dayjs from 'dayjs';
export const Route = createFileRoute('/users')({
    component: UsersPage,
});
function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [total, setTotal] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        name: '',
        phone: '',
        email: '',
        role: 'consultant',
        password: '',
    });
    const fetchUsers = () => {
        setLoading(true);
        apiClient
            .get('/users', { params: { page, pageSize } })
            .then((res) => {
            setUsers(res.data.list || res.data);
            setTotal(res.data.total || (res.data.list ? res.data.list.length : res.data.length));
        })
            .finally(() => setLoading(false));
    };
    useEffect(() => {
        fetchUsers();
    }, [page, pageSize]);
    const handleSubmit = () => {
        const data = { ...formData };
        if (!editingUser && !data.password) {
            alert('请输入密码');
            return;
        }
        if (editingUser && !data.password) {
            delete data.password;
        }
        const promise = editingUser
            ? apiClient.put(`/users/${editingUser.id}`, data)
            : apiClient.post('/users', data);
        promise.then(() => {
            setModalOpen(false);
            fetchUsers();
        });
    };
    const handleToggleStatus = (user) => {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        if (confirm(`确定要${newStatus === 'active' ? '启用' : '禁用'}用户 "${user.name}" 吗？`)) {
            apiClient.patch(`/users/${user.id}/status`, { status: newStatus }).then(fetchUsers);
        }
    };
    const handleResetPassword = (user) => {
        const newPassword = prompt('请输入新密码：');
        if (newPassword && newPassword.length >= 6) {
            apiClient.patch(`/users/${user.id}/password`, { password: newPassword }).then(() => {
                alert('密码重置成功');
            });
        }
        else if (newPassword) {
            alert('密码长度至少6位');
        }
    };
    const openEditModal = (user) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            name: user.name,
            phone: user.phone,
            email: user.email,
            role: user.role,
            password: '',
        });
        setModalOpen(true);
    };
    const openCreateModal = () => {
        setEditingUser(null);
        setFormData({
            username: '',
            name: '',
            phone: '',
            email: '',
            role: 'consultant',
            password: '',
        });
        setModalOpen(true);
    };
    const columns = [
        {
            key: 'name',
            title: '姓名',
            render: (r) => (_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3", children: r.name?.charAt(0) }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-gray-800", children: r.name }), _jsxs("div", { className: "text-xs text-gray-500", children: ["@", r.username] })] })] })),
        },
        {
            key: 'phone',
            title: '联系电话',
            render: (r) => r.phone || '-',
        },
        {
            key: 'email',
            title: '邮箱',
            render: (r) => r.email || '-',
        },
        {
            key: 'role',
            title: '角色',
            render: (r) => (_jsx("span", { className: `px-2 py-1 rounded text-xs ${r.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`, children: r.role === 'admin' ? '管理员' : '顾问' })),
        },
        {
            key: 'status',
            title: '状态',
            render: (r) => (_jsx("span", { className: `px-2 py-1 rounded text-xs ${r.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`, children: r.status === 'active' ? '正常' : '禁用' })),
        },
        {
            key: 'lastLogin',
            title: '最后登录',
            render: (r) => r.lastLogin ? dayjs(r.lastLogin).format('YYYY-MM-DD HH:mm') : '-',
        },
        {
            key: 'createdAt',
            title: '创建时间',
            render: (r) => dayjs(r.createdAt).format('YYYY-MM-DD'),
        },
    ];
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-800", children: "\u7528\u6237\u7BA1\u7406" }), _jsx("button", { onClick: openCreateModal, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: "+ \u65B0\u589E\u7528\u6237" })] }), _jsx(DataTable, { columns: columns, data: users, loading: loading, total: total, page: page, pageSize: pageSize, onPageChange: setPage, onPageSizeChange: setPageSize, rowKey: (r) => r.id, actions: (r) => (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => openEditModal(r), className: "text-blue-600 hover:text-blue-800", children: "\u7F16\u8F91" }), _jsx("button", { onClick: () => handleResetPassword(r), className: "text-yellow-600 hover:text-yellow-800", children: "\u91CD\u7F6E\u5BC6\u7801" }), _jsx("button", { onClick: () => handleToggleStatus(r), className: r.status === 'active' ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800', children: r.status === 'active' ? '禁用' : '启用' })] })) }), _jsx(Modal, { open: modalOpen, title: editingUser ? '编辑用户' : '新增用户', onClose: () => setModalOpen(false), width: "max-w-2xl", footer: _jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setModalOpen(false), className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50", children: "\u53D6\u6D88" }), _jsx("button", { onClick: handleSubmit, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: "\u4FDD\u5B58" })] }), children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u7528\u6237\u540D *" }), _jsx("input", { type: "text", value: formData.username, onChange: (e) => setFormData({ ...formData, username: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", placeholder: "\u767B\u5F55\u8D26\u53F7", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u59D3\u540D *" }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", placeholder: "\u771F\u5B9E\u59D3\u540D", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u89D2\u8272 *" }), _jsxs("select", { value: formData.role, onChange: (e) => setFormData({ ...formData, role: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", required: true, children: [_jsx("option", { value: "consultant", children: "\u987E\u95EE" }), _jsx("option", { value: "admin", children: "\u7BA1\u7406\u5458" })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["\u5BC6\u7801 ", !editingUser && _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("input", { type: "password", value: formData.password, onChange: (e) => setFormData({ ...formData, password: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", placeholder: editingUser ? '不修改请留空' : '至少6位' }), editingUser && (_jsx("p", { className: "mt-1 text-xs text-gray-500", children: "\u4E0D\u4FEE\u6539\u5BC6\u7801\u8BF7\u7559\u7A7A" }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u7535\u8BDD" }), _jsx("input", { type: "tel", value: formData.phone, onChange: (e) => setFormData({ ...formData, phone: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", placeholder: "\u624B\u673A\u53F7\u7801" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u90AE\u7BB1" }), _jsx("input", { type: "email", value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", placeholder: "\u7535\u5B50\u90AE\u7BB1" })] })] }) })] }));
}

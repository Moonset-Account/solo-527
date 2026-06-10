import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import SearchFilter from '@/components/SearchFilter';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import dayjs from 'dayjs';
export const Route = createFileRoute('/customers')({
    component: CustomersPage,
});
function CustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [total, setTotal] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [formData, setFormData] = useState({});
    const fetchCustomers = () => {
        setLoading(true);
        apiClient
            .get('/customers', { params: { ...filters, page, pageSize } })
            .then((res) => {
            setCustomers(res.data.list);
            setTotal(res.data.total);
        })
            .finally(() => setLoading(false));
    };
    useEffect(() => {
        fetchCustomers();
    }, [page, pageSize, filters]);
    const handleSubmit = () => {
        const promise = editingCustomer
            ? apiClient.put(`/customers/${editingCustomer.id}`, formData)
            : apiClient.post('/customers', formData);
        promise.then(() => {
            setModalOpen(false);
            fetchCustomers();
            setEditingCustomer(null);
            setFormData({});
        });
    };
    const handleEdit = (c) => {
        setEditingCustomer(c);
        setFormData(c);
        setModalOpen(true);
    };
    const handleViewDetail = (id) => {
        apiClient.get(`/customers/${id}`).then((res) => {
            setSelectedCustomer(res.data);
            setDetailModalOpen(true);
        });
    };
    const sourceOptions = ['线上', '转介绍', '门店', '其他'];
    const columns = [
        { key: 'name', title: '姓名' },
        { key: 'phone', title: '手机号' },
        { key: 'source', title: '客户来源' },
        { key: 'requirements', title: '需求', width: '200px' },
        { key: 'createdAt', title: '创建时间', render: (r) => dayjs(r.createdAt).format('YYYY-MM-DD HH:mm') },
    ];
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-800", children: "\u5BA2\u6237\u7BA1\u7406" }), _jsx("button", { onClick: () => {
                            setEditingCustomer(null);
                            setFormData({});
                            setModalOpen(true);
                        }, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: "+ \u65B0\u589E\u5BA2\u6237" })] }), _jsx(SearchFilter, { filters: filters, onChange: setFilters, onSearch: () => setPage(1), showStatus: false, extraFilters: _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u5BA2\u6237\u6765\u6E90" }), _jsxs("select", { value: filters.source || '', onChange: (e) => setFilters({ ...filters, source: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: [_jsx("option", { value: "", children: "\u5168\u90E8\u6765\u6E90" }), sourceOptions.map((s) => (_jsx("option", { value: s, children: s }, s)))] })] }) }), _jsx(DataTable, { columns: columns, data: customers, loading: loading, total: total, page: page, pageSize: pageSize, onPageChange: setPage, onPageSizeChange: setPageSize, rowKey: (r) => r.id, actions: (r) => (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => handleViewDetail(r.id), className: "text-blue-600 hover:text-blue-800", children: "\u8BE6\u60C5" }), _jsx("button", { onClick: () => handleEdit(r), className: "text-green-600 hover:text-green-800", children: "\u7F16\u8F91" })] })) }), _jsx(Modal, { open: modalOpen, title: editingCustomer ? '编辑客户' : '新增客户', onClose: () => setModalOpen(false), footer: _jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setModalOpen(false), className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50", children: "\u53D6\u6D88" }), _jsx("button", { onClick: handleSubmit, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: "\u4FDD\u5B58" })] }), children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u59D3\u540D *" }), _jsx("input", { type: "text", value: formData.name || '', onChange: (e) => setFormData({ ...formData, name: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u624B\u673A\u53F7 *" }), _jsx("input", { type: "text", value: formData.phone || '', onChange: (e) => setFormData({ ...formData, phone: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u8EAB\u4EFD\u8BC1\u53F7" }), _jsx("input", { type: "text", value: formData.idCard || '', onChange: (e) => setFormData({ ...formData, idCard: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u5BA2\u6237\u6765\u6E90" }), _jsxs("select", { value: formData.source || '', onChange: (e) => setFormData({ ...formData, source: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", children: [_jsx("option", { value: "", children: "\u8BF7\u9009\u62E9" }), sourceOptions.map((s) => (_jsx("option", { value: s, children: s }, s)))] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u5BA2\u6237\u9700\u6C42" }), _jsx("textarea", { value: formData.requirements || '', onChange: (e) => setFormData({ ...formData, requirements: e.target.value }), rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-lg", placeholder: "\u63CF\u8FF0\u5BA2\u6237\u7684\u79DF\u623F\u9700\u6C42..." })] })] }) }), _jsx(Modal, { open: detailModalOpen, title: "\u5BA2\u6237\u8BE6\u60C5", onClose: () => setDetailModalOpen(false), width: "max-w-4xl", children: selectedCustomer && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "\u59D3\u540D" }), _jsx("p", { className: "font-medium", children: selectedCustomer.name })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "\u624B\u673A\u53F7" }), _jsx("p", { className: "font-medium", children: selectedCustomer.phone })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "\u8EAB\u4EFD\u8BC1\u53F7" }), _jsx("p", { className: "font-medium", children: selectedCustomer.idCard || '-' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "\u5BA2\u6237\u6765\u6E90" }), _jsx("p", { className: "font-medium", children: selectedCustomer.source || '-' })] }), _jsxs("div", { className: "col-span-2", children: [_jsx("p", { className: "text-sm text-gray-500", children: "\u5BA2\u6237\u9700\u6C42" }), _jsx("p", { className: "font-medium", children: selectedCustomer.requirements || '-' })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold mb-3", children: "\u770B\u623F\u8BB0\u5F55" }), selectedCustomer.viewings?.length ? (_jsx("div", { className: "bg-white border rounded-lg overflow-hidden", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-2 text-left", children: "\u623F\u6E90" }), _jsx("th", { className: "px-4 py-2 text-left", children: "\u770B\u623F\u65F6\u95F4" }), _jsx("th", { className: "px-4 py-2 text-left", children: "\u72B6\u6001" }), _jsx("th", { className: "px-4 py-2 text-left", children: "\u53CD\u9988" })] }) }), _jsx("tbody", { className: "divide-y", children: selectedCustomer.viewings.map((v, i) => (_jsxs("tr", { children: [_jsx("td", { className: "px-4 py-2", children: v.apartmentNo || '-' }), _jsx("td", { className: "px-4 py-2", children: dayjs(v.viewingDate).format('YYYY-MM-DD HH:mm') }), _jsx("td", { className: "px-4 py-2", children: v.status }), _jsx("td", { className: "px-4 py-2", children: v.feedback || '-' })] }, i))) })] }) })) : (_jsx("p", { className: "text-gray-500 text-center py-4", children: "\u6682\u65E0\u770B\u623F\u8BB0\u5F55" }))] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold mb-3", children: "\u8DDF\u8FDB\u8BB0\u5F55" }), selectedCustomer.followUps?.length ? (_jsx("div", { className: "bg-white border rounded-lg overflow-hidden", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-2 text-left", children: "\u7C7B\u578B" }), _jsx("th", { className: "px-4 py-2 text-left", children: "\u5185\u5BB9" }), _jsx("th", { className: "px-4 py-2 text-left", children: "\u7ED3\u679C" }), _jsx("th", { className: "px-4 py-2 text-left", children: "\u4E0B\u6B21\u8DDF\u8FDB" }), _jsx("th", { className: "px-4 py-2 text-left", children: "\u65F6\u95F4" })] }) }), _jsx("tbody", { className: "divide-y", children: selectedCustomer.followUps.map((f, i) => (_jsxs("tr", { children: [_jsx("td", { className: "px-4 py-2", children: f.type }), _jsx("td", { className: "px-4 py-2 max-w-xs truncate", children: f.content }), _jsx("td", { className: "px-4 py-2", children: f.result || '-' }), _jsx("td", { className: "px-4 py-2", children: f.nextFollowDate ? dayjs(f.nextFollowDate).format('YYYY-MM-DD') : '-' }), _jsx("td", { className: "px-4 py-2", children: dayjs(f.createdAt).format('YYYY-MM-DD HH:mm') })] }, i))) })] }) })) : (_jsx("p", { className: "text-gray-500 text-center py-4", children: "\u6682\u65E0\u8DDF\u8FDB\u8BB0\u5F55" }))] })] })) })] }));
}

import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import { getStatusLabel, getStatusColor, VIEWING_STATUS } from '@/utils/constants';
import SearchFilter from '@/components/SearchFilter';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import dayjs from 'dayjs';
export const Route = createFileRoute('/viewings')({
    component: ViewingsPage,
});
function ViewingsPage() {
    const [viewings, setViewings] = useState([]);
    const [apartments, setApartments] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [total, setTotal] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingViewing, setEditingViewing] = useState(null);
    const [formData, setFormData] = useState({
        apartmentId: 0,
        customerId: 0,
        viewingDate: '',
        note: '',
        status: 'pending',
        feedback: '',
    });
    const fetchViewings = () => {
        setLoading(true);
        apiClient
            .get('/viewings', { params: { ...filters, page, pageSize } })
            .then((res) => {
            setViewings(res.data.list);
            setTotal(res.data.total);
        })
            .finally(() => setLoading(false));
    };
    const fetchSelectData = () => {
        apiClient.get('/apartments', { params: { pageSize: 100 } }).then((res) => {
            setApartments(res.data.list);
        });
        apiClient.get('/customers', { params: { pageSize: 100 } }).then((res) => {
            setCustomers(res.data.list);
        });
    };
    useEffect(() => {
        fetchViewings();
    }, [page, pageSize, filters]);
    useEffect(() => {
        fetchSelectData();
    }, []);
    const handleSubmit = () => {
        const submitData = {
            apartmentId: formData.apartmentId,
            customerId: formData.customerId,
            viewingDate: formData.viewingDate,
            note: formData.note,
        };
        const promise = editingViewing
            ? apiClient.put(`/viewings/${editingViewing.id}`, formData)
            : apiClient.post('/viewings', submitData);
        promise.then(() => {
            setModalOpen(false);
            fetchViewings();
            setEditingViewing(null);
            setFormData({ apartmentId: 0, customerId: 0, viewingDate: '', note: '', status: 'pending', feedback: '' });
        });
    };
    const handleEdit = (v) => {
        setEditingViewing(v);
        setFormData({
            apartmentId: v.apartmentId,
            customerId: v.customerId,
            viewingDate: dayjs(v.viewingDate).format('YYYY-MM-DDTHH:mm'),
            note: v.note || '',
            status: v.status,
            feedback: v.feedback || '',
        });
        setModalOpen(true);
    };
    const columns = [
        {
            key: 'apartment',
            title: '房源',
            render: (r) => `${r.apartment?.building || ''} ${r.apartment?.apartmentNo || ''}`,
        },
        {
            key: 'customer',
            title: '客户',
            render: (r) => `${r.customer?.name || ''} (${r.customer?.phone || ''})`,
        },
        {
            key: 'consultant',
            title: '顾问',
            render: (r) => r.consultant?.name || '-',
        },
        {
            key: 'viewingDate',
            title: '看房时间',
            render: (r) => dayjs(r.viewingDate).format('YYYY-MM-DD HH:mm'),
        },
        {
            key: 'status',
            title: '状态',
            render: (r) => (_jsx("span", { className: `px-2 py-1 rounded text-xs ${getStatusColor(r.status, VIEWING_STATUS)}`, children: getStatusLabel(r.status, VIEWING_STATUS) })),
        },
        { key: 'note', title: '备注', width: '150px' },
    ];
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-800", children: "\u770B\u623F\u9884\u7EA6" }), _jsx("button", { onClick: () => {
                            setEditingViewing(null);
                            setFormData({ apartmentId: 0, customerId: 0, viewingDate: '', note: '', status: 'pending', feedback: '' });
                            setModalOpen(true);
                        }, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: "+ \u65B0\u589E\u9884\u7EA6" })] }), _jsx(SearchFilter, { filters: filters, onChange: setFilters, onSearch: () => setPage(1), statusOptions: VIEWING_STATUS }), _jsx(DataTable, { columns: columns, data: viewings, loading: loading, total: total, page: page, pageSize: pageSize, onPageChange: setPage, onPageSizeChange: setPageSize, rowKey: (r) => r.id, actions: (r) => (_jsx("button", { onClick: () => handleEdit(r), className: "text-blue-600 hover:text-blue-800", children: r.status === 'pending' ? '处理' : '查看' })) }), _jsx(Modal, { open: modalOpen, title: editingViewing ? '处理预约' : '新增预约', onClose: () => setModalOpen(false), footer: _jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setModalOpen(false), className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50", children: "\u53D6\u6D88" }), _jsx("button", { onClick: handleSubmit, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: "\u4FDD\u5B58" })] }), children: _jsxs("div", { className: "space-y-4", children: [!editingViewing && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u9009\u62E9\u623F\u6E90 *" }), _jsxs("select", { value: formData.apartmentId, onChange: (e) => setFormData({ ...formData, apartmentId: Number(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", required: true, children: [_jsx("option", { value: 0, children: "\u8BF7\u9009\u62E9\u623F\u6E90" }), apartments.map((a) => (_jsx("option", { value: a.id, children: a.apartmentNo }, a.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u9009\u62E9\u5BA2\u6237 *" }), _jsxs("select", { value: formData.customerId, onChange: (e) => setFormData({ ...formData, customerId: Number(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", required: true, children: [_jsx("option", { value: 0, children: "\u8BF7\u9009\u62E9\u5BA2\u6237" }), customers.map((c) => (_jsxs("option", { value: c.id, children: [c.name, " - ", c.phone] }, c.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u770B\u623F\u65F6\u95F4 *" }), _jsx("input", { type: "datetime-local", value: formData.viewingDate, onChange: (e) => setFormData({ ...formData, viewingDate: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", required: true })] })] })), editingViewing && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "p-4 bg-gray-50 rounded-lg", children: [_jsxs("p", { className: "text-sm text-gray-600", children: ["\u623F\u6E90: ", _jsxs("span", { className: "font-medium", children: [editingViewing.apartment?.building, " ", editingViewing.apartment?.apartmentNo] })] }), _jsxs("p", { className: "text-sm text-gray-600 mt-1", children: ["\u5BA2\u6237: ", _jsxs("span", { className: "font-medium", children: [editingViewing.customer?.name, " (", editingViewing.customer?.phone, ")"] })] }), _jsxs("p", { className: "text-sm text-gray-600 mt-1", children: ["\u770B\u623F\u65F6\u95F4: ", _jsx("span", { className: "font-medium", children: dayjs(editingViewing.viewingDate).format('YYYY-MM-DD HH:mm') })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u72B6\u6001" }), _jsx("select", { value: formData.status, onChange: (e) => setFormData({ ...formData, status: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", children: VIEWING_STATUS.map((s) => (_jsx("option", { value: s.value, children: s.label }, s.value))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u770B\u623F\u53CD\u9988" }), _jsx("textarea", { value: formData.feedback, onChange: (e) => setFormData({ ...formData, feedback: e.target.value }), rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-lg", placeholder: "\u8BB0\u5F55\u5BA2\u6237\u770B\u623F\u540E\u7684\u53CD\u9988\u610F\u89C1..." })] })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u5907\u6CE8" }), _jsx("textarea", { value: formData.note, onChange: (e) => setFormData({ ...formData, note: e.target.value }), rows: 2, className: "w-full px-3 py-2 border border-gray-300 rounded-lg" })] })] }) })] }));
}

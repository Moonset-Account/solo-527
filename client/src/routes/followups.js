import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import { FOLLOWUP_TYPE, FOLLOWUP_RESULT } from '@/utils/constants';
import SearchFilter from '@/components/SearchFilter';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import dayjs from 'dayjs';
export const Route = createFileRoute('/followups')({
    component: FollowUpsPage,
});
function FollowUpsPage() {
    const [followups, setFollowups] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [apartments, setApartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [total, setTotal] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        customerId: 0,
        apartmentId: 0,
        type: 'phone',
        content: '',
        nextFollowDate: '',
        result: '',
    });
    const fetchFollowups = () => {
        setLoading(true);
        apiClient
            .get('/followups', { params: { ...filters, page, pageSize } })
            .then((res) => {
            setFollowups(res.data.list);
            setTotal(res.data.total);
        })
            .finally(() => setLoading(false));
    };
    const fetchSelectData = () => {
        apiClient.get('/customers', { params: { pageSize: 100 } }).then((res) => {
            setCustomers(res.data.list);
        });
        apiClient.get('/apartments', { params: { pageSize: 100 } }).then((res) => {
            setApartments(res.data.list);
        });
    };
    useEffect(() => {
        fetchFollowups();
    }, [page, pageSize, filters]);
    useEffect(() => {
        fetchSelectData();
    }, []);
    const handleSubmit = () => {
        const submitData = {
            customerId: formData.customerId,
            apartmentId: formData.apartmentId || undefined,
            type: formData.type,
            content: formData.content,
            nextFollowDate: formData.nextFollowDate || undefined,
            result: formData.result || undefined,
        };
        apiClient.post('/followups', submitData).then(() => {
            setModalOpen(false);
            fetchFollowups();
            setFormData({ customerId: 0, apartmentId: 0, type: 'phone', content: '', nextFollowDate: '', result: '' });
        });
    };
    const typeLabels = {
        phone: '电话',
        wechat: '微信',
        visit: '到访',
        other: '其他',
    };
    const resultColors = {
        interested: 'bg-blue-100 text-blue-800',
        negotiating: 'bg-yellow-100 text-yellow-800',
        signed: 'bg-green-100 text-green-800',
        lost: 'bg-red-100 text-red-800',
        pending: 'bg-gray-100 text-gray-800',
    };
    const resultLabels = {
        interested: '意向强',
        negotiating: '洽谈中',
        signed: '已签约',
        lost: '已流失',
        pending: '待跟进',
    };
    const columns = [
        {
            key: 'customer',
            title: '客户',
            render: (r) => `${r.customer?.name || ''} (${r.customer?.phone || ''})`,
        },
        {
            key: 'apartment',
            title: '意向房源',
            render: (r) => r.apartment?.apartmentNo || '-',
        },
        {
            key: 'type',
            title: '跟进类型',
            render: (r) => typeLabels[r.type] || r.type,
        },
        { key: 'content', title: '跟进内容', width: '200px' },
        {
            key: 'result',
            title: '跟进结果',
            render: (r) => r.result ? (_jsx("span", { className: `px-2 py-1 rounded text-xs ${resultColors[r.result]}`, children: resultLabels[r.result] })) : (_jsx("span", { className: "px-2 py-1 rounded text-xs bg-gray-100 text-gray-600", children: "\u8DDF\u8FDB\u4E2D" })),
        },
        {
            key: 'nextFollowDate',
            title: '下次跟进',
            render: (r) => (r.nextFollowDate ? dayjs(r.nextFollowDate).format('YYYY-MM-DD') : '-'),
        },
        {
            key: 'createdAt',
            title: '跟进时间',
            render: (r) => dayjs(r.createdAt).format('YYYY-MM-DD HH:mm'),
        },
    ];
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-800", children: "\u8DDF\u8FDB\u8BB0\u5F55" }), _jsx("button", { onClick: () => setModalOpen(true), className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: "+ \u65B0\u589E\u8DDF\u8FDB" })] }), _jsx(SearchFilter, { filters: filters, onChange: setFilters, onSearch: () => setPage(1), showStatus: false, extraFilters: _jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u8DDF\u8FDB\u7C7B\u578B" }), _jsxs("select", { value: filters.type || '', onChange: (e) => setFilters({ ...filters, type: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: [_jsx("option", { value: "", children: "\u5168\u90E8\u7C7B\u578B" }), FOLLOWUP_TYPE.map((t) => (_jsx("option", { value: t.value, children: t.label }, t.value)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u5F85\u8DDF\u8FDB" }), _jsxs("select", { value: filters.pending || '', onChange: (e) => setFilters({ ...filters, pending: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: [_jsx("option", { value: "", children: "\u5168\u90E8" }), _jsx("option", { value: "true", children: "\u5F85\u8DDF\u8FDB" }), _jsx("option", { value: "false", children: "\u5DF2\u5904\u7406" })] })] })] }) }), _jsx(DataTable, { columns: columns, data: followups, loading: loading, total: total, page: page, pageSize: pageSize, onPageChange: setPage, onPageSizeChange: setPageSize, rowKey: (r) => r.id }), _jsx(Modal, { open: modalOpen, title: "\u65B0\u589E\u8DDF\u8FDB\u8BB0\u5F55", onClose: () => setModalOpen(false), footer: _jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setModalOpen(false), className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50", children: "\u53D6\u6D88" }), _jsx("button", { onClick: handleSubmit, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: "\u4FDD\u5B58" })] }), children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u9009\u62E9\u5BA2\u6237 *" }), _jsxs("select", { value: formData.customerId, onChange: (e) => setFormData({ ...formData, customerId: Number(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", required: true, children: [_jsx("option", { value: 0, children: "\u8BF7\u9009\u62E9\u5BA2\u6237" }), customers.map((c) => (_jsxs("option", { value: c.id, children: [c.name, " - ", c.phone] }, c.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u610F\u5411\u623F\u6E90" }), _jsxs("select", { value: formData.apartmentId, onChange: (e) => setFormData({ ...formData, apartmentId: Number(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", children: [_jsx("option", { value: 0, children: "\u8BF7\u9009\u62E9\u623F\u6E90" }), apartments.map((a) => (_jsx("option", { value: a.id, children: a.apartmentNo }, a.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u8DDF\u8FDB\u65B9\u5F0F *" }), _jsx("select", { value: formData.type, onChange: (e) => setFormData({ ...formData, type: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", required: true, children: FOLLOWUP_TYPE.map((t) => (_jsx("option", { value: t.value, children: t.label }, t.value))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u8DDF\u8FDB\u5185\u5BB9 *" }), _jsx("textarea", { value: formData.content, onChange: (e) => setFormData({ ...formData, content: e.target.value }), rows: 4, className: "w-full px-3 py-2 border border-gray-300 rounded-lg", placeholder: "\u8BF7\u8BE6\u7EC6\u8BB0\u5F55\u8DDF\u8FDB\u5185\u5BB9...", required: true })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u4E0B\u6B21\u8DDF\u8FDB\u65F6\u95F4" }), _jsx("input", { type: "datetime-local", value: formData.nextFollowDate, onChange: (e) => setFormData({ ...formData, nextFollowDate: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u8DDF\u8FDB\u7ED3\u679C" }), _jsxs("select", { value: formData.result, onChange: (e) => setFormData({ ...formData, result: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", children: [_jsx("option", { value: "", children: "\u672A\u5904\u7406" }), FOLLOWUP_RESULT.map((r) => (_jsx("option", { value: r.value, children: r.label }, r.value)))] })] })] })] }) })] }));
}

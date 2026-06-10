import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import { getStatusLabel, getStatusColor, LEASE_STATUS } from '@/utils/constants';
import SearchFilter from '@/components/SearchFilter';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { useAuthStore } from '@/store/authStore';
import dayjs from 'dayjs';
export const Route = createFileRoute('/leases')({
    component: LeasesPage,
});
function LeasesPage() {
    const [leases, setLeases] = useState([]);
    const [drafts, setDrafts] = useState([]);
    const [apartments, setApartments] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [total, setTotal] = useState(0);
    const [activeTab, setActiveTab] = useState('drafts');
    const [draftModalOpen, setDraftModalOpen] = useState(false);
    const [signModalOpen, setSignModalOpen] = useState(false);
    const [selectedDraft, setSelectedDraft] = useState(null);
    const [editingDraft, setEditingDraft] = useState(null);
    const [formData, setFormData] = useState({
        apartmentId: 0,
        customerId: 0,
        startDate: '',
        endDate: '',
        monthlyRent: 0,
        depositAmount: 0,
        paymentCycle: 1,
        terms: '',
    });
    const [signFormData, setSignFormData] = useState({
        startDate: '',
        endDate: '',
        monthlyRent: 0,
        depositAmount: 0,
        paymentCycle: 1,
        terms: '',
        depositReceivedDate: '',
    });
    const { user } = useAuthStore();
    const fetchLeases = () => {
        setLoading(true);
        apiClient
            .get('/leases', { params: { ...filters, page, pageSize } })
            .then((res) => {
            setLeases(res.data.list);
            setTotal(res.data.total);
        })
            .finally(() => setLoading(false));
    };
    const fetchDrafts = () => {
        setLoading(true);
        apiClient
            .get('/leases/drafts', { params: { ...filters, page, pageSize } })
            .then((res) => {
            setDrafts(res.data.list);
            setTotal(res.data.total);
        })
            .finally(() => setLoading(false));
    };
    const fetchSelectData = () => {
        apiClient.get('/apartments', { params: { pageSize: 100, status: 'vacant' } }).then((res) => {
            setApartments(res.data.list);
        });
        apiClient.get('/customers', { params: { pageSize: 100 } }).then((res) => {
            setCustomers(res.data.list);
        });
    };
    useEffect(() => {
        if (activeTab === 'drafts') {
            fetchDrafts();
        }
        else {
            fetchLeases();
        }
    }, [page, pageSize, filters, activeTab]);
    useEffect(() => {
        fetchSelectData();
    }, []);
    const handleApartmentChange = (id) => {
        const apt = apartments.find((a) => a.id === id);
        if (apt) {
            setFormData({
                ...formData,
                apartmentId: id,
                monthlyRent: Number(apt.monthlyRent),
                depositAmount: Number(apt.monthlyRent),
            });
        }
    };
    const handleDraftSubmit = () => {
        const promise = editingDraft
            ? apiClient.put(`/leases/drafts/${editingDraft.id}`, formData)
            : apiClient.post('/leases/drafts', formData);
        promise.then(() => {
            setDraftModalOpen(false);
            fetchDrafts();
            setEditingDraft(null);
            setFormData({ apartmentId: 0, customerId: 0, startDate: '', endDate: '', monthlyRent: 0, depositAmount: 0, paymentCycle: 1, terms: '' });
        });
    };
    const handleSign = () => {
        if (selectedDraft) {
            apiClient.post(`/leases/drafts/${selectedDraft.id}/sign`, signFormData).then(() => {
                setSignModalOpen(false);
                fetchDrafts();
            });
        }
    };
    const handleTerminate = (id) => {
        if (confirm('确定要终止此租约吗？')) {
            apiClient.patch(`/leases/${id}/terminate`).then(fetchLeases);
        }
    };
    const openSignModal = (draft) => {
        setSelectedDraft(draft);
        setSignFormData({
            startDate: draft.startDate,
            endDate: draft.endDate,
            monthlyRent: Number(draft.monthlyRent),
            depositAmount: Number(draft.depositAmount),
            paymentCycle: draft.paymentCycle,
            terms: draft.terms || '',
            depositReceivedDate: dayjs().format('YYYY-MM-DD'),
        });
        setSignModalOpen(true);
    };
    const openEditDraft = (draft) => {
        setEditingDraft(draft);
        setFormData({
            apartmentId: draft.apartmentId,
            customerId: draft.customerId,
            startDate: draft.startDate,
            endDate: draft.endDate,
            monthlyRent: Number(draft.monthlyRent),
            depositAmount: Number(draft.depositAmount),
            paymentCycle: draft.paymentCycle,
            terms: draft.terms || '',
        });
        setDraftModalOpen(true);
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
            key: 'startDate',
            title: '租期',
            render: (r) => `${dayjs(r.startDate).format('YYYY-MM-DD')} 至 ${dayjs(r.endDate).format('YYYY-MM-DD')}`,
        },
        {
            key: 'monthlyRent',
            title: '月租金',
            render: (r) => `¥${Number(r.monthlyRent).toLocaleString()}`,
        },
        {
            key: 'depositAmount',
            title: '押金',
            render: (r) => `¥${Number(r.depositAmount).toLocaleString()}`,
        },
        {
            key: 'status',
            title: '状态',
            render: (r) => (_jsx("span", { className: `px-2 py-1 rounded text-xs ${getStatusColor(r.status, LEASE_STATUS)}`, children: getStatusLabel(r.status, LEASE_STATUS) })),
        },
    ];
    const draftColumns = [
        {
            key: 'apartment',
            title: '房源',
            render: (r) => r.apartment?.apartmentNo || '',
        },
        {
            key: 'customer',
            title: '客户',
            render: (r) => r.customer?.name || '',
        },
        {
            key: 'startDate',
            title: '租期',
            render: (r) => `${dayjs(r.startDate).format('YYYY-MM-DD')} 至 ${dayjs(r.endDate).format('YYYY-MM-DD')}`,
        },
        {
            key: 'monthlyRent',
            title: '月租金',
            render: (r) => `¥${Number(r.monthlyRent).toLocaleString()}`,
        },
        {
            key: 'depositAmount',
            title: '押金',
            render: (r) => `¥${Number(r.depositAmount).toLocaleString()}`,
        },
        {
            key: 'status',
            title: '状态',
            render: (r) => (_jsx("span", { className: `px-2 py-1 rounded text-xs ${r.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`, children: r.status === 'draft' ? '草稿' : '已签约' })),
        },
    ];
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-800", children: "\u79DF\u7EA6\u7BA1\u7406" }), _jsx("button", { onClick: () => {
                            setEditingDraft(null);
                            setFormData({ apartmentId: 0, customerId: 0, startDate: '', endDate: '', monthlyRent: 0, depositAmount: 0, paymentCycle: 1, terms: '' });
                            setDraftModalOpen(true);
                        }, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: "+ \u65B0\u5EFA\u79DF\u7EA6\u8349\u7A3F" })] }), _jsx("div", { className: "bg-white rounded-lg shadow", children: _jsx("div", { className: "border-b", children: _jsxs("nav", { className: "flex", children: [_jsx("button", { onClick: () => { setActiveTab('drafts'); setPage(1); }, className: `px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'drafts'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'}`, children: "\u79DF\u7EA6\u8349\u7A3F" }), user?.role === 'admin' && (_jsx("button", { onClick: () => { setActiveTab('active'); setPage(1); }, className: `px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'active'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'}`, children: "\u5DF2\u7B7E\u7EA6\u79DF\u7EA6" }))] }) }) }), _jsx(SearchFilter, { filters: filters, onChange: setFilters, onSearch: () => setPage(1), statusOptions: LEASE_STATUS }), activeTab === 'drafts' ? (_jsx(DataTable, { columns: draftColumns, data: drafts, loading: loading, total: total, page: page, pageSize: pageSize, onPageChange: setPage, onPageSizeChange: setPageSize, rowKey: (r) => r.id, actions: (r) => r.status === 'draft' && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => openEditDraft(r), className: "text-blue-600 hover:text-blue-800", children: "\u7F16\u8F91" }), user?.role === 'admin' && (_jsx("button", { onClick: () => openSignModal(r), className: "text-green-600 hover:text-green-800", children: "\u7B7E\u7EA6" }))] })) })) : (_jsx(DataTable, { columns: columns, data: leases, loading: loading, total: total, page: page, pageSize: pageSize, onPageChange: setPage, onPageSizeChange: setPageSize, rowKey: (r) => r.id, actions: (r) => r.status === 'active' && (_jsx("button", { onClick: () => handleTerminate(r.id), className: "text-red-600 hover:text-red-800", children: "\u7EC8\u6B62" })) })), _jsx(Modal, { open: draftModalOpen, title: editingDraft ? '编辑租约草稿' : '新建租约草稿', onClose: () => setDraftModalOpen(false), width: "max-w-3xl", footer: _jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setDraftModalOpen(false), className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50", children: "\u53D6\u6D88" }), _jsx("button", { onClick: handleDraftSubmit, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: "\u4FDD\u5B58" })] }), children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u9009\u62E9\u623F\u6E90 *" }), _jsxs("select", { value: formData.apartmentId, onChange: (e) => handleApartmentChange(Number(e.target.value)), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", required: true, children: [_jsx("option", { value: 0, children: "\u8BF7\u9009\u62E9\u623F\u6E90" }), apartments.map((a) => (_jsxs("option", { value: a.id, children: [a.apartmentNo, " (\u00A5", Number(a.monthlyRent).toLocaleString(), "/\u6708)"] }, a.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u9009\u62E9\u5BA2\u6237 *" }), _jsxs("select", { value: formData.customerId, onChange: (e) => setFormData({ ...formData, customerId: Number(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", required: true, children: [_jsx("option", { value: 0, children: "\u8BF7\u9009\u62E9\u5BA2\u6237" }), customers.map((c) => (_jsxs("option", { value: c.id, children: [c.name, " - ", c.phone] }, c.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u8D77\u79DF\u65E5\u671F *" }), _jsx("input", { type: "date", value: formData.startDate, onChange: (e) => setFormData({ ...formData, startDate: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u7ED3\u675F\u65E5\u671F *" }), _jsx("input", { type: "date", value: formData.endDate, onChange: (e) => setFormData({ ...formData, endDate: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u6708\u79DF\u91D1(\u5143) *" }), _jsx("input", { type: "number", value: formData.monthlyRent, onChange: (e) => setFormData({ ...formData, monthlyRent: Number(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u62BC\u91D1(\u5143) *" }), _jsx("input", { type: "number", value: formData.depositAmount, onChange: (e) => setFormData({ ...formData, depositAmount: Number(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u4ED8\u6B3E\u5468\u671F(\u6708)" }), _jsx("input", { type: "number", value: formData.paymentCycle, onChange: (e) => setFormData({ ...formData, paymentCycle: Number(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg" })] }), _jsxs("div", { className: "col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u79DF\u7EA6\u6761\u6B3E" }), _jsx("textarea", { value: formData.terms, onChange: (e) => setFormData({ ...formData, terms: e.target.value }), rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-lg", placeholder: "\u8BE6\u7EC6\u63CF\u8FF0\u79DF\u7EA6\u6761\u6B3E..." })] })] }) }), _jsx(Modal, { open: signModalOpen, title: "\u7B7E\u7F72\u79DF\u7EA6", onClose: () => setSignModalOpen(false), width: "max-w-3xl", footer: _jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setSignModalOpen(false), className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50", children: "\u53D6\u6D88" }), _jsx("button", { onClick: handleSign, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: "\u786E\u8BA4\u7B7E\u7EA6" })] }), children: _jsxs("div", { className: "space-y-4", children: [selectedDraft && (_jsx("div", { className: "p-4 bg-blue-50 rounded-lg", children: _jsxs("p", { className: "text-sm", children: ["\u623F\u6E90: ", _jsx("span", { className: "font-medium", children: selectedDraft.apartment?.apartmentNo }), ' | ', "\u5BA2\u6237: ", _jsx("span", { className: "font-medium", children: selectedDraft.customer?.name })] }) })), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u8D77\u79DF\u65E5\u671F *" }), _jsx("input", { type: "date", value: signFormData.startDate, onChange: (e) => setSignFormData({ ...signFormData, startDate: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u7ED3\u675F\u65E5\u671F *" }), _jsx("input", { type: "date", value: signFormData.endDate, onChange: (e) => setSignFormData({ ...signFormData, endDate: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u6708\u79DF\u91D1(\u5143) *" }), _jsx("input", { type: "number", value: signFormData.monthlyRent, onChange: (e) => setSignFormData({ ...signFormData, monthlyRent: Number(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u62BC\u91D1(\u5143) *" }), _jsx("input", { type: "number", value: signFormData.depositAmount, onChange: (e) => setSignFormData({ ...signFormData, depositAmount: Number(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u4ED8\u6B3E\u5468\u671F(\u6708)" }), _jsx("input", { type: "number", value: signFormData.paymentCycle, onChange: (e) => setSignFormData({ ...signFormData, paymentCycle: Number(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u62BC\u91D1\u6536\u6B3E\u65E5\u671F *" }), _jsx("input", { type: "date", value: signFormData.depositReceivedDate, onChange: (e) => setSignFormData({ ...signFormData, depositReceivedDate: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", required: true })] }), _jsxs("div", { className: "col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u79DF\u7EA6\u6761\u6B3E" }), _jsx("textarea", { value: signFormData.terms, onChange: (e) => setSignFormData({ ...signFormData, terms: e.target.value }), rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-lg" })] })] })] }) })] }));
}

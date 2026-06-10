import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import { getStatusLabel, getStatusColor, DEPOSIT_STATUS, DISPUTE_STATUS } from '@/utils/constants';
import SearchFilter from '@/components/SearchFilter';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { useAuthStore } from '@/store/authStore';
import dayjs from 'dayjs';
export const Route = createFileRoute('/deposits')({
    component: DepositsPage,
});
function DepositsPage() {
    const [deposits, setDeposits] = useState([]);
    const [disputes, setDisputes] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [total, setTotal] = useState(0);
    const [activeTab, setActiveTab] = useState('deposits');
    const [refundModalOpen, setRefundModalOpen] = useState(false);
    const [disputeModalOpen, setDisputeModalOpen] = useState(false);
    const [closeDisputeModalOpen, setCloseDisputeModalOpen] = useState(false);
    const [selectedDeposit, setSelectedDeposit] = useState(null);
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [refundFormData, setRefundFormData] = useState({
        refundDate: '',
        refundAmount: 0,
        deductionReason: '',
        note: '',
    });
    const [disputeFormData, setDisputeFormData] = useState({
        title: '',
        description: '',
        disputedAmount: 0,
        assigneeId: 0,
    });
    const [closeDisputeFormData, setCloseDisputeFormData] = useState({
        closeNote: '',
        resolution: 'other',
    });
    const { user } = useAuthStore();
    const fetchDeposits = () => {
        setLoading(true);
        apiClient
            .get('/deposits', { params: { ...filters, page, pageSize } })
            .then((res) => {
            setDeposits(res.data.list);
            setTotal(res.data.total);
        })
            .finally(() => setLoading(false));
    };
    const fetchDisputes = () => {
        setLoading(true);
        apiClient
            .get('/deposits/disputes', { params: { ...filters, page, pageSize } })
            .then((res) => {
            setDisputes(res.data.list);
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
        if (activeTab === 'deposits') {
            fetchDeposits();
        }
        else {
            fetchDisputes();
        }
    }, [page, pageSize, filters, activeTab]);
    useEffect(() => {
        if (user?.role === 'admin') {
            fetchUsers();
        }
    }, [user]);
    const handleRefund = () => {
        if (selectedDeposit) {
            apiClient.post(`/deposits/${selectedDeposit.id}/refund`, refundFormData).then(() => {
                setRefundModalOpen(false);
                fetchDeposits();
            });
        }
    };
    const handleCreateDispute = () => {
        if (selectedDeposit) {
            const data = {
                ...disputeFormData,
                assigneeId: disputeFormData.assigneeId || undefined,
            };
            apiClient.post(`/deposits/${selectedDeposit.id}/dispute`, data).then(() => {
                setDisputeModalOpen(false);
                fetchDeposits();
            });
        }
    };
    const handleCloseDispute = () => {
        if (selectedDispute) {
            apiClient.post(`/deposits/disputes/${selectedDispute.id}/close`, closeDisputeFormData).then(() => {
                setCloseDisputeModalOpen(false);
                fetchDisputes();
            });
        }
    };
    const openRefundModal = (deposit) => {
        setSelectedDeposit(deposit);
        setRefundFormData({
            refundDate: dayjs().format('YYYY-MM-DD'),
            refundAmount: Number(deposit.amount),
            deductionReason: '',
            note: '',
        });
        setRefundModalOpen(true);
    };
    const openDisputeModal = (deposit) => {
        setSelectedDeposit(deposit);
        setDisputeFormData({
            title: '',
            description: '',
            disputedAmount: Number(deposit.amount),
            assigneeId: 0,
        });
        setDisputeModalOpen(true);
    };
    const openCloseDisputeModal = (dispute) => {
        setSelectedDispute(dispute);
        setCloseDisputeFormData({
            closeNote: '',
            resolution: 'other',
        });
        setCloseDisputeModalOpen(true);
    };
    const depositColumns = [
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
            key: 'amount',
            title: '押金金额',
            render: (r) => `¥${Number(r.amount).toLocaleString()}`,
        },
        {
            key: 'receivedDate',
            title: '收款日期',
            render: (r) => dayjs(r.receivedDate).format('YYYY-MM-DD'),
        },
        {
            key: 'status',
            title: '状态',
            render: (r) => (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: `px-2 py-1 rounded text-xs ${getStatusColor(r.status, DEPOSIT_STATUS)}`, children: getStatusLabel(r.status, DEPOSIT_STATUS) }), r.hasDispute && (_jsx("span", { className: "px-2 py-1 rounded text-xs bg-red-100 text-red-800", children: "\u6709\u4E89\u8BAE" }))] })),
        },
        {
            key: 'refund',
            title: '退款信息',
            render: (r) => r.refundDate ? `${dayjs(r.refundDate).format('YYYY-MM-DD')} ¥${Number(r.refundAmount).toLocaleString()}` : '-',
        },
    ];
    const disputeColumns = [
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
            key: 'title',
            title: '争议标题',
            render: (r) => r.title,
        },
        {
            key: 'disputedAmount',
            title: '争议金额',
            render: (r) => `¥${Number(r.disputedAmount).toLocaleString()}`,
        },
        {
            key: 'status',
            title: '状态',
            render: (r) => (_jsx("span", { className: `px-2 py-1 rounded text-xs ${getStatusColor(r.status, DISPUTE_STATUS)}`, children: getStatusLabel(r.status, DISPUTE_STATUS) })),
        },
        {
            key: 'createdAt',
            title: '创建时间',
            render: (r) => dayjs(r.createdAt).format('YYYY-MM-DD HH:mm'),
        },
    ];
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsx("h1", { className: "text-2xl font-bold text-gray-800", children: "\u62BC\u91D1\u7BA1\u7406" }) }), _jsx("div", { className: "bg-white rounded-lg shadow", children: _jsx("div", { className: "border-b", children: _jsxs("nav", { className: "flex", children: [_jsx("button", { onClick: () => { setActiveTab('deposits'); setPage(1); }, className: `px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'deposits'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'}`, children: "\u62BC\u91D1\u8BB0\u5F55" }), _jsx("button", { onClick: () => { setActiveTab('disputes'); setPage(1); }, className: `px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'disputes'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'}`, children: "\u62BC\u91D1\u4E89\u8BAE" })] }) }) }), _jsx(SearchFilter, { filters: filters, onChange: setFilters, onSearch: () => setPage(1), statusOptions: activeTab === 'deposits' ? DEPOSIT_STATUS : DISPUTE_STATUS, showDateRange: true, showAssignee: activeTab === 'disputes', assigneeOptions: users.map((u) => ({ value: u.id, label: u.name })) }), activeTab === 'deposits' ? (_jsx(DataTable, { columns: depositColumns, data: deposits, loading: loading, total: total, page: page, pageSize: pageSize, onPageChange: setPage, onPageSizeChange: setPageSize, rowKey: (r) => r.id, actions: (r) => r.status === 'held' && (_jsxs(_Fragment, { children: [user?.role === 'admin' && (_jsx("button", { onClick: () => openRefundModal(r), className: "text-green-600 hover:text-green-800", children: "\u9000\u6B3E" })), _jsx("button", { onClick: () => openDisputeModal(r), className: "text-red-600 hover:text-red-800", children: "\u53D1\u8D77\u4E89\u8BAE" })] })) })) : (_jsx(DataTable, { columns: disputeColumns, data: disputes, loading: loading, total: total, page: page, pageSize: pageSize, onPageChange: setPage, onPageSizeChange: setPageSize, rowKey: (r) => r.id, actions: (r) => r.status !== 'closed' && (_jsx("button", { onClick: () => openCloseDisputeModal(r), className: "text-blue-600 hover:text-blue-800", children: "\u5173\u95ED" })) })), _jsx(Modal, { open: refundModalOpen, title: "\u62BC\u91D1\u9000\u6B3E", onClose: () => setRefundModalOpen(false), width: "max-w-2xl", footer: _jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setRefundModalOpen(false), className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50", children: "\u53D6\u6D88" }), _jsx("button", { onClick: handleRefund, className: "px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700", children: "\u786E\u8BA4\u9000\u6B3E" })] }), children: selectedDeposit && (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "p-4 bg-gray-50 rounded-lg", children: _jsxs("p", { className: "text-sm", children: ["\u623F\u6E90: ", _jsxs("span", { className: "font-medium", children: [selectedDeposit.apartment?.building, " ", selectedDeposit.apartment?.apartmentNo] }), ' | ', "\u5BA2\u6237: ", _jsx("span", { className: "font-medium", children: selectedDeposit.customer?.name }), ' | ', "\u62BC\u91D1\u91D1\u989D: ", _jsxs("span", { className: "font-medium text-green-600", children: ["\u00A5", Number(selectedDeposit.amount).toLocaleString()] })] }) }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u9000\u6B3E\u65E5\u671F *" }), _jsx("input", { type: "date", value: refundFormData.refundDate, onChange: (e) => setRefundFormData({ ...refundFormData, refundDate: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u9000\u6B3E\u91D1\u989D(\u5143) *" }), _jsx("input", { type: "number", value: refundFormData.refundAmount, onChange: (e) => setRefundFormData({ ...refundFormData, refundAmount: Number(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", required: true })] }), _jsxs("div", { className: "col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u6263\u6B3E\u539F\u56E0" }), _jsx("input", { type: "text", value: refundFormData.deductionReason, onChange: (e) => setRefundFormData({ ...refundFormData, deductionReason: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", placeholder: "\u5982\u6709\u6263\u6B3E\uFF0C\u8BF7\u8BF4\u660E\u539F\u56E0" })] }), _jsxs("div", { className: "col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u5907\u6CE8" }), _jsx("textarea", { value: refundFormData.note, onChange: (e) => setRefundFormData({ ...refundFormData, note: e.target.value }), rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-lg", placeholder: "\u5176\u4ED6\u8BF4\u660E..." })] })] })] })) }), _jsx(Modal, { open: disputeModalOpen, title: "\u53D1\u8D77\u62BC\u91D1\u4E89\u8BAE", onClose: () => setDisputeModalOpen(false), width: "max-w-2xl", footer: _jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setDisputeModalOpen(false), className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50", children: "\u53D6\u6D88" }), _jsx("button", { onClick: handleCreateDispute, className: "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700", children: "\u63D0\u4EA4\u4E89\u8BAE" })] }), children: selectedDeposit && (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "p-4 bg-red-50 rounded-lg", children: _jsxs("p", { className: "text-sm text-red-800", children: ["\u623F\u6E90: ", _jsxs("span", { className: "font-medium", children: [selectedDeposit.apartment?.building, " ", selectedDeposit.apartment?.apartmentNo] }), ' | ', "\u5BA2\u6237: ", _jsx("span", { className: "font-medium", children: selectedDeposit.customer?.name }), ' | ', "\u62BC\u91D1\u91D1\u989D: ", _jsxs("span", { className: "font-medium", children: ["\u00A5", Number(selectedDeposit.amount).toLocaleString()] })] }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u4E89\u8BAE\u6807\u9898 *" }), _jsx("input", { type: "text", value: disputeFormData.title, onChange: (e) => setDisputeFormData({ ...disputeFormData, title: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", placeholder: "\u7B80\u8981\u63CF\u8FF0\u4E89\u8BAE\u95EE\u9898", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u4E89\u8BAE\u8BE6\u60C5 *" }), _jsx("textarea", { value: disputeFormData.description, onChange: (e) => setDisputeFormData({ ...disputeFormData, description: e.target.value }), rows: 4, className: "w-full px-3 py-2 border border-gray-300 rounded-lg", placeholder: "\u8BE6\u7EC6\u63CF\u8FF0\u4E89\u8BAE\u60C5\u51B5...", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u4E89\u8BAE\u91D1\u989D(\u5143) *" }), _jsx("input", { type: "number", value: disputeFormData.disputedAmount, onChange: (e) => setDisputeFormData({ ...disputeFormData, disputedAmount: Number(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", required: true })] }), user?.role === 'admin' && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u6307\u5B9A\u5904\u7406\u4EBA" }), _jsxs("select", { value: disputeFormData.assigneeId, onChange: (e) => setDisputeFormData({ ...disputeFormData, assigneeId: Number(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", children: [_jsx("option", { value: 0, children: "\u4E0D\u6307\u5B9A\uFF08\u9ED8\u8BA4\u4E3A\u5F53\u524D\u7528\u6237\uFF09" }), users.map((u) => (_jsx("option", { value: u.id, children: u.name }, u.id)))] })] })), _jsx("div", { className: "p-3 bg-yellow-50 rounded-lg", children: _jsxs("p", { className: "text-sm text-yellow-800", children: [_jsx("span", { className: "font-medium", children: "\u6CE8\u610F\uFF1A" }), "\u53D1\u8D77\u4E89\u8BAE\u540E\u5C06\u81EA\u52A8\u751F\u6210\u9AD8\u4F18\u5148\u7EA7\u5F85\u529E\u4E8B\u9879\uFF0C\u5E76\u53D1\u9001\u7ED9\u5904\u7406\u4EBA\u3002"] }) })] })] })) }), _jsx(Modal, { open: closeDisputeModalOpen, title: "\u5173\u95ED\u62BC\u91D1\u4E89\u8BAE", onClose: () => setCloseDisputeModalOpen(false), width: "max-w-2xl", footer: _jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setCloseDisputeModalOpen(false), className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50", children: "\u53D6\u6D88" }), _jsx("button", { onClick: handleCloseDispute, disabled: !closeDisputeFormData.closeNote.trim(), className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400", children: "\u786E\u8BA4\u5173\u95ED" })] }), children: selectedDispute && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "p-4 bg-gray-50 rounded-lg", children: [_jsxs("p", { className: "text-sm", children: ["\u6807\u9898: ", _jsx("span", { className: "font-medium", children: selectedDispute.title })] }), _jsxs("p", { className: "text-sm mt-1", children: ["\u4E89\u8BAE\u91D1\u989D: ", _jsxs("span", { className: "font-medium text-red-600", children: ["\u00A5", Number(selectedDispute.disputedAmount).toLocaleString()] })] }), _jsx("p", { className: "text-sm mt-1 text-gray-600", children: selectedDispute.description })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u5904\u7406\u7ED3\u679C" }), _jsxs("select", { value: closeDisputeFormData.resolution, onChange: (e) => setCloseDisputeFormData({ ...closeDisputeFormData, resolution: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", children: [_jsx("option", { value: "customer_wins", children: "\u5BA2\u6237\u80DC\u8BC9\uFF08\u5168\u989D\u9000\u6B3E\uFF09" }), _jsx("option", { value: "company_wins", children: "\u516C\u53F8\u80DC\u8BC9\uFF08\u4E0D\u4E88\u9000\u6B3E\uFF09" }), _jsx("option", { value: "partial", children: "\u90E8\u5206\u9000\u6B3E" }), _jsx("option", { value: "other", children: "\u5176\u4ED6" })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["\u5904\u7406\u8BF4\u660E ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("textarea", { value: closeDisputeFormData.closeNote, onChange: (e) => setCloseDisputeFormData({ ...closeDisputeFormData, closeNote: e.target.value }), rows: 4, className: "w-full px-3 py-2 border border-gray-300 rounded-lg", placeholder: "\u8BF7\u8BE6\u7EC6\u8BF4\u660E\u5904\u7406\u8FC7\u7A0B\u548C\u7ED3\u679C\uFF0C\u6B64\u4E3A\u5FC5\u586B\u9879...", required: true }), !closeDisputeFormData.closeNote.trim() && (_jsx("p", { className: "mt-1 text-sm text-red-500", children: "\u5904\u7406\u8BF4\u660E\u4E0D\u80FD\u4E3A\u7A7A" }))] })] })) })] }));
}

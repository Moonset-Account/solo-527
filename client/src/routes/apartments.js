import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import { getStatusLabel, getStatusColor, APARTMENT_STATUS } from '@/utils/constants';
import SearchFilter from '@/components/SearchFilter';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { useAuthStore } from '@/store/authStore';
import dayjs from 'dayjs';
export const Route = createFileRoute('/apartments')({
    component: ApartmentsPage,
});
function ApartmentsPage() {
    const [apartments, setApartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [total, setTotal] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [priceModalOpen, setPriceModalOpen] = useState(false);
    const [editingApartment, setEditingApartment] = useState(null);
    const [priceData, setPriceData] = useState({ monthlyRent: 0, effectiveDate: dayjs().format('YYYY-MM-DD'), reason: '' });
    const [formData, setFormData] = useState({});
    const { user } = useAuthStore();
    const fetchApartments = () => {
        setLoading(true);
        apiClient
            .get('/apartments', { params: { ...filters, page, pageSize } })
            .then((res) => {
            setApartments(res.data.list);
            setTotal(res.data.total);
        })
            .finally(() => setLoading(false));
    };
    useEffect(() => {
        fetchApartments();
    }, [page, pageSize, filters]);
    const handleSubmit = () => {
        const promise = editingApartment
            ? apiClient.put(`/apartments/${editingApartment.id}`, formData)
            : apiClient.post('/apartments', formData);
        promise.then(() => {
            setModalOpen(false);
            fetchApartments();
            setEditingApartment(null);
            setFormData({});
        });
    };
    const handleEdit = (apt) => {
        setEditingApartment(apt);
        setFormData(apt);
        setModalOpen(true);
    };
    const handleStatusChange = (id, status) => {
        if (confirm(`确定要修改房源状态吗？`)) {
            apiClient.patch(`/apartments/${id}/status`, { status }).then(fetchApartments);
        }
    };
    const handlePriceUpdate = (apt) => {
        setEditingApartment(apt);
        setPriceData({ monthlyRent: Number(apt.monthlyRent), effectiveDate: dayjs().format('YYYY-MM-DD'), reason: '' });
        setPriceModalOpen(true);
    };
    const submitPriceUpdate = () => {
        if (editingApartment) {
            apiClient.post(`/apartments/${editingApartment.id}/price`, priceData).then(() => {
                setPriceModalOpen(false);
                fetchApartments();
            });
        }
    };
    const columns = [
        { key: 'apartmentNo', title: '房源编号' },
        { key: 'building', title: '楼栋' },
        { key: 'floor', title: '楼层' },
        { key: 'layout', title: '户型' },
        { key: 'area', title: '面积(㎡)', render: (r) => Number(r.area).toFixed(0) },
        { key: 'monthlyRent', title: '月租金(元)', render: (r) => Number(r.monthlyRent).toLocaleString() },
        {
            key: 'status',
            title: '状态',
            render: (r) => (_jsx("span", { className: `px-2 py-1 rounded text-xs ${getStatusColor(r.status, APARTMENT_STATUS)}`, children: getStatusLabel(r.status, APARTMENT_STATUS) })),
        },
        { key: 'updatedAt', title: '更新时间', render: (r) => dayjs(r.updatedAt).format('YYYY-MM-DD HH:mm') },
    ];
    const layoutOptions = ['一室一厅', '两室一厅', '三室一厅', '两室两厅', '三室两厅'];
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-800", children: "\u623F\u6E90\u7BA1\u7406" }), user?.role === 'admin' && (_jsx("button", { onClick: () => {
                            setEditingApartment(null);
                            setFormData({});
                            setModalOpen(true);
                        }, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: "+ \u65B0\u589E\u623F\u6E90" }))] }), _jsx(SearchFilter, { filters: filters, onChange: setFilters, onSearch: () => setPage(1), statusOptions: APARTMENT_STATUS, extraFilters: _jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u6237\u578B" }), _jsxs("select", { value: filters.layout || '', onChange: (e) => setFilters({ ...filters, layout: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: [_jsx("option", { value: "", children: "\u5168\u90E8\u6237\u578B" }), layoutOptions.map((l) => (_jsx("option", { value: l, children: l }, l)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u6700\u4F4E\u79DF\u91D1" }), _jsx("input", { type: "number", value: filters.minRent || '', onChange: (e) => setFilters({ ...filters, minRent: e.target.value }), placeholder: "\u5143/\u6708", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u6700\u9AD8\u79DF\u91D1" }), _jsx("input", { type: "number", value: filters.maxRent || '', onChange: (e) => setFilters({ ...filters, maxRent: e.target.value }), placeholder: "\u5143/\u6708", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] })] }) }), _jsx(DataTable, { columns: columns, data: apartments, loading: loading, total: total, page: page, pageSize: pageSize, onPageChange: setPage, onPageSizeChange: setPageSize, rowKey: (r) => r.id, actions: (r) => (_jsx(_Fragment, { children: user?.role === 'admin' && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => handleEdit(r), className: "text-blue-600 hover:text-blue-800", children: "\u7F16\u8F91" }), _jsx("button", { onClick: () => handlePriceUpdate(r), className: "text-green-600 hover:text-green-800", children: "\u8C03\u4EF7" }), _jsx("select", { value: r.status, onChange: (e) => handleStatusChange(r.id, e.target.value), className: "text-sm border rounded px-2 py-1", children: APARTMENT_STATUS.map((s) => (_jsx("option", { value: s.value, children: s.label }, s.value))) })] })) })) }), _jsx(Modal, { open: modalOpen, title: editingApartment ? '编辑房源' : '新增房源', onClose: () => setModalOpen(false), width: "max-w-3xl", footer: _jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setModalOpen(false), className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50", children: "\u53D6\u6D88" }), _jsx("button", { onClick: handleSubmit, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: "\u4FDD\u5B58" })] }), children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u623F\u6E90\u7F16\u53F7 *" }), _jsx("input", { type: "text", value: formData.apartmentNo || '', onChange: (e) => setFormData({ ...formData, apartmentNo: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u697C\u680B" }), _jsx("input", { type: "text", value: formData.building || '', onChange: (e) => setFormData({ ...formData, building: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u697C\u5C42" }), _jsx("input", { type: "number", value: formData.floor || '', onChange: (e) => setFormData({ ...formData, floor: Number(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u9762\u79EF(\u33A1)" }), _jsx("input", { type: "number", step: "0.01", value: formData.area || '', onChange: (e) => setFormData({ ...formData, area: Number(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u6237\u578B" }), _jsxs("select", { value: formData.layout || '', onChange: (e) => setFormData({ ...formData, layout: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", children: [_jsx("option", { value: "", children: "\u8BF7\u9009\u62E9" }), layoutOptions.map((l) => (_jsx("option", { value: l, children: l }, l)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u671D\u5411" }), _jsxs("select", { value: formData.orientation || '', onChange: (e) => setFormData({ ...formData, orientation: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", children: [_jsx("option", { value: "", children: "\u8BF7\u9009\u62E9" }), ['南', '北', '东', '西', '东南', '西南', '东北', '西北'].map((o) => (_jsx("option", { value: o, children: o }, o)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u88C5\u4FEE" }), _jsxs("select", { value: formData.decoration || '', onChange: (e) => setFormData({ ...formData, decoration: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", children: [_jsx("option", { value: "", children: "\u8BF7\u9009\u62E9" }), ['精装', '简装', '毛坯'].map((d) => (_jsx("option", { value: d, children: d }, d)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u6708\u79DF\u91D1(\u5143)" }), _jsx("input", { type: "number", value: formData.monthlyRent || '', onChange: (e) => setFormData({ ...formData, monthlyRent: Number(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u62BC\u91D1\u6708\u6570" }), _jsx("input", { type: "number", value: formData.depositMonths || 1, onChange: (e) => setFormData({ ...formData, depositMonths: Number(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg" })] }), _jsxs("div", { className: "col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u623F\u6E90\u63CF\u8FF0" }), _jsx("textarea", { value: formData.description || '', onChange: (e) => setFormData({ ...formData, description: e.target.value }), rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-lg" })] })] }) }), _jsx(Modal, { open: priceModalOpen, title: "\u8C03\u6574\u79DF\u91D1", onClose: () => setPriceModalOpen(false), footer: _jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setPriceModalOpen(false), className: "px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50", children: "\u53D6\u6D88" }), _jsx("button", { onClick: submitPriceUpdate, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: "\u786E\u8BA4" })] }), children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "p-4 bg-gray-50 rounded-lg", children: [_jsxs("p", { className: "text-sm text-gray-600", children: ["\u623F\u6E90: ", _jsx("span", { className: "font-medium", children: editingApartment?.apartmentNo })] }), _jsxs("p", { className: "text-sm text-gray-600 mt-1", children: ["\u5F53\u524D\u79DF\u91D1: ", _jsxs("span", { className: "font-medium", children: ["\u00A5", Number(editingApartment?.monthlyRent || 0).toLocaleString(), "/\u6708"] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u65B0\u79DF\u91D1(\u5143/\u6708) *" }), _jsx("input", { type: "number", value: priceData.monthlyRent, onChange: (e) => setPriceData({ ...priceData, monthlyRent: Number(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u751F\u6548\u65E5\u671F *" }), _jsx("input", { type: "date", value: priceData.effectiveDate, onChange: (e) => setPriceData({ ...priceData, effectiveDate: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u8C03\u6574\u539F\u56E0" }), _jsx("textarea", { value: priceData.reason, onChange: (e) => setPriceData({ ...priceData, reason: e.target.value }), rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-lg" })] })] }) })] }));
}

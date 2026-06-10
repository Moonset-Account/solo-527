import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { apiClient } from '@/api/client';
import { getStatusLabel, getStatusColor, APARTMENT_STATUS, VIEWING_STATUS, LEASE_STATUS, DEPOSIT_STATUS, FOLLOWUP_RESULT } from '@/utils/constants';
import { useAuthStore } from '@/store/authStore';
import dayjs from 'dayjs';
export const Route = createFileRoute('/search')({
    component: SearchPage,
});
function SearchPage() {
    const [keyword, setKeyword] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [status, setStatus] = useState('');
    const [consultantId, setConsultantId] = useState(0);
    const [selectedTypes, setSelectedTypes] = useState(['apartments', 'customers', 'viewings', 'followups', 'leases', 'deposits']);
    const [activeTab, setActiveTab] = useState('apartments');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const { user } = useAuthStore();
    const typeOptions = [
        { value: 'apartments', label: '房源档案', icon: '🏢' },
        { value: 'customers', label: '客户信息', icon: '👥' },
        { value: 'viewings', label: '看房预约', icon: '📅' },
        { value: 'followups', label: '跟进记录', icon: '📝' },
        { value: 'leases', label: '租约档案', icon: '📄' },
        { value: 'deposits', label: '押金记录', icon: '💰' },
    ];
    const statusOptions = [
        { value: '', label: '全部状态' },
        ...APARTMENT_STATUS.map((s) => ({ value: s.value, label: `房源: ${s.label}` })),
        ...VIEWING_STATUS.map((s) => ({ value: s.value, label: `预约: ${s.label}` })),
        ...LEASE_STATUS.filter((s) => s.value !== 'draft').map((s) => ({ value: s.value, label: `租约: ${s.label}` })),
        ...DEPOSIT_STATUS.map((s) => ({ value: s.value, label: `押金: ${s.label}` })),
    ];
    const handleSearch = () => {
        setLoading(true);
        const data = {
            types: selectedTypes,
        };
        if (keyword.trim())
            data.keyword = keyword.trim();
        if (startDate)
            data.startDate = startDate;
        if (endDate)
            data.endDate = endDate;
        if (status)
            data.status = status;
        if (consultantId > 0)
            data.consultantId = consultantId;
        apiClient
            .post('/reports/batch', data)
            .then((res) => {
            setResults(res.data);
            const firstType = selectedTypes.find((t) => res.data[t] && res.data[t].length > 0);
            if (firstType) {
                setActiveTab(firstType);
            }
        })
            .finally(() => setLoading(false));
    };
    const handleExport = () => {
        if (!results)
            return;
        let csv = '类型,详情,状态,日期\n';
        if (results.apartments) {
            results.apartments.forEach((a) => {
                csv += `房源,${a.building} ${a.apartmentNo},${getStatusLabel(a.status, APARTMENT_STATUS)},${dayjs(a.updatedAt).format('YYYY-MM-DD')}\n`;
            });
        }
        if (results.customers) {
            results.customers.forEach((c) => {
                csv += `客户,${c.name} (${c.phone}),,${dayjs(c.createdAt).format('YYYY-MM-DD')}\n`;
            });
        }
        if (results.viewings) {
            results.viewings.forEach((v) => {
                csv += `预约,${v.apartment?.building} ${v.apartment?.apartmentNo} - ${v.customer?.name},${getStatusLabel(v.status, VIEWING_STATUS)},${dayjs(v.viewingDate).format('YYYY-MM-DD')}\n`;
            });
        }
        if (results.followups) {
            results.followups.forEach((f) => {
                csv += `跟进,${f.customer?.name} - ${f.content},${f.result ? getStatusLabel(f.result, FOLLOWUP_RESULT) : ''},${dayjs(f.createdAt).format('YYYY-MM-DD')}\n`;
            });
        }
        if (results.leases) {
            results.leases.forEach((l) => {
                csv += `租约,${l.apartment?.building} ${l.apartment?.apartmentNo} - ${l.customer?.name},${getStatusLabel(l.status, LEASE_STATUS)},${dayjs(l.startDate).format('YYYY-MM-DD')} 至 ${dayjs(l.endDate).format('YYYY-MM-DD')}\n`;
            });
        }
        if (results.deposits) {
            results.deposits.forEach((d) => {
                csv += `押金,${d.apartment?.building} ${d.apartment?.apartmentNo} - ${d.customer?.name},${getStatusLabel(d.status, DEPOSIT_STATUS)}${d.hasDispute ? ' (有争议)' : ''},${dayjs(d.receivedDate).format('YYYY-MM-DD')}\n`;
            });
        }
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `批量查询结果_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
        link.click();
    };
    const toggleType = (type) => {
        if (selectedTypes.includes(type)) {
            if (selectedTypes.length > 1) {
                setSelectedTypes(selectedTypes.filter((t) => t !== type));
            }
        }
        else {
            setSelectedTypes([...selectedTypes, type]);
        }
    };
    const getResultCount = (type) => {
        if (!results)
            return 0;
        return results[type]?.length || 0;
    };
    const totalCount = selectedTypes.reduce((sum, type) => sum + getResultCount(type), 0);
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-800", children: "\u7EFC\u5408\u67E5\u8BE2" }), results && totalCount > 0 && (_jsx("button", { onClick: handleExport, className: "px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors", children: "\uD83D\uDCE5 \u5BFC\u51FACSV" }))] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u5173\u952E\u5B57" }), _jsx("input", { type: "text", value: keyword, onChange: (e) => setKeyword(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", placeholder: "\u623F\u6E90\u53F7/\u5BA2\u6237\u540D/\u7535\u8BDD..." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u5F00\u59CB\u65E5\u671F" }), _jsx("input", { type: "date", value: startDate, onChange: (e) => setStartDate(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u7ED3\u675F\u65E5\u671F" }), _jsx("input", { type: "date", value: endDate, onChange: (e) => setEndDate(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u72B6\u6001" }), _jsx("select", { value: status, onChange: (e) => setStatus(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", children: statusOptions.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) })] }), user?.role === 'admin' && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u987E\u95EE" }), _jsxs("select", { value: consultantId, onChange: (e) => setConsultantId(Number(e.target.value)), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", children: [_jsx("option", { value: 0, children: "\u5168\u90E8\u987E\u95EE" }), users.map((u) => (_jsx("option", { value: u.id, children: u.name }, u.id)))] })] }))] }), _jsxs("div", { className: "mb-6", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "\u67E5\u8BE2\u7C7B\u578B" }), _jsx("div", { className: "flex flex-wrap gap-2", children: typeOptions.map((opt) => (_jsxs("button", { onClick: () => toggleType(opt.value), className: `px-4 py-2 rounded-lg border transition-colors ${selectedTypes.includes(opt.value)
                                        ? 'bg-blue-50 border-blue-500 text-blue-600'
                                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`, children: [_jsx("span", { className: "mr-1", children: opt.icon }), opt.label, results && getResultCount(opt.value) > 0 && (_jsx("span", { className: "ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full", children: getResultCount(opt.value) }))] }, opt.value))) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-sm text-gray-500", children: "\u652F\u6301\u7EC4\u5408\u67E5\u8BE2\uFF1A\u5173\u952E\u5B57 + \u65E5\u671F\u8303\u56F4 + \u72B6\u6001 + \u5904\u7406\u4EBA\uFF0C\u53EF\u540C\u65F6\u67E5\u8BE2\u591A\u79CD\u7C7B\u578B\u6570\u636E" }), _jsx("button", { onClick: handleSearch, disabled: loading, className: "px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors", children: loading ? '查询中...' : '🔍 开始查询' })] })] }), results && totalCount > 0 && (_jsxs("div", { className: "bg-white rounded-lg shadow", children: [_jsx("div", { className: "border-b px-6 py-3", children: _jsxs("p", { className: "text-sm text-gray-600", children: ["\u67E5\u8BE2\u5B8C\u6210\uFF0C\u5171\u627E\u5230 ", _jsx("span", { className: "font-bold text-blue-600", children: totalCount }), " \u6761\u8BB0\u5F55"] }) }), _jsx("div", { className: "border-b", children: _jsx("nav", { className: "flex px-4", children: typeOptions
                                .filter((opt) => selectedTypes.includes(opt.value))
                                .map((opt) => (_jsxs("button", { onClick: () => setActiveTab(opt.value), className: `px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === opt.value
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'}`, children: [opt.icon, " ", opt.label, _jsx("span", { className: "ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full", children: getResultCount(opt.value) })] }, opt.value))) }) }), _jsxs("div", { className: "p-4", children: [activeTab === 'apartments' && results.apartments && (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u623F\u6E90" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u9762\u79EF" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u6708\u79DF\u91D1" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u72B6\u6001" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u66F4\u65B0\u65F6\u95F4" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200", children: results.apartments.map((a) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsxs("td", { className: "px-4 py-3 text-sm", children: [a.building, " ", a.apartmentNo] }), _jsxs("td", { className: "px-4 py-3 text-sm", children: [a.area, " \u33A1"] }), _jsxs("td", { className: "px-4 py-3 text-sm", children: ["\u00A5", Number(a.monthlyRent).toLocaleString()] }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `px-2 py-1 rounded text-xs ${getStatusColor(a.status, APARTMENT_STATUS)}`, children: getStatusLabel(a.status, APARTMENT_STATUS) }) }), _jsx("td", { className: "px-4 py-3 text-sm text-gray-500", children: dayjs(a.updatedAt).format('YYYY-MM-DD HH:mm') })] }, a.id))) })] }) })), activeTab === 'customers' && results.customers && (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u59D3\u540D" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u7535\u8BDD" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u6027\u522B" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u521B\u5EFA\u65F6\u95F4" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200", children: results.customers.map((c) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-4 py-3 text-sm font-medium", children: c.name }), _jsx("td", { className: "px-4 py-3 text-sm", children: c.phone }), _jsx("td", { className: "px-4 py-3 text-sm", children: c.gender === 'male' ? '男' : c.gender === 'female' ? '女' : '-' }), _jsx("td", { className: "px-4 py-3 text-sm text-gray-500", children: dayjs(c.createdAt).format('YYYY-MM-DD HH:mm') })] }, c.id))) })] }) })), activeTab === 'viewings' && results.viewings && (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u623F\u6E90" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u5BA2\u6237" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u987E\u95EE" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u770B\u623F\u65F6\u95F4" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u72B6\u6001" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200", children: results.viewings.map((v) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsxs("td", { className: "px-4 py-3 text-sm", children: [v.apartment?.building, " ", v.apartment?.apartmentNo] }), _jsxs("td", { className: "px-4 py-3 text-sm", children: [v.customer?.name, " (", v.customer?.phone, ")"] }), _jsx("td", { className: "px-4 py-3 text-sm", children: v.consultant?.name }), _jsx("td", { className: "px-4 py-3 text-sm", children: dayjs(v.viewingDate).format('YYYY-MM-DD HH:mm') }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `px-2 py-1 rounded text-xs ${getStatusColor(v.status, VIEWING_STATUS)}`, children: getStatusLabel(v.status, VIEWING_STATUS) }) })] }, v.id))) })] }) })), activeTab === 'followups' && results.followups && (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u5BA2\u6237" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u987E\u95EE" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u7C7B\u578B" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u5185\u5BB9" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u7ED3\u679C" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u65F6\u95F4" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200", children: results.followups.map((f) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsxs("td", { className: "px-4 py-3 text-sm", children: [f.customer?.name, " (", f.customer?.phone, ")"] }), _jsx("td", { className: "px-4 py-3 text-sm", children: f.consultant?.name }), _jsx("td", { className: "px-4 py-3 text-sm", children: f.type === 'phone' ? '电话' : f.type === 'wechat' ? '微信' : f.type === 'visit' ? '到访' : '其他' }), _jsx("td", { className: "px-4 py-3 text-sm max-w-xs truncate", title: f.content, children: f.content }), _jsx("td", { className: "px-4 py-3", children: f.result ? (_jsx("span", { className: "px-2 py-1 rounded text-xs bg-blue-100 text-blue-800", children: getStatusLabel(f.result, FOLLOWUP_RESULT) })) : '-' }), _jsx("td", { className: "px-4 py-3 text-sm text-gray-500", children: dayjs(f.createdAt).format('YYYY-MM-DD HH:mm') })] }, f.id))) })] }) })), activeTab === 'leases' && results.leases && (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u623F\u6E90" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u5BA2\u6237" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u987E\u95EE" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u79DF\u671F" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u6708\u79DF\u91D1" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u72B6\u6001" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200", children: results.leases.map((l) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsxs("td", { className: "px-4 py-3 text-sm", children: [l.apartment?.building, " ", l.apartment?.apartmentNo] }), _jsxs("td", { className: "px-4 py-3 text-sm", children: [l.customer?.name, " (", l.customer?.phone, ")"] }), _jsx("td", { className: "px-4 py-3 text-sm", children: l.consultant?.name }), _jsxs("td", { className: "px-4 py-3 text-sm", children: [dayjs(l.startDate).format('YYYY-MM-DD'), " \u81F3 ", dayjs(l.endDate).format('YYYY-MM-DD')] }), _jsxs("td", { className: "px-4 py-3 text-sm", children: ["\u00A5", Number(l.monthlyRent).toLocaleString()] }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `px-2 py-1 rounded text-xs ${getStatusColor(l.status, LEASE_STATUS)}`, children: getStatusLabel(l.status, LEASE_STATUS) }) })] }, l.id))) })] }) })), activeTab === 'deposits' && results.deposits && (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u623F\u6E90" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u5BA2\u6237" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u62BC\u91D1\u91D1\u989D" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u6536\u6B3E\u65E5\u671F" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase", children: "\u72B6\u6001" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200", children: results.deposits.map((d) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsxs("td", { className: "px-4 py-3 text-sm", children: [d.apartment?.building, " ", d.apartment?.apartmentNo] }), _jsxs("td", { className: "px-4 py-3 text-sm", children: [d.customer?.name, " (", d.customer?.phone, ")"] }), _jsxs("td", { className: "px-4 py-3 text-sm font-medium", children: ["\u00A5", Number(d.amount).toLocaleString()] }), _jsx("td", { className: "px-4 py-3 text-sm", children: dayjs(d.receivedDate).format('YYYY-MM-DD') }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: `px-2 py-1 rounded text-xs ${getStatusColor(d.status, DEPOSIT_STATUS)}`, children: getStatusLabel(d.status, DEPOSIT_STATUS) }), d.hasDispute && (_jsx("span", { className: "px-2 py-1 rounded text-xs bg-red-100 text-red-800", children: "\u4E89\u8BAE" }))] }) })] }, d.id))) })] }) }))] })] })), results && totalCount === 0 && (_jsxs("div", { className: "bg-white rounded-lg shadow p-12 text-center", children: [_jsx("p", { className: "text-gray-500 text-lg", children: "\u672A\u627E\u5230\u7B26\u5408\u6761\u4EF6\u7684\u8BB0\u5F55" }), _jsx("p", { className: "text-gray-400 text-sm mt-2", children: "\u8BF7\u5C1D\u8BD5\u8C03\u6574\u67E5\u8BE2\u6761\u4EF6" })] })), !results && !loading && (_jsxs("div", { className: "bg-white rounded-lg shadow p-12 text-center", children: [_jsx("p", { className: "text-gray-500 text-lg", children: "\u8F93\u5165\u67E5\u8BE2\u6761\u4EF6\u540E\u70B9\u51FB\u5F00\u59CB\u67E5\u8BE2" }), _jsx("p", { className: "text-gray-400 text-sm mt-2", children: "\u53EF\u540C\u65F6\u67E5\u8BE2\u623F\u6E90\u3001\u5BA2\u6237\u3001\u9884\u7EA6\u3001\u8DDF\u8FDB\u3001\u79DF\u7EA6\u3001\u62BC\u91D1\u7B49\u591A\u7C7B\u6570\u636E" })] }))] }));
}

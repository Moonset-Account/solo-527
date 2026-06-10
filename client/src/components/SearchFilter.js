import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import dayjs from 'dayjs';
export default function SearchFilter({ filters, onChange, onSearch, showDateRange = true, showStatus = true, showHandler = false, showAssignee = false, showKeyword = true, statusOptions = [], handlerOptions = [], assigneeOptions = [], extraFilters, }) {
    const [keyword, setKeyword] = useState(filters.keyword || '');
    const [status, setStatus] = useState(filters.status || '');
    const [handlerId, setHandlerId] = useState(filters.consultantId || '');
    const [assigneeId, setAssigneeId] = useState(filters.assigneeId || '');
    const [startDate, setStartDate] = useState(filters.startDate ? dayjs(filters.startDate).format('YYYY-MM-DD') : '');
    const [endDate, setEndDate] = useState(filters.endDate ? dayjs(filters.endDate).format('YYYY-MM-DD') : '');
    const handleSearch = () => {
        const newFilters = {};
        if (keyword)
            newFilters.keyword = keyword;
        if (status)
            newFilters.status = status;
        if (handlerId)
            newFilters.consultantId = Number(handlerId);
        if (assigneeId)
            newFilters.assigneeId = Number(assigneeId);
        if (startDate)
            newFilters.startDate = startDate;
        if (endDate)
            newFilters.endDate = endDate;
        onChange(newFilters);
        onSearch();
    };
    const handleReset = () => {
        setKeyword('');
        setStatus('');
        setHandlerId('');
        setAssigneeId('');
        setStartDate('');
        setEndDate('');
        onChange({});
        onSearch();
    };
    return (_jsxs("div", { className: "bg-white rounded-lg shadow p-4 mb-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [showKeyword && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u5173\u952E\u5B57" }), _jsx("input", { type: "text", value: keyword, onChange: (e) => setKeyword(e.target.value), placeholder: "\u8F93\u5165\u5173\u952E\u5B57\u641C\u7D22...", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", onKeyPress: (e) => e.key === 'Enter' && handleSearch() })] })), showStatus && statusOptions.length > 0 && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u72B6\u6001" }), _jsxs("select", { value: status, onChange: (e) => setStatus(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: [_jsx("option", { value: "", children: "\u5168\u90E8\u72B6\u6001" }), statusOptions.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value)))] })] })), showHandler && handlerOptions.length > 0 && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u5904\u7406\u4EBA" }), _jsxs("select", { value: handlerId, onChange: (e) => setHandlerId(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: [_jsx("option", { value: "", children: "\u5168\u90E8\u5904\u7406\u4EBA" }), handlerOptions.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value)))] })] })), showAssignee && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u5904\u7406\u4EBA" }), _jsxs("select", { value: assigneeId, onChange: (e) => setAssigneeId(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: [_jsx("option", { value: "", children: "\u5168\u90E8\u5904\u7406\u4EBA" }), assigneeOptions.length > 0 ? (assigneeOptions.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value)))) : (_jsx(_Fragment, { children: _jsx("option", { value: "", children: "\u8BF7\u5148\u52A0\u8F7D\u7528\u6237\u5217\u8868" }) }))] })] })), showDateRange && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u5F00\u59CB\u65E5\u671F" }), _jsx("input", { type: "date", value: startDate, onChange: (e) => setStartDate(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] })), showDateRange && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u7ED3\u675F\u65E5\u671F" }), _jsx("input", { type: "date", value: endDate, onChange: (e) => setEndDate(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] })), extraFilters] }), _jsxs("div", { className: "mt-4 flex justify-end gap-2", children: [_jsx("button", { onClick: handleReset, className: "px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors", children: "\u91CD\u7F6E" }), _jsx("button", { onClick: handleSearch, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: "\u641C\u7D22" })] })] }));
}

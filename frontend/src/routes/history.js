import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import { formatDate } from '../lib/utils';
import { Clock, User, Search, Filter } from 'lucide-react';
export const Route = createFileRoute('/history')({
    component: HistoryPage,
});
function HistoryPage() {
    const [entityType, setEntityType] = useState('');
    const [operator, setOperator] = useState('');
    const [searchOperator, setSearchOperator] = useState('');
    const { data: logs } = useQuery({
        queryKey: ['history', entityType, operator],
        queryFn: () => api.history.list({
            ...(entityType ? { entityType } : {}),
            ...(operator ? { operator } : {}),
        }),
    });
    return (_jsxs("div", { className: "p-6", children: [_jsx("h2", { className: "text-2xl font-bold mb-6", children: "\u64CD\u4F5C\u5386\u53F2" }), _jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Filter, { size: 16, className: "text-slate-400" }), _jsxs("select", { value: entityType, onChange: (e) => setEntityType(e.target.value), className: "border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "\u5168\u90E8\u7C7B\u578B" }), _jsx("option", { value: "material", children: "\u7D20\u6750" }), _jsx("option", { value: "script", children: "\u811A\u672C" }), _jsx("option", { value: "schedule", children: "\u6392\u671F" }), _jsx("option", { value: "exception", children: "\u5F02\u5E38" })] })] }), _jsxs("div", { className: "relative flex-1 max-w-xs", children: [_jsx(Search, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }), _jsx("input", { type: "text", placeholder: "\u6309\u64CD\u4F5C\u4EBA\u641C\u7D22...", value: searchOperator, onChange: (e) => setSearchOperator(e.target.value), onKeyDown: (e) => e.key === 'Enter' && setOperator(searchOperator), className: "w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" })] })] }), _jsx("div", { className: "bg-white border border-slate-200 rounded-xl", children: _jsxs("div", { className: "divide-y divide-slate-100", children: [logs?.data.map((log) => (_jsx(HistoryItem, { log: log }, log.id))), logs?.data.length === 0 && (_jsx("div", { className: "text-center py-12 text-slate-400", children: "\u6682\u65E0\u64CD\u4F5C\u5386\u53F2" }))] }) })] }));
}
function HistoryItem({ log }) {
    const actionLabels = {
        create: '创建',
        update: '更新',
        delete: '删除',
        close: '关闭',
    };
    const entityLabels = {
        material: '素材',
        script: '脚本',
        schedule: '排期',
        exception: '异常',
    };
    const actionColors = {
        create: 'bg-green-100 text-green-700',
        update: 'bg-blue-100 text-blue-700',
        delete: 'bg-red-100 text-red-700',
        close: 'bg-slate-100 text-slate-700',
    };
    return (_jsxs("div", { className: "flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5", children: _jsx(User, { size: 14, className: "text-slate-500" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: "font-medium text-sm text-slate-900", children: log.operator }), _jsx("span", { className: `text-xs px-2 py-0.5 rounded-full ${actionColors[log.action] || 'bg-slate-100 text-slate-700'}`, children: actionLabels[log.action] || log.action }), _jsx("span", { className: "text-xs text-slate-400", children: "\u4E86" }), _jsx("span", { className: "text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded", children: entityLabels[log.entityType] || log.entityType })] }), log.details && Object.keys(log.details).length > 0 && (_jsx("p", { className: "text-xs text-slate-500 mt-1", children: Object.entries(log.details)
                            .filter(([k]) => k !== 'tagIds')
                            .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
                            .join(' · ') }))] }), _jsxs("div", { className: "flex items-center gap-1 text-xs text-slate-400 shrink-0", children: [_jsx(Clock, { size: 12 }), formatDate(log.createdAt)] })] }));
}

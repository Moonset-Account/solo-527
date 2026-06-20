import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import { formatDate } from '../lib/utils';
import { AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';
export const Route = createFileRoute('/exceptions')({
    component: ExceptionsPage,
});
function ExceptionsPage() {
    const [filter, setFilter] = useState('');
    const { data: exceptions } = useQuery({
        queryKey: ['exceptions', filter],
        queryFn: () => api.exceptions.list(filter ? { status: filter } : undefined),
    });
    return (_jsxs("div", { className: "p-6", children: [_jsx("h2", { className: "text-2xl font-bold mb-6", children: "\u5F02\u5E38\u5904\u7406\u6E05\u5355" }), _jsx("div", { className: "flex gap-2 mb-4", children: [
                    { value: '', label: '全部' },
                    { value: 'open', label: '待处理' },
                    { value: 'processing', label: '处理中' },
                    { value: 'closed', label: '已关闭' },
                ].map((tab) => (_jsx("button", { onClick: () => setFilter(tab.value), className: `px-4 py-2 text-sm rounded-lg transition-colors ${filter === tab.value
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`, children: tab.label }, tab.value))) }), _jsxs("div", { className: "space-y-3", children: [exceptions?.data.map((ex) => (_jsx(ExceptionCard, { exception: ex }, ex.id))), exceptions?.data.length === 0 && (_jsx("div", { className: "text-center py-12 text-slate-400", children: "\u6682\u65E0\u5F02\u5E38\u8BB0\u5F55" }))] })] }));
}
function ExceptionCard({ exception: ex }) {
    const [showClose, setShowClose] = useState(false);
    const [closeExplanation, setCloseExplanation] = useState('');
    const [handler, setHandler] = useState('');
    const qc = useQueryClient();
    const updateMutation = useMutation({
        mutationFn: (data) => api.exceptions.update(ex.id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['exceptions'] });
            setShowClose(false);
        },
    });
    const statusConfig = {
        open: { icon: _jsx(AlertTriangle, { size: 16 }), bg: 'bg-red-50', text: 'text-red-700', label: '待处理' },
        processing: { icon: _jsx(Clock, { size: 16 }), bg: 'bg-amber-50', text: 'text-amber-700', label: '处理中' },
        closed: { icon: _jsx(CheckCircle, { size: 16 }), bg: 'bg-green-50', text: 'text-green-700', label: '已关闭' },
    };
    const config = statusConfig[ex.status] || statusConfig.open;
    const handleProcessing = () => {
        updateMutation.mutate({ status: 'processing', handler: handler || undefined });
    };
    const handleClose = (e) => {
        e.preventDefault();
        if (!closeExplanation.trim())
            return;
        updateMutation.mutate({
            status: 'closed',
            handler: handler || undefined,
            closeExplanation: closeExplanation.trim(),
        });
    };
    return (_jsxs("div", { className: `bg-white border rounded-xl p-5 ${ex.status === 'open' ? 'border-red-200' : ex.status === 'processing' ? 'border-amber-200' : 'border-slate-200'}`, children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsxs("span", { className: `inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full ${config.bg} ${config.text}`, children: [config.icon, config.label] }), _jsx("span", { className: "text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded", children: ex.type })] }), _jsx("h3", { className: "font-semibold text-slate-900", children: ex.description || ex.type }), _jsxs("div", { className: "text-sm text-slate-500 mt-1", children: ["\u5173\u8054\u6392\u671F\uFF1A", ex.scheduleTitle || '-', " \u00B7 \u5E73\u53F0\uFF1A", ex.platform || '-'] }), _jsxs("div", { className: "text-xs text-slate-400 mt-2", children: ["\u521B\u5EFA\u4EBA\uFF1A", ex.createdBy || '-', " \u00B7 \u521B\u5EFA\u65F6\u95F4\uFF1A", formatDate(ex.createdAt), ex.handler && _jsxs("span", { className: "ml-3", children: ["\u5904\u7406\u4EBA\uFF1A", ex.handler] }), ex.handledAt && _jsxs("span", { className: "ml-3", children: ["\u5904\u7406\u65F6\u95F4\uFF1A", formatDate(ex.handledAt)] })] }), ex.closeExplanation && (_jsxs("div", { className: "mt-3 bg-green-50 border border-green-100 rounded-lg p-3", children: [_jsx("p", { className: "text-xs font-medium text-green-800", children: "\u5173\u95ED\u8BF4\u660E\uFF1A" }), _jsx("p", { className: "text-sm text-green-700 mt-0.5", children: ex.closeExplanation })] }))] }), ex.status !== 'closed' && (_jsxs("div", { className: "flex items-center gap-2 ml-4", children: [ex.status === 'open' && (_jsx("button", { onClick: handleProcessing, className: "text-sm bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors", children: "\u5F00\u59CB\u5904\u7406" })), _jsx("button", { onClick: () => setShowClose(true), className: "text-sm bg-red-50 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors", children: "\u5173\u95ED" })] }))] }), showClose && (_jsxs("div", { className: "mt-4 bg-slate-50 border border-slate-200 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h4", { className: "text-sm font-semibold text-slate-900", children: "\u5173\u95ED\u5F02\u5E38" }), _jsx("button", { onClick: () => setShowClose(false), className: "text-slate-400 hover:text-slate-600", children: _jsx(X, { size: 16 }) })] }), _jsxs("div", { className: "mb-3", children: [_jsx("label", { className: "block text-sm text-slate-600 mb-1", children: "\u5904\u7406\u4EBA" }), _jsx("input", { type: "text", value: handler, onChange: (e) => setHandler(e.target.value), placeholder: "\u54C1\u724C\u5185\u5BB9\u8D1F\u8D23\u4EBA\u59D3\u540D", className: "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { className: "mb-3", children: [_jsxs("label", { className: "block text-sm text-slate-600 mb-1", children: ["\u5173\u95ED\u8BF4\u660E ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("textarea", { value: closeExplanation, onChange: (e) => setCloseExplanation(e.target.value), placeholder: "\u54C1\u724C\u5185\u5BB9\u8D1F\u8D23\u4EBA\u5173\u95ED\u65F6\u5FC5\u987B\u586B\u5199\u8BF4\u660E...", rows: 3, className: "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" }), _jsx("p", { className: "text-xs text-red-500 mt-1", children: "\u54C1\u724C\u5185\u5BB9\u8D1F\u8D23\u4EBA\u5173\u95ED\u5F02\u5E38\u65F6\u5FC5\u987B\u8865\u5145\u8BF4\u660E\u539F\u56E0" })] }), _jsx("div", { className: "flex justify-end", children: _jsx("button", { onClick: handleClose, disabled: !closeExplanation.trim() || updateMutation.isPending, className: "px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors", children: updateMutation.isPending ? '提交中...' : '确认关闭' }) })] }))] }));
}

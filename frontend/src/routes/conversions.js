import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import { formatDate, formatNumber } from '../lib/utils';
import { Plus, X, Eye, BookOpen, Share2, MessageSquare, TrendingUp, BarChart3 } from 'lucide-react';
export const Route = createFileRoute('/conversions')({
    component: ConversionsPage,
});
function ConversionsPage() {
    const [showCreate, setShowCreate] = useState(false);
    const { data: conversions } = useQuery({
        queryKey: ['conversions'],
        queryFn: () => api.conversions.list(),
    });
    const { data: summary } = useQuery({
        queryKey: ['conversions', 'summary'],
        queryFn: () => api.conversions.summary(),
    });
    const { data: schedules } = useQuery({
        queryKey: ['schedules-all'],
        queryFn: () => api.schedules.list({ status: 'published' }),
    });
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-2xl font-bold", children: "\u9605\u8BFB\u8F6C\u5316\u6570\u636E" }), _jsxs("button", { onClick: () => setShowCreate(true), className: "flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors", children: [_jsx(Plus, { size: 18 }), "\u5F55\u5165\u6570\u636E"] })] }), _jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6", children: [_jsx(StatCard, { icon: _jsx(Eye, { size: 18 }), label: "\u603B\u6D4F\u89C8", value: summary?.data?.totalViews ?? 0, color: "blue" }), _jsx(StatCard, { icon: _jsx(BookOpen, { size: 18 }), label: "\u603B\u9605\u8BFB", value: summary?.data?.totalReads ?? 0, color: "green" }), _jsx(StatCard, { icon: _jsx(Share2, { size: 18 }), label: "\u603B\u5206\u4EAB", value: summary?.data?.totalShares ?? 0, color: "amber" }), _jsx(StatCard, { icon: _jsx(MessageSquare, { size: 18 }), label: "\u603B\u8BC4\u8BBA", value: summary?.data?.totalComments ?? 0, color: "purple" })] }), _jsx("div", { className: "bg-white border border-slate-200 rounded-xl overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-slate-50 border-b border-slate-200", children: _jsxs("tr", { children: [_jsx("th", { className: "text-left px-4 py-3 font-medium text-slate-600", children: "\u6392\u671F/\u6587\u7AE0" }), _jsx("th", { className: "text-left px-4 py-3 font-medium text-slate-600", children: "\u5E73\u53F0" }), _jsx("th", { className: "text-right px-4 py-3 font-medium text-slate-600", children: "\u6D4F\u89C8" }), _jsx("th", { className: "text-right px-4 py-3 font-medium text-slate-600", children: "\u9605\u8BFB" }), _jsx("th", { className: "text-right px-4 py-3 font-medium text-slate-600", children: "\u5206\u4EAB" }), _jsx("th", { className: "text-right px-4 py-3 font-medium text-slate-600", children: "\u8BC4\u8BBA" }), _jsx("th", { className: "text-right px-4 py-3 font-medium text-slate-600", children: "\u8F6C\u5316\u7387" }), _jsx("th", { className: "text-left px-4 py-3 font-medium text-slate-600", children: "\u7EDF\u8BA1\u65F6\u95F4" })] }) }), _jsxs("tbody", { className: "divide-y divide-slate-100", children: [conversions?.data.map((conv) => (_jsxs("tr", { className: "hover:bg-slate-50", children: [_jsx("td", { className: "px-4 py-3 font-medium text-slate-900", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(BarChart3, { size: 14, className: "text-slate-400" }), conv.scheduleTitle || conv.scheduleId?.slice(0, 8)] }) }), _jsx("td", { className: "px-4 py-3 text-slate-500", children: conv.platform || '-' }), _jsx("td", { className: "px-4 py-3 text-right text-slate-700 font-mono", children: formatNumber(conv.views) }), _jsx("td", { className: "px-4 py-3 text-right text-green-700 font-mono font-medium", children: formatNumber(conv.reads) }), _jsx("td", { className: "px-4 py-3 text-right text-amber-700 font-mono", children: formatNumber(conv.shares) }), _jsx("td", { className: "px-4 py-3 text-right text-purple-700 font-mono", children: formatNumber(conv.comments) }), _jsx("td", { className: "px-4 py-3 text-right", children: _jsxs("span", { className: "inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full", children: [_jsx(TrendingUp, { size: 10 }), conv.conversionRate || '0', "%"] }) }), _jsx("td", { className: "px-4 py-3 text-xs text-slate-400", children: formatDate(conv.recordedAt) })] }, conv.id))), conversions?.data.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 8, className: "text-center py-12 text-slate-400", children: "\u6682\u65E0\u8F6C\u5316\u6570\u636E\uFF0C\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u5F55\u5165" }) }))] })] }) }) }), showCreate && (_jsx(ConversionModal, { schedules: schedules?.data || [], onClose: () => setShowCreate(false), onSuccess: () => setShowCreate(false) }))] }));
}
function StatCard({ icon, label, value, color, }) {
    const bgColors = { blue: 'bg-blue-50', green: 'bg-green-50', amber: 'bg-amber-50', purple: 'bg-purple-50' };
    const textColors = { blue: 'text-blue-600', green: 'text-green-600', amber: 'text-amber-600', purple: 'text-purple-600' };
    return (_jsx("div", { className: "bg-white border border-slate-200 rounded-xl p-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `w-10 h-10 rounded-lg ${bgColors[color]} flex items-center justify-center ${textColors[color]}`, children: icon }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-slate-500", children: label }), _jsx("p", { className: "text-xl font-bold text-slate-900", children: formatNumber(value) })] })] }) }));
}
function ConversionModal({ schedules, onClose, onSuccess, }) {
    const [scheduleId, setScheduleId] = useState('');
    const [views, setViews] = useState('');
    const [reads, setReads] = useState('');
    const [shares, setShares] = useState('');
    const [comments, setComments] = useState('');
    const [conversionRate, setConversionRate] = useState('');
    const qc = useQueryClient();
    const mutation = useMutation({
        mutationFn: api.conversions.create,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['conversions'] });
            qc.invalidateQueries({ queryKey: ['dashboard'] });
            onSuccess();
        },
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        const viewsNum = Number(views) || 0;
        const readsNum = Number(reads) || 0;
        let rate = conversionRate;
        if (!rate && viewsNum > 0) {
            rate = ((readsNum / viewsNum) * 100).toFixed(2);
        }
        mutation.mutate({
            scheduleId,
            views: viewsNum,
            reads: readsNum,
            shares: Number(shares) || 0,
            comments: Number(comments) || 0,
            conversionRate: rate || '0',
        });
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-bold", children: "\u5F55\u5165\u9605\u8BFB\u8F6C\u5316\u6570\u636E" }), _jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-600", children: _jsx(X, { size: 20 }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "\u5173\u8054\u6392\u671F *" }), _jsxs("select", { value: scheduleId, onChange: (e) => setScheduleId(e.target.value), required: true, className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "\u9009\u62E9\u5DF2\u53D1\u5E03\u7684\u6392\u671F" }), schedules.map((s) => (_jsxs("option", { value: s.id, children: [s.title, " (", s.platform, ")"] }, s.id)))] }), _jsx("p", { className: "text-xs text-slate-400 mt-1", children: "\u53EA\u663E\u793A\u72B6\u6001\u4E3A\u300C\u5DF2\u53D1\u5E03\u300D\u7684\u6392\u671F" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: [_jsx(Eye, { size: 12, className: "inline mr-1" }), "\u6D4F\u89C8\u91CF"] }), _jsx("input", { type: "number", min: "0", value: views, onChange: (e) => setViews(e.target.value), className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: [_jsx(BookOpen, { size: 12, className: "inline mr-1" }), "\u9605\u8BFB\u91CF"] }), _jsx("input", { type: "number", min: "0", value: reads, onChange: (e) => setReads(e.target.value), className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: [_jsx(Share2, { size: 12, className: "inline mr-1" }), "\u5206\u4EAB\u6570"] }), _jsx("input", { type: "number", min: "0", value: shares, onChange: (e) => setShares(e.target.value), className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: [_jsx(MessageSquare, { size: 12, className: "inline mr-1" }), "\u8BC4\u8BBA\u6570"] }), _jsx("input", { type: "number", min: "0", value: comments, onChange: (e) => setComments(e.target.value), className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: [_jsx(TrendingUp, { size: 12, className: "inline mr-1" }), "\u8F6C\u5316\u7387 (%)"] }), _jsx("input", { type: "text", value: conversionRate, onChange: (e) => setConversionRate(e.target.value), placeholder: "\u7559\u7A7A\u5219\u81EA\u52A8\u6309 \u9605\u8BFB/\u6D4F\u89C8 \u8BA1\u7B97", className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-2", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 text-sm text-slate-600 hover:text-slate-800", children: "\u53D6\u6D88" }), _jsx("button", { type: "submit", disabled: mutation.isPending || !scheduleId, className: "px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors", children: mutation.isPending ? '保存中...' : '录入数据' })] })] })] }) }));
}

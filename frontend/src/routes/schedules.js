import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import { formatDate } from '../lib/utils';
import { Plus, X, Calendar, AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react';
export const Route = createFileRoute('/schedules')({
    component: SchedulesPage,
});
const STATUS_CONFIG = {
    draft: { label: '草稿', style: 'bg-slate-100 text-slate-600', icon: _jsx(Clock, { size: 12 }) },
    scheduled: { label: '已排期', style: 'bg-blue-100 text-blue-700', icon: _jsx(Calendar, { size: 12 }) },
    published: { label: '已发布', style: 'bg-green-100 text-green-700', icon: _jsx(CheckCircle, { size: 12 }) },
    failed: { label: '发布失败', style: 'bg-red-100 text-red-700', icon: _jsx(AlertTriangle, { size: 12 }) },
};
function SchedulesPage() {
    const [showCreate, setShowCreate] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const { data: schedules } = useQuery({
        queryKey: ['schedules', statusFilter],
        queryFn: () => api.schedules.list(statusFilter ? { status: statusFilter } : undefined),
    });
    const { data: scripts } = useQuery({
        queryKey: ['scripts-all'],
        queryFn: () => api.scripts.list(),
    });
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-2xl font-bold", children: "\u53D1\u5E03\u6392\u671F" }), _jsxs("button", { onClick: () => setShowCreate(true), className: "flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors", children: [_jsx(Plus, { size: 18 }), "\u65B0\u5EFA\u6392\u671F"] })] }), _jsx("div", { className: "flex gap-2 mb-4", children: [
                    { value: '', label: '全部' },
                    { value: 'draft', label: '草稿' },
                    { value: 'scheduled', label: '已排期' },
                    { value: 'published', label: '已发布' },
                    { value: 'failed', label: '发布失败' },
                ].map((tab) => (_jsx("button", { onClick: () => setStatusFilter(tab.value), className: `px-4 py-2 text-sm rounded-lg transition-colors ${statusFilter === tab.value
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`, children: tab.label }, tab.value))) }), _jsxs("div", { className: "space-y-3", children: [schedules?.data.map((schedule) => (_jsx(ScheduleCard, { schedule: schedule, scripts: scripts?.data || [] }, schedule.id))), schedules?.data.length === 0 && (_jsx("div", { className: "text-center py-12 text-slate-400 bg-white border border-dashed border-slate-200 rounded-lg", children: "\u6682\u65E0\u53D1\u5E03\u6392\u671F" }))] }), showCreate && (_jsx(ScheduleModal, { scripts: scripts?.data || [], onClose: () => setShowCreate(false), onSuccess: () => setShowCreate(false) }))] }));
}
function ScheduleCard({ schedule, scripts }) {
    const [showEdit, setShowEdit] = useState(false);
    const script = scripts.find((s) => s.id === schedule.scriptId);
    const status = STATUS_CONFIG[schedule.status] || STATUS_CONFIG.draft;
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: `bg-white border rounded-lg p-4 transition-all hover:shadow-md ${schedule.status === 'failed' ? 'border-red-200' : 'border-slate-200'}`, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("h3", { className: "font-semibold text-slate-900", children: schedule.title }), _jsxs("span", { className: `inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${status.style}`, children: [status.icon, status.label] })] }), _jsxs("div", { className: "text-sm text-slate-500 space-y-1", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("span", { children: ["\u5E73\u53F0\uFF1A", schedule.platform] }), schedule.scheduledAt && (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Calendar, { size: 12 }), formatDate(schedule.scheduledAt)] })), schedule.publishedAt && (_jsxs("span", { className: "text-green-600", children: ["\u53D1\u5E03\u4E8E\uFF1A", formatDate(schedule.publishedAt)] }))] }), script && (_jsxs("span", { className: "inline-flex items-center gap-1 bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded", children: [_jsx(FileText, { size: 10 }), "\u5173\u8054\u811A\u672C\uFF1A", script.title] })), _jsxs("div", { className: "text-xs text-slate-400 mt-1", children: ["\u8D23\u4EFB\u4EBA\uFF1A", schedule.createdBy, " \u00B7 \u521B\u5EFA\uFF1A", formatDate(schedule.createdAt)] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [schedule.status === 'failed' && (_jsx(Link, { to: "/exceptions", className: "text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded hover:bg-red-100 transition-colors", children: "\u5904\u7406\u5F02\u5E38" })), _jsx("button", { onClick: () => setShowEdit(true), className: "text-sm text-slate-500 hover:text-blue-600", children: "\u7F16\u8F91" })] })] }) }), showEdit && (_jsx(ScheduleModal, { schedule: schedule, scripts: scripts, onClose: () => setShowEdit(false), onSuccess: () => setShowEdit(false) }))] }));
}
function ScheduleModal({ schedule, scripts, onClose, onSuccess, }) {
    const [title, setTitle] = useState(schedule?.title || '');
    const [scriptId, setScriptId] = useState(schedule?.scriptId || '');
    const [platform, setPlatform] = useState(schedule?.platform || '');
    const [scheduledAt, setScheduledAt] = useState(schedule?.scheduledAt ? schedule.scheduledAt.slice(0, 16) : '');
    const [status, setStatus] = useState(schedule?.status || 'draft');
    const [createdBy, setCreatedBy] = useState(schedule?.createdBy || '');
    const qc = useQueryClient();
    const mutation = useMutation({
        mutationFn: (data) => schedule ? api.schedules.update(schedule.id, data) : api.schedules.create(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['schedules'] });
            qc.invalidateQueries({ queryKey: ['exceptions'] });
            qc.invalidateQueries({ queryKey: ['dashboard'] });
            onSuccess();
        },
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            title,
            scriptId: scriptId || undefined,
            platform,
            scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
            status,
            createdBy: createdBy || '匿名',
        };
        mutation.mutate(payload);
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6 shadow-2xl", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-bold", children: schedule ? '编辑发布排期' : '新建发布排期' }), _jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-600", children: _jsx(X, { size: 20 }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "\u6807\u9898 *" }), _jsx("input", { type: "text", value: title, onChange: (e) => setTitle(e.target.value), required: true, className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "\u5E73\u53F0 *" }), _jsxs("select", { value: platform, onChange: (e) => setPlatform(e.target.value), required: true, className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "\u9009\u62E9\u5E73\u53F0" }), _jsx("option", { value: "\u5FAE\u4FE1\u516C\u4F17\u53F7", children: "\u5FAE\u4FE1\u516C\u4F17\u53F7" }), _jsx("option", { value: "\u5FAE\u535A", children: "\u5FAE\u535A" }), _jsx("option", { value: "\u6296\u97F3", children: "\u6296\u97F3" }), _jsx("option", { value: "\u5C0F\u7EA2\u4E66", children: "\u5C0F\u7EA2\u4E66" }), _jsx("option", { value: "\u5B98\u7F51", children: "\u5B98\u7F51" }), _jsx("option", { value: "\u4ECA\u65E5\u5934\u6761", children: "\u4ECA\u65E5\u5934\u6761" }), _jsx("option", { value: "\u5176\u4ED6", children: "\u5176\u4ED6" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "\u72B6\u6001" }), _jsxs("select", { value: status, onChange: (e) => setStatus(e.target.value), className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "draft", children: "\u8349\u7A3F" }), _jsx("option", { value: "scheduled", children: "\u5DF2\u6392\u671F" }), _jsx("option", { value: "published", children: "\u5DF2\u53D1\u5E03" }), _jsx("option", { value: "failed", children: "\u53D1\u5E03\u5931\u8D25\uFF08\u4F1A\u81EA\u52A8\u751F\u6210\u5F02\u5E38\uFF09" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "\u8BA1\u5212\u53D1\u5E03\u65F6\u95F4" }), _jsx("input", { type: "datetime-local", value: scheduledAt, onChange: (e) => setScheduledAt(e.target.value), className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "\u5173\u8054\u811A\u672C" }), _jsxs("select", { value: scriptId, onChange: (e) => setScriptId(e.target.value), className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "\u6682\u4E0D\u5173\u8054" }), scripts.map((s) => (_jsx("option", { value: s.id, children: s.title }, s.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "\u8D23\u4EFB\u4EBA" }), _jsx("input", { type: "text", value: createdBy, onChange: (e) => setCreatedBy(e.target.value), placeholder: "\u8F93\u5165\u59D3\u540D", className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-2", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 text-sm text-slate-600 hover:text-slate-800", children: "\u53D6\u6D88" }), _jsx("button", { type: "submit", disabled: mutation.isPending, className: "px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors", children: mutation.isPending ? '保存中...' : schedule ? '更新排期' : '创建排期' })] })] })] }) }));
}

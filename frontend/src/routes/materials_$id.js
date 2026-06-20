import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatDate } from '../lib/utils';
import { ArrowLeft, FileText, Calendar, Tag, Clock, User } from 'lucide-react';
export const Route = createFileRoute('/materials_$id')({
    component: MaterialDetailPage,
});
function MaterialDetailPage() {
    const { id } = Route.useParams();
    const { data: detail, isLoading } = useQuery({
        queryKey: ['dashboard', 'detail', id],
        queryFn: () => api.dashboard.detail(id),
    });
    const { data: history } = useQuery({
        queryKey: ['history', 'material', id],
        queryFn: () => api.history.byEntity('material', id),
    });
    if (isLoading)
        return _jsx("div", { className: "p-6 text-slate-400", children: "\u52A0\u8F7D\u4E2D..." });
    if (!detail)
        return _jsx("div", { className: "p-6 text-slate-400", children: "\u672A\u627E\u5230\u7D20\u6750" });
    const { material, tags: materialTags, scripts, schedules } = detail.data;
    return (_jsxs("div", { className: "p-6", children: [_jsxs(Link, { to: "/materials", className: "inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 mb-4", children: [_jsx(ArrowLeft, { size: 16 }), "\u8FD4\u56DE\u7D20\u6750\u5217\u8868"] }), _jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-6 mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-slate-900", children: material.title }), material.description && (_jsx("p", { className: "text-slate-600 mt-2", children: material.description })), _jsxs("div", { className: "flex items-center gap-4 mt-4 text-sm text-slate-500", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(User, { size: 14 }), material.uploadedBy] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Clock, { size: 14 }), formatDate(material.createdAt)] }), material.reuseCount != null && material.reuseCount > 0 && (_jsxs("span", { className: "text-amber-600 font-medium", children: ["\u590D\u7528 ", material.reuseCount, " \u6B21"] }))] }), _jsxs("div", { className: "flex items-center gap-2 mt-3", children: [_jsx(Tag, { size: 14, className: "text-slate-400" }), materialTags.map((tag) => (_jsx("span", { className: "inline-block text-xs px-2.5 py-1 rounded-full text-white", style: { backgroundColor: tag.color || '#3b82f6' }, children: tag.name }, tag.id)))] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6", children: [_jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-5", children: [_jsxs("h3", { className: "font-semibold text-slate-900 flex items-center gap-2 mb-3", children: [_jsx(FileText, { size: 18, className: "text-blue-600" }), "\u9009\u9898\u811A\u672C"] }), scripts.length === 0 ? (_jsx("p", { className: "text-sm text-slate-400", children: "\u6682\u65E0\u5173\u8054\u811A\u672C" })) : (_jsx("div", { className: "space-y-3", children: scripts.map((script) => (_jsxs("div", { className: "border border-slate-100 rounded-lg p-3", children: [_jsx("h4", { className: "font-medium text-sm", children: script.title }), script.content && (_jsx("p", { className: "text-xs text-slate-500 mt-1 line-clamp-3", children: script.content })), _jsxs("div", { className: "text-xs text-slate-400 mt-2", children: [script.createdBy, " \u00B7 ", formatDate(script.createdAt)] })] }, script.id))) }))] }), _jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-5", children: [_jsxs("h3", { className: "font-semibold text-slate-900 flex items-center gap-2 mb-3", children: [_jsx(Calendar, { size: 18, className: "text-green-600" }), "\u53D1\u5E03\u6392\u671F"] }), schedules.length === 0 ? (_jsx("p", { className: "text-sm text-slate-400", children: "\u6682\u65E0\u53D1\u5E03\u6392\u671F" })) : (_jsx("div", { className: "space-y-3", children: schedules.map((schedule) => (_jsxs("div", { className: "border border-slate-100 rounded-lg p-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h4", { className: "font-medium text-sm", children: schedule.title }), _jsx(StatusBadge, { status: schedule.status })] }), _jsxs("div", { className: "text-xs text-slate-400 mt-1", children: [schedule.platform, " \u00B7 ", formatDate(schedule.scheduledAt)] }), _jsxs("div", { className: "text-xs text-slate-400", children: [schedule.createdBy, " \u00B7 ", formatDate(schedule.createdAt)] })] }, schedule.id))) }))] })] }), _jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-5", children: [_jsxs("h3", { className: "font-semibold text-slate-900 flex items-center gap-2 mb-3", children: [_jsx(Clock, { size: 18, className: "text-purple-600" }), "\u64CD\u4F5C\u5386\u53F2"] }), history && history.data.length > 0 ? (_jsx("div", { className: "space-y-3", children: history.data.map((log) => (_jsxs("div", { className: "flex items-start gap-3 text-sm", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-slate-300 mt-1.5 shrink-0" }), _jsxs("div", { className: "flex-1", children: [_jsx("span", { className: "text-slate-700 font-medium", children: log.operator }), _jsxs("span", { className: "text-slate-500 ml-1", children: [log.action === 'create' ? '创建了' : log.action === 'update' ? '更新了' : log.action === 'delete' ? '删除了' : log.action, "\u8BE5\u7D20\u6750"] }), _jsx("span", { className: "text-slate-400 ml-2", children: formatDate(log.createdAt) })] })] }, log.id))) })) : (_jsx("p", { className: "text-sm text-slate-400", children: "\u6682\u65E0\u64CD\u4F5C\u5386\u53F2" }))] })] }));
}
function StatusBadge({ status }) {
    const styles = {
        draft: 'bg-slate-100 text-slate-600',
        scheduled: 'bg-blue-100 text-blue-700',
        published: 'bg-green-100 text-green-700',
        failed: 'bg-red-100 text-red-700',
    };
    const labels = {
        draft: '草稿',
        scheduled: '已排期',
        published: '已发布',
        failed: '发布失败',
    };
    return (_jsx("span", { className: `text-xs px-2 py-0.5 rounded-full ${styles[status] || styles.draft}`, children: labels[status] || status }));
}

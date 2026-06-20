import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import { formatDate } from '../lib/utils';
import { ArrowLeft, FileText, Calendar, Tag, Clock, User, Plus, X, AlertTriangle, CheckCircle } from 'lucide-react';
export const Route = createFileRoute('/materials/$id')({
    component: MaterialDetailPage,
});
function MaterialDetailPage() {
    const { id } = Route.useParams();
    const [showScriptModal, setShowScriptModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
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
    return (_jsxs("div", { className: "p-6", children: [_jsxs(Link, { to: "/materials", className: "inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 mb-4", children: [_jsx(ArrowLeft, { size: 16 }), "\u8FD4\u56DE\u7D20\u6750\u5217\u8868"] }), _jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-6 mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-slate-900", children: material.title }), material.description && (_jsx("p", { className: "text-slate-600 mt-2", children: material.description })), _jsxs("div", { className: "flex items-center gap-4 mt-4 text-sm text-slate-500 flex-wrap", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(User, { size: 14 }), material.uploadedBy] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Clock, { size: 14 }), formatDate(material.createdAt)] }), material.reuseCount != null && material.reuseCount > 0 && (_jsxs("span", { className: "text-amber-600 font-medium", children: ["\u590D\u7528 ", material.reuseCount, " \u6B21"] })), material.fileUrl && (_jsx("a", { href: material.fileUrl, target: "_blank", rel: "noreferrer", className: "text-blue-600 hover:underline", children: "\u67E5\u770B\u6587\u4EF6" }))] }), _jsxs("div", { className: "flex items-center gap-2 mt-3", children: [_jsx(Tag, { size: 14, className: "text-slate-400" }), materialTags.length > 0 ? (materialTags.map((tag) => (_jsx("span", { className: "inline-block text-xs px-2.5 py-1 rounded-full text-white", style: { backgroundColor: tag.color || '#3b82f6' }, children: tag.name }, tag.id)))) : (_jsx("span", { className: "text-xs text-slate-400", children: "\u6682\u65E0\u6807\u7B7E" }))] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6", children: [_jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("h3", { className: "font-semibold text-slate-900 flex items-center gap-2", children: [_jsx(FileText, { size: 18, className: "text-blue-600" }), "\u9009\u9898\u811A\u672C (", scripts.length, ")"] }), _jsxs("button", { onClick: () => setShowScriptModal(true), className: "flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors", children: [_jsx(Plus, { size: 14 }), "\u65B0\u5EFA\u811A\u672C"] })] }), scripts.length === 0 ? (_jsx("p", { className: "text-sm text-slate-400", children: "\u6682\u65E0\u5173\u8054\u811A\u672C\uFF0C\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u57FA\u4E8E\u6B64\u7D20\u6750\u521B\u5EFA" })) : (_jsx("div", { className: "space-y-3", children: scripts.map((script) => (_jsxs("div", { className: "border border-slate-100 rounded-lg p-3", children: [_jsx("h4", { className: "font-medium text-sm text-slate-900", children: script.title }), script.content && (_jsx("p", { className: "text-xs text-slate-500 mt-1 whitespace-pre-wrap line-clamp-3", children: script.content })), _jsxs("div", { className: "text-xs text-slate-400 mt-2", children: [_jsx(User, { size: 10, className: "inline mr-0.5" }), script.createdBy, " \u00B7 ", formatDate(script.createdAt)] })] }, script.id))) }))] }), _jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("h3", { className: "font-semibold text-slate-900 flex items-center gap-2", children: [_jsx(Calendar, { size: 18, className: "text-green-600" }), "\u53D1\u5E03\u6392\u671F (", schedules.length, ")"] }), _jsxs("button", { onClick: () => setShowScheduleModal(true), className: "flex items-center gap-1 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors", children: [_jsx(Plus, { size: 14 }), "\u65B0\u5EFA\u6392\u671F"] })] }), schedules.length === 0 ? (_jsx("p", { className: "text-sm text-slate-400", children: "\u6682\u65E0\u53D1\u5E03\u6392\u671F\uFF0C\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u521B\u5EFA" })) : (_jsx("div", { className: "space-y-3", children: schedules.map((schedule) => (_jsxs("div", { className: "border border-slate-100 rounded-lg p-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h4", { className: "font-medium text-sm text-slate-900", children: schedule.title }), _jsx(StatusBadge, { status: schedule.status })] }), _jsxs("div", { className: "text-xs text-slate-400 mt-1", children: [schedule.platform, " \u00B7 ", schedule.scheduledAt ? formatDate(schedule.scheduledAt) : '未排期'] }), _jsxs("div", { className: "text-xs text-slate-400", children: [_jsx(User, { size: 10, className: "inline mr-0.5" }), schedule.createdBy, " \u00B7 ", formatDate(schedule.createdAt)] })] }, schedule.id))) }))] })] }), _jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-5 mb-6", children: [_jsxs("h3", { className: "font-semibold text-slate-900 flex items-center gap-2 mb-3", children: [_jsx(Clock, { size: 18, className: "text-purple-600" }), "\u64CD\u4F5C\u5386\u53F2"] }), history && history.data.length > 0 ? (_jsx("div", { className: "space-y-3", children: history.data.map((log) => (_jsxs("div", { className: "flex items-start gap-3 text-sm", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-slate-300 mt-1.5 shrink-0" }), _jsxs("div", { className: "flex-1", children: [_jsx("span", { className: "text-slate-700 font-medium", children: log.operator }), _jsxs("span", { className: "text-slate-500 ml-1", children: [log.action === 'create' ? '创建了' : log.action === 'update' ? '更新了' : log.action === 'delete' ? '删除了' : log.action, "\u8BE5\u7D20\u6750"] }), _jsx("span", { className: "text-slate-400 ml-2", children: formatDate(log.createdAt) })] })] }, log.id))) })) : (_jsx("p", { className: "text-sm text-slate-400", children: "\u6682\u65E0\u64CD\u4F5C\u5386\u53F2" }))] }), showScriptModal && (_jsx(ScriptModal, { materialId: id, materialTitle: material.title, onClose: () => setShowScriptModal(false), onSuccess: () => {
                    setShowScriptModal(false);
                } })), showScheduleModal && (_jsx(ScheduleModal, { scripts: scripts, materialTitle: material.title, onClose: () => setShowScheduleModal(false), onSuccess: () => setShowScheduleModal(false) }))] }));
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
    const Icons = {
        draft: _jsx(Clock, { size: 10 }),
        scheduled: _jsx(Calendar, { size: 10 }),
        published: _jsx(CheckCircle, { size: 10 }),
        failed: _jsx(AlertTriangle, { size: 10 }),
    };
    return (_jsxs("span", { className: `inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${styles[status] || styles.draft}`, children: [Icons[status], labels[status] || status] }));
}
function ScriptModal({ materialId, materialTitle, onClose, onSuccess, }) {
    const [title, setTitle] = useState(`${materialTitle} - 脚本`);
    const [content, setContent] = useState('');
    const [createdBy, setCreatedBy] = useState('');
    const qc = useQueryClient();
    const mutation = useMutation({
        mutationFn: (data) => api.scripts.create(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['dashboard', 'detail'] });
            qc.invalidateQueries({ queryKey: ['scripts'] });
            onSuccess();
        },
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate({
            title,
            content: content || undefined,
            materialId,
            createdBy: createdBy || '匿名',
        });
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6 shadow-2xl", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-bold", children: "\u57FA\u4E8E\u7D20\u6750\u65B0\u5EFA\u9009\u9898\u811A\u672C" }), _jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-600", children: _jsx(X, { size: 20 }) })] }), _jsxs("div", { className: "mb-4 text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2", children: ["\u5173\u8054\u7D20\u6750\uFF1A", materialTitle] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "\u811A\u672C\u6807\u9898 *" }), _jsx("input", { type: "text", value: title, onChange: (e) => setTitle(e.target.value), required: true, className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "\u811A\u672C\u5185\u5BB9" }), _jsx("textarea", { value: content, onChange: (e) => setContent(e.target.value), rows: 8, placeholder: "\u8F93\u5165\u9009\u9898\u811A\u672C\u6B63\u6587...", className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "\u8D23\u4EFB\u4EBA" }), _jsx("input", { type: "text", value: createdBy, onChange: (e) => setCreatedBy(e.target.value), placeholder: "\u8F93\u5165\u59D3\u540D", className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-2", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 text-sm text-slate-600 hover:text-slate-800", children: "\u53D6\u6D88" }), _jsx("button", { type: "submit", disabled: mutation.isPending, className: "px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors", children: mutation.isPending ? '保存中...' : '创建脚本' })] })] })] }) }));
}
function ScheduleModal({ scripts, materialTitle, onClose, onSuccess, }) {
    const [title, setTitle] = useState(`${materialTitle} - 发布`);
    const [scriptId, setScriptId] = useState(scripts[0]?.id || '');
    const [platform, setPlatform] = useState('');
    const [scheduledAt, setScheduledAt] = useState('');
    const [status, setStatus] = useState('draft');
    const [createdBy, setCreatedBy] = useState('');
    const qc = useQueryClient();
    const mutation = useMutation({
        mutationFn: (data) => api.schedules.create(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['dashboard', 'detail'] });
            qc.invalidateQueries({ queryKey: ['schedules'] });
            qc.invalidateQueries({ queryKey: ['exceptions'] });
            onSuccess();
        },
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate({
            title,
            scriptId: scriptId || undefined,
            platform,
            scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
            status,
            createdBy: createdBy || '匿名',
        });
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6 shadow-2xl", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-bold", children: "\u57FA\u4E8E\u7D20\u6750\u65B0\u5EFA\u53D1\u5E03\u6392\u671F" }), _jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-600", children: _jsx(X, { size: 20 }) })] }), _jsxs("div", { className: "mb-4 text-xs text-slate-500 bg-green-50 border border-green-100 rounded-lg px-3 py-2", children: ["\u5173\u8054\u7D20\u6750\uFF1A", materialTitle] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "\u6392\u671F\u6807\u9898 *" }), _jsx("input", { type: "text", value: title, onChange: (e) => setTitle(e.target.value), required: true, className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "\u53D1\u5E03\u5E73\u53F0 *" }), _jsxs("select", { value: platform, onChange: (e) => setPlatform(e.target.value), required: true, className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "\u9009\u62E9\u5E73\u53F0" }), _jsx("option", { value: "\u5FAE\u4FE1\u516C\u4F17\u53F7", children: "\u5FAE\u4FE1\u516C\u4F17\u53F7" }), _jsx("option", { value: "\u5FAE\u535A", children: "\u5FAE\u535A" }), _jsx("option", { value: "\u6296\u97F3", children: "\u6296\u97F3" }), _jsx("option", { value: "\u5C0F\u7EA2\u4E66", children: "\u5C0F\u7EA2\u4E66" }), _jsx("option", { value: "\u5B98\u7F51", children: "\u5B98\u7F51" }), _jsx("option", { value: "\u4ECA\u65E5\u5934\u6761", children: "\u4ECA\u65E5\u5934\u6761" }), _jsx("option", { value: "\u5176\u4ED6", children: "\u5176\u4ED6" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "\u72B6\u6001" }), _jsxs("select", { value: status, onChange: (e) => setStatus(e.target.value), className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "draft", children: "\u8349\u7A3F" }), _jsx("option", { value: "scheduled", children: "\u5DF2\u6392\u671F" }), _jsx("option", { value: "published", children: "\u5DF2\u53D1\u5E03" }), _jsx("option", { value: "failed", children: "\u53D1\u5E03\u5931\u8D25\uFF08\u4F1A\u81EA\u52A8\u751F\u6210\u5F02\u5E38\uFF09" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "\u8BA1\u5212\u53D1\u5E03\u65F6\u95F4" }), _jsx("input", { type: "datetime-local", value: scheduledAt, onChange: (e) => setScheduledAt(e.target.value), className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "\u5173\u8054\u811A\u672C" }), _jsxs("select", { value: scriptId, onChange: (e) => setScriptId(e.target.value), className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "\u6682\u4E0D\u5173\u8054" }), scripts.map((s) => (_jsx("option", { value: s.id, children: s.title }, s.id)))] }), scripts.length === 0 && (_jsx("p", { className: "text-xs text-amber-600 mt-1", children: "\u6B64\u7D20\u6750\u6682\u65E0\u811A\u672C\uFF0C\u53EF\u5148\u521B\u5EFA\u811A\u672C\u540E\u518D\u5173\u8054" }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "\u8D23\u4EFB\u4EBA" }), _jsx("input", { type: "text", value: createdBy, onChange: (e) => setCreatedBy(e.target.value), placeholder: "\u8F93\u5165\u59D3\u540D", className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-2", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 text-sm text-slate-600 hover:text-slate-800", children: "\u53D6\u6D88" }), _jsx("button", { type: "submit", disabled: mutation.isPending || !platform, className: "px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors", children: mutation.isPending ? '保存中...' : '创建排期' })] })] })] }) }));
}

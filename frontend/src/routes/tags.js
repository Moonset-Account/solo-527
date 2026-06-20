import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import { Plus, Trash2, X, Tag as TagIcon } from 'lucide-react';
export const Route = createFileRoute('/tags')({
    component: TagsPage,
});
function TagsPage() {
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('#3b82f6');
    const qc = useQueryClient();
    const { data: tags } = useQuery({
        queryKey: ['tags'],
        queryFn: () => api.tags.list(),
    });
    const { data: tagDist } = useQuery({
        queryKey: ['dashboard', 'tag-distribution'],
        queryFn: () => api.dashboard.tagDistribution(),
    });
    const createMutation = useMutation({
        mutationFn: api.tags.create,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['tags'] });
            setShowCreate(false);
            setNewName('');
            setNewColor('#3b82f6');
        },
    });
    const deleteMutation = useMutation({
        mutationFn: api.tags.delete,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
    });
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-2xl font-bold", children: "\u6807\u7B7E\u7BA1\u7406" }), _jsxs("button", { onClick: () => setShowCreate(true), className: "flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors", children: [_jsx(Plus, { size: 18 }), "\u65B0\u5EFA\u6807\u7B7E"] })] }), tagDist && tagDist.data.length > 0 && (_jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-5 mb-6", children: [_jsx("h3", { className: "font-semibold text-slate-900 mb-4", children: "\u6807\u7B7E\u5206\u5E03" }), _jsx("div", { className: "flex flex-wrap gap-3", children: tagDist.data.map((tag) => (_jsxs("div", { className: "flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2", children: [_jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: tag.color || '#3b82f6' } }), _jsx("span", { className: "text-sm font-medium text-slate-700", children: tag.name }), _jsxs("span", { className: "text-xs text-slate-400 bg-white px-1.5 py-0.5 rounded", children: [tag.count, "\u4E2A\u7D20\u6750"] })] }, tag.id))) })] })), _jsx("div", { className: "bg-white border border-slate-200 rounded-xl", children: _jsxs("div", { className: "divide-y divide-slate-100", children: [tags?.data.map((tag) => (_jsxs("div", { className: "flex items-center justify-between p-4 hover:bg-slate-50 transition-colors", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-8 h-8 rounded-lg flex items-center justify-center", style: { backgroundColor: tag.color || '#3b82f6' }, children: _jsx(TagIcon, { size: 16, className: "text-white" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-slate-900", children: tag.name }), _jsxs("p", { className: "text-xs text-slate-400", children: ["\u521B\u5EFA\u4E8E ", new Date(tag.createdAt).toLocaleDateString('zh-CN'), tag.usageCount != null && ` · ${tag.usageCount}个素材使用`] })] })] }), _jsx("button", { onClick: () => {
                                        if (confirm(`确认删除标签「${tag.name}」？`)) {
                                            deleteMutation.mutate(tag.id);
                                        }
                                    }, className: "text-slate-400 hover:text-red-500 transition-colors", children: _jsx(Trash2, { size: 16 }) })] }, tag.id))), tags?.data.length === 0 && (_jsx("div", { className: "text-center py-12 text-slate-400", children: "\u6682\u65E0\u6807\u7B7E" }))] }) }), showCreate && (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-xl w-full max-w-md p-6 shadow-2xl", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-bold", children: "\u65B0\u5EFA\u6807\u7B7E" }), _jsx("button", { onClick: () => setShowCreate(false), className: "text-slate-400 hover:text-slate-600", children: _jsx(X, { size: 20 }) })] }), _jsxs("form", { onSubmit: (e) => {
                                e.preventDefault();
                                if (!newName.trim())
                                    return;
                                createMutation.mutate({ name: newName.trim(), color: newColor });
                            }, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "\u6807\u7B7E\u540D\u79F0 *" }), _jsx("input", { type: "text", value: newName, onChange: (e) => setNewName(e.target.value), required: true, className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "\u989C\u8272" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("input", { type: "color", value: newColor, onChange: (e) => setNewColor(e.target.value), className: "w-10 h-10 rounded cursor-pointer" }), _jsx("span", { className: "text-sm text-slate-500", children: newColor }), _jsx("div", { className: "flex gap-1.5 ml-3", children: ['#3b82f6', '#16a34a', '#f59e0b', '#dc2626', '#8b5cf6', '#ec4899'].map((c) => (_jsx("button", { type: "button", onClick: () => setNewColor(c), className: "w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform", style: { backgroundColor: c } }, c))) })] })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-2", children: [_jsx("button", { type: "button", onClick: () => setShowCreate(false), className: "px-4 py-2 text-sm text-slate-600 hover:text-slate-800", children: "\u53D6\u6D88" }), _jsx("button", { type: "submit", disabled: createMutation.isPending, className: "px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors", children: createMutation.isPending ? '创建中...' : '创建标签' })] })] })] }) }))] }));
}

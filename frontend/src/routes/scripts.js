import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import { formatDate } from '../lib/utils';
import { Plus, X, FileText, Link as LinkIcon } from 'lucide-react';
export const Route = createFileRoute('/scripts')({
    component: ScriptsPage,
});
function ScriptsPage() {
    const [showCreate, setShowCreate] = useState(false);
    const [materialFilter, setMaterialFilter] = useState('');
    const { data: scripts } = useQuery({
        queryKey: ['scripts', materialFilter],
        queryFn: () => api.scripts.list(materialFilter ? { materialId: materialFilter } : undefined),
    });
    const { data: materials } = useQuery({
        queryKey: ['materials-select'],
        queryFn: () => api.materials.list({ limit: '100' }),
    });
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-2xl font-bold", children: "\u9009\u9898\u811A\u672C" }), _jsxs("button", { onClick: () => setShowCreate(true), className: "flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors", children: [_jsx(Plus, { size: 18 }), "\u65B0\u5EFA\u811A\u672C"] })] }), _jsx("div", { className: "mb-4", children: _jsxs("select", { value: materialFilter, onChange: (e) => setMaterialFilter(e.target.value), className: "border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "\u5168\u90E8\u7D20\u6750\u7684\u811A\u672C" }), materials?.data.map((m) => (_jsx("option", { value: m.id, children: m.title }, m.id)))] }) }), _jsxs("div", { className: "grid gap-3", children: [scripts?.data.map((script) => (_jsx(ScriptCard, { script: script, materials: materials?.data || [] }, script.id))), scripts?.data.length === 0 && (_jsx("div", { className: "text-center py-12 text-slate-400 bg-white border border-dashed border-slate-200 rounded-lg", children: "\u6682\u65E0\u9009\u9898\u811A\u672C\uFF0C\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u65B0\u5EFA" }))] }), showCreate && (_jsx(ScriptModal, { materials: materials?.data || [], onClose: () => setShowCreate(false), onSuccess: () => setShowCreate(false) }))] }));
}
function ScriptCard({ script, materials }) {
    const material = materials.find((m) => m.id === script.materialId);
    const [showEdit, setShowEdit] = useState(false);
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("h3", { className: "font-semibold text-slate-900 flex items-center gap-2", children: [_jsx(FileText, { size: 16, className: "text-blue-600" }), script.title] }), script.content && (_jsx("p", { className: "text-sm text-slate-500 mt-2 whitespace-pre-wrap line-clamp-4", children: script.content })), _jsxs("div", { className: "flex items-center gap-3 mt-3 text-xs text-slate-400", children: [_jsxs("span", { children: ["\u4F5C\u8005\uFF1A", script.createdBy] }), _jsxs("span", { children: ["\u521B\u5EFA\uFF1A", formatDate(script.createdAt)] }), script.updatedAt !== script.createdAt && (_jsxs("span", { children: ["\u66F4\u65B0\uFF1A", formatDate(script.updatedAt)] })), material && (_jsxs("span", { className: "flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded", children: [_jsx(LinkIcon, { size: 10 }), "\u7D20\u6750\uFF1A", material.title] }))] })] }), _jsx("button", { onClick: () => setShowEdit(true), className: "text-sm text-slate-500 hover:text-blue-600", children: "\u7F16\u8F91" })] }) }), showEdit && (_jsx(ScriptModal, { script: script, materials: materials, onClose: () => setShowEdit(false), onSuccess: () => setShowEdit(false) }))] }));
}
function ScriptModal({ script, materials, onClose, onSuccess, }) {
    const [title, setTitle] = useState(script?.title || '');
    const [content, setContent] = useState(script?.content || '');
    const [materialId, setMaterialId] = useState(script?.materialId || '');
    const [createdBy, setCreatedBy] = useState(script?.createdBy || '');
    const qc = useQueryClient();
    const mutation = useMutation({
        mutationFn: (data) => script ? api.scripts.update(script.id, data) : api.scripts.create(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['scripts'] });
            onSuccess();
        },
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate({
            title,
            content: content || undefined,
            materialId: materialId || undefined,
            createdBy: createdBy || '匿名',
        });
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6 shadow-2xl", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-bold", children: script ? '编辑选题脚本' : '新建选题脚本' }), _jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-600", children: _jsx(X, { size: 20 }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "\u6807\u9898 *" }), _jsx("input", { type: "text", value: title, onChange: (e) => setTitle(e.target.value), required: true, className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "\u5173\u8054\u7D20\u6750" }), _jsxs("select", { value: materialId, onChange: (e) => setMaterialId(e.target.value), className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "\u6682\u4E0D\u5173\u8054" }), materials.map((m) => (_jsx("option", { value: m.id, children: m.title }, m.id)))] }), _jsx("p", { className: "text-xs text-slate-400 mt-1", children: "\u5173\u8054\u540E\u53EF\u5728\u7D20\u6750\u8BE6\u60C5\u9875\u770B\u5230\u8BE5\u811A\u672C" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "\u811A\u672C\u5185\u5BB9" }), _jsx("textarea", { value: content || '', onChange: (e) => setContent(e.target.value), rows: 8, placeholder: "\u8F93\u5165\u9009\u9898\u811A\u672C\u6B63\u6587...", className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "\u8D23\u4EFB\u4EBA" }), _jsx("input", { type: "text", value: createdBy, onChange: (e) => setCreatedBy(e.target.value), placeholder: "\u8F93\u5165\u59D3\u540D", className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-2", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 text-sm text-slate-600 hover:text-slate-800", children: "\u53D6\u6D88" }), _jsx("button", { type: "submit", disabled: mutation.isPending, className: "px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors", children: mutation.isPending ? '保存中...' : script ? '更新脚本' : '创建脚本' })] })] })] }) }));
}

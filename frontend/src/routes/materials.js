import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import { formatDate } from '../lib/utils';
import { Plus, Search, FileText, X, Filter } from 'lucide-react';
export const Route = createFileRoute('/materials')({
    component: MaterialsPage,
});
function MaterialsPage() {
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [selectedTag, setSelectedTag] = useState('');
    const [showUpload, setShowUpload] = useState(false);
    const qc = useQueryClient();
    const queryParams = {};
    if (search)
        queryParams.q = search;
    if (selectedTag)
        queryParams.tag = selectedTag;
    const { data: materials } = useQuery({
        queryKey: ['materials', search, selectedTag],
        queryFn: () => api.materials.list(queryParams),
    });
    const { data: tags } = useQuery({
        queryKey: ['tags'],
        queryFn: () => api.tags.list(),
    });
    const { data: reuseSuggestions } = useQuery({
        queryKey: ['materials', 'reuse'],
        queryFn: () => api.materials.reuseSuggestions(),
    });
    const handleSearch = (e) => {
        e.preventDefault();
        setSearch(searchInput.trim());
    };
    const handleTagChange = (tagId) => {
        setSelectedTag(tagId);
    };
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-2xl font-bold", children: "\u7D20\u6750\u7BA1\u7406" }), _jsxs("button", { onClick: () => setShowUpload(true), className: "flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors", children: [_jsx(Plus, { size: 18 }), "\u4E0A\u4F20\u7D20\u6750"] })] }), reuseSuggestions && reuseSuggestions.data.length > 0 && (_jsxs("div", { className: "mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4", children: [_jsx("h3", { className: "text-sm font-semibold text-amber-800 mb-2", children: "\u7D20\u6750\u590D\u7528\u63D0\u9192" }), _jsx("div", { className: "flex flex-wrap gap-2", children: reuseSuggestions.data.map((m) => (_jsxs(Link, { to: "/materials/$id", params: { id: m.id }, className: "inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-sm hover:bg-amber-200 transition-colors", children: [_jsx(FileText, { size: 14 }), m.title, _jsxs("span", { className: "text-amber-600", children: ["(", m.reuseCount, "\u6B21\u590D\u7528)"] })] }, m.id))) })] })), _jsxs("form", { onSubmit: handleSearch, className: "flex items-center gap-3 mb-4", children: [_jsxs("div", { className: "relative flex-1 max-w-md", children: [_jsx(Search, { size: 18, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }), _jsx("input", { type: "text", placeholder: "\u641C\u7D22\u7D20\u6750\u6807\u9898...", value: searchInput, onChange: (e) => setSearchInput(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsx("button", { type: "submit", className: "bg-slate-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-800 transition-colors", children: "\u641C\u7D22" }), (search || selectedTag) && (_jsx("button", { type: "button", onClick: () => {
                            setSearch('');
                            setSearchInput('');
                            setSelectedTag('');
                        }, className: "text-sm text-slate-500 hover:text-slate-700", children: "\u6E05\u9664\u7B5B\u9009" }))] }), _jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx(Filter, { size: 14, className: "text-slate-400" }), _jsx("span", { className: "text-sm text-slate-500", children: "\u6309\u6807\u7B7E\u7B5B\u9009\uFF1A" }), _jsx("button", { type: "button", onClick: () => handleTagChange(''), className: `text-xs px-3 py-1 rounded-full transition-colors ${selectedTag === ''
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`, children: "\u5168\u90E8" }), tags?.data.map((tag) => (_jsxs("button", { type: "button", onClick: () => handleTagChange(tag.id), className: `text-xs px-3 py-1 rounded-full transition-colors ${selectedTag === tag.id
                            ? 'text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`, style: selectedTag === tag.id ? { backgroundColor: tag.color || '#3b82f6' } : undefined, children: [tag.name, tag.usageCount != null && (_jsxs("span", { className: "ml-1 opacity-70", children: ["(", tag.usageCount, ")"] }))] }, tag.id)))] }), _jsxs("div", { className: "grid gap-3", children: [materials?.data.map((material) => (_jsx(MaterialCard, { material: material }, material.id))), materials?.data.length === 0 && (_jsx("div", { className: "text-center py-12 text-slate-400 bg-white border border-dashed border-slate-200 rounded-lg", children: search || selectedTag ? '没有符合条件的素材' : '暂无素材，点击上方按钮上传' }))] }), showUpload && (_jsx(UploadModal, { tags: tags?.data || [], onClose: () => setShowUpload(false), onSuccess: () => {
                    setShowUpload(false);
                    qc.invalidateQueries({ queryKey: ['materials'] });
                } }))] }));
}
function MaterialCard({ material }) {
    const materialTags = material.tags || [];
    return (_jsx(Link, { to: "/materials/$id", params: { id: material.id }, className: "block bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-semibold text-slate-900", children: material.title }), material.description && (_jsx("p", { className: "text-sm text-slate-500 mt-1 line-clamp-2", children: material.description })), _jsxs("div", { className: "flex items-center gap-2 mt-2", children: [materialTags.map((tag) => (_jsx("span", { className: "inline-block text-xs px-2 py-0.5 rounded-full text-white", style: { backgroundColor: tag.color || '#3b82f6' }, children: tag.name }, tag.id))), material.fileType && (_jsx("span", { className: "text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded", children: material.fileType }))] })] }), _jsxs("div", { className: "text-right text-xs text-slate-400 ml-4", children: [_jsx("div", { children: material.uploadedBy }), _jsx("div", { className: "mt-1", children: formatDate(material.createdAt) }), material.reuseCount != null && material.reuseCount > 0 && (_jsxs("div", { className: "mt-1 text-amber-600 font-medium", children: ["\u590D\u7528 ", material.reuseCount, " \u6B21"] }))] })] }) }));
}
function UploadModal({ tags, onClose, onSuccess, }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [fileType, setFileType] = useState('');
    const [uploadedBy, setUploadedBy] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [newTagName, setNewTagName] = useState('');
    const qc = useQueryClient();
    const createMutation = useMutation({
        mutationFn: api.materials.create,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['materials'] });
            qc.invalidateQueries({ queryKey: ['tags'] });
            onSuccess();
        },
    });
    const createTagMutation = useMutation({
        mutationFn: api.tags.create,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
    });
    const handleAddTag = () => {
        if (!newTagName.trim())
            return;
        createTagMutation.mutate({ name: newTagName.trim() }, {
            onSuccess: (res) => {
                setSelectedTags((prev) => [...prev, res.data.id]);
                setNewTagName('');
            },
        });
    };
    const toggleTag = (tagId) => {
        setSelectedTags((prev) => prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate({
            title,
            description: description || undefined,
            fileUrl: fileUrl || undefined,
            fileType: fileType || undefined,
            uploadedBy: uploadedBy || '匿名',
            tagIds: selectedTags.length > 0 ? selectedTags : undefined,
        });
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-xl w-full max-w-lg p-6 shadow-2xl", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-bold", children: "\u4E0A\u4F20\u91C7\u8BBF\u7D20\u6750" }), _jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-600", children: _jsx(X, { size: 20 }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "\u6807\u9898 *" }), _jsx("input", { type: "text", value: title, onChange: (e) => setTitle(e.target.value), required: true, className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "\u63CF\u8FF0" }), _jsx("textarea", { value: description, onChange: (e) => setDescription(e.target.value), rows: 3, className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "\u6587\u4EF6\u94FE\u63A5" }), _jsx("input", { type: "text", value: fileUrl, onChange: (e) => setFileUrl(e.target.value), placeholder: "https://...", className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "\u6587\u4EF6\u7C7B\u578B" }), _jsxs("select", { value: fileType, onChange: (e) => setFileType(e.target.value), className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "\u9009\u62E9\u7C7B\u578B" }), _jsx("option", { value: "image", children: "\u56FE\u7247" }), _jsx("option", { value: "video", children: "\u89C6\u9891" }), _jsx("option", { value: "audio", children: "\u97F3\u9891" }), _jsx("option", { value: "document", children: "\u6587\u6863" }), _jsx("option", { value: "other", children: "\u5176\u4ED6" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "\u4E0A\u4F20\u4EBA" }), _jsx("input", { type: "text", value: uploadedBy, onChange: (e) => setUploadedBy(e.target.value), placeholder: "\u8F93\u5165\u59D3\u540D", className: "w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "\u6807\u7B7E" }), _jsxs("div", { className: "flex flex-wrap gap-2 mb-2", children: [tags.map((tag) => (_jsx("button", { type: "button", onClick: () => toggleTag(tag.id), className: `text-xs px-2.5 py-1 rounded-full transition-colors ${selectedTags.includes(tag.id)
                                                ? 'text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`, style: selectedTags.includes(tag.id)
                                                ? { backgroundColor: tag.color || '#3b82f6' }
                                                : undefined, children: tag.name }, tag.id))), tags.length === 0 && (_jsx("span", { className: "text-xs text-slate-400", children: "\u6682\u65E0\u6807\u7B7E\uFF0C\u53EF\u5728\u4E0B\u65B9\u65B0\u5EFA" }))] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", value: newTagName, onChange: (e) => setNewTagName(e.target.value), placeholder: "\u65B0\u5EFA\u6807\u7B7E", className: "flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500", onKeyDown: (e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag()) }), _jsx("button", { type: "button", onClick: handleAddTag, className: "text-sm bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors", children: "\u6DFB\u52A0" })] })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-2", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 text-sm text-slate-600 hover:text-slate-800", children: "\u53D6\u6D88" }), _jsx("button", { type: "submit", disabled: createMutation.isPending, className: "px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors", children: createMutation.isPending ? '上传中...' : '上传素材' })] })] })] }) }));
}

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatNumber } from '../lib/utils';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, } from 'recharts';
import { FileText, Calendar, AlertTriangle, Eye, BookOpen, Share2, MessageSquare } from 'lucide-react';
export const Route = createFileRoute('/')({
    component: DashboardPage,
});
function DashboardPage() {
    const { data: overview } = useQuery({
        queryKey: ['dashboard', 'overview'],
        queryFn: () => api.dashboard.overview(),
    });
    const { data: trend } = useQuery({
        queryKey: ['dashboard', 'conversion-trend'],
        queryFn: () => api.dashboard.conversionTrend(7),
    });
    const { data: topMaterials } = useQuery({
        queryKey: ['dashboard', 'top-materials'],
        queryFn: () => api.dashboard.topMaterials(),
    });
    const { data: exceptions } = useQuery({
        queryKey: ['exceptions', 'open'],
        queryFn: () => api.exceptions.list({ status: 'open' }),
    });
    return (_jsxs("div", { className: "p-6", children: [_jsx("h2", { className: "text-2xl font-bold mb-6", children: "\u6570\u636E\u590D\u76D8\u770B\u677F" }), _jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6", children: [_jsx(StatCard, { icon: _jsx(FileText, { size: 20 }), label: "\u7D20\u6750\u603B\u91CF", value: overview?.data.materialCount ?? 0, color: "blue" }), _jsx(StatCard, { icon: _jsx(Calendar, { size: 20 }), label: "\u5DF2\u53D1\u5E03", value: overview?.data.publishedCount ?? 0, color: "green" }), _jsx(StatCard, { icon: _jsx(AlertTriangle, { size: 20 }), label: "\u5F85\u5904\u7406\u5F02\u5E38", value: overview?.data.openExceptions ?? 0, color: "red" }), _jsx(StatCard, { icon: _jsx(Eye, { size: 20 }), label: "\u603B\u9605\u8BFB\u91CF", value: overview?.data.conversions?.totalViews ?? 0, color: "purple" })] }), _jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6", children: [_jsx(MiniStat, { icon: _jsx(Eye, { size: 16 }), label: "\u6D4F\u89C8\u91CF", value: overview?.data.conversions?.totalViews ?? 0 }), _jsx(MiniStat, { icon: _jsx(BookOpen, { size: 16 }), label: "\u9605\u8BFB\u91CF", value: overview?.data.conversions?.totalReads ?? 0 }), _jsx(MiniStat, { icon: _jsx(Share2, { size: 16 }), label: "\u5206\u4EAB\u91CF", value: overview?.data.conversions?.totalShares ?? 0 }), _jsx(MiniStat, { icon: _jsx(MessageSquare, { size: 16 }), label: "\u8BC4\u8BBA\u91CF", value: overview?.data.conversions?.totalComments ?? 0 })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6", children: [_jsxs("div", { className: "lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5", children: [_jsx("h3", { className: "font-semibold text-slate-900 mb-4", children: "\u9605\u8BFB\u8F6C\u5316\u8D8B\u52BF\uFF08\u8FD17\u5929\uFF09" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: trend?.data || [], children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f1f5f9" }), _jsx(XAxis, { dataKey: "date", tick: { fontSize: 12 }, stroke: "#94a3b8" }), _jsx(YAxis, { tick: { fontSize: 12 }, stroke: "#94a3b8" }), _jsx(Tooltip, { contentStyle: { borderRadius: '8px', border: '1px solid #e2e8f0' } }), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "views", name: "\u6D4F\u89C8", stroke: "#3b82f6", strokeWidth: 2, dot: false }), _jsx(Line, { type: "monotone", dataKey: "reads", name: "\u9605\u8BFB", stroke: "#16a34a", strokeWidth: 2, dot: false }), _jsx(Line, { type: "monotone", dataKey: "shares", name: "\u5206\u4EAB", stroke: "#f59e0b", strokeWidth: 2, dot: false }), _jsx(Line, { type: "monotone", dataKey: "comments", name: "\u8BC4\u8BBA", stroke: "#8b5cf6", strokeWidth: 2, dot: false })] }) })] }), _jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-5", children: [_jsx("h3", { className: "font-semibold text-slate-900 mb-4", children: "\u70ED\u95E8\u7D20\u6750" }), _jsxs("div", { className: "space-y-3", children: [topMaterials?.data.map((m, i) => (_jsxs(Link, { to: "/materials/$id", params: { id: m.id }, className: "flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors", children: [_jsx("span", { className: `w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`, children: i + 1 }), _jsx("div", { className: "flex-1 min-w-0", children: _jsx("p", { className: "text-sm font-medium truncate", children: m.title }) }), _jsxs("span", { className: "text-xs text-amber-600 font-medium", children: [m.reuseCount ?? 0, "\u6B21"] })] }, m.id))), (!topMaterials?.data || topMaterials.data.length === 0) && (_jsx("p", { className: "text-sm text-slate-400 text-center py-4", children: "\u6682\u65E0\u6570\u636E" }))] })] })] }), exceptions && exceptions.data.length > 0 && (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-xl p-5", children: [_jsxs("h3", { className: "font-semibold text-red-800 flex items-center gap-2 mb-3", children: [_jsx(AlertTriangle, { size: 18 }), "\u5F85\u5904\u7406\u5F02\u5E38"] }), _jsx("div", { className: "space-y-2", children: exceptions.data.map((ex) => (_jsxs(Link, { to: "/exceptions", className: "flex items-center justify-between bg-white border border-red-100 rounded-lg p-3 hover:border-red-300 transition-colors", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-red-900", children: ex.description || ex.type }), _jsxs("p", { className: "text-xs text-red-600 mt-0.5", children: [ex.scheduleTitle, " \u00B7 ", ex.platform] })] }), _jsx("span", { className: "text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full", children: ex.status === 'open' ? '待处理' : '处理中' })] }, ex.id))) })] }))] }));
}
function StatCard({ icon, label, value, color, }) {
    const bgColors = { blue: 'bg-blue-50', green: 'bg-green-50', red: 'bg-red-50', purple: 'bg-purple-50' };
    const textColors = { blue: 'text-blue-600', green: 'text-green-600', red: 'text-red-600', purple: 'text-purple-600' };
    return (_jsx("div", { className: "bg-white border border-slate-200 rounded-xl p-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `w-10 h-10 rounded-lg ${bgColors[color]} flex items-center justify-center ${textColors[color]}`, children: icon }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-slate-500", children: label }), _jsx("p", { className: "text-xl font-bold text-slate-900", children: formatNumber(value) })] })] }) }));
}
function MiniStat({ icon, label, value }) {
    return (_jsxs("div", { className: "bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-2", children: [_jsx("span", { className: "text-slate-400", children: icon }), _jsx("span", { className: "text-xs text-slate-500", children: label }), _jsx("span", { className: "text-sm font-bold text-slate-900 ml-auto", children: formatNumber(value) })] }));
}

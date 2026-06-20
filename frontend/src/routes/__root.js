import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createRootRoute, Outlet, Link } from '@tanstack/react-router';
import { LayoutDashboard, FileUp, AlertTriangle, Clock, Tag, FileText, Calendar, BarChart3 } from 'lucide-react';
export const Route = createRootRoute({
    component: RootLayout,
});
function RootLayout() {
    return (_jsxs("div", { className: "flex min-h-screen", children: [_jsxs("aside", { className: "w-60 bg-slate-900 text-white flex flex-col shrink-0", children: [_jsxs("div", { className: "px-5 py-4 border-b border-slate-700", children: [_jsx("h1", { className: "text-lg font-bold tracking-tight", children: "\u65B0\u95FB\u7A3F\u4EF6\u590D\u76D8" }), _jsx("p", { className: "text-xs text-slate-400 mt-0.5", children: "\u6570\u636E\u590D\u76D8\u770B\u677F" })] }), _jsxs("nav", { className: "flex-1 py-3", children: [_jsx(NavItem, { to: "/", icon: _jsx(LayoutDashboard, { size: 18 }), label: "\u6570\u636E\u770B\u677F" }), _jsx(NavItem, { to: "/materials", icon: _jsx(FileUp, { size: 18 }), label: "\u7D20\u6750\u7BA1\u7406" }), _jsx(NavItem, { to: "/scripts", icon: _jsx(FileText, { size: 18 }), label: "\u9009\u9898\u811A\u672C" }), _jsx(NavItem, { to: "/schedules", icon: _jsx(Calendar, { size: 18 }), label: "\u53D1\u5E03\u6392\u671F" }), _jsx(NavItem, { to: "/conversions", icon: _jsx(BarChart3, { size: 18 }), label: "\u9605\u8BFB\u8F6C\u5316" }), _jsx(NavItem, { to: "/exceptions", icon: _jsx(AlertTriangle, { size: 18 }), label: "\u5F02\u5E38\u5904\u7406" }), _jsx(NavItem, { to: "/history", icon: _jsx(Clock, { size: 18 }), label: "\u64CD\u4F5C\u5386\u53F2" }), _jsx(NavItem, { to: "/tags", icon: _jsx(Tag, { size: 18 }), label: "\u6807\u7B7E\u7BA1\u7406" })] }), _jsx("div", { className: "px-5 py-3 border-t border-slate-700 text-xs text-slate-400", children: "\u7F16\u8F91\u4E3B\u7BA1\u5DE5\u4F5C\u53F0" })] }), _jsx("main", { className: "flex-1 overflow-auto", children: _jsx(Outlet, {}) })] }));
}
function NavItem({ to, icon, label }) {
    return (_jsxs(Link, { to: to, className: "flex items-center gap-3 px-5 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors", activeProps: { className: 'bg-slate-800 text-white' }, children: [icon, label] }));
}

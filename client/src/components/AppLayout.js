import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link, useNavigate, useLocation } from '@tanstack/react-router';
import { useAuthStore } from '@/store/authStore';
export default function AppLayout({ children }) {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const handleLogout = () => {
        logout();
        navigate({ to: '/login' });
    };
    const isActive = (path) => location.pathname.startsWith(path);
    const menuItems = [
        { path: '/', label: '首页', icon: '🏠' },
        { path: '/apartments', label: '房源管理', icon: '🏢' },
        { path: '/customers', label: '客户管理', icon: '👥' },
        { path: '/viewings', label: '看房预约', icon: '📅' },
        { path: '/followups', label: '跟进记录', icon: '📝' },
        { path: '/leases', label: '租约管理', icon: '📄' },
        { path: '/deposits', label: '押金管理', icon: '💰' },
        { path: '/reminders', label: '空置提醒', icon: '🔔' },
        { path: '/todos', label: '待办事项', icon: '✅' },
        { path: '/search', label: '综合查询', icon: '🔍' },
    ];
    const adminMenuItems = [
        { path: '/reports', label: '统计报表', icon: '📊' },
        { path: '/users', label: '用户管理', icon: '👤' },
    ];
    return (_jsxs("div", { className: "flex h-screen bg-gray-100", children: [_jsxs("aside", { className: "w-64 bg-white shadow-lg flex flex-col", children: [_jsxs("div", { className: "p-4 border-b", children: [_jsx("h1", { className: "text-xl font-bold text-gray-800", children: "\u957F\u79DF\u516C\u5BD3\u7BA1\u7406" }), _jsx("p", { className: "text-sm text-gray-500", children: "v1.0.0" })] }), _jsx("nav", { className: "flex-1 overflow-y-auto p-4", children: _jsxs("ul", { className: "space-y-1", children: [menuItems.map((item) => (_jsx("li", { children: _jsxs(Link, { to: item.path, className: `flex items-center px-4 py-2 rounded-lg transition-colors ${isActive(item.path)
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-gray-600 hover:bg-gray-50'}`, children: [_jsx("span", { className: "mr-3", children: item.icon }), item.label] }) }, item.path))), user?.role === 'admin' && (_jsxs(_Fragment, { children: [_jsx("li", { className: "pt-4 pb-2", children: _jsx("span", { className: "px-4 text-xs font-semibold text-gray-400 uppercase", children: "\u7CFB\u7EDF\u7BA1\u7406" }) }), adminMenuItems.map((item) => (_jsx("li", { children: _jsxs(Link, { to: item.path, className: `flex items-center px-4 py-2 rounded-lg transition-colors ${isActive(item.path)
                                                    ? 'bg-blue-50 text-blue-600'
                                                    : 'text-gray-600 hover:bg-gray-50'}`, children: [_jsx("span", { className: "mr-3", children: item.icon }), item.label] }) }, item.path)))] }))] }) }), _jsx("div", { className: "p-4 border-t", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold", children: user?.name?.charAt(0) }), _jsxs("div", { className: "ml-3", children: [_jsx("p", { className: "text-sm font-medium text-gray-800", children: user?.name }), _jsx("p", { className: "text-xs text-gray-500", children: user?.role === 'admin' ? '管理员' : '顾问' })] })] }), _jsx("button", { onClick: handleLogout, className: "text-gray-400 hover:text-gray-600", title: "\u9000\u51FA\u767B\u5F55", children: "\uD83D\uDEAA" })] }) })] }), _jsx("main", { className: "flex-1 overflow-auto", children: _jsx("div", { className: "p-6", children: children }) })] }));
}

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import dayjs from 'dayjs';
export const Route = createFileRoute('/')({
    component: Dashboard,
});
function Dashboard() {
    const [stats, setStats] = useState(null);
    const [todos, setTodos] = useState([]);
    const { user } = useAuthStore();
    useEffect(() => {
        if (user?.role === 'admin') {
            apiClient.get('/reports/statistics').then((res) => setStats(res.data));
        }
        apiClient.get('/todos', { params: { status: 'pending', pageSize: 5 } }).then((res) => setTodos(res.data.list));
    }, [user]);
    const statusColors = {
        vacant: 'bg-green-100 text-green-800',
        occupied: 'bg-blue-100 text-blue-800',
        reserved: 'bg-yellow-100 text-yellow-800',
        maintenance: 'bg-red-100 text-red-800',
    };
    const statusLabels = {
        vacant: '空置',
        occupied: '已租',
        reserved: '预留',
        maintenance: '维修',
        pending: '待处理',
        completed: '已完成',
        cancelled: '已取消',
        signed: '已签约',
        lost: '已流失',
    };
    const priorityColors = {
        high: 'bg-red-100 text-red-800',
        normal: 'bg-yellow-100 text-yellow-800',
        low: 'bg-green-100 text-green-800',
    };
    const priorityLabels = {
        high: '高',
        normal: '中',
        low: '低',
    };
    const todoTypeLabels = {
        deposit_dispute: '押金争议',
        vacancy: '空置处理',
        other: '其他',
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-800", children: "\u5DE5\u4F5C\u53F0" }), _jsx("p", { className: "text-gray-500", children: dayjs().format('YYYY年MM月DD日 dddd') })] }), stats && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-500 text-sm", children: "\u623F\u6E90\u603B\u6570" }), _jsx("p", { className: "text-3xl font-bold text-gray-800", children: stats.apartments.total })] }), _jsx("div", { className: "text-4xl", children: "\uD83C\uDFE2" })] }), _jsxs("div", { className: "mt-4 flex gap-2", children: [_jsxs("span", { className: `px-2 py-1 rounded text-xs ${statusColors.vacant}`, children: ["\u7A7A\u7F6E ", stats.apartments.vacant] }), _jsxs("span", { className: `px-2 py-1 rounded text-xs ${statusColors.occupied}`, children: ["\u5DF2\u79DF ", stats.apartments.occupied] })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-500 text-sm", children: "\u672C\u6708\u9884\u7EA6" }), _jsx("p", { className: "text-3xl font-bold text-gray-800", children: stats.viewings.total })] }), _jsx("div", { className: "text-4xl", children: "\uD83D\uDCC5" })] }), _jsxs("div", { className: "mt-4 flex gap-2", children: [_jsxs("span", { className: `px-2 py-1 rounded text-xs ${statusColors.reserved}`, children: ["\u5F85\u5904\u7406 ", stats.viewings.pending] }), _jsxs("span", { className: `px-2 py-1 rounded text-xs ${statusColors.occupied}`, children: ["\u5DF2\u5B8C\u6210 ", stats.viewings.completed] })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-500 text-sm", children: "\u672C\u6708\u8DDF\u8FDB" }), _jsx("p", { className: "text-3xl font-bold text-gray-800", children: stats.followups.total })] }), _jsx("div", { className: "text-4xl", children: "\uD83D\uDCDD" })] }), _jsxs("div", { className: "mt-4 flex gap-2", children: [_jsxs("span", { className: `px-2 py-1 rounded text-xs ${statusColors.occupied}`, children: ["\u7B7E\u7EA6 ", stats.followups.signed] }), _jsxs("span", { className: `px-2 py-1 rounded text-xs ${statusColors.maintenance}`, children: ["\u6D41\u5931 ", stats.followups.lost] })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-500 text-sm", children: "\u62BC\u91D1\u603B\u989D" }), _jsxs("p", { className: "text-3xl font-bold text-gray-800", children: ["\u00A5", Number(stats.deposits.totalAmount || 0).toLocaleString()] })] }), _jsx("div", { className: "text-4xl", children: "\uD83D\uDCB0" })] }), _jsxs("div", { className: "mt-4 flex gap-2", children: [_jsxs("span", { className: `px-2 py-1 rounded text-xs ${statusColors.reserved}`, children: ["\u4E89\u8BAE ", stats.deposits.disputed] }), _jsxs("span", { className: `px-2 py-1 rounded text-xs ${statusColors.occupied}`, children: ["\u5DF2\u9000 \u00A5", Number(stats.deposits.refundedAmount || 0).toLocaleString()] })] })] })] })), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow", children: [_jsx("div", { className: "p-4 border-b", children: _jsx("h2", { className: "text-lg font-semibold text-gray-800", children: "\u5F85\u529E\u4E8B\u9879" }) }), _jsx("div", { className: "p-4", children: todos.length === 0 ? (_jsx("p", { className: "text-gray-500 text-center py-8", children: "\u6682\u65E0\u5F85\u529E\u4E8B\u9879" })) : (_jsx("ul", { className: "space-y-3", children: todos.map((todo) => (_jsxs("li", { className: "flex items-start justify-between p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-800", children: todo.title }), _jsxs("p", { className: "text-sm text-gray-500 mt-1", children: [todoTypeLabels[todo.type] || todo.type, " \u00B7 ", dayjs(todo.createdAt).format('MM-DD HH:mm')] })] }), _jsx("span", { className: `px-2 py-1 rounded text-xs ${priorityColors[todo.priority] || priorityColors.normal}`, children: priorityLabels[todo.priority] || todo.priority })] }, todo.id))) })) })] }), stats?.consultantStats && stats.consultantStats.length > 0 && (_jsxs("div", { className: "bg-white rounded-lg shadow", children: [_jsx("div", { className: "p-4 border-b", children: _jsx("h2", { className: "text-lg font-semibold text-gray-800", children: "\u987E\u95EE\u4E1A\u7EE9" }) }), _jsx("div", { className: "p-4", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-left text-sm text-gray-500", children: [_jsx("th", { className: "pb-3", children: "\u987E\u95EE" }), _jsx("th", { className: "pb-3", children: "\u8DDF\u8FDB\u6570" }), _jsx("th", { className: "pb-3", children: "\u7B7E\u7EA6\u6570" }), _jsx("th", { className: "pb-3", children: "\u8F6C\u5316\u7387" })] }) }), _jsx("tbody", { className: "divide-y", children: stats.consultantStats.map((item) => (_jsxs("tr", { className: "py-3", children: [_jsx("td", { className: "py-3 text-gray-800", children: item.consultantName }), _jsx("td", { className: "py-3 text-gray-600", children: item.followups }), _jsx("td", { className: "py-3 text-gray-600", children: item.signed }), _jsx("td", { className: "py-3", children: _jsxs("span", { className: "text-blue-600 font-medium", children: [item.followups > 0 ? ((item.signed / item.followups) * 100).toFixed(1) : 0, "%"] }) })] }, item.consultantId))) })] }) })] }))] })] }));
}

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from '@tanstack/react-router';
export const Route = createFileRoute('/login')({
    component: LoginPage,
});
function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuthStore();
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
            navigate({ to: '/' });
        }
        catch (err) {
            const axiosError = err;
            setError(axiosError.response?.data?.error || '登录失败，请重试');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600", children: _jsxs("div", { className: "bg-white p-8 rounded-lg shadow-xl w-full max-w-md", children: [_jsx("h1", { className: "text-2xl font-bold text-center mb-6 text-gray-800", children: "\u957F\u79DF\u516C\u5BD3\u7BA1\u7406\u7CFB\u7EDF" }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u7528\u6237\u540D" }), _jsx("input", { type: "text", value: username, onChange: (e) => setUsername(e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "\u8BF7\u8F93\u5165\u7528\u6237\u540D", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u5BC6\u7801" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "\u8BF7\u8F93\u5165\u5BC6\u7801", required: true })] }), error && _jsx("div", { className: "text-red-500 text-sm", children: error }), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors", children: loading ? '登录中...' : '登录' })] }), _jsxs("div", { className: "mt-4 text-xs text-gray-500 text-center", children: [_jsx("p", { children: "\u6D4B\u8BD5\u8D26\u53F7: admin / 123456 (\u7BA1\u7406\u5458)" }), _jsx("p", { children: "\u6D4B\u8BD5\u8D26\u53F7: consultant1 / 123456 (\u987E\u95EE)" })] })] }) }));
}

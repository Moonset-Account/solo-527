import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { createRootRoute, Outlet, Navigate, useLocation } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import AppLayout from '@/components/AppLayout';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
export const Route = createRootRoute({
    component: RootComponent,
});
function RootComponent() {
    const { isAuthenticated, checkAuth } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    useEffect(() => {
        checkAuth().finally(() => setLoading(false));
    }, [checkAuth]);
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx("div", { className: "text-xl", children: "\u52A0\u8F7D\u4E2D..." }) }));
    }
    if (!isAuthenticated && location.pathname !== '/login') {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    if (isAuthenticated && location.pathname === '/login') {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    if (!isAuthenticated) {
        return _jsx(Outlet, {});
    }
    return (_jsxs(_Fragment, { children: [_jsx(AppLayout, { children: _jsx(Outlet, {}) }), _jsx(TanStackRouterDevtools, {})] }));
}

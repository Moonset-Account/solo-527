<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', '管理后台') - 烘焙店管理系统</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#f59e0b',
                        secondary: '#d97706',
                        accent: '#fbbf24',
                        success: '#10b981',
                        danger: '#ef4444',
                        warning: '#f59e0b',
                        info: '#3b82f6',
                    }
                }
            }
        }
    </script>
    <style>
        [v-cloak] { display: none; }
        .status-badge {
            @apply px-2 py-1 text-xs font-medium rounded-full;
        }
        .status-pending { @apply bg-yellow-100 text-yellow-800; }
        .status-confirmed { @apply bg-blue-100 text-blue-800; }
        .status-in_production { @apply bg-purple-100 text-purple-800; }
        .status-ready { @apply bg-green-100 text-green-800; }
        .status-picked_up { @apply bg-gray-100 text-gray-800; }
        .status-cancelled { @apply bg-red-100 text-red-800; }
        .status-refunded { @apply bg-orange-100 text-orange-800; }

        .payment-unpaid { @apply bg-red-100 text-red-800; }
        .payment-deposit_paid { @apply bg-yellow-100 text-yellow-800; }
        .payment-paid { @apply bg-green-100 text-green-800; }

        .kanban-column {
            @apply bg-gray-50 rounded-lg p-3 min-h-[400px] flex-shrink-0 w-64;
        }
        .kanban-card {
            @apply bg-white rounded-lg p-3 mb-2 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer;
        }
    </style>
</head>
<body class="bg-gray-100 min-h-screen">
    @yield('content')

    <script>
        const API_BASE = '/api';

        const store = {
            state: {
                user: null,
                token: localStorage.getItem('token') || null,
            },
            setUser(user) {
                this.state.user = user;
            },
            setToken(token) {
                this.state.token = token;
                localStorage.setItem('token', token);
            },
            logout() {
                this.state.user = null;
                this.state.token = null;
                localStorage.removeItem('token');
            },
            isAuthenticated() {
                return !!this.state.token;
            }
        };

        async function apiRequest(url, options = {}) {
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers,
            };

            if (store.state.token) {
                headers['Authorization'] = `Bearer ${store.state.token}`;
            }

            const response = await fetch(`${API_BASE}${url}`, {
                ...options,
                headers,
            });

            if (response.status === 401) {
                store.logout();
                window.location.href = '/login';
                return;
            }

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: '请求失败' }));
                throw new Error(error.message || '请求失败');
            }

            return response.json();
        }

        function formatDate(dateStr) {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        }

        function formatDateTime(dateStr) {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        }
    </script>

    @yield('scripts')
</body>
</html>

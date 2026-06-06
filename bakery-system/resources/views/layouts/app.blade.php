<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', '烘焙店预订系统')</title>
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
        .kanban-column {
            @apply bg-gray-100 rounded-lg p-4 min-h-[500px];
        }
        .kanban-card {
            @apply bg-white rounded-lg p-3 mb-3 shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-shadow;
        }
    </style>
</head>
<body class="bg-gray-50">
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
    </script>

    @yield('scripts')
</body>
</html>

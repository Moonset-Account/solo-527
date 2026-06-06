@extends('layouts.app')

@section('title', '员工登录 - 烘焙店管理系统')

@section('content')
<div class="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center py-12 px-4">
    <div class="max-w-md w-full">
        <div class="text-center mb-8">
            <div class="text-6xl mb-4">🧁</div>
            <h1 class="text-3xl font-bold text-gray-800">烘焙店管理系统</h1>
            <p class="text-gray-600 mt-2">请登录以继续</p>
        </div>

        <div class="bg-white rounded-2xl shadow-xl p-8" id="loginApp" v-cloak>
            <form @submit.prevent="login">
                <div class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
                        <input v-model="email" type="email" required
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                               placeholder="请输入邮箱">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">密码</label>
                        <input v-model="password" type="password" required
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                               placeholder="请输入密码">
                    </div>

                    <div v-if="error" class="text-red-500 text-sm text-center">
                        @{{ error }}
                    </div>

                    <button type="submit" :disabled="loading"
                            class="w-full py-3 bg-primary hover:bg-secondary text-white font-semibold rounded-lg transition-colors disabled:opacity-50">
                        <span v-if="loading">登录中...</span>
                        <span v-else>登录</span>
                    </button>
                </div>
            </form>

            <div class="mt-6 pt-6 border-t">
                <p class="text-sm text-gray-500 text-center">测试账号：</p>
                <div class="mt-2 text-xs text-gray-400 space-y-1">
                    <p>管理员: admin@bakery.com / password123</p>
                    <p>店员: staff@bakery.com / password123</p>
                    <p>顾客: customer@example.com / password123</p>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
const { createApp, ref } = Vue;

createApp({
    setup() {
        const email = ref('');
        const password = ref('');
        const loading = ref(false);
        const error = ref('');

        const login = async () => {
            loading.value = true;
            error.value = '';

            try {
                const result = await apiRequest('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({
                        email: email.value,
                        password: password.value
                    })
                });

                store.setToken(result.token);
                store.setUser(result.user);

                if (result.user.user_type === 'customer') {
                    window.location.href = '/';
                } else {
                    window.location.href = '/admin';
                }
            } catch (e) {
                error.value = e.message || '登录失败，请检查账号密码';
            } finally {
                loading.value = false;
            }
        };

        return { email, password, loading, error, login };
    }
}).mount('#loginApp');
</script>
@endsection

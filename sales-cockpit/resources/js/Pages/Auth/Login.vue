<script setup>
import { ref } from 'vue';
import { useForm, Head } from '@inertiajs/vue3';

const form = useForm({
    email: '',
    password: '',
    remember: false,
});

const showPassword = ref(false);

function submit() {
    form.post('/login', {
        preserveScroll: true,
    });
}
</script>

<template>
    <Head title="登录 - 销售经营指标驾驶舱" />
    <div class="login-page">
        <div class="login-card">
            <div class="login-header">
                <h1 class="brand">📊 销售经营指标驾驶舱</h1>
                <p class="subtitle">请登录以继续</p>
            </div>

            <form @submit.prevent="submit" class="login-form">
                <div class="form-group">
                    <label class="form-label">邮箱</label>
                    <input
                        type="email"
                        v-model="form.email"
                        class="form-input"
                        placeholder="请输入邮箱"
                        autofocus
                    />
                    <div v-if="form.errors.email" class="form-error">{{ form.errors.email }}</div>
                </div>

                <div class="form-group">
                    <label class="form-label">密码</label>
                    <div class="password-wrapper">
                        <input
                            :type="showPassword ? 'text' : 'password'"
                            v-model="form.password"
                            class="form-input"
                            placeholder="请输入密码"
                            @keyup.enter="submit"
                        />
                        <button
                            type="button"
                            class="toggle-password"
                            @click="showPassword = !showPassword"
                        >
                            {{ showPassword ? '🙈' : '👁' }}
                        </button>
                    </div>
                    <div v-if="form.errors.password" class="form-error">{{ form.errors.password }}</div>
                </div>

                <label class="remember-label">
                    <input type="checkbox" v-model="form.remember" />
                    <span>记住我</span>
                </label>

                <button
                    type="submit"
                    class="btn btn-primary btn-block"
                    :disabled="form.processing"
                >
                    {{ form.processing ? '登录中...' : '登录' }}
                </button>
            </form>

            <div class="demo-accounts">
                <p class="demo-title">演示账号</p>
                <div class="demo-account">
                    <span class="demo-role">销售总监：</span>
                    <code>director@example.com / password</code>
                </div>
                <div class="demo-account">
                    <span class="demo-role">业务分析师：</span>
                    <code>analyst@example.com / password</code>
                </div>
                <div class="demo-account">
                    <span class="demo-role">系统管理员：</span>
                    <code>admin@example.com / password</code>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #06b6d4 100%);
    padding: 20px;
}

.login-card {
    background: #fff;
    border-radius: 12px;
    padding: 40px 36px;
    width: 420px;
    max-width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.login-header {
    text-align: center;
    margin-bottom: 28px;
}

.brand {
    font-size: 22px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 8px;
}

.subtitle {
    font-size: 14px;
    color: #64748b;
    margin: 0;
}

.login-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-label {
    font-size: 13px;
    font-weight: 500;
    color: #334155;
}

.form-input {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 14px;
    box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.password-wrapper {
    position: relative;
}

.password-wrapper .form-input {
    padding-right: 44px;
}

.toggle-password {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
    padding: 0;
    line-height: 1;
}

.form-error {
    font-size: 12px;
    color: #ef4444;
}

.remember-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #64748b;
    cursor: pointer;
}

.btn {
    padding: 11px 20px;
    border-radius: 8px;
    border: none;
    font-size: 14px;
    cursor: pointer;
    font-weight: 500;
    transition: opacity 0.2s;
}

.btn-primary {
    background: #3b82f6;
    color: #fff;
}

.btn-primary:hover {
    opacity: 0.92;
}

.btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-block {
    width: 100%;
}

.demo-accounts {
    margin-top: 24px;
    padding: 14px 16px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.demo-title {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    margin: 0 0 8px;
}

.demo-account {
    font-size: 12px;
    color: #64748b;
    margin-bottom: 4px;
    display: flex;
    gap: 4px;
    align-items: center;
}

.demo-role {
    font-weight: 500;
    color: #475569;
    min-width: 80px;
}

.demo-account code {
    background: #fff;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    border: 1px solid #e2e8f0;
}
</style>

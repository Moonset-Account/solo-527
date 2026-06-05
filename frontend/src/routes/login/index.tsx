import { component$, useStore, $ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { useAuth } from "~/context/auth";

type LoginRole = 'member' | 'operator' | 'admin';

const demoAccounts = [
  { username: 'admin', password: '123456', name: '张管理员', role: 'admin' as const },
  { username: 'member1', password: '123456', name: '李社员', role: 'member' as const },
  { username: 'member2', password: '123456', name: '王社员', role: 'member' as const },
  { username: 'member3', password: '123456', name: '赵社员', role: 'member' as const },
  { username: 'operator1', password: '123456', name: '刘机手', role: 'operator' as const },
  { username: 'operator2', password: '123456', name: '陈机手', role: 'operator' as const },
];

export default component$(() => {
  const auth = useAuth();
  const nav = useNavigate();
  
  const form = useStore({
    username: 'admin',
    password: '123456',
    error: '',
    loading: false,
    selectedRole: 'admin' as LoginRole,
  });

  const handleSubmit = $(async (e: Event) => {
    e.preventDefault();
    form.error = '';
    form.loading = true;

    try {
      await auth.login(form.username, form.password);
      nav.navigate('/dashboard');
    } catch (err: any) {
      form.error = err.response?.data?.error || '登录失败，请检查用户名和密码';
    } finally {
      form.loading = false;
    }
  });

  const quickLogin = $((account: typeof demoAccounts[0]) => {
    form.username = account.username;
    form.password = account.password;
    form.selectedRole = account.role;
  });

  return (
    <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-soil-50 flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <div class="w-20 h-20 bg-primary-500 rounded-2xl flex items-center justify-center text-white text-4xl mx-auto mb-4 shadow-lg shadow-primary-200">
            🌾
          </div>
          <h1 class="font-serif text-3xl font-bold text-gray-800 mb-2">农业合作社</h1>
          <p class="text-gray-500">农机共享管理平台</p>
        </div>

        <div class="card">
          <div class="flex gap-2 mb-6">
            {(['admin', 'member', 'operator'] as LoginRole[]).map((role) => (
              <button
                key={role}
                onClick$={() => form.selectedRole = role}
                class={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  form.selectedRole === role
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {role === 'admin' && '管理员'}
                {role === 'member' && '社员'}
                {role === 'operator' && '机手'}
              </button>
            ))}
          </div>

          <form onSubmit$={handleSubmit} class="space-y-4">
            <div>
              <label class="label">用户名</label>
              <input
                type="text"
                value={form.username}
                onInput$={(e) => form.username = (e.target as HTMLInputElement).value}
                class="input-field"
                placeholder="请输入用户名"
                required
              />
            </div>

            <div>
              <label class="label">密码</label>
              <input
                type="password"
                value={form.password}
                onInput$={(e) => form.password = (e.target as HTMLInputElement).value}
                class="input-field"
                placeholder="请输入密码"
                required
              />
            </div>

            {form.error && (
              <div class="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {form.error}
              </div>
            )}

            <button
              type="submit"
              disabled={form.loading}
              class="w-full btn-primary py-3 text-base"
            >
              {form.loading ? '登录中...' : '登 录'}
            </button>
          </form>

          <div class="mt-6 pt-6 border-t border-gray-100">
            <p class="text-xs text-gray-500 mb-3">演示账号快捷登录：</p>
            <div class="grid grid-cols-2 gap-2">
              {demoAccounts
                .filter(a => a.role === form.selectedRole)
                .map((account) => (
                  <button
                    key={account.username}
                    onClick$={() => quickLogin(account)}
                    class="text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                  >
                    <div class="font-medium text-gray-700">{account.name}</div>
                    <div class="text-xs text-gray-400">{account.username}</div>
                  </button>
                ))}
            </div>
          </div>
        </div>

        <p class="text-center text-xs text-gray-400 mt-6">
          默认密码：123456
        </p>
      </div>
    </div>
  );
});

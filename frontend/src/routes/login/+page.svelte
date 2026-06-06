<script>
	import { auth } from '$stores/auth';
	import { api } from '$api/client';
	import { goto } from '$app/navigation';

	let username = '';
	let password = '';
	let error = '';
	let loading = false;

	async function handleLogin() {
		error = '';
		loading = true;
		try {
			const result = await api.login(username, password);
			auth.login(result.token, result.user);
			goto('/tasks');
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
	<div class="max-w-md w-full mx-4">
		<div class="bg-white rounded-2xl shadow-xl p-8">
			<div class="text-center mb-8">
				<div class="text-5xl mb-4">❄️</div>
				<h1 class="text-2xl font-bold text-gray-900">冷链箱周转管理系统</h1>
				<p class="text-gray-500 mt-2">社区疫苗配送管理平台</p>
			</div>

			<form on:submit|preventDefault={handleLogin} class="space-y-6">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">用户名</label>
					<input
						type="text"
						bind:value={username}
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						placeholder="请输入用户名"
						required
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">密码</label>
					<input
						type="password"
						bind:value={password}
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						placeholder="请输入密码"
						required
					/>
				</div>

				{#if error}
					<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
						{error}
					</div>
				{/if}

				<button
					type="submit"
					disabled={loading}
					class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? '登录中...' : '登 录'}
				</button>
			</form>

			<div class="mt-6 pt-6 border-t border-gray-100">
				<p class="text-sm text-gray-500 text-center">测试账号：</p>
				<div class="mt-3 space-y-2 text-xs text-gray-500">
					<div class="flex justify-between"><span>管理员</span><code>admin / password123</code></div>
					<div class="flex justify-between"><span>调度员</span><code>dispatcher1 / password123</code></div>
					<div class="flex justify-between"><span>护士</span><code>nurse1 / password123</code></div>
				</div>
			</div>
		</div>
	</div>
</div>

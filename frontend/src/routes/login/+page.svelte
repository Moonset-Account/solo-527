<script>
	import { goto } from '$app/navigation';
	import { api } from '$lib/utils/api';
	import { login } from '$lib/stores/auth';

	let username = '';
	let password = '';
	let error = '';
	let loading = false;

	async function handleLogin() {
		error = '';
		loading = true;
		try {
			const res = await api.login({ username, password });
			login(res.token, res.user);
			goto('/');
		} catch (e) {
			error = e.message || '登录失败';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
	<div class="card w-full max-w-md">
		<div class="text-center mb-8">
			<div class="w-16 h-16 bg-blue-100 rounded-full flex-center mx-auto mb-4">
				<svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
				</svg>
			</div>
			<h1 class="text-xl font-semibold text-gray-800">社区冷链药品交接系统</h1>
			<p class="text-sm text-gray-500 mt-2">卫生服务站疫苗与冷藏药品管理</p>
		</div>

		{#if error}
			<div class="alert alert-danger">{error}</div>
		{/if}

		<form on:submit|preventDefault={handleLogin}>
			<div class="form-group">
				<label class="form-label">用户名</label>
				<input
					class="form-input"
					type="text"
					bind:value={username}
					placeholder="请输入用户名"
					required
				/>
			</div>

			<div class="form-group">
				<label class="form-label">密码</label>
				<input
					class="form-input"
					type="password"
					bind:value={password}
					placeholder="请输入密码"
					required
				/>
			</div>

			<button class="btn btn-primary w-full" type="submit" disabled={loading}>
				{loading ? '登录中...' : '登 录'}
			</button>
		</form>

		<div class="mt-4 text-xs text-gray-500 text-center">
			<p>测试账号: admin/admin123 (管理员)</p>
			<p>nurse1/nurse123 (护士)</p>
		</div>
	</div>
</div>

<script>
	import { goto } from '$app/navigation';
	import { api, setAuth } from '$lib/api';

	let username = '';
	let password = '';
	let error = '';
	let loading = false;

	async function handleLogin() {
		if (!username || !password) {
			error = '请输入用户名和密码';
			return;
		}
		loading = true;
		error = '';
		try {
			const res = await api.login(username, password);
			setAuth(res.token, res.user);
			goto('/');
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	function handleKey(e) {
		if (e.key === 'Enter') handleLogin();
	}
</script>

<div class="login-container">
	<div class="login-box">
		<h1 class="title">🏗️ 小区装修施工通行系统</h1>
		<p class="subtitle">物业工程部管理平台</p>

		{#if error}
			<div class="error">{error}</div>
		{/if}

		<div class="form-group">
			<label>用户名</label>
			<input type="text" bind:value={username} placeholder="请输入用户名" on:keydown={handleKey} />
		</div>

		<div class="form-group">
			<label>密码</label>
			<input type="password" bind:value={password} placeholder="请输入密码" on:keydown={handleKey} />
		</div>

		<button class="login-btn" on:click={handleLogin} disabled={loading}>
			{loading ? '登录中...' : '登 录'}
		</button>

		<div class="tips">
			<p>测试账号：</p>
			<p>管理员：admin / admin123</p>
			<p>工程部：engineer / engineer123</p>
			<p>门岗：gate / gate123</p>
			<p>业主：owner / owner123</p>
		</div>
	</div>
</div>

<style>
	.login-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}
	.login-box {
		background: white;
		padding: 40px;
		border-radius: 12px;
		box-shadow: 0 20px 60px rgba(0,0,0,0.3);
		width: 100%;
		max-width: 400px;
	}
	.title {
		font-size: 22px;
		text-align: center;
		margin-bottom: 8px;
		color: #1f2937;
	}
	.subtitle {
		text-align: center;
		color: #6b7280;
		margin-bottom: 30px;
		font-size: 14px;
	}
	.error {
		background: #fef2f2;
		color: #dc2626;
		padding: 10px 14px;
		border-radius: 6px;
		margin-bottom: 20px;
		font-size: 14px;
	}
	.form-group {
		margin-bottom: 20px;
	}
	.form-group label {
		display: block;
		margin-bottom: 8px;
		font-size: 14px;
		color: #374151;
		font-weight: 500;
	}
	.form-group input {
		width: 100%;
		padding: 12px 14px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 14px;
		outline: none;
		transition: border-color 0.2s;
	}
	.form-group input:focus {
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
	}
	.login-btn {
		width: 100%;
		padding: 12px;
		background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 16px;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.2s;
	}
	.login-btn:hover:not(:disabled) {
		opacity: 0.9;
	}
	.login-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.tips {
		margin-top: 24px;
		padding-top: 20px;
		border-top: 1px solid #e5e7eb;
		font-size: 12px;
		color: #9ca3af;
		line-height: 1.8;
	}
</style>

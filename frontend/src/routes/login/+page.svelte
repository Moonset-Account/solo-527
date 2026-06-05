<script lang="ts">
	import { goto } from '$app/navigation';
	import { api } from '$lib/api';

	let username = '';
	let password = '';
	let loading = false;
	let error = '';

	async function handleLogin(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';

		try {
			const res = await api.login(username, password);
			localStorage.setItem('token', res.token);
			localStorage.setItem('user', JSON.stringify(res.user));
			goto('/');
		} catch (err: any) {
			error = err.message || '登录失败，请检查用户名和密码';
		} finally {
			loading = false;
		}
	}
</script>

<div class="login-container">
	<div class="login-header">
		<span class="logo">💊</span>
		<h1>社区药房处方取药排队系统</h1>
		<p class="subtitle">工作人员登录</p>
	</div>

	<form class="login-form" on:submit={handleLogin}>
		{#if error}
			<div class="error-message">{error}</div>
		{/if}

		<div class="form-group">
			<label>用户名</label>
			<input
				type="text"
				bind:value={username}
				placeholder="请输入用户名"
				required
			/>
		</div>

		<div class="form-group">
			<label>密码</label>
			<input
				type="password"
				bind:value={password}
				placeholder="请输入密码"
				required
			/>
		</div>

		<button type="submit" class="login-btn" disabled={loading}>
			{loading ? '登录中...' : '登录'}
		</button>

		<div class="quick-access">
			<p>测试账号：</p>
			<ul>
				<li>药师：pharmacist1 / pharma123</li>
				<li>窗口：window1 / window123</li>
				<li>管理员：admin / admin123</li>
			</ul>
		</div>

		<a href="/patient" class="patient-link">🔍 患者端查询入口</a>
	</form>
</div>

<style>
	.login-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 20px;
	}

	.login-header {
		text-align: center;
		color: white;
		margin-bottom: 32px;
	}

	.logo {
		font-size: 64px;
		display: block;
		margin-bottom: 16px;
	}

	.login-header h1 {
		font-size: 28px;
		font-weight: 600;
		margin-bottom: 8px;
	}

	.subtitle {
		font-size: 16px;
		opacity: 0.9;
	}

	.login-form {
		background: white;
		padding: 40px;
		border-radius: 12px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
		width: 100%;
		max-width: 400px;
	}

	.error-message {
		background: #fff2f0;
		border: 1px solid #ffccc7;
		color: #ff4d4f;
		padding: 12px;
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
		font-weight: 500;
		color: #595959;
	}

	.form-group input {
		width: 100%;
		padding: 12px 16px;
		border: 1px solid #d9d9d9;
		border-radius: 6px;
		font-size: 14px;
		transition: all 0.3s;
		box-sizing: border-box;
	}

	.form-group input:focus {
		outline: none;
		border-color: #1890ff;
		box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
	}

	.login-btn {
		width: 100%;
		padding: 14px;
		background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s;
	}

	.login-btn:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
	}

	.login-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.quick-access {
		margin-top: 24px;
		padding-top: 20px;
		border-top: 1px solid #f0f0f0;
	}

	.quick-access p {
		font-size: 13px;
		color: #8c8c8c;
		margin-bottom: 8px;
	}

	.quick-access ul {
		list-style: none;
		font-size: 12px;
		color: #8c8c8c;
		line-height: 1.8;
	}

	.patient-link {
		display: block;
		text-align: center;
		margin-top: 20px;
		color: #1890ff;
		text-decoration: none;
		font-size: 14px;
	}

	.patient-link:hover {
		text-decoration: underline;
	}
</style>

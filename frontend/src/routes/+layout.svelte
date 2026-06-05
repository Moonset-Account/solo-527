<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let user: any = null;

	onMount(() => {
		const savedUser = localStorage.getItem('user');
		if (savedUser) {
			user = JSON.parse(savedUser);
		}
	});

	function logout() {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		user = null;
		goto('/login');
	}

	$: currentPath = $page.url.pathname;
	$: isLoginPage = currentPath === '/login' || currentPath === '/patient';
</script>

{#if !isLoginPage}
	<nav class="navbar">
		<div class="nav-brand">
			<span class="logo">💊</span>
			<h1>社区药房处方取药排队系统</h1>
		</div>
		{#if user}
			<div class="nav-user">
				<span class="user-info">
					{user.name} ({user.role === 'admin' ? '管理员' : user.role === 'pharmacist' ? '药师' : '窗口'})
				</span>
				<button on:click={logout} class="logout-btn">退出登录</button>
			</div>
		{/if}
	</nav>

	{#if user && !isLoginPage}
		<div class="sidebar-layout">
			<aside class="sidebar">
				<ul class="nav-menu">
					<li class:active={currentPath === '/'}>
						<a href="/">🏠 首页</a>
					</li>
					{#if user.role === 'pharmacist' || user.role === 'admin'}
						<li class:active={currentPath === '/pharmacist'}>
							<a href="/pharmacist">📝 处方管理</a>
						</li>
					{/if}
					{#if user.role === 'window' || user.role === 'admin'}
						<li class:active={currentPath === '/window'}>
							<a href="/window">🪟 窗口叫号</a>
						</li>
					{/if}
					{#if user.role === 'admin'}
						<li class:active={currentPath === '/admin'}>
							<a href="/admin">⚙️ 系统管理</a>
						</li>
					{/if}
				</ul>
			</aside>
			<main class="main-content">
				<slot />
			</main>
		</div>
	{:else}
		<main class="main-content">
			<slot />
		</main>
	{/if}
{:else}
	<main>
		<slot />
	</main>
{/if}

<style>
	.navbar {
		background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
		color: white;
		padding: 0 24px;
		height: 60px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.nav-brand {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.logo {
		font-size: 28px;
	}

	.nav-brand h1 {
		font-size: 20px;
		font-weight: 600;
	}

	.nav-user {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.user-info {
		font-size: 14px;
	}

	.logout-btn {
		background: rgba(255, 255, 255, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.3);
		color: white;
		padding: 6px 16px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
		transition: all 0.3s;
	}

	.logout-btn:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	.sidebar-layout {
		display: flex;
		min-height: calc(100vh - 60px);
	}

	.sidebar {
		width: 220px;
		background: white;
		border-right: 1px solid #e8e8e8;
		padding: 16px 0;
	}

	.nav-menu {
		list-style: none;
	}

	.nav-menu li a {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 24px;
		color: #595959;
		text-decoration: none;
		font-size: 14px;
		transition: all 0.3s;
	}

	.nav-menu li a:hover {
		background: #e6f7ff;
		color: #1890ff;
	}

	.nav-menu li.active a {
		background: #e6f7ff;
		color: #1890ff;
		border-right: 3px solid #1890ff;
	}

	.main-content {
		flex: 1;
		padding: 24px;
		background: #f0f2f5;
		overflow-y: auto;
	}
</style>

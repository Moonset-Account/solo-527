<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { getUser, clearAuth } from '$lib/api';

	let user = null;
	let showMenu = false;

	onMount(() => {
		user = getUser();
		if (!$page.url.pathname.startsWith('/login') && !user) {
			goto('/login');
		}
	});

	function logout() {
		clearAuth();
		goto('/login');
	}

	$: currentPath = $page.url.pathname;

	const menuItems = [
		{ path: '/', label: '首页', roles: ['admin', 'engineer', 'gate', 'owner'] },
		{ path: '/applications', label: '施工申请', roles: ['admin', 'engineer', 'gate', 'owner'] },
		{ path: '/applications/new', label: '新建申请', roles: ['admin', 'engineer', 'owner'] },
		{ path: '/review', label: '审核管理', roles: ['admin', 'engineer'] },
		{ path: '/gate', label: '门岗核验', roles: ['admin', 'engineer', 'gate'] },
		{ path: '/violations', label: '违规记录', roles: ['admin', 'engineer', 'gate'] },
		{ path: '/notifications', label: '通知中心', roles: ['admin', 'engineer', 'gate', 'owner'] },
		{ path: '/audit', label: '审计查询', roles: ['admin'] }
	];

	$: filteredMenu = menuItems.filter(item => user && item.roles.includes(user.role));
</script>

{#if user && !currentPath.startsWith('/login')}
<div class="layout">
	<header class="header">
		<div class="logo">🏗️ 装修施工通行系统</div>
		<nav class="nav">
			{#each filteredMenu as item}
				<a href={item.path} class="nav-link {currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path)) ? 'active' : ''}">
					{item.label}
				</a>
			{/each}
		</nav>
		<div class="user-info" on:click={() => showMenu = !showMenu}>
			<span class="user-name">{user.name}</span>
			<span class="user-role">{user.role === 'admin' ? '管理员' : user.role === 'engineer' ? '工程部' : user.role === 'gate' ? '门岗' : '业主'}</span>
			{#if showMenu}
				<div class="dropdown">
					<button on:click={logout} class="logout-btn">退出登录</button>
				</div>
			{/if}
		</div>
	</header>
	<main class="main">
		<slot />
	</main>
</div>
{:else}
	<slot />
{/if}

<style>
	.layout {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
	.header {
		background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
		color: white;
		padding: 0 24px;
		display: flex;
		align-items: center;
		height: 60px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.1);
	}
	.logo {
		font-size: 18px;
		font-weight: 600;
		margin-right: 40px;
	}
	.nav {
		display: flex;
		gap: 4px;
		flex: 1;
	}
	.nav-link {
		color: rgba(255,255,255,0.85);
		text-decoration: none;
		padding: 8px 16px;
		border-radius: 6px;
		font-size: 14px;
		transition: all 0.2s;
	}
	.nav-link:hover {
		background: rgba(255,255,255,0.1);
		color: white;
	}
	.nav-link.active {
		background: rgba(255,255,255,0.2);
		color: white;
	}
	.user-info {
		position: relative;
		cursor: pointer;
		padding: 8px 12px;
		border-radius: 6px;
		background: rgba(255,255,255,0.1);
	}
	.user-info:hover {
		background: rgba(255,255,255,0.15);
	}
	.user-name {
		font-weight: 500;
		margin-right: 8px;
	}
	.user-role {
		font-size: 12px;
		opacity: 0.8;
	}
	.dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 4px;
		background: white;
		border-radius: 6px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		overflow: hidden;
		z-index: 100;
	}
	.logout-btn {
		width: 100%;
		padding: 10px 20px;
		border: none;
		background: white;
		color: #ef4444;
		cursor: pointer;
		text-align: left;
	}
	.logout-btn:hover {
		background: #fef2f2;
	}
	.main {
		flex: 1;
		padding: 24px;
		max-width: 1400px;
		margin: 0 auto;
		width: 100%;
	}
</style>

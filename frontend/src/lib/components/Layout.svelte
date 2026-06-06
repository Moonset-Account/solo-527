<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { user, drawerOpen, logout as logoutStore } from '$lib/stores/auth';
	import AbnormalDrawer from './AbnormalDrawer.svelte';

	const navItems = [
		{ path: '/', label: '首页', icon: 'home' },
		{ path: '/receive', label: '药品入库', icon: 'receive' },
		{ path: '/batches', label: '批次管理', icon: 'batch' },
		{ path: '/handover', label: '发放交接', icon: 'handover' },
		{ path: '/records', label: '交接记录', icon: 'records' }
	];

	function handleLogout() {
		logoutStore();
		goto('/login');
	}
</script>

<div class="app-layout">
	<header class="header">
		<div class="header-content">
			<div class="flex items-center gap-3">
				<div class="logo">
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
					</svg>
				</div>
				<h1 class="text-white text-lg font-semibold">冷链药品交接系统</h1>
			</div>

			<nav class="nav">
				{#each navItems as item}
					<a
						href={item.path}
						class="nav-link { $page.url.pathname === item.path ? 'active' : '' }"
						data-sveltekit-preload-data="hover"
					>
						{item.label}
					</a>
				{/each}
			</nav>

			<div class="flex items-center gap-4">
				<button class="btn btn-outline header-btn" on:click={() => drawerOpen.set(true)}>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
					</svg>
					异常提醒
				</button>

				<div class="user-info">
					<span class="text-white text-sm">{$user?.name}</span>
					<span class="badge badge-info text-xs">{$user?.role === 'admin' ? '管理员' : $user?.role === 'nurse' ? '护士' : '接种员'}</span>
					<button class="logout-btn" on:click={handleLogout}>退出</button>
				</div>
			</div>
		</div>
	</header>

	<main class="main-content">
		<slot />
	</main>

	<AbnormalDrawer />
</div>

<style>
	.app-layout {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.header {
		background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		position: sticky;
		top: 0;
		z-index: 40;
	}

	.header-content {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0.875rem 1.5rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.logo {
		width: 40px;
		height: 40px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.nav {
		display: flex;
		gap: 0.25rem;
	}

	.nav-link {
		padding: 0.5rem 1rem;
		color: rgba(255, 255, 255, 0.8);
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: 0.5rem;
		transition: all 0.2s;
	}

	.nav-link:hover {
		background: rgba(255, 255, 255, 0.1);
		color: white;
	}

	.nav-link.active {
		background: rgba(255, 255, 255, 0.2);
		color: white;
	}

	.header-btn {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.3);
		color: white;
	}

	.header-btn:hover {
		background: rgba(255, 255, 255, 0.25);
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.logout-btn {
		background: rgba(255, 255, 255, 0.15);
		border: 1px solid rgba(255, 255, 255, 0.3);
		color: white;
		padding: 0.375rem 0.75rem;
		border-radius: 0.5rem;
		font-size: 0.8125rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.logout-btn:hover {
		background: rgba(255, 255, 255, 0.25);
	}

	.main-content {
		flex: 1;
		padding: 1.5rem;
		max-width: 1400px;
		margin: 0 auto;
		width: 100%;
	}

	@media (max-width: 1024px) {
		.nav {
			display: none;
		}
	}
</style>

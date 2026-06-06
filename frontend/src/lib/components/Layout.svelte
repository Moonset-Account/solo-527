<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { user, drawerOpen, logout as logoutStore } from '$lib/stores/auth';
	import { online, offlineQueueCount, processOfflineQueue, syncStatus } from '$lib/utils/api';
	import AbnormalDrawer from './AbnormalDrawer.svelte';

	const navItems = [
		{ path: '/', label: '首页', icon: 'home' },
		{ path: '/receive', label: '药品入库', icon: 'receive' },
		{ path: '/batches', label: '批次管理', icon: 'batch' },
		{ path: '/handover', label: '发放交接', icon: 'handover' },
		{ path: '/records', label: '交接记录', icon: 'records' }
	];

	let syncToast = '';

	function handleLogout() {
		logoutStore();
		goto('/login');
	}

	onMount(() => {
		const handleSynced = (e) => {
			syncToast = `✅ 已同步 ${e.detail.count} 条离线数据`;
			setTimeout(() => syncToast = '', 4000);
		};
		const handleEnqueued = (e) => {
			syncToast = `💾 数据已保存到离线队列（共 ${e.detail.count} 条）`;
			setTimeout(() => syncToast = '', 4000);
		};

		window.addEventListener('offline-synced', handleSynced);
		window.addEventListener('offline-enqueued', handleEnqueued);
	});
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
				{#if !$online}
					<span class="badge badge-danger">
						<svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
						</svg>
						离线模式
					</span>
				{/if}

				{#if $offlineQueueCount > 0}
					<button 
						class="btn {$syncStatus === 'syncing' ? 'btn-secondary' : 'btn-warning'} header-btn" 
						on:click={processOfflineQueue}
						disabled={$syncStatus === 'syncing'}
					>
						{#if $syncStatus === 'syncing'}
							<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
							同步中...
						{:else}
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							队列 ({$offlineQueueCount})
						{/if}
					</button>
				{/if}

				{#if $syncStatus === 'synced'}
					<span class="badge badge-success">
						<svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
						</svg>
						已同步
					</span>
				{/if}

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

	{#if syncToast}
		<div class="sync-toast">
			{syncToast}
		</div>
	{/if}

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

	.sync-toast {
		position: fixed;
		top: 80px;
		right: 24px;
		background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
		color: white;
		padding: 0.875rem 1.25rem;
		border-radius: 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		box-shadow: 0 10px 25px rgba(22, 163, 74, 0.3);
		z-index: 100;
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	.animate-spin {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>

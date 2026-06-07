<script lang="ts">
	import { page } from '$app/stores';
	import { getUserRole, setUserRole } from '$stores';
	import { exportToPDF } from '$utils/export';
	import type { UserRole } from '$lib/types';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	let exporting = $state(false);

	async function handleExport() {
		const contentIdMap: Record<string, string> = {
			'/': 'dashboard-content',
			'/data': 'data-page-content',
			'/reports': 'reports-page-content',
			'/validation': 'validation-page-content'
		};
		const pathname = $page.url.pathname;
		const contentId = contentIdMap[pathname] || 'dashboard-content';
		const el = document.getElementById(contentId);
		if (!el) return;
		exporting = true;
		try {
			const filename = `SKU周转分析_${new Date().toISOString().slice(0, 10)}`;
			await exportToPDF(contentId, filename);
		} catch (e) {
			console.error(e);
		}
		exporting = false;
	}

	const navItems = [
		{
			label: '分析仪表盘',
			href: '/',
			icon: 'dashboard',
			match: (path: string) => path === '/'
		},
		{
			label: '数据管理',
			href: '/data',
			icon: 'folder',
			match: (path: string) => path.startsWith('/data')
		},
		{
			label: '周报中心',
			href: '/reports',
			icon: 'report',
			match: (path: string) => path.startsWith('/reports')
		},
		{
			label: '维度校验',
			href: '/validation',
			icon: 'check',
			match: (path: string) => path.startsWith('/validation')
		}
	] as const;

	const roles: Array<{ role_id: UserRole['role_id']; role_name: string }> = [
		{ role_id: 'admin', role_name: '系统管理员' },
		{ role_id: 'manager', role_name: '仓库经理' },
		{ role_id: 'analyst', role_name: '数据分析师' }
	];

	let currentRole = $state(getUserRole());
	let sidebarCollapsed = $state(false);

	function onRoleChange(e: Event) {
		const select = e.target as HTMLSelectElement;
		const found = roles.find((r) => r.role_id === select.value);
		if (found) {
			const newRole: UserRole = {
				role_id: found.role_id,
				role_name: found.role_name,
				accessible_warehouses: currentRole.accessible_warehouses,
				accessible_suppliers: currentRole.accessible_suppliers,
				accessible_sku_categories: currentRole.accessible_sku_categories
			};
			setUserRole(newRole);
			currentRole = newRole;
		}
	}

	function isActive(item: (typeof navItems)[number]): boolean {
		return item.match($page.url.pathname);
	}

	const pageTitle = $derived.by(() => {
		const path = $page.url.pathname;
		const found = navItems.find((item) => item.match(path));
		return found ? found.label : 'SKU周转分析';
	});
</script>

<div class="app-layout" class:collapsed={sidebarCollapsed}>
	<aside class="sidebar">
		<div class="sidebar-header">
			<svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
			</svg>
			<span class="logo-text">SKU周转分析</span>
		</div>

		<nav class="sidebar-nav">
			{#each navItems as item}
				<a
					href={item.href}
					class="nav-item"
					class:active={isActive(item)}
					aria-current={isActive(item) ? 'page' : undefined}
				>
					{#if item.icon === 'dashboard'}
						<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<rect x="3" y="3" width="7" height="7" rx="1" />
							<rect x="14" y="3" width="7" height="7" rx="1" />
							<rect x="3" y="14" width="7" height="7" rx="1" />
							<rect x="14" y="14" width="7" height="7" rx="1" />
						</svg>
					{:else if item.icon === 'folder'}
						<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
						</svg>
					{:else if item.icon === 'report'}
						<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
							<polyline points="14 2 14 8 20 8" />
							<line x1="16" y1="13" x2="8" y2="13" />
							<line x1="16" y1="17" x2="8" y2="17" />
						</svg>
					{:else if item.icon === 'check'}
						<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M9 11l3 3L22 4" />
							<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
						</svg>
					{/if}
					<span class="nav-label">{item.label}</span>
				</a>
			{/each}
		</nav>

		<div class="sidebar-footer">
			<svg class="role-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
				<circle cx="12" cy="7" r="4" />
			</svg>
			<select class="role-select" value={currentRole.role_id} onchange={onRoleChange}>
				{#each roles as role}
					<option value={role.role_id}>{role.role_name}</option>
				{/each}
			</select>
		</div>

		<button class="collapse-btn" onclick={() => (sidebarCollapsed = !sidebarCollapsed)} aria-label="切换侧边栏">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<polyline points="15 18 9 12 15 6" />
			</svg>
		</button>
	</aside>

	<main class="main-content">
		<header class="top-bar">
			<h1 class="page-title">{pageTitle}</h1>
			<div class="top-actions">
				<button class="action-btn" onclick={handleExport} disabled={exporting} title="导出PDF">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="7 10 12 15 17 10" />
						<line x1="12" y1="15" x2="12" y2="3" />
					</svg>
					<span>{exporting ? '导出中...' : '导出PDF'}</span>
				</button>
			</div>
		</header>
		<div class="content-body">
			{@render children()}
		</div>
	</main>
</div>

<style>
	.app-layout {
		display: grid;
		grid-template-columns: 240px 1fr;
		min-height: 100vh;
		transition: grid-template-columns 0.25s ease;
	}

	.app-layout.collapsed {
		grid-template-columns: 60px 1fr;
	}

	.sidebar {
		background-color: var(--color-primary);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		position: relative;
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 20px 16px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.logo-icon {
		width: 28px;
		height: 28px;
		color: var(--color-accent);
		flex-shrink: 0;
	}

	.logo-text {
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: 16px;
		color: #ffffff;
		white-space: nowrap;
		overflow: hidden;
		transition: opacity 0.2s ease;
	}

	.collapsed .logo-text {
		opacity: 0;
		width: 0;
	}

	.sidebar-nav {
		flex: 1;
		padding: 12px 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		color: rgba(255, 255, 255, 0.7);
		text-decoration: none;
		border-left: 3px solid transparent;
		transition: all 0.15s ease;
		white-space: nowrap;
		overflow: hidden;
	}

	.nav-item:hover {
		color: #ffffff;
		background-color: rgba(255, 255, 255, 0.06);
	}

	.nav-item.active {
		color: #ffffff;
		background-color: rgba(255, 107, 53, 0.12);
		border-left-color: var(--color-accent);
	}

	.nav-icon {
		width: 20px;
		height: 20px;
		flex-shrink: 0;
	}

	.nav-label {
		font-size: 14px;
		transition: opacity 0.2s ease;
	}

	.collapsed .nav-label {
		opacity: 0;
	}

	.sidebar-footer {
		padding: 12px 16px;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		display: flex;
		align-items: center;
		gap: 8px;
		overflow: hidden;
	}

	.role-icon {
		width: 20px;
		height: 20px;
		color: rgba(255, 255, 255, 0.5);
		flex-shrink: 0;
	}

	.role-select {
		background-color: var(--color-primary-light);
		color: rgba(255, 255, 255, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 6px;
		padding: 6px 8px;
		font-size: 13px;
		font-family: var(--font-body);
		outline: none;
		cursor: pointer;
		flex: 1;
		min-width: 0;
		transition: opacity 0.2s ease;
	}

	.role-select:focus {
		border-color: var(--color-accent);
	}

	.collapsed .role-select {
		opacity: 0;
		width: 0;
		padding: 0;
		border: 0;
	}

	.collapse-btn {
		position: absolute;
		bottom: 12px;
		right: -14px;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background-color: var(--color-primary-light);
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: rgba(255, 255, 255, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		padding: 0;
		transition: transform 0.25s ease, background-color 0.15s ease;
		z-index: 10;
	}

	.collapse-btn:hover {
		background-color: var(--color-accent);
		color: #ffffff;
	}

	.collapse-btn svg {
		width: 16px;
		height: 16px;
		transition: transform 0.25s ease;
	}

	.collapsed .collapse-btn svg {
		transform: rotate(180deg);
	}

	.main-content {
		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow: hidden;
	}

	.top-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 24px;
		background-color: var(--color-card);
		border-bottom: 1px solid var(--color-surface-dark);
		flex-shrink: 0;
	}

	.page-title {
		font-family: var(--font-heading);
		font-size: 20px;
		font-weight: 700;
		color: var(--color-primary);
		margin: 0;
	}

	.top-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		border-radius: 8px;
		border: 1px solid var(--color-surface-dark);
		background-color: var(--color-card);
		color: var(--color-primary);
		font-size: 13px;
		font-family: var(--font-body);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.action-btn:hover {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.content-body {
		flex: 1;
		overflow-y: auto;
		padding: 24px;
	}

	@media (max-width: 1023px) {
		.app-layout {
			grid-template-columns: 60px 1fr;
		}

		.logo-text,
		.nav-label {
			opacity: 0;
		}

		.role-select {
			opacity: 0;
			width: 0;
			padding: 0;
			border: 0;
		}

		.collapse-btn svg {
			transform: rotate(180deg);
		}
	}
</style>

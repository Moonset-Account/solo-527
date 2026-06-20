<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { page } from '$app/stores';
	import { pendingReviewsCount, pendingRiskCount } from '$lib/stores';

	let { children } = $props();

	const navItems = [
		{ href: '/', label: '邮件列表', icon: '📧' },
		{ href: '/emails/new', label: '新建邮件', icon: '✏️' },
		{ href: '/reviews', label: '复核任务', icon: '🔍', badge: $pendingReviewsCount },
		{ href: '/risks', label: '风险样本', icon: '⚠️', badge: $pendingRiskCount },
		{ href: '/analytics', label: '命中率分析', icon: '📊' },
		{ href: '/knowledge', label: '知识库', icon: '📚' },
		{ href: '/references', label: '引用来源', icon: '📖' },
		{ href: '/forbidden', label: '禁用词库', icon: '🚫' },
		{ href: '/trainers', label: '培训负责人', icon: '👤' }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>销售邮件质检分析系统</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 flex">
	<Sidebar {navItems} currentPath={$page.url.pathname} />
	<main class="flex-1 overflow-auto">
		<div class="max-w-7xl mx-auto px-6 py-8">
			{@render children()}
		</div>
	</main>
</div>

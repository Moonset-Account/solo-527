<script lang="ts">
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import { currentUser } from '$stores/user';
	import {
		Archive,
		Shield,
		AlertTriangle,
		FlaskConical,
		FileText,
		Settings,
		ChevronRight
	} from 'lucide-svelte';

	let path = $derived($page.url.pathname);
	let user = $derived(get(currentUser));
	let isAdmin = $derived(user?.role === 'admin');

	const navItems = [
		{
			key: 'experiments',
			label: '实验数据管理',
			icon: Archive,
			href: '/admin/experiments'
		},
		{
			key: 'compliance',
			label: '安全合规看板',
			icon: Shield,
			href: '/admin/compliance'
		},
		{
			key: 'risks',
			label: '危化风险处理',
			icon: AlertTriangle,
			href: '/admin/risks'
		},
		{
			key: 'reagents',
			label: '试剂库存管理',
			icon: FlaskConical,
			href: '/admin/reagents'
		},
		{
			key: 'requisitions',
			label: '领用申请审批',
			icon: FileText,
			href: '/admin/requisitions'
		}
	];
</script>

<div class="min-h-[calc(100vh-4rem)] bg-gray-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<div class="flex flex-col lg:flex-row gap-8">
			<aside class="lg:w-64 flex-shrink-0">
				<div class="card p-4 sticky top-24">
					<div class="mb-6">
						<h2 class="text-lg font-semibold text-gray-900 mb-1">管理后台</h2>
						<p class="text-sm text-gray-500">
							{isAdmin ? '管理员权限' : '仅查看权限'}
						</p>
					</div>

					<nav class="space-y-1">
						{#each navItems as item}
							<a
								href={item.href}
								class="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
								class:bg-primary-50={path.startsWith(item.href)}
								class:text-primary-700={path.startsWith(item.href)}
								class:text-gray-600={!path.startsWith(item.href)}
								class:hover:bg-gray-100={!path.startsWith(item.href)}
							>
								<span class="flex items-center gap-3">
									<item.icon class="w-4 h-4" />
									{item.label}
								</span>
								<ChevronRight
									class="w-4 h-4"
									class:opacity-100={path.startsWith(item.href)}
									class:opacity-0={!path.startsWith(item.href)}
								/>
							</a>
						{/each}
					</nav>

					<div class="mt-6 pt-6 border-t border-gray-100">
						<div class="flex items-center gap-3 px-3 py-2">
							<div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium text-sm">
								{user?.name?.charAt(0) || 'U'}
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium text-gray-900 truncate">
									{user?.name}
								</p>
								<p class="text-xs text-gray-500 truncate">
									{user?.email}
								</p>
							</div>
						</div>
					</div>
				</div>
			</aside>

			<main class="flex-1 min-w-0">
				<slot />
			</main>
		</div>
	</div>
</div>

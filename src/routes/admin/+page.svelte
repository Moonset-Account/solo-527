<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { currentUser } from '$stores/user';
	import StatCard from '$components/StatCard.svelte';
	import {
		Archive,
		Shield,
		AlertTriangle,
		FlaskConical,
		FileText,
		TrendingUp,
		TrendingDown,
		Minus
	} from 'lucide-svelte';
	import {
		mockCompliance,
		mockRisks,
		mockExperiments,
		mockReagents,
		mockRequisitions,
		getComplianceStats,
		getRiskStats
	} from '$server/mockData';

	let loading = $state(true);
	let complianceStats = $state(getComplianceStats());
	let riskStats = $state(getRiskStats());
	let pendingRequisitions = $state(0);
	let totalExperiments = $state(0);
	let totalReagents = $state(0);

	let user = $derived(get(currentUser));

	onMount(async () => {
		try {
			pendingRequisitions = mockRequisitions.filter((r) => r.status === 'pending').length;
			totalExperiments = mockExperiments.length;
			totalReagents = mockReagents.length;
		} catch (e) {
			console.error('Failed to load admin stats:', e);
		} finally {
			loading = false;
		}
	});

	const quickActions = [
		{
			title: '实验数据管理',
			description: '查看和管理所有归档的实验数据',
			icon: Archive,
			href: '/admin/experiments',
			color: 'purple'
		},
		{
			title: '安全合规看板',
			description: '监控所有合规记录和处理状态',
			icon: Shield,
			href: '/admin/compliance',
			color: 'green'
		},
		{
			title: '危化风险处理',
			description: '处理和跟踪危化品风险提醒',
			icon: AlertTriangle,
			href: '/admin/risks',
			color: 'orange'
		},
		{
			title: '试剂库存管理',
			description: '管理试剂库存信息和库存预警',
			icon: FlaskConical,
			href: '/admin/reagents',
			color: 'blue'
		},
		{
			title: '领用申请审批',
			description: '审批试剂领用申请',
			icon: FileText,
			href: '/admin/requisitions',
			color: 'indigo'
		}
	];

	const colorClasses: Record<string, string> = {
		purple: 'bg-purple-100 text-purple-600',
		green: 'bg-success-100 text-success-600',
		orange: 'bg-warning-100 text-warning-600',
		blue: 'bg-primary-100 text-primary-600',
		indigo: 'bg-indigo-100 text-indigo-600'
	};
</script>

<div class="space-y-8 animate-fade-in">
	<div>
		<h1 class="text-2xl font-bold text-gray-900 mb-2">管理后台</h1>
		<p class="text-gray-500">
			欢迎，{user.name} · 今天是 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
		</p>
	</div>

	{#if loading}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			{#each Array(4) as _}
				<div class="h-28 bg-gray-100 rounded-xl animate-pulse" />
			{/each}
		</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<StatCard
				title="待审批申请"
				value={pendingRequisitions}
				icon={FileText}
				color="indigo"
				trend="up"
				trendValue="待处理"
			/>
			<StatCard
				title="待处理风险"
				value={riskStats.pending + riskStats.processing}
				icon={AlertTriangle}
				color="orange"
				trend="neutral"
				trendValue="需关注"
			/>
			<StatCard
				title="合规记录"
				value={complianceStats.total}
				icon={Shield}
				color="green"
				trend="up"
				trendValue="完整追踪"
			/>
			<StatCard
				title="试剂品类"
				value={totalReagents}
				icon={FlaskConical}
				color="blue"
				trend="neutral"
				trendValue="在库"
			/>
		</div>
	{/if}

	<div>
		<h2 class="text-lg font-semibold text-gray-900 mb-4">快捷操作</h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each quickActions as action}
				<a
					href={action.href}
					class="card-hover p-5 group cursor-pointer"
				>
					<div class="flex items-start gap-4">
						<div class={`w-12 h-12 ${colorClasses[action.color]} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
							<action.icon class="w-6 h-6" />
						</div>
						<div class="flex-1 min-w-0">
							<h3 class="font-semibold text-gray-900 mb-1">
								{action.title}
							</h3>
							<p class="text-sm text-gray-500">
								{action.description}
							</p>
						</div>
					</div>
				</a>
			{/each}
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<div class="card p-6">
			<div class="flex items-center justify-between mb-4">
				<h3 class="font-semibold text-gray-900">最近风险提醒</h3>
				<a href="/admin/risks" class="text-sm text-primary-600 hover:text-primary-700 font-medium">
					查看全部
				</a>
			</div>
			<div class="space-y-3">
				{#each mockRisks.slice(0, 3) as risk}
					<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
						<div class={`w-2 h-2 rounded-full ${
							risk.riskLevel === 'critical' ? 'bg-red-500 animate-pulse' :
							risk.riskLevel === 'high' ? 'bg-orange-500' :
							risk.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
						}`} />
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium text-gray-900 truncate">
								{risk.reagentName} - {risk.riskType}
							</p>
							<p class="text-xs text-gray-500 truncate">
								{risk.userName}
							</p>
						</div>
						<span class={`text-xs px-2 py-0.5 rounded-full font-medium ${
							risk.status === 'pending' ? 'bg-red-100 text-red-700' :
							risk.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
							'bg-green-100 text-green-700'
						}`}>
							{risk.status === 'pending' ? '待处理' : risk.status === 'processing' ? '处理中' : '已解决'}
						</span>
					</div>
				{/each}
			</div>
		</div>

		<div class="card p-6">
			<div class="flex items-center justify-between mb-4">
				<h3 class="font-semibold text-gray-900">最近合规记录</h3>
				<a href="/admin/compliance" class="text-sm text-primary-600 hover:text-primary-700 font-medium">
					查看全部
				</a>
			</div>
			<div class="space-y-3">
				{#each mockCompliance.slice(0, 3) as record}
					<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
						<div class={`w-2 h-2 rounded-full ${
							record.status === 'completed' ? 'bg-green-500' :
							record.status === 'pending' ? 'bg-yellow-500' :
							'bg-gray-400'
						}`} />
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium text-gray-900 truncate">
								{record.details}
							</p>
							<p class="text-xs text-gray-500">
								{record.operator} · {new Date(record.createdAt).toLocaleDateString('zh-CN')}
							</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import type { Session, DimensionType, Pagination } from '@/lib/types';
	import { getSessionsByDimension } from '@/lib/utils/queryService';
	import { filterStore } from '@/lib/stores/filterStore';
	import {
		formatDateTime,
		formatSatisfaction,
		getLevelLabel,
		getChannelLabel
	} from '@/lib/utils/format';
	import { X, ChevronLeft, ChevronRight, User, Bot, MessageSquare } from 'lucide-svelte';

	const dispatch = createEventDispatcher<{
		close: void;
		addNote: { dimension: DimensionType; value: string };
	}>();

	export let dimension: DimensionType;
	export let dimensionValue: string;

	let sessions = $state<Session[]>([]);
	let pagination = $state<Pagination>({ page: 1, pageSize: 10 });
	let total = $state(0);
	let loading = $state(false);

	$effect(() => {
		loadData();
	});

	function loadData() {
		loading = true;
		const filters = $filterStore;
		const allSessions = getSessionsByDimension(dimension, dimensionValue, filters);
		total = allSessions.length;
		const start = (pagination.page - 1) * pagination.pageSize;
		sessions = allSessions.slice(start, start + pagination.pageSize);
		loading = false;
	}

	function goToPage(page: number) {
		pagination.page = page;
		loadData();
	}

	const totalPages = $derived(Math.ceil(total / pagination.pageSize));
</script>

<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
	<div class="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-scale-in">
		<div class="flex items-center justify-between p-4 border-b border-slate-200">
			<div>
				<h3 class="text-lg font-semibold text-slate-900">
					会话明细 - {dimensionValue}
				</h3>
				<p class="text-sm text-slate-500 mt-1">
					共 {total} 条会话记录
				</p>
			</div>
			<div class="flex items-center gap-2">
				<button
					class="btn btn-outline text-sm"
					onclick={() => dispatch('addNote', { dimension, value: dimensionValue })}
				>
					<MessageSquare class="w-4 h-4 inline mr-1" />
					添加备注
				</button>
				<button
					class="text-slate-400 hover:text-slate-600 p-1"
					onclick={() => dispatch('close')}
				>
					<X class="w-5 h-5" />
				</button>
			</div>
		</div>

		<div class="flex-1 overflow-auto">
			{#if loading}
				<div class="flex items-center justify-center py-12">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
				</div>
			{:else if sessions.length === 0}
				<div class="flex flex-col items-center justify-center py-12 text-slate-400">
					<MessageSquare class="w-12 h-12 mb-4 opacity-50" />
					<p>暂无会话数据</p>
				</div>
			{:else}
				<div class="divide-y divide-slate-100">
					{#each sessions as session}
						<div class="p-4 hover:bg-slate-50 transition-colors">
							<div class="flex items-start justify-between mb-3">
								<div class="flex items-center gap-3">
									<span class="badge badge-info">{session.session_id}</span>
									<span class="text-sm text-slate-500">
										{formatDateTime(session.start_time)}
									</span>
								</div>
								<div class="flex items-center gap-2">
									{#if session.is_transfer_to_human}
										<span class="badge badge-danger">已转人工</span>
									{/if}
									<span class="badge {formatSatisfaction(session.satisfaction_score).class}">
										{formatSatisfaction(session.satisfaction_score).text}
										({session.satisfaction_score})
									</span>
								</div>
							</div>

							<div class="grid grid-cols-4 gap-4 mb-3 text-sm">
								<div>
									<span class="text-slate-400">用户:</span>
									<span class="ml-1 text-slate-700 font-medium">{session.user_id}</span>
								</div>
								<div>
									<span class="text-slate-400">渠道:</span>
									<span class="ml-1 text-slate-700">{getChannelLabel(session.channel)}</span>
								</div>
								<div>
									<span class="text-slate-400">等级:</span>
									<span class="ml-1 text-slate-700">{getLevelLabel(session.customer_level)}</span>
								</div>
								<div>
									<span class="text-slate-400">轮次:</span>
									<span class="ml-1 text-slate-700 font-mono">{session.total_rounds}</span>
								</div>
							</div>

							<div class="space-y-2">
								<div class="flex gap-2">
									<div class="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
										<User class="w-4 h-4 text-blue-600" />
									</div>
									<div class="flex-1 bg-slate-100 rounded-lg p-3">
										<p class="text-sm text-slate-700">{session.user_question}</p>
									</div>
								</div>
								<div class="flex gap-2">
									<div class="flex-shrink-0 w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
										<Bot class="w-4 h-4 text-green-600" />
									</div>
									<div class="flex-1 bg-green-50 border border-green-100 rounded-lg p-3">
										<p class="text-sm text-slate-700">{session.bot_answer}</p>
									</div>
								</div>
								{#if session.transfer_reason}
									<div class="pl-9">
										<span class="text-xs text-red-500">
											转人工原因: {session.transfer_reason}
										</span>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		{#if totalPages > 1}
			<div class="flex items-center justify-between p-4 border-t border-slate-200">
				<p class="text-sm text-slate-500">
					显示 {(pagination.page - 1) * pagination.pageSize + 1} - {Math.min(pagination.page * pagination.pageSize, total)} 条，共 {total} 条
				</p>
				<div class="flex items-center gap-1">
					<button
						class="btn btn-secondary px-3 py-1 text-sm"
						disabled={pagination.page <= 1}
						onclick={() => goToPage(pagination.page - 1)}
					>
						<ChevronLeft class="w-4 h-4" />
					</button>
					{#each Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + Math.max(1, pagination.page - 2)) as page}
						{#if page <= totalPages}
							<button
								class="btn px-3 py-1 text-sm {page === pagination.page ? 'btn-primary' : 'btn-secondary'}"
								onclick={() => goToPage(page)}
							>
								{page}
							</button>
						{/if}
					{/each}
					<button
						class="btn btn-secondary px-3 py-1 text-sm"
						disabled={pagination.page >= totalPages}
						onclick={() => goToPage(pagination.page + 1)}
					>
						<ChevronRight class="w-4 h-4" />
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

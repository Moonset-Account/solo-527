<script lang="ts">
	import type { Session } from '@/lib/types';
	import { formatDateTime } from '@/lib/utils/format';
	import { AlertCircle, User, Bot } from 'lucide-svelte';

	export let data: Session[] = [];
	export let title = '转人工失败问法样例';
</script>

<div class="card h-full flex flex-col">
	<div class="flex items-center gap-2 mb-4">
		<AlertCircle class="w-5 h-5 text-red-500" />
		<h3 class="text-base font-semibold text-slate-900">{title}</h3>
	</div>

	<div class="flex-1 space-y-3 overflow-y-auto scrollbar-thin pr-1">
		{#if data.length === 0}
			<p class="text-center text-slate-400 py-8">暂无数据</p>
		{:else}
			{#each data as session, i}
				<div class="bg-red-50/50 border border-red-100 rounded-lg p-3">
					<div class="flex items-center justify-between mb-2">
						<span class="text-xs text-slate-400">{formatDateTime(session.start_time)}</span>
						<span class="badge badge-danger text-xs">转人工</span>
					</div>
					<div class="space-y-2">
						<div class="flex gap-2">
							<User class="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
							<p class="text-sm text-slate-700 line-clamp-2">{session.user_question}</p>
						</div>
						<div class="flex gap-2">
							<Bot class="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
							<p class="text-sm text-slate-500 line-clamp-2">{session.bot_answer}</p>
						</div>
					</div>
					{#if session.transfer_reason}
						<p class="mt-2 text-xs text-red-600">
							原因: {session.transfer_reason}
						</p>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>

<script lang="ts">
	import type { Activity } from '$lib/types';

	export let activities: Activity[] = [];
	export let loading = false;
</script>

<div class="card overflow-hidden">
	<div class="px-5 py-4 border-b border-gray-100">
		<h3 class="font-semibold text-gray-800">活动明细</h3>
	</div>
	<div class="overflow-x-auto">
		<table class="w-full text-sm">
			<thead class="bg-gray-50">
				<tr>
					<th class="text-left px-5 py-3 font-medium text-gray-600">活动名称</th>
					<th class="text-left px-5 py-3 font-medium text-gray-600">类型</th>
					<th class="text-left px-5 py-3 font-medium text-gray-600">社区</th>
					<th class="text-right px-5 py-3 font-medium text-gray-600">报名</th>
					<th class="text-right px-5 py-3 font-medium text-gray-600">签到</th>
					<th class="text-right px-5 py-3 font-medium text-gray-600">取消</th>
					<th class="text-right px-5 py-3 font-medium text-gray-600">反馈</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#if loading}
					{#each Array(5) as _, i}
						<tr>
							{#each Array(7) as _, j}
								<td class="px-5 py-3">
									<div class="animate-pulse bg-gray-200 rounded h-4 w-20"></div>
								</td>
							{/each}
						</tr>
					{/each}
				{:else if activities.length === 0}
					<tr>
						<td colspan="7" class="px-5 py-8 text-center text-gray-500">
							暂无数据
						</td>
					</tr>
				{:else}
					{#each activities as activity}
						<tr class="hover:bg-gray-50 transition-colors">
							<td class="px-5 py-3 font-medium text-gray-800">{activity.name}</td>
							<td class="px-5 py-3">
								<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700">
									{activity.type}
								</span>
							</td>
							<td class="px-5 py-3 text-gray-600">{activity.community_name}</td>
							<td class="px-5 py-3 text-right font-mono">{activity.registrations}</td>
							<td class="px-5 py-3 text-right font-mono text-green-600">{activity.checkins}</td>
							<td class="px-5 py-3 text-right font-mono text-red-600">{activity.cancellations}</td>
							<td class="px-5 py-3 text-right font-mono text-blue-600">{activity.feedback_count}</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>

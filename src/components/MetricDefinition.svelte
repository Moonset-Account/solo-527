<script lang="ts">
	import { HelpCircle, X } from 'lucide-svelte';
	import { metricDefinitions } from '$lib/dictionary';
	import type { MetricDefinition } from '$types';

	export let metricKey: string | undefined = undefined;
	export let title = '数据说明';
	export let customDefinition: MetricDefinition | undefined = undefined;
	export let compact = false;

	let showModal = false;

	function getDefinition(): MetricDefinition | undefined {
		if (customDefinition) return customDefinition;
		if (metricKey) return metricDefinitions.find((m) => m.key === metricKey);
		return undefined;
	}

	$: def = getDefinition();
</script>

{#if compact}
	<span class="inline-flex items-center">
		<button
			class="tooltip-icon"
			on:click={() => (showModal = true)}
			title="点击查看口径说明"
		>
			<HelpCircle class="w-4 h-4" />
		</button>
	</span>
{:else}
	<div class="disclaimer flex items-start space-x-2">
		<HelpCircle class="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
		<div class="text-xs">
			{#if def}
				<p class="font-medium text-gray-600">{def.name}</p>
				<p class="text-gray-500 mt-1">{def.definition}</p>
				<p class="text-gray-400 mt-1">计算方法：{def.calculation}</p>
				{#if def.limitations.length > 0}
					<p class="text-gray-400 mt-1">注意：{def.limitations[0]}</p>
				{/if}
			{:else}
				<p class="text-gray-500">本图表仅用于流程效率分析，不涉及诊断建议。数据已脱敏处理。</p>
			{/if}
			<button
				class="text-primary-500 hover:text-primary-600 mt-1"
				on:click={() => (showModal = true)}
			>
				查看详细说明
			</button>
		</div>
	</div>
{/if}

{#if showModal}
	<div
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
		on:click={() => (showModal = false)}
	>
		<div
			class="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6"
			on:click|stopPropagation
		>
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-semibold text-gray-900">{title}</h3>
				<button
					class="text-gray-400 hover:text-gray-600"
					on:click={() => (showModal = false)}
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			{#if def}
				<div class="space-y-4">
					<div>
						<h4 class="font-medium text-gray-800 mb-1">指标定义</h4>
						<p class="text-gray-600">{def.definition}</p>
					</div>
					<div>
						<h4 class="font-medium text-gray-800 mb-1">计算方法</h4>
						<p class="text-gray-600">{def.calculation}</p>
					</div>
					<div>
						<h4 class="font-medium text-gray-800 mb-1">使用限制与注意事项</h4>
						<ul class="list-disc list-inside text-gray-600 space-y-1">
							{#each def.limitations as lim}
								<li>{lim}</li>
							{/each}
						</ul>
					</div>
				</div>
			{/if}

			<div class="mt-6 pt-4 border-t border-gray-100">
				<p class="text-xs text-gray-400">
					重要声明：本系统仅用于医院运营流程分析，所有数据均已脱敏处理。
					分析结果仅供内部参考，不构成任何医疗建议。
				</p>
			</div>
		</div>
	</div>
{/if}

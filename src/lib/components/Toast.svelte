<script lang="ts">
	import { toastStore } from '$lib/stores';
	import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-svelte';

	const iconMap = {
		success: CheckCircle,
		error: XCircle,
		warning: AlertCircle,
		info: Info
	};

	const colorMap = {
		success: 'bg-green-50 text-green-800 border-green-200',
		error: 'bg-red-50 text-red-800 border-red-200',
		warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
		info: 'bg-blue-50 text-blue-800 border-blue-200'
	};

	const iconColorMap = {
		success: 'text-green-500',
		error: 'text-red-500',
		warning: 'text-yellow-500',
		info: 'text-blue-500'
	};
</script>

{#if $toastStore}
	<div class="fixed top-4 right-4 z-50 animate-pulse">
		<div class="flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg {colorMap[$toastStore.type]}">
			<svelte:component
				this={iconMap[$toastStore.type]}
				class="w-5 h-5 flex-shrink-0 {iconColorMap[$toastStore.type]}"
			/>
			<p class="text-sm font-medium">{$toastStore.message}</p>
			<button on:click={() => ($toastStore = null)} class="ml-2">
				<X class="w-4 h-4" />
			</button>
		</div>
	</div>
{/if}

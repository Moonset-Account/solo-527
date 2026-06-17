<script lang="ts">
	import { toast, type Toast } from '$lib/stores/toast';
	import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-svelte';

	const icons: Record<Toast['type'], typeof CheckCircle> = {
		success: CheckCircle,
		error: XCircle,
		warning: AlertTriangle,
		info: Info
	};

	const colors: Record<Toast['type'], string> = {
		success: 'bg-success/10 border-success/30 text-success',
		error: 'bg-danger/10 border-danger/30 text-danger',
		warning: 'bg-warning/10 border-warning/30 text-warning',
		info: 'bg-accent/10 border-accent/30 text-accent'
	};
</script>

<div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
	{#each $toast as t (t.id)}
		<div
			class="pointer-events-auto animate-slide-up flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm bg-white/90 {colors[t.type]}"
			style="animation-delay: 0ms;"
		>
			<svelte:component this={icons[t.type]} class="w-5 h-5 flex-shrink-0 mt-0.5" />
			<p class="flex-1 text-sm font-medium">{t.message}</p>
			<button
				on:click={() => toast.remove(t.id)}
				class="p-1 rounded-lg hover:bg-black/5 transition-colors flex-shrink-0"
			>
				<X class="w-4 h-4" />
			</button>
		</div>
	{/each}
</div>

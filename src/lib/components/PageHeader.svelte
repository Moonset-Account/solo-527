<script lang="ts">
	let { title, subtitle, actions }: { title: string; subtitle?: string; actions?: any } = $props();
</script>

<div class="mb-6">
	<div class="flex items-start justify-between gap-4 flex-wrap">
		<div>
			<h1 class="text-2xl font-bold text-slate-900">{title}</h1>
			{#if subtitle}
				<p class="mt-1 text-sm text-slate-500">{subtitle}</p>
			{/if}
		</div>
		{#if actions}
			<div class="flex items-center gap-2">{@render actions()}</div>
		{/if}
	</div>
</div>

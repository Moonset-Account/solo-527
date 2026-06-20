<script lang="ts">
	let { level }: { level: 'low' | 'medium' | 'high' | 'critical' } = $props();

	const styles: Record<string, string> = {
		low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
		medium: 'bg-amber-50 text-amber-700 border-amber-200',
		high: 'bg-orange-50 text-orange-700 border-orange-200',
		critical: 'bg-rose-50 text-rose-700 border-rose-200'
	};

	const labels: Record<string, string> = {
		low: '低风险',
		medium: '中风险',
		high: '高风险',
		critical: '严重'
	};
</script>

<span
	class="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-md border {styles[level] || styles.low}"
>
	<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
		<path
			fill-rule="evenodd"
			d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
			clip-rule="evenodd"
		/>
	</svg>
	{labels[level] || level}
</span>

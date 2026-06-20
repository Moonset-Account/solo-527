<script lang="ts">
	let { status }: { status: 'draft' | 'pending' | 'reviewed' | 'sent' | 'archived' } = $props();

	const styles: Record<string, string> = {
		draft: 'bg-slate-100 text-slate-700 border-slate-200',
		pending: 'bg-amber-50 text-amber-700 border-amber-200',
		reviewed: 'bg-blue-50 text-blue-700 border-blue-200',
		sent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
		archived: 'bg-gray-100 text-gray-500 border-gray-200'
	};

	const labels: Record<string, string> = {
		draft: '草稿',
		pending: '待复核',
		reviewed: '已复核',
		sent: '已发送',
		archived: '已归档'
	};
</script>

<span
	class="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-md border {styles[status] || styles.draft}"
>
	{labels[status] || status}
</span>

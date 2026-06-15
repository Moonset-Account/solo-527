<script lang="ts">
	import Chart from 'chart.js/auto';

	let pendingAppointments = $state<any[]>([]);
	let visitRateData = $state<{ months: string[]; rates: number[]; newCustomers: number[]; returningCustomers: number[] } | null>(null);
	let activeCards = $state<any[]>([]);
	let pendingComments = $state<any[]>([]);
	let reminders = $state<any[]>([]);
	let cashierRecords = $state<any[]>([]);
	let chartInstance: Chart | null = null;
	let canvasEl: HTMLCanvasElement | undefined = $state();

	const today = new Date().toISOString().split('T')[0];
	const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

	$effect(() => {
		async function loadData() {
			try {
				const [appointmentsRes, visitRes, cardsRes, commentsRes, remindersRes, cashierRes] = await Promise.all([
					fetch('/api/appointments?status=pending').then(r => r.json()),
					fetch('/api/analytics/visit-rate').then(r => r.json()),
					fetch('/api/treatment-cards?status=active').then(r => r.json()),
					fetch('/api/comments?status=pending').then(r => r.json()),
					fetch('/api/reminders').then(r => r.json()),
					fetch(`/api/cashier?startDate=${monthStart}&endDate=${today}`).then(r => r.json())
				]);
				pendingAppointments = appointmentsRes;
				visitRateData = visitRes;
				activeCards = cardsRes;
				pendingComments = commentsRes;
				reminders = remindersRes;
				cashierRecords = cashierRes;
			} catch (e) {
				console.error('Failed to load dashboard data', e);
			}
		}
		loadData();
	});

	$effect(() => {
		if (!canvasEl || !visitRateData) return;
		if (chartInstance) chartInstance.destroy();

		chartInstance = new Chart(canvasEl, {
			type: 'line',
			data: {
				labels: visitRateData.months,
				datasets: [
					{
						label: '回访率 (%)',
						data: visitRateData.rates,
						borderColor: '#e91e8c',
						backgroundColor: 'rgba(233, 30, 140, 0.1)',
						fill: true,
						tension: 0.4,
						pointBackgroundColor: '#e91e8c',
						pointRadius: 4
					},
					{
						label: '新客户',
						data: visitRateData.newCustomers,
						borderColor: '#fbbf24',
						backgroundColor: 'rgba(251, 191, 36, 0.1)',
						fill: false,
						tension: 0.4,
						pointBackgroundColor: '#fbbf24',
						pointRadius: 4
					},
					{
						label: '回访客户',
						data: visitRateData.returningCustomers,
						borderColor: '#a78bfa',
						backgroundColor: 'rgba(167, 139, 250, 0.1)',
						fill: false,
						tension: 0.4,
						pointBackgroundColor: '#a78bfa',
						pointRadius: 4
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'top',
						labels: { usePointStyle: true, padding: 16, font: { size: 13 } }
					}
				},
				scales: {
					y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
					x: { grid: { display: false } }
				}
			}
		});

		return () => { chartInstance?.destroy(); };
	});

	const monthRevenue = $derived(
		cashierRecords.reduce((sum: number, r: any) => sum + Number(r.record?.amount ?? 0), 0)
	);

	const urgentReminders = $derived(reminders.filter((r: any) => r.reminder?.urgencyLevel === 'urgent'));
	const warningReminders = $derived(reminders.filter((r: any) => r.reminder?.urgencyLevel === 'warning'));
	const infoReminders = $derived(reminders.filter((r: any) => r.reminder?.urgencyLevel === 'info'));

	const recentAppointments = $derived(pendingAppointments.slice(0, 5));

	const statusMap: Record<string, { label: string; cls: string }> = {
		pending: { label: '待确认', cls: 'bg-yellow-100 text-yellow-700' },
		confirmed: { label: '已确认', cls: 'bg-blue-100 text-blue-700' },
		completed: { label: '已完成', cls: 'bg-green-100 text-green-700' },
		cancelled: { label: '已取消', cls: 'bg-gray-100 text-gray-500' }
	};

	const statsCards = $derived([
		{ icon: '📅', value: pendingAppointments.length, label: '今日预约数', trend: '↑', trendUp: true },
		{ icon: '💰', value: `¥${monthRevenue.toLocaleString()}`, label: '本月营收', trend: '↑', trendUp: true },
		{ icon: '🎫', value: activeCards.length, label: '活跃疗程卡', trend: '→', trendUp: false },
		{ icon: '💬', value: pendingComments.length, label: '待审核评论', trend: '↓', trendUp: false }
	]);
</script>

<div class="space-y-6">
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
		{#each statsCards as card}
			<div class="rounded-xl bg-white p-5 shadow-sm">
				<div class="flex items-center justify-between">
					<span class="text-3xl">{card.icon}</span>
					<span class={`text-sm font-medium ${card.trendUp ? 'text-green-500' : 'text-gray-400'}`}>
						{card.trend}
					</span>
				</div>
				<p class="mt-3 text-2xl font-bold text-gray-800">{card.value}</p>
				<p class="mt-1 text-sm text-gray-500">{card.label}</p>
			</div>
		{/each}
	</div>

	<div class="rounded-xl bg-white p-6 shadow-sm">
		<h2 class="mb-4 text-lg font-semibold text-gray-800">客户回访趋势</h2>
		<div class="h-80">
			<canvas bind:this={canvasEl}></canvas>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
		<div class="rounded-xl bg-white p-6 shadow-sm">
			<h2 class="mb-4 text-lg font-semibold text-gray-800">最近预约</h2>
			<div class="overflow-x-auto">
				<table class="w-full text-left text-sm">
					<thead>
						<tr class="border-b text-gray-500">
							<th class="pb-3 font-medium">客户</th>
							<th class="pb-3 font-medium">技师</th>
							<th class="pb-3 font-medium">服务</th>
							<th class="pb-3 font-medium">日期</th>
							<th class="pb-3 font-medium">时间</th>
							<th class="pb-3 font-medium">状态</th>
						</tr>
					</thead>
					<tbody>
						{#if recentAppointments.length === 0}
							<tr>
								<td colspan="6" class="py-8 text-center text-gray-400">暂无预约数据</td>
							</tr>
						{/if}
						{#each recentAppointments as item}
							{@const s = statusMap[item.appointment?.status] ?? { label: item.appointment?.status, cls: 'bg-gray-100 text-gray-500' }}
							<tr class="border-b border-gray-50 last:border-0">
								<td class="py-3 text-gray-700">{item.customer?.name ?? '-'}</td>
								<td class="py-3 text-gray-700">{item.technician?.name ?? '-'}</td>
								<td class="py-3 text-gray-700">{item.service?.name ?? '-'}</td>
								<td class="py-3 text-gray-500">{item.appointment?.appointmentDate}</td>
								<td class="py-3 text-gray-500">{item.appointment?.appointmentTime}</td>
								<td class="py-3">
									<span class="rounded-full px-2 py-0.5 text-xs font-medium {s.cls}">
										{s.label}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<div class="rounded-xl bg-white p-6 shadow-sm">
			<h2 class="mb-4 text-lg font-semibold text-gray-800">待处理提醒</h2>
			<div class="space-y-3">
				{#if urgentReminders.length > 0}
					<div>
						<h3 class="mb-2 text-sm font-medium text-red-600">🔴 紧急 ({urgentReminders.length})</h3>
						{#each urgentReminders.slice(0, 3) as item}
							<div class="mb-2 rounded-lg border border-red-200 bg-red-50 p-3">
								<p class="text-sm font-medium text-red-800">{item.customer?.name ?? '未知客户'}</p>
								<p class="mt-1 text-xs text-red-600">{item.reminder?.message}</p>
								<p class="mt-1 text-xs text-red-400">到期: {item.reminder?.dueDate ?? '-'}</p>
							</div>
						{/each}
					</div>
				{/if}
				{#if warningReminders.length > 0}
					<div>
						<h3 class="mb-2 text-sm font-medium text-yellow-600">🟡 警告 ({warningReminders.length})</h3>
						{#each warningReminders.slice(0, 3) as item}
							<div class="mb-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
								<p class="text-sm font-medium text-yellow-800">{item.customer?.name ?? '未知客户'}</p>
								<p class="mt-1 text-xs text-yellow-600">{item.reminder?.message}</p>
								<p class="mt-1 text-xs text-yellow-400">到期: {item.reminder?.dueDate ?? '-'}</p>
							</div>
						{/each}
					</div>
				{/if}
				{#if infoReminders.length > 0}
					<div>
						<h3 class="mb-2 text-sm font-medium text-blue-600">🔵 提示 ({infoReminders.length})</h3>
						{#each infoReminders.slice(0, 3) as item}
							<div class="mb-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
								<p class="text-sm font-medium text-blue-800">{item.customer?.name ?? '未知客户'}</p>
								<p class="mt-1 text-xs text-blue-600">{item.reminder?.message}</p>
								<p class="mt-1 text-xs text-blue-400">到期: {item.reminder?.dueDate ?? '-'}</p>
							</div>
						{/each}
					</div>
				{/if}
				{#if reminders.length === 0}
					<p class="py-8 text-center text-gray-400">暂无待处理提醒</p>
				{/if}
			</div>
		</div>
	</div>
</div>

<script lang="ts">
	import { store } from '$lib/stores/mock-data.svelte';
	import {
		SCHEDULE_STATUS_LABELS,
		PLATFORM_COLORS
	} from '$lib/types';
	import type { ScheduleStatus } from '$lib/types';
	import {
		Plus,
		ChevronLeft,
		ChevronRight,
		X,
		List,
		CalendarDays,
		Clock
	} from 'lucide-svelte';

	let currentYear = $state(new Date().getFullYear());
	let currentMonth = $state(new Date().getMonth());
	let viewMode = $state<'calendar' | 'list'>('calendar');
	let showNewDialog = $state(false);

	let newTopicId = $state('');
	let newPlatform = $state('');
	let newAccountName = $state('');
	let newPublishDate = $state('');
	let newPublishTime = $state('');
	let newNotes = $state('');

	const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

	let calendarDays = $derived.by(() => {
		const firstDay = new Date(currentYear, currentMonth, 1);
		const lastDay = new Date(currentYear, currentMonth + 1, 0);
		let startDow = firstDay.getDay() - 1;
		if (startDow < 0) startDow = 6;
		const days: { date: Date; isCurrentMonth: boolean }[] = [];
		for (let i = startDow - 1; i >= 0; i--) {
			const d = new Date(currentYear, currentMonth, -i);
			days.push({ date: d, isCurrentMonth: false });
		}
		for (let i = 1; i <= lastDay.getDate(); i++) {
			days.push({ date: new Date(currentYear, currentMonth, i), isCurrentMonth: true });
		}
		const remaining = 7 - (days.length % 7);
		if (remaining < 7) {
			for (let i = 1; i <= remaining; i++) {
				days.push({ date: new Date(currentYear, currentMonth + 1, i), isCurrentMonth: false });
			}
		}
		return days;
	});

	let schedulesByDate = $derived.by(() => {
		const map = new Map<string, typeof store.schedules>();
		for (const s of store.schedules) {
			const key = s.publishDate;
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(s);
		}
		return map;
	});

	let monthLabel = $derived(
		`${currentYear}年${currentMonth + 1}月`
	);

	function getTopicTitle(id: string) {
		return store.topics.find((t) => t.id === id)?.title ?? '未知选题';
	}

	function dateKey(d: Date) {
		return d.toISOString().slice(0, 10);
	}

	function isToday(d: Date) {
		const today = new Date();
		return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
	}

	function prevMonth() {
		if (currentMonth === 0) {
			currentMonth = 11;
			currentYear--;
		} else {
			currentMonth--;
		}
	}

	function nextMonth() {
		if (currentMonth === 11) {
			currentMonth = 0;
			currentYear++;
		} else {
			currentMonth++;
		}
	}

	function resetForm() {
		newTopicId = '';
		newPlatform = '';
		newAccountName = '';
		newPublishDate = '';
		newPublishTime = '';
		newNotes = '';
	}

	async function handleCreate() {
		if (!newTopicId || !newPlatform || !newAccountName || !newPublishDate || !newPublishTime) return;
		const payload = {
			topicId: newTopicId,
			platform: newPlatform,
			accountName: newAccountName,
			publishDate: newPublishDate,
			publishTime: newPublishTime,
			status: 'scheduled',
			supplementaryNotes: newNotes,
			createdBy: store.getCurrentUser().id
		};
		try {
			const res = await fetch('/api/schedules', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			if (!res.ok) throw new Error('创建失败');
			const created = await res.json();
			store.addSchedule({ ...payload, id: created.id, createdAt: new Date(created.createdAt) });
			showNewDialog = false;
			resetForm();
		} catch (e) {
			console.error(e);
			alert('创建排期失败');
		}
	}

	function statusBadgeClass(status: ScheduleStatus) {
		const map: Record<ScheduleStatus, string> = {
			scheduled: 'bg-blue-100 text-blue-700',
			published: 'bg-success-light text-success',
			cancelled: 'bg-danger-light text-danger'
		};
		return map[status];
	}

	function platformColor(platform: string) {
		return PLATFORM_COLORS[platform] ?? '#e07a3a';
	}
</script>

<div class="min-h-screen bg-warm-gray">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
		<div class="flex flex-wrap items-center justify-between gap-4 mb-6">
			<h1 class="text-2xl font-bold text-ink">发布排期</h1>
			<div class="flex items-center gap-3">
				<div class="flex items-center bg-card rounded-lg shadow-sm">
					<button
						onclick={() => (viewMode = 'calendar')}
						class="p-2 rounded-l-lg {viewMode === 'calendar' ? 'bg-copper text-white' : 'text-ink/50 hover:text-ink'}"
					>
						<CalendarDays size={18} />
					</button>
					<button
						onclick={() => (viewMode = 'list')}
						class="p-2 rounded-r-lg {viewMode === 'list' ? 'bg-copper text-white' : 'text-ink/50 hover:text-ink'}"
					>
						<List size={18} />
					</button>
				</div>
				<button
					onclick={() => (showNewDialog = true)}
					class="flex items-center gap-2 bg-copper text-white px-4 py-2 rounded-lg hover:bg-copper-dark transition-colors"
				>
					<Plus size={18} />
					新建排期
				</button>
			</div>
		</div>

		{#if viewMode === 'calendar'}
			<div class="bg-card rounded-xl shadow-sm p-4 mb-6">
				<div class="flex items-center justify-between mb-4">
					<button onclick={prevMonth} class="p-2 hover:bg-warm-gray rounded-lg transition-colors">
						<ChevronLeft size={20} class="text-ink/50" />
					</button>
					<h2 class="text-lg font-bold text-ink">{monthLabel}</h2>
					<button onclick={nextMonth} class="p-2 hover:bg-warm-gray rounded-lg transition-colors">
						<ChevronRight size={20} class="text-ink/50" />
					</button>
				</div>

				<div class="grid grid-cols-7 gap-px bg-warm-gray-dark rounded-lg overflow-hidden">
					{#each weekdays as day}
						<div class="bg-card px-2 py-2 text-center text-xs font-semibold text-ink/50">
							{day}
						</div>
					{/each}
					{#each calendarDays as dayObj}
						{@const key = dateKey(dayObj.date)}
						{@const daySchedules = schedulesByDate.get(key) ?? []}
						<div
							class="bg-card min-h-[80px] sm:min-h-[100px] p-1.5 sm:p-2 transition-colors {dayObj.isCurrentMonth ? '' : 'opacity-40'}"
						>
							<div class="text-xs font-medium mb-1 {isToday(dayObj.date) ? 'w-6 h-6 rounded-full bg-copper text-white flex items-center justify-center' : 'text-ink/50'}">
								{dayObj.date.getDate()}
							</div>
							<div class="space-y-0.5">
								{#each daySchedules.slice(0, 3) as sch}
									<a
										href="/schedule/{sch.id}"
										class="block text-xs truncate rounded px-1 py-0.5 hover:bg-warm-gray transition-colors"
										style="border-left: 3px solid {platformColor(sch.platform)}"
									>
										<span class="font-medium text-ink/80">{getTopicTitle(sch.topicId).slice(0, 6)}</span>
										<span class="text-ink/40 ml-1">{sch.publishTime}</span>
									</a>
								{/each}
								{#if daySchedules.length > 3}
									<div class="text-xs text-ink/40 pl-1">+{daySchedules.length - 3} 更多</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<div class="bg-card rounded-xl shadow-sm overflow-hidden">
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="bg-warm-gray">
								<th class="text-left px-4 py-3 font-semibold text-ink/60">选题</th>
								<th class="text-left px-4 py-3 font-semibold text-ink/60">平台</th>
								<th class="text-left px-4 py-3 font-semibold text-ink/60">账号</th>
								<th class="text-left px-4 py-3 font-semibold text-ink/60">日期</th>
								<th class="text-left px-4 py-3 font-semibold text-ink/60">时间</th>
								<th class="text-left px-4 py-3 font-semibold text-ink/60">状态</th>
								<th class="text-left px-4 py-3 font-semibold text-ink/60">操作</th>
							</tr>
						</thead>
						<tbody>
							{#each store.schedules as sch}
								<tr class="border-t border-warm-gray-dark hover:bg-warm-gray/50 transition-colors">
									<td class="px-4 py-3">
										<span class="text-ink font-medium">{getTopicTitle(sch.topicId)}</span>
									</td>
									<td class="px-4 py-3">
										<span
											class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
											style="background: {platformColor(sch.platform)}15; color: {platformColor(sch.platform)}"
										>
											<span class="w-1.5 h-1.5 rounded-full" style="background: {platformColor(sch.platform)}"></span>
											{sch.platform}
										</span>
									</td>
									<td class="px-4 py-3 text-ink/70">{sch.accountName}</td>
									<td class="px-4 py-3 text-ink/70">{sch.publishDate}</td>
									<td class="px-4 py-3 text-ink/70">{sch.publishTime}</td>
									<td class="px-4 py-3">
										<span class="text-xs px-2 py-0.5 rounded-full {statusBadgeClass(sch.status)}">
											{SCHEDULE_STATUS_LABELS[sch.status]}
										</span>
									</td>
									<td class="px-4 py-3">
										<a href="/schedule/{sch.id}" class="text-copper hover:underline text-sm">查看</a>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</div>
</div>

{#if showNewDialog}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-ink/40" onclick={() => (showNewDialog = false)}>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="bg-card rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6" onclick={(e) => e.stopPropagation()}>
			<div class="flex items-center justify-between mb-5">
				<h2 class="text-lg font-bold text-ink">新建排期</h2>
				<button onclick={() => (showNewDialog = false)} class="text-ink/40 hover:text-ink">
					<X size={20} />
				</button>
			</div>
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-ink/70 mb-1">关联选题</label>
					<select
						bind:value={newTopicId}
						class="w-full border border-warm-gray-dark rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-copper/40"
					>
						<option value="">请选择选题</option>
						{#each store.topics as t}
							<option value={t.id}>{t.title}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-ink/70 mb-1">发布平台</label>
					<input
						type="text"
						bind:value={newPlatform}
						class="w-full border border-warm-gray-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-copper/40"
						placeholder="如：微信公众号、抖音"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-ink/70 mb-1">账号名称</label>
					<input
						type="text"
						bind:value={newAccountName}
						class="w-full border border-warm-gray-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-copper/40"
						placeholder="如：城市观察"
					/>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block text-sm font-medium text-ink/70 mb-1">发布日期</label>
						<input
							type="date"
							bind:value={newPublishDate}
							class="w-full border border-warm-gray-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-copper/40"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-ink/70 mb-1">发布时间</label>
						<input
							type="time"
							bind:value={newPublishTime}
							class="w-full border border-warm-gray-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-copper/40"
						/>
					</div>
				</div>
				<div>
					<label class="block text-sm font-medium text-ink/70 mb-1">备注</label>
					<textarea
						bind:value={newNotes}
						rows="2"
						class="w-full border border-warm-gray-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-copper/40"
						placeholder="补充说明"
					></textarea>
				</div>
			</div>
			<div class="flex justify-end gap-3 mt-6">
				<button
					onclick={() => (showNewDialog = false)}
					class="px-4 py-2 text-sm rounded-lg border border-warm-gray-dark text-ink/60 hover:bg-warm-gray transition-colors"
				>
					取消
				</button>
				<button
					onclick={handleCreate}
					disabled={!newTopicId || !newPlatform || !newAccountName || !newPublishDate || !newPublishTime}
					class="px-4 py-2 text-sm rounded-lg bg-copper text-white hover:bg-copper-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					创建
				</button>
			</div>
		</div>
	</div>
{/if}

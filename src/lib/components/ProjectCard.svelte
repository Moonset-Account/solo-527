<script lang="ts">
	import { Calendar, MapPin, Users, Clock, ChevronRight } from 'lucide-svelte';
	import { formatDate, formatNumber } from '$lib/utils/format';
	import type { ProjectWithStats } from '$lib/types';

	let { project }: { project: ProjectWithStats } = $props();

	const statusColors: Record<string, string> = {
		draft: 'badge-info',
		published: 'badge-success',
		ongoing: 'badge-success',
		completed: 'badge-info',
		cancelled: 'badge-danger'
	};

	const statusText: Record<string, string> = {
		draft: '草稿',
		published: '已发布',
		ongoing: '进行中',
		completed: '已完成',
		cancelled: '已取消'
	};
</script>

<a
	href={`/projects/${project.id}`}
	class="card card-hover group overflow-hidden flex flex-col h-full"
>
	<div class="relative aspect-[16/9] overflow-hidden">
		<img
			src={project.coverImage || ''}
			alt={project.title}
			class="w-full h-full object-cover transition-transform duration-normal group-hover:scale-105"
			loading="lazy"
		/>
		<div class="absolute top-3 left-3">
			<span class="badge {statusColors[project.status] || 'badge-info'}">
				{statusText[project.status] || project.status}
			</span>
		</div>
		{#if project.category}
			<div class="absolute top-3 right-3">
				<span class="badge bg-black/60 text-white border-0">{project.category}</span>
			</div>
		{/if}
	</div>

	<div class="flex-1 p-5 flex flex-col">
		<h3 class="font-display text-lg font-semibold text-text-primary mb-2 line-clamp-2 group-hover:text-primary transition-colors">
			{project.title}
		</h3>
		<p class="text-text-secondary text-sm mb-4 line-clamp-2 flex-1">
			{project.description}
		</p>

		<div class="grid grid-cols-2 gap-3 mb-4">
			<div class="flex items-center gap-1.5 text-sm text-text-muted">
				<Calendar class="w-4 h-4 flex-shrink-0" />
				<span class="truncate">{formatDate(project.startDate)}</span>
			</div>
			<div class="flex items-center gap-1.5 text-sm text-text-muted">
				<MapPin class="w-4 h-4 flex-shrink-0" />
				<span class="truncate">{project.location || '-'}</span>
			</div>
			<div class="flex items-center gap-1.5 text-sm text-text-muted">
				<Users class="w-4 h-4 flex-shrink-0" />
				<span>{formatNumber(project.totalVolunteers, 0)} 人</span>
			</div>
			<div class="flex items-center gap-1.5 text-sm text-text-muted">
				<Clock class="w-4 h-4 flex-shrink-0" />
				<span>{formatNumber(project.totalHours, 1)} 小时</span>
			</div>
		</div>

		<div class="flex items-center justify-between pt-3 border-t border-border-light">
			<div class="flex items-center gap-2">
				<div class="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
					<span class="text-xs font-medium text-primary">{project.managerName?.[0] || '-'}</span>
				</div>
				<span class="text-sm text-text-muted">{project.managerName}</span>
			</div>
			<div class="flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
				查看详情
				<ChevronRight class="w-4 h-4" />
			</div>
		</div>
	</div>
</a>

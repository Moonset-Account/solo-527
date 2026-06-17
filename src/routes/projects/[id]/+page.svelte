<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import {
		Calendar,
		MapPin,
		Users,
		Clock,
		ArrowLeft,
		Check,
		X,
		Package,
		Images,
		BarChart3,
		CalendarClock,
		Location,
		User,
		TrendingUp,
		ArrowRight,
		Download,
		ZoomIn,
		X as XIcon
	} from 'lucide-svelte';
	import { Line } from 'svelte-chartjs';
	import {
		Chart as ChartJS,
		CategoryScale,
		LinearScale,
		PointElement,
		LineElement,
		Title,
		Tooltip,
		Legend,
		Filler
	} from 'chart.js';
	import { toast } from '$lib/stores/toast';
	import { auth } from '$lib/stores/auth';
	import { formatDate, formatDateTime, formatTime, formatNumber, formatCurrency, statusToText } from '$lib/utils/format';
	import {
		mockGetProjectById,
		mockGetMaterialFlows,
		mockGetHoursByProject,
		mockRegisterForShift,
		mockCancelRegistration
	} from '$lib/mock/service';
	import type {
		ProjectWithStats,
		ShiftWithDetails,
		Material,
		MaterialFlow,
		Photo
	} from '$lib/types';

	ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

	let project: ProjectWithStats | null = null;
	let shifts: ShiftWithDetails[] = [];
	let materials: Material[] = [];
	let photos: Photo[] = [];
	let budget: { totalAmount: string; usedAmount: string; items: { itemName: string; amount: string; category: string; expenseDate: Date }[] } | null = null;
	let materialFlows: Record<string, MaterialFlow[]> = {};
	let hoursData: { date: string; hours: number }[] = [];
	let loading = true;
	let activeTab = 'overview';
	let selectedPhoto: Photo | null = null;
	let expandedMaterial: string | null = null;
	let registeringShift: string | null = null;

	const tabs = [
		{ id: 'overview', label: '项目概览', icon: BarChart3 },
		{ id: 'hours', label: '服务时长', icon: Clock },
		{ id: 'materials', label: '物资流向', icon: Package },
		{ id: 'photos', label: '成果照片', icon: Images },
		{ id: 'shifts', label: '班次报名', icon: CalendarClock }
	];

	$effect(() => {
		const id = $page.params.id;
		if (id) {
			loadData(id);
		}
	});

	async function loadData(id: string) {
		loading = true;
		try {
			const result = await mockGetProjectById(id);
			if (result) {
				project = result.project;
				shifts = result.shifts;
				materials = result.materials;
				photos = result.photos;
				budget = result.budget;

				const hours = await mockGetHoursByProject(id);
				hoursData = hours;

				for (const mat of result.materials) {
					const flows = await mockGetMaterialFlows(mat.id);
					materialFlows[mat.id] = flows;
				}
			}
		} finally {
			loading = false;
		}
	}

	async function handleRegister(shiftId: string) {
		if (!$auth.isAuthenticated) {
			toast.warning('请先登录');
			return;
		}
		registeringShift = shiftId;
		try {
			const result = await mockRegisterForShift($auth.user!.id, shiftId);
			if (result.success) {
				toast.success(result.message);
				const shift = shifts.find((s) => s.id === shiftId);
				if (shift) {
					shift.isRegistered = true;
					shift.registeredCount++;
				}
			} else {
				toast.error(result.message);
			}
		} finally {
			registeringShift = null;
		}
	}

	async function handleCancel(regId: string, shiftId: string) {
		registeringShift = shiftId;
		try {
			const result = await mockCancelRegistration(regId);
			if (result) {
				toast.success('已取消报名');
				const shift = shifts.find((s) => s.id === shiftId);
				if (shift) {
					shift.isRegistered = false;
					shift.registrationId = null;
					shift.registeredCount--;
				}
			} else {
				toast.error('取消失败');
			}
		} finally {
			registeringShift = null;
		}
	}

	$: chartData = {
		labels: hoursData.map((d) => formatDate(d.date, 'MM-dd')),
		datasets: [
			{
				label: '服务时长（小时）',
				data: hoursData.map((d) => d.hours),
				borderColor: '#FF6B35',
				backgroundColor: 'rgba(255, 107, 53, 0.1)',
				fill: true,
				tension: 0.4,
				pointBackgroundColor: '#FF6B35',
				pointBorderColor: '#fff',
				pointBorderWidth: 2,
				pointRadius: 5,
				pointHoverRadius: 7
			}
		]
	};

	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: { display: false },
			tooltip: {
				backgroundColor: 'rgba(26, 26, 46, 0.9)',
				titleColor: '#fff',
				bodyColor: '#fff',
				padding: 12,
				borderRadius: 8
			}
		},
		scales: {
			x: {
				grid: { display: false },
				ticks: { color: '#8a8aa0' }
			},
			y: {
				grid: { color: 'rgba(138, 138, 160, 0.1)' },
				ticks: { color: '#8a8aa0' }
			}
		}
	};

	function scrollToSection(sectionId: string) {
		activeTab = sectionId;
		const el = document.getElementById(sectionId);
		if (el) {
			const offset = 80;
			const bodyRect = document.body.getBoundingClientRect().top;
			const elementRect = el.getBoundingClientRect().top;
			const elementPosition = elementRect - bodyRect;
			const offsetPosition = elementPosition - offset;

			window.scrollTo({
				top: offsetPosition,
				behavior: 'smooth'
			});
		}
	}

	let scrollContainer: HTMLElement | null = null;

	function handleScroll() {
		const sections = ['overview', 'hours', 'materials', 'photos', 'shifts'];
		const scrollPosition = window.scrollY + 120;

		for (let i = sections.length - 1; i >= 0; i--) {
			const section = document.getElementById(sections[i]);
			if (section && section.offsetTop <= scrollPosition) {
				if (activeTab !== sections[i]) {
					activeTab = sections[i];
				}
				break;
			}
		}
	}

	$effect(() => {
		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	});
</script>

{#if loading}
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
		<div class="animate-pulse space-y-6">
			<div class="h-64 bg-surface-alt rounded-2xl" />
			<div class="h-12 bg-surface-alt rounded-xl" />
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div class="h-32 bg-surface-alt rounded-xl" />
				<div class="h-32 bg-surface-alt rounded-xl" />
				<div class="h-32 bg-surface-alt rounded-xl" />
			</div>
		</div>
	</div>
{:else if !project}
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
		<h2 class="font-display text-2xl font-semibold text-text-primary mb-2">项目不存在</h2>
		<a href="/" class="btn btn-primary mt-4">
			<ArrowLeft class="w-4 h-4" />
			返回列表
		</a>
	</div>
{:else}
	<div class="relative">
		<div class="h-64 md:h-80 overflow-hidden relative">
			<img src={project.coverImage || ''} alt={project.title} class="w-full h-full object-cover" />
			<div class="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
		</div>

		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
			<div class="mb-6">
				<a href="/" class="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors">
					<ArrowLeft class="w-4 h-4" />
					返回项目列表
				</a>
			</div>

			<div class="card p-6 md:p-8 mb-6">
				<div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
					<div>
						<div class="flex items-center gap-3 mb-3">
							<span
								class="badge {project.status === 'ongoing' || project.status === 'published' ? 'badge-success' : project.status === 'completed' ? 'badge-info' : 'badge-danger'}"
							>
								{statusToText(project.status)}
							</span>
							{#if project.category}
								<span class="badge bg-secondary/10 text-secondary">{project.category}</span>
							{/if}
						</div>
						<h1 class="font-display text-2xl md:text-3xl font-bold text-text-primary mb-3">
							{project.title}
						</h1>
						<p class="text-text-secondary max-w-3xl">{project.description}</p>
					</div>
					<div class="flex gap-3 flex-shrink-0">
						<a href="#shifts" on:click={() => scrollToSection('shifts')} class="btn btn-primary">
							立即报名
						</a>
					</div>
				</div>

				<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div class="flex items-center gap-3 p-3 bg-surface-alt rounded-xl">
						<div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
							<Calendar class="w-5 h-5 text-primary" />
						</div>
						<div>
							<p class="text-xs text-text-muted">活动时间</p>
							<p class="text-sm font-medium text-text-primary">{formatDate(project.startDate)}</p>
						</div>
					</div>
					<div class="flex items-center gap-3 p-3 bg-surface-alt rounded-xl">
						<div class="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
							<MapPin class="w-5 h-5 text-secondary" />
						</div>
						<div>
							<p class="text-xs text-text-muted">活动地点</p>
							<p class="text-sm font-medium text-text-primary truncate">{project.location || '-'}</p>
						</div>
					</div>
					<div class="flex items-center gap-3 p-3 bg-surface-alt rounded-xl">
						<div class="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
							<Users class="w-5 h-5 text-success" />
						</div>
						<div>
							<p class="text-xs text-text-muted">参与人数</p>
							<p class="text-sm font-medium text-text-primary">{formatNumber(project.totalVolunteers, 0)} 人</p>
						</div>
					</div>
					<div class="flex items-center gap-3 p-3 bg-surface-alt rounded-xl">
						<div class="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
							<Clock class="w-5 h-5 text-warning" />
						</div>
						<div>
							<p class="text-xs text-text-muted">累计时长</p>
							<p class="text-sm font-medium text-text-primary">{formatNumber(project.totalHours, 1)} 小时</p>
						</div>
					</div>
				</div>
			</div>

			<div class="sticky top-16 z-30 bg-background/95 backdrop-blur-md border-b border-border mb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
				<div class="max-w-7xl mx-auto">
					<div class="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
						{#each tabs as tab}
							<button
								on:click={() => scrollToSection(tab.id)}
								class="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all {
									activeTab === tab.id
										? 'bg-primary text-white'
										: 'text-text-secondary hover:bg-surface-alt hover:text-text-primary'
								}"
							>
								<svelte:component this={tab.icon} class="w-4 h-4" />
								{tab.label}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<section id="overview" class="mb-12 animate-fade-in">
			<h2 class="font-display text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
				<BarChart3 class="w-5 h-5 text-primary" />
				项目概览
				<span class="text-sm font-normal text-text-muted ml-2">关键信息一目了然</span>
			</h2>

			<div class="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
				<button
					on:click={() => scrollToSection('hours')}
					class="card p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all group"
				>
					<div class="flex items-center justify-between mb-3">
						<div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
							<Clock class="w-5 h-5 text-primary" />
						</div>
						<ArrowRight class="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
					</div>
					<p class="text-2xl font-bold text-text-primary mb-1">
						{formatNumber(project.totalHours, 1)}
						<span class="text-sm font-normal text-text-muted">小时</span>
					</p>
					<p class="text-xs text-text-muted">
						完成度 {project.targetHours ? Math.round((parseFloat(project.totalHours.toString()) / parseFloat(project.targetHours.toString())) * 100) : 0}%
					</p>
				</button>

				<button
					on:click={() => scrollToSection('materials')}
					class="card p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all group"
				>
					<div class="flex items-center justify-between mb-3">
						<div class="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
							<Package class="w-5 h-5 text-secondary" />
						</div>
						<ArrowRight class="w-4 h-4 text-text-muted group-hover:text-secondary group-hover:translate-x-1 transition-all" />
					</div>
					<p class="text-2xl font-bold text-text-primary mb-1">
						{materials.length}
						<span class="text-sm font-normal text-text-muted">类物资</span>
					</p>
					<p class="text-xs text-text-muted">
						{materials.reduce((sum, m) => sum + m.currentQuantity, 0)} 件总库存
					</p>
				</button>

				<button
					on:click={() => scrollToSection('photos')}
					class="card p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all group"
				>
					<div class="flex items-center justify-between mb-3">
						<div class="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
							<Images class="w-5 h-5 text-accent" />
						</div>
						<ArrowRight class="w-4 h-4 text-text-muted group-hover:text-accent group-hover:translate-x-1 transition-all" />
					</div>
					<p class="text-2xl font-bold text-text-primary mb-1">
						{photos.length}
						<span class="text-sm font-normal text-text-muted">张照片</span>
					</p>
					<p class="text-xs text-text-muted">
						{new Set(photos.map((p) => p.category).filter(Boolean)).size} 个分类
					</p>
				</button>

				<button
					on:click={() => scrollToSection('shifts')}
					class="card p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all group"
				>
					<div class="flex items-center justify-between mb-3">
						<div class="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
							<CalendarClock class="w-5 h-5 text-success" />
						</div>
						<ArrowRight class="w-4 h-4 text-text-muted group-hover:text-success group-hover:translate-x-1 transition-all" />
					</div>
					<p class="text-2xl font-bold text-text-primary mb-1">
						{shifts.length}
						<span class="text-sm font-normal text-text-muted">个班次</span>
					</p>
					<p class="text-xs text-text-muted">
						{shifts.reduce((sum, s) => sum + s.registeredCount, 0)} 人已报名
					</p>
				</button>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
				<div class="lg:col-span-2 card p-6">
					<div class="flex items-center justify-between mb-4">
						<h3 class="font-display font-semibold text-text-primary">服务时长趋势</h3>
						<button
							on:click={() => scrollToSection('hours')}
							class="text-sm text-primary hover:underline flex items-center gap-1"
						>
							查看详情
							<ArrowRight class="w-3 h-3" />
						</button>
					</div>
					<div class="h-56">
						<Line data={chartData} options={chartOptions} />
					</div>
				</div>

				<div class="card p-6">
					<div class="flex items-center justify-between mb-4">
						<h3 class="font-display font-semibold text-text-primary">最新动态</h3>
					</div>
					<div class="space-y-3">
						<div class="flex items-start gap-3 p-3 bg-surface-alt rounded-lg">
							<div class="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
								<Check class="w-4 h-4 text-success" />
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-sm font-medium text-text-primary truncate">新签到记录</p>
								<p class="text-xs text-text-muted">今日新增 {hoursData.length} 条服务记录</p>
							</div>
						</div>
						{#if photos.length > 0}
							<div class="flex items-start gap-3 p-3 bg-surface-alt rounded-lg">
								<div class="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
									<Images class="w-4 h-4 text-accent" />
								</div>
								<div class="min-w-0 flex-1">
									<p class="text-sm font-medium text-text-primary truncate">成果照片更新</p>
									<p class="text-xs text-text-muted">新增 {photos.length} 张活动照片</p>
								</div>
							</div>
						{/if}
						{#if materials.length > 0}
							<div class="flex items-start gap-3 p-3 bg-surface-alt rounded-lg">
								<div class="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
									<Package class="w-4 h-4 text-secondary" />
								</div>
								<div class="min-w-0 flex-1">
									<p class="text-sm font-medium text-text-primary truncate">物资状态正常</p>
									<p class="text-xs text-text-muted">{materials.length} 类物资库存充足</p>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>

			{#if photos.length > 0}
				<div class="card p-6 mb-8">
					<div class="flex items-center justify-between mb-4">
						<h3 class="font-display font-semibold text-text-primary flex items-center gap-2">
							<Images class="w-5 h-5 text-accent" />
							精彩瞬间
						</h3>
						<button
							on:click={() => scrollToSection('photos')}
							class="text-sm text-primary hover:underline flex items-center gap-1"
						>
							查看全部
							<ArrowRight class="w-3 h-3" />
						</button>
					</div>
					<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
						{#each photos.slice(0, 6) as photo}
							<div
								on:click={() => (selectedPhoto = photo)}
								class="aspect-square rounded-lg overflow-hidden cursor-pointer group relative"
							>
								<img
									src={photo.url}
									alt={photo.caption || ''}
									class="w-full h-full object-cover transition-transform duration-normal group-hover:scale-110"
									loading="lazy"
								/>
								<div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100">
									<ZoomIn class="w-5 h-5 text-white" />
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</section>

			<section id="hours" class="mb-12 animate-fade-in">
				<h2 class="font-display text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
					<Clock class="w-5 h-5 text-primary" />
					服务时长
				</h2>

				<div class="card overflow-hidden">
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead class="bg-surface-alt">
								<tr>
									<th class="text-left px-6 py-3 text-sm font-semibold text-text-primary">日期</th>
									<th class="text-left px-6 py-3 text-sm font-semibold text-text-primary">班次名称</th>
									<th class="text-left px-6 py-3 text-sm font-semibold text-text-primary">签到时间</th>
									<th class="text-left px-6 py-3 text-sm font-semibold text-text-primary">签退时间</th>
									<th class="text-left px-6 py-3 text-sm font-semibold text-text-primary">服务时长</th>
									<th class="text-left px-6 py-3 text-sm font-semibold text-text-primary">状态</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border-light">
								{#each hoursData as day, i}
									<tr class="hover:bg-surface-alt/50 transition-colors">
										<td class="px-6 py-4 text-sm text-text-primary">{day.date}</td>
										<td class="px-6 py-4 text-sm text-text-secondary">第 {i + 1} 次服务</td>
										<td class="px-6 py-4 text-sm text-text-secondary">--</td>
										<td class="px-6 py-4 text-sm text-text-secondary">--</td>
										<td class="px-6 py-4">
											<span class="text-sm font-medium text-text-primary">{day.hours} 小时</span>
										</td>
										<td class="px-6 py-4">
											<span class="badge badge-success">已确认</span>
										</td>
									</tr>
								{/each}
								{#if hoursData.length === 0}
									<tr>
										<td colspan="6" class="px-6 py-12 text-center text-text-muted">暂无服务时长记录</td>
									</tr>
								{/if}
							</tbody>
						</table>
					</div>
				</div>
			</section>

			<section id="materials" class="mb-12 animate-fade-in">
				<h2 class="font-display text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
					<Package class="w-5 h-5 text-primary" />
					物资流向
				</h2>

				<div class="space-y-4">
					{#each materials as mat}
						<div class="card overflow-hidden">
							<button
								on:click={() => (expandedMaterial = expandedMaterial === mat.id ? null : mat.id)}
								class="w-full p-5 flex items-center justify-between hover:bg-surface-alt/50 transition-colors"
							>
								<div class="flex items-center gap-4">
									<div class="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
										<Package class="w-6 h-6 text-secondary" />
									</div>
									<div class="text-left">
										<h3 class="font-semibold text-text-primary">{mat.name}</h3>
										<p class="text-sm text-text-muted">
											{mat.category} · 单价 {mat.unitPrice ? formatCurrency(mat.unitPrice) : '-'}
										</p>
									</div>
								</div>
								<div class="flex items-center gap-6">
									<div class="text-right">
										<p class="text-lg font-bold text-text-primary">
											{mat.currentQuantity} <span class="text-sm font-normal text-text-muted">{mat.unit}</span>
										</p>
										<p class="text-xs text-text-muted">
											初始 {mat.initialQuantity} · {mat.currentQuantity < mat.initialQuantity ? '已使用' : '未使用'} {mat.initialQuantity - mat.currentQuantity}
										</p>
									</div>
									<ArrowRight
										class="w-5 h-5 text-text-muted transition-transform {expandedMaterial === mat.id ? 'rotate-90' : ''}"
									/>
								</div>
							</button>

							{#if expandedMaterial === mat.id}
								<div class="border-t border-border-light px-5 py-4 bg-surface-alt/30">
									<h4 class="text-sm font-semibold text-text-primary mb-3">流向记录</h4>
									<div class="space-y-2">
										{#each materialFlows[mat.id] || [] as flow}
											<div class="flex items-center justify-between p-3 bg-white rounded-lg">
												<div class="flex items-center gap-3">
													<div
														class="w-8 h-8 rounded-full flex items-center justify-center {
															flow.direction === 'in' ? 'bg-success/10' : 'bg-warning/10'
														}"
													>
														{#if flow.direction === 'in'}
															<Check class="w-4 h-4 text-success" />
														{:else}
															<X class="w-4 h-4 text-warning" />
														{/if}
													</div>
													<div>
														<p class="text-sm font-medium text-text-primary">
															{flow.type === 'purchase' ? '采购入库' : flow.type === 'use' ? '活动消耗' : flow.type === 'distribute' ? '领用出库' : flow.type}
															<span class="text-text-muted"> · {flow.quantity} {mat.unit}</span>
														</p>
														<p class="text-xs text-text-muted">
															{flow.remark} · 经手人：{flow.handler}
															{#if flow.recipient} · 领取人：{flow.recipient}{/if}
														</p>
													</div>
												</div>
												<span class="text-xs text-text-muted">{formatDateTime(flow.flowTime)}</span>
											</div>
										{/each}
										{#if !materialFlows[mat.id]?.length}
											<p class="text-sm text-text-muted text-center py-4">暂无流向记录</p>
										{/if}
									</div>
								</div>
							{/if}
						</div>
					{/each}
					{#if materials.length === 0}
						<div class="card p-12 text-center">
							<Package class="w-12 h-12 text-text-muted mx-auto mb-3" />
							<p class="text-text-muted">暂无物资数据</p>
						</div>
					{/if}
				</div>
			</section>

			<section id="photos" class="mb-12 animate-fade-in">
				<div class="flex items-center justify-between mb-6">
					<h2 class="font-display text-xl font-bold text-text-primary flex items-center gap-2">
						<Images class="w-5 h-5 text-primary" />
						成果照片
					</h2>
					<button class="btn btn-ghost text-sm">
						<Download class="w-4 h-4" />
						下载全部
					</button>
				</div>

				<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{#each photos as photo}
						<div
							on:click={() => (selectedPhoto = photo)}
							class="card overflow-hidden cursor-pointer group aspect-square"
						>
							<div class="relative w-full h-full">
								<img
									src={photo.url}
									alt={photo.caption || ''}
									class="w-full h-full object-cover transition-transform duration-normal group-hover:scale-105"
									loading="lazy"
								/>
								<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
									<div class="p-3 w-full">
										<p class="text-white text-sm line-clamp-2">{photo.caption || '查看大图'}</p>
										<div class="flex items-center gap-1 mt-1 text-white/80 text-xs">
											<ZoomIn class="w-3 h-3" />
											点击查看
										</div>
									</div>
								</div>
								{#if photo.category}
									<div class="absolute top-2 right-2">
										<span class="badge bg-black/60 text-white border-0 text-xs">{photo.category}</span>
									</div>
								{/if}
							</div>
						</div>
					{/each}
					{#if photos.length === 0}
						<div class="col-span-full card p-12 text-center">
							<Images class="w-12 h-12 text-text-muted mx-auto mb-3" />
							<p class="text-text-muted">暂无照片</p>
						</div>
					{/if}
				</div>
			</section>

			<section id="shifts" class="mb-12 animate-fade-in">
				<h2 class="font-display text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
					<CalendarClock class="w-5 h-5 text-primary" />
					班次报名
				</h2>

				<div class="space-y-4">
					{#each shifts as shift}
						<div class="card p-5">
							<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
								<div class="flex-1">
									<div class="flex items-center gap-3 mb-2">
										<h3 class="font-semibold text-text-primary">{shift.name}</h3>
										{#if shift.isRegistered}
											<span class="badge badge-success">已报名</span>
										{/if}
									</div>
									<p class="text-sm text-text-secondary mb-3">{shift.description}</p>
									<div class="flex flex-wrap gap-4 text-sm text-text-muted">
										<span class="flex items-center gap-1">
											<Calendar class="w-4 h-4" />
											{formatDate(shift.startTime)}
										</span>
										<span class="flex items-center gap-1">
											<Clock class="w-4 h-4" />
											{formatTime(shift.startTime)} - {formatTime(shift.endTime)}
										</span>
										<span class="flex items-center gap-1">
											<Location class="w-4 h-4" />
											{shift.location || '-'}
										</span>
										<span class="flex items-center gap-1">
											<Users class="w-4 h-4" />
											{shift.registeredCount}/{shift.maxParticipants} 人
										</span>
									</div>
									<div class="mt-3">
										<div class="h-2 bg-surface-alt rounded-full overflow-hidden">
											<div
												class="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all"
												style={`width: ${Math.min(100, (shift.registeredCount / shift.maxParticipants) * 100)}%`}
											/>
										</div>
									</div>
								</div>
								<div class="flex gap-3 flex-shrink-0">
									<a href={`/projects/${project.id}/signin?shift=${shift.id}`} class="btn btn-ghost">
										签到
									</a>
									{#if shift.isRegistered && shift.registrationId}
										<button
											on:click={() => handleCancel(shift.registrationId!, shift.id)}
											disabled={registeringShift === shift.id}
											class="btn btn-outline disabled:opacity-50"
										>
											{registeringShift === shift.id ? '处理中...' : '取消报名'}
										</button>
									{:else}
										<button
											on:click={() => handleRegister(shift.id)}
											disabled={registeringShift === shift.id || shift.registeredCount >= shift.maxParticipants}
											class="btn btn-primary disabled:opacity-50"
										>
											{registeringShift === shift.id
												? '处理中...'
												: shift.registeredCount >= shift.maxParticipants
													? '已满员'
													: '立即报名'}
										</button>
									{/if}
								</div>
							</div>
						</div>
					{/each}
					{#if shifts.length === 0}
						<div class="card p-12 text-center">
							<CalendarClock class="w-12 h-12 text-text-muted mx-auto mb-3" />
							<p class="text-text-muted">暂无班次安排</p>
						</div>
					{/if}
				</div>
			</section>

			{#if project.managerName}
				<div class="card p-5 mb-8">
					<h3 class="font-display font-semibold text-text-primary mb-4">项目负责人</h3>
					<div class="flex items-center gap-4">
						<div class="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
							<User class="w-7 h-7 text-primary" />
						</div>
						<div>
							<p class="font-semibold text-text-primary">{project.managerName}</p>
							<p class="text-sm text-text-muted">项目队长</p>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

{#if selectedPhoto}
	<div
		class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in"
		on:click={() => (selectedPhoto = null)}
	>
		<button
			on:click={() => (selectedPhoto = null)}
			class="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
		>
			<XIcon class="w-6 h-6" />
		</button>
		<div class="max-w-5xl w-full animate-scale-in" on:click|stopPropagation>
			<img src={selectedPhoto.url} alt={selectedPhoto.caption || ''} class="w-full h-auto max-h-[80vh] object-contain rounded-lg" />
			{#if selectedPhoto.caption}
				<p class="text-white text-center mt-4">{selectedPhoto.caption}</p>
			{/if}
			{#if selectedPhoto.category}
				<p class="text-white/60 text-center text-sm mt-1">{selectedPhoto.category}</p>
			{/if}
		</div>
	</div>
{/if}

<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import {
		ArrowLeft,
		MapPin,
		Clock,
		QrCode,
		Map,
		CheckCircle2,
		XCircle,
		User,
		Calendar,
		Loader2
	} from 'lucide-svelte';
	import { toast } from '$lib/stores/toast';
	import { auth } from '$lib/stores/auth';
	import { formatDate, formatDateTime, formatTime, statusToText } from '$lib/utils/format';
	import { mockSignin, mockGetProjectById } from '$lib/mock/service';
	import type { ShiftWithDetails, ProjectWithStats } from '$lib/types';

	let project: ProjectWithStats | null = null;
	let shifts: ShiftWithDetails[] = [];
	let selectedShiftId: string | null = null;
	let loading = true;
	let signingIn = false;
	let hasSignedInToday = false;
	let signinMethod: 'qr' | 'manual' | 'location' = 'manual';
	let currentLocation = '';
	let showScanner = false;

	$effect(() => {
		const id = $page.params.id;
		const shiftFromUrl = $page.url.searchParams.get('shift');
		if (id) {
			loadData(id, shiftFromUrl);
		}
	});

	async function loadData(projectId: string, shiftId: string | null = null) {
		loading = true;
		try {
			const result = await mockGetProjectById(projectId);
			if (result) {
				project = result.project;
				shifts = result.shifts.filter((s) => {
					const now = new Date();
					const shiftDate = new Date(s.startTime);
					return shiftDate.toDateString() === now.toDateString();
				});
				if (shiftId && shifts.find((s) => s.id === shiftId)) {
					selectedShiftId = shiftId;
				} else if (shifts.length > 0) {
					selectedShiftId = shifts[0].id;
				}
			}
		} finally {
			loading = false;
		}
	}

	async function getLocation() {
		if ('geolocation' in navigator) {
			try {
				const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
					navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
				});
				currentLocation = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
				toast.success('位置获取成功');
			} catch {
				toast.warning('无法获取位置，请手动确认');
				currentLocation = shifts.find((s) => s.id === selectedShiftId)?.location || '';
			}
		} else {
			currentLocation = shifts.find((s) => s.id === selectedShiftId)?.location || '';
		}
	}

	async function handleSignin() {
		if (!$auth.isAuthenticated) {
			toast.warning('请先登录');
			return;
		}
		if (!selectedShiftId) {
			toast.warning('请选择班次');
			return;
		}

		signingIn = true;
		try {
			if (signinMethod === 'location' && !currentLocation) {
				await getLocation();
			}
			const result = await mockSignin($auth.user!.id, selectedShiftId, currentLocation);
			if (result.success) {
				toast.success(result.message);
				if (result.isSignout) {
					hasSignedInToday = true;
				}
			} else {
				toast.error(result.message);
			}
		} finally {
			signingIn = false;
		}
	}

	$: selectedShift = shifts.find((s) => s.id === selectedShiftId);

	onMount(() => {
		getLocation();
	});
</script>

<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<div class="mb-6">
		<a href={`/projects/${$page.params.id}`} class="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors">
			<ArrowLeft class="w-4 h-4" />
			返回项目详情
		</a>
	</div>

	{#if loading}
		<div class="card p-8 animate-pulse">
			<div class="h-8 bg-surface-alt rounded w-1/2 mb-4" />
			<div class="h-4 bg-surface-alt rounded w-3/4 mb-2" />
			<div class="h-4 bg-surface-alt rounded w-2/3" />
		</div>
	{:else if !project}
		<div class="card p-12 text-center">
			<XCircle class="w-16 h-16 text-danger mx-auto mb-4" />
			<h2 class="font-display text-xl font-semibold text-text-primary mb-2">项目不存在</h2>
			<a href="/" class="btn btn-primary mt-4">返回首页</a>
		</div>
	{:else}
		<div class="space-y-6">
			<div class="card p-6">
				<div class="flex items-start gap-4">
					<div class="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
						<MapPin class="w-7 h-7 text-primary" />
					</div>
					<div class="flex-1">
						<h1 class="font-display text-xl font-bold text-text-primary mb-2">{project.title}</h1>
						<div class="flex flex-wrap gap-4 text-sm text-text-muted">
							<span class="flex items-center gap-1">
								<MapPin class="w-4 h-4" />
								{project.location || '待确定'}
							</span>
							<span class="flex items-center gap-1">
								<Calendar class="w-4 h-4" />
								{formatDate(project.startDate)} - {formatDate(project.endDate)}
							</span>
						</div>
					</div>
				</div>
			</div>

			<div class="card p-6">
				<h2 class="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
					<Clock class="w-5 h-5 text-primary" />
					选择今日班次
				</h2>

				{#if shifts.length === 0}
					<div class="text-center py-8">
						<Calendar class="w-12 h-12 text-text-muted mx-auto mb-3" />
						<p class="text-text-muted">今日暂无班次安排</p>
					</div>
				{:else}
					<div class="space-y-3">
						{#each shifts as shift}
							<button
								on:click={() => (selectedShiftId = shift.id)}
								class="w-full text-left p-4 rounded-xl border-2 transition-all {
									selectedShiftId === shift.id
										? 'border-primary bg-primary/5'
										: 'border-border hover:border-primary/50 hover:bg-surface-alt/50'
								}"
							>
								<div class="flex items-center justify-between">
									<div>
										<h3 class="font-semibold text-text-primary">{shift.name}</h3>
										<div class="flex flex-wrap gap-3 mt-2 text-sm text-text-muted">
											<span class="flex items-center gap-1">
												<Clock class="w-4 h-4" />
												{formatTime(shift.startTime)} - {formatTime(shift.endTime)}
											</span>
											<span class="flex items-center gap-1">
												<MapPin class="w-4 h-4" />
												{shift.location || '-'}
											</span>
										</div>
									</div>
									{#if shift.isRegistered}
										<span class="badge badge-success">已报名</span>
									{:else}
										<span class="badge bg-surface-alt text-text-muted">未报名</span>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			{#if selectedShift}
				<div class="card p-6">
					<h2 class="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
						<User class="w-5 h-5 text-primary" />
						签到方式
					</h2>

					<div class="grid grid-cols-3 gap-3 mb-6">
						<button
							on:click={() => { signinMethod = 'manual'; showScanner = false; }}
							class="p-4 rounded-xl border-2 transition-all text-center {
								signinMethod === 'manual'
									? 'border-primary bg-primary/5 text-primary'
									: 'border-border hover:border-primary/50 text-text-secondary'
							}"
						>
							<CheckCircle2 class="w-6 h-6 mx-auto mb-2" />
							<p class="text-sm font-medium">手动确认</p>
						</button>
						<button
							on:click={() => { signinMethod = 'qr'; showScanner = true; }}
							class="p-4 rounded-xl border-2 transition-all text-center {
								signinMethod === 'qr'
									? 'border-primary bg-primary/5 text-primary'
									: 'border-border hover:border-primary/50 text-text-secondary'
							}"
						>
							<QrCode class="w-6 h-6 mx-auto mb-2" />
							<p class="text-sm font-medium">扫码签到</p>
						</button>
						<button
							on:click={() => { signinMethod = 'location'; showScanner = false; getLocation(); }}
							class="p-4 rounded-xl border-2 transition-all text-center {
								signinMethod === 'location'
									? 'border-primary bg-primary/5 text-primary'
									: 'border-border hover:border-primary/50 text-text-secondary'
							}"
						>
							<Map class="w-6 h-6 mx-auto mb-2" />
							<p class="text-sm font-medium">位置验证</p>
						</button>
					</div>

					{#if showScanner}
						<div class="bg-surface-alt rounded-xl p-8 mb-6 text-center">
							<div class="w-48 h-48 mx-auto border-2 border-dashed border-border rounded-xl flex items-center justify-center mb-4">
								<QrCode class="w-20 h-20 text-text-muted" />
							</div>
							<p class="text-text-muted text-sm">请将二维码放入扫描框内</p>
							<button
								on:click={() => { showScanner = false; signinMethod = 'manual'; }}
								class="btn btn-ghost mt-4 text-sm"
							>
								切换为手动签到
							</button>
						</div>
					{/if}

					{#if signinMethod === 'location'}
						<div class="bg-surface-alt rounded-xl p-4 mb-6">
							<div class="flex items-center gap-3">
								<Map class="w-5 h-5 text-primary flex-shrink-0" />
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-text-primary">当前位置</p>
									<p class="text-sm text-text-muted truncate">{currentLocation || '正在获取位置...'}</p>
								</div>
								<button on:click={getLocation} class="btn btn-ghost text-sm">
									<Map class="w-4 h-4" />
									刷新
								</button>
							</div>
						</div>
					{/if}

					<button
						on:click={handleSignin}
						disabled={signingIn || shifts.length === 0}
						class="w-full btn btn-primary text-base py-3 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if signingIn}
							<Loader2 class="w-5 h-5 animate-spin" />
							处理中...
						{:else if hasSignedInToday}
							<CheckCircle2 class="w-5 h-5" />
							签退结束服务
						{:else}
							<CheckCircle2 class="w-5 h-5" />
							{signinMethod === 'qr' ? '扫码签到' : signinMethod === 'location' ? '位置签到' : '确认签到'}
						{/if}
					</button>
				</div>

				<div class="card p-6">
					<h3 class="font-display font-semibold text-text-primary mb-4">签到提示</h3>
					<ul class="space-y-2 text-sm text-text-secondary">
						<li class="flex items-start gap-2">
							<span class="text-primary mt-0.5">•</span>
							请在班次时间内完成签到，逾期将无法签到
						</li>
						<li class="flex items-start gap-2">
							<span class="text-primary mt-0.5">•</span>
							使用位置签到时，请确保已开启设备定位服务
						</li>
						<li class="flex items-start gap-2">
							<span class="text-primary mt-0.5">•</span>
							签到成功后请在活动结束时完成签退，以记录准确时长
						</li>
						<li class="flex items-start gap-2">
							<span class="text-primary mt-0.5">•</span>
							如有疑问，请联系项目负责人：{project.managerName || '待定'}
						</li>
					</ul>
				</div>
			{/if}
		</div>
	{/if}
</div>

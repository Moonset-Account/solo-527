<script lang="ts">
	import AppLayout from '$lib/components/AppLayout.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore, showToast } from '$lib/stores';
	import { Settings as SettingsIcon, Save, Thermometer, Gauge, Shield } from 'lucide-svelte';

	let loading = false;

	let settings = {
		tempUpper: 8,
		tempLower: -25,
		maxDeviation: 0.5,
		calibrationValidity: 90,
		anomalyThreshold: 5,
		autoDetectAnomaly: true,
		notifyEmail: true,
		notifySms: false
	};

	onMount(() => {
		if (!$userStore) {
			goto('/login');
		}
	});

	function handleSave() {
		loading = true;
		setTimeout(() => {
			showToast('设置已保存', 'success');
			loading = false;
		}, 800);
	}
</script>

<AppLayout>
	<div class="space-y-6 max-w-4xl">
		<div class="card">
			<div class="card-header flex items-center gap-3">
				<div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
					<Thermometer class="w-5 h-5 text-blue-600" />
				</div>
				<div>
					<h3 class="text-base font-semibold text-slate-800">温度阈值设置</h3>
					<p class="text-sm text-slate-500">配置温度异常判定标准</p>
				</div>
			</div>
			<div class="card-body">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label class="block text-sm font-medium text-slate-700 mb-2">温度上限 (°C)</label>
						<input type="number" class="input" bind:value={settings.tempUpper} step="0.5" />
						<p class="text-xs text-slate-500 mt-1">超过此温度判定为超温异常</p>
					</div>
					<div>
						<label class="block text-sm font-medium text-slate-700 mb-2">温度下限 (°C)</label>
						<input type="number" class="input" bind:value={settings.tempLower} step="0.5" />
						<p class="text-xs text-slate-500 mt-1">低于此温度判定为低温异常</p>
					</div>
					<div>
						<label class="block text-sm font-medium text-slate-700 mb-2">异常持续阈值 (分钟)</label>
						<input type="number" class="input" bind:value={settings.anomalyThreshold} />
						<p class="text-xs text-slate-500 mt-1">连续异常超过此时长才记录为异常</p>
					</div>
				</div>
			</div>
		</div>

		<div class="card">
			<div class="card-header flex items-center gap-3">
				<div class="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
					<Gauge class="w-5 h-5 text-cyan-600" />
				</div>
				<div>
					<h3 class="text-base font-semibold text-slate-800">探头校准参数</h3>
					<p class="text-sm text-slate-500">温度探头校准管理参数配置</p>
				</div>
			</div>
			<div class="card-body">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label class="block text-sm font-medium text-slate-700 mb-2">最大允许偏差 (°C)</label>
						<input type="number" class="input" bind:value={settings.maxDeviation} step="0.1" />
						<p class="text-xs text-slate-500 mt-1">校准偏差超过此值标记为待校准</p>
					</div>
					<div>
						<label class="block text-sm font-medium text-slate-700 mb-2">校准有效期 (天)</label>
						<input type="number" class="input" bind:value={settings.calibrationValidity} />
						<p class="text-xs text-slate-500 mt-1">超过此天数自动提示重新校准</p>
					</div>
				</div>
			</div>
		</div>

		<div class="card">
			<div class="card-header flex items-center gap-3">
				<div class="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
					<Shield class="w-5 h-5 text-purple-600" />
				</div>
				<div>
					<h3 class="text-base font-semibold text-slate-800">系统设置</h3>
					<p class="text-sm text-slate-500">通用系统配置</p>
				</div>
			</div>
			<div class="card-body">
				<div class="space-y-4">
					<label class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-slate-700">自动检测异常</p>
							<p class="text-xs text-slate-500">系统自动分析数据并标记异常</p>
						</div>
						<input type="checkbox" class="w-5 h-5" bind:checked={settings.autoDetectAnomaly} />
					</label>
					<label class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-slate-700">邮件通知</p>
							<p class="text-xs text-slate-500">异常发生时发送邮件提醒</p>
						</div>
						<input type="checkbox" class="w-5 h-5" bind:checked={settings.notifyEmail} />
					</label>
					<label class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-slate-700">短信通知</p>
							<p class="text-xs text-slate-500">严重异常发送短信提醒</p>
						</div>
						<input type="checkbox" class="w-5 h-5" bind:checked={settings.notifySms} />
					</label>
				</div>
			</div>
		</div>

		<div class="flex justify-end">
			<button class="btn btn-primary flex items-center gap-2" on:click={handleSave} disabled={loading}>
				{#if loading}
					<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
					</svg>
				{:else}
					<Save class="w-4 h-4" />
				{/if}
				保存设置
			</button>
		</div>
	</div>
</AppLayout>

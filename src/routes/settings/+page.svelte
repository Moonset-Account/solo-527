<script lang="ts">
	import { onMount } from 'svelte';
	import { settings } from '$lib/stores/settings';
	import type { Settings } from '$lib/types';

	let formData: Settings = {
		lowTempThreshold: 60,
		minSampleCount: 3,
		lateDeliveryThreshold: 15,
		exportTimeRange: '06:00-18:00'
	};
	let saving = false;
	let saveSuccess = false;

	onMount(async () => {
		try {
			const res = await fetch('/api/settings');
			const result = await res.json();
			if (result.success) {
				formData = result.data;
				settings.updateSettings(result.data);
			}
		} catch (e) {
			console.error(e);
		}
	});

	async function saveSettings() {
		saving = true;
		saveSuccess = false;
		try {
			const res = await fetch('/api/settings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});
			const result = await res.json();
			if (result.success) {
				settings.updateSettings(result.data);
				saveSuccess = true;
				setTimeout(() => (saveSuccess = false), 3000);
			}
		} catch (e) {
			console.error(e);
		} finally {
			saving = false;
		}
	}

	function resetDefaults() {
		formData = {
			lowTempThreshold: 60,
			minSampleCount: 3,
			lateDeliveryThreshold: 15,
			exportTimeRange: '06:00-18:00'
		};
	}
</script>

<div class="space-y-6 animate-fade-in max-w-3xl">
	<div>
		<h1 class="text-2xl font-bold text-slate-800">阈值配置</h1>
		<p class="text-sm text-slate-500 mt-1">配置温度监控和配送质量的判定标准</p>
	</div>

	{#if saveSuccess}
		<div class="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
			<span class="text-xl">✅</span>
			<span>配置保存成功！</span>
		</div>
	{/if}

	<div class="card p-6 space-y-6">
		<!-- 低温阈值 -->
		<div>
			<label class="block text-sm font-medium text-slate-700 mb-2">
				❄️ 低温阈值 (°C)
			</label>
			<div class="flex items-center gap-4">
				<input
					type="range"
					bind:value={formData.lowTempThreshold}
					min="40"
					max="80"
					class="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
				/>
				<input
					type="number"
					bind:value={formData.lowTempThreshold}
					class="w-20 px-3 py-2 border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
				/>
			</div>
			<p class="text-xs text-slate-500 mt-2">
				低于此温度的餐品将被标记为低温异常。当前设置：<span class="font-medium text-primary-600">{formData.lowTempThreshold}°C</span>
			</p>
		</div>

		<hr class="border-slate-100" />

		<!-- 最低采样次数 -->
		<div>
			<label class="block text-sm font-medium text-slate-700 mb-2">
				📊 最低采样次数
			</label>
			<div class="flex items-center gap-4">
				<input
					type="range"
					bind:value={formData.minSampleCount}
					min="1"
					max="10"
					class="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
				/>
				<input
					type="number"
					bind:value={formData.minSampleCount}
					class="w-20 px-3 py-2 border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
				/>
			</div>
			<p class="text-xs text-slate-500 mt-2">
				采样次数少于此值的低温箱号不进入排行榜，仅显示为"待复核"状态。当前设置：<span class="font-medium text-primary-600">{formData.minSampleCount} 次</span>
			</p>
		</div>

		<hr class="border-slate-100" />

		<!-- 晚签收阈值 -->
		<div>
			<label class="block text-sm font-medium text-slate-700 mb-2">
				⏰ 晚签收阈值 (分钟)
			</label>
			<div class="flex items-center gap-4">
				<input
					type="range"
					bind:value={formData.lateDeliveryThreshold}
					min="5"
					max="60"
					class="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
				/>
				<input
					type="number"
					bind:value={formData.lateDeliveryThreshold}
					class="w-20 px-3 py-2 border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
				/>
			</div>
			<p class="text-xs text-slate-500 mt-2">
				超过预计送达时间此值以上将被标记为晚签收。当前设置：<span class="font-medium text-primary-600">{formData.lateDeliveryThreshold} 分钟</span>
			</p>
		</div>

		<hr class="border-slate-100" />

		<!-- 默认导出时段 -->
		<div>
			<label class="block text-sm font-medium text-slate-700 mb-2">
				📅 日报默认导出时段
			</label>
			<input
				type="text"
				bind:value={formData.exportTimeRange}
				placeholder="例如: 06:00-18:00"
				class="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
			/>
			<p class="text-xs text-slate-500 mt-2">
				导出日报时默认的统计时段范围
			</p>
		</div>
	</div>

	<!-- 数据清洗说明 -->
	<div class="card p-6">
		<h3 class="text-lg font-semibold text-slate-800 mb-4">🔬 温度数据清洗规则</h3>
		<div class="space-y-3 text-sm text-slate-600">
			<div class="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
				<span class="text-lg">⚠️</span>
				<div>
					<p class="font-medium text-slate-700">温度超出合理范围</p>
					<p class="text-xs mt-1">温度 < 0°C 或 > 100°C 的采样点将被剔除</p>
				</div>
			</div>
			<div class="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
				<span class="text-lg">📉</span>
				<div>
					<p class="font-medium text-slate-700">温度异常突变</p>
					<p class="text-xs mt-1">相邻采样点温差 > 20°C 的数据将被标记为异常</p>
				</div>
			</div>
			<div class="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
				<span class="text-lg">📋</span>
				<div>
					<p class="font-medium text-slate-700">剔除记录可追溯</p>
					<p class="text-xs mt-1">所有被剔除的异常采样点都会在导出日报和详情页中列明，便于社工复盘退款争议</p>
				</div>
			</div>
		</div>
	</div>

	<!-- 操作按钮 -->
	<div class="flex items-center justify-end gap-4">
		<button class="btn-secondary" on:click={resetDefaults}>
			恢复默认
		</button>
		<button class="btn-primary" on:click={saveSettings} disabled={saving}>
			{saving ? '保存中...' : '保存配置'}
		</button>
	</div>
</div>

<script>
	import { goto } from '$app/navigation';
	import { api, online } from '$lib/utils/api';
	import { user, refreshTrigger } from '$lib/stores/auth';
	import SignatureInput from '$lib/components/SignatureInput.svelte';

	let form = {
		batch_no: '',
		box_no: '',
		vaccine_name: '',
		manufacturer: '',
		quantity: 0,
		receive_temp: 4,
		temp_min: 2,
		temp_max: 8,
		expire_date: '',
		signature: ''
	};

	let error = '';
	let success = '';
	let loading = false;
	let showTempWarning = false;

	$: showTempWarning = form.receive_temp < form.temp_min || form.receive_temp > form.temp_max;

	async function handleSubmit() {
		error = '';
		success = '';
		loading = true;

		try {
			if (!form.signature) {
				throw new Error('请完成签名');
			}

			const result = await api.receiveBatch(form);
			if (result.offline) {
				success = '当前处于离线模式，数据已保存到本地队列，联网后将自动同步。';
			} else {
				success = '入库成功！';
				refreshTrigger.update((n) => n + 1);
			}

			setTimeout(() => {
				goto('/');
			}, 2000);
		} catch (e) {
			error = e.message || '入库失败';
		} finally {
			loading = false;
		}
	}

	const vaccineOptions = [
		'新冠疫苗', '乙肝疫苗', '流感疫苗', 'HPV疫苗', '肺炎疫苗',
		'狂犬疫苗', '水痘疫苗', '麻腮风疫苗', '百白破疫苗', '其他'
	];
</script>

<div class="max-w-3xl mx-auto">
	<div class="page-header">
		<div>
			<h1 class="text-2xl font-bold text-gray-800">药品入库</h1>
			<p class="text-gray-500 mt-1">从上级仓接收疫苗和冷藏药品</p>
		</div>
	</div>

	{#if !$online}
		<div class="alert alert-warning">
			⚠️ 当前处于离线模式，提交的数据将保存到本地，联网后自动同步
		</div>
	{/if}

	{#if error}
		<div class="alert alert-danger">{error}</div>
	{/if}

	{#if success}
		<div class="alert alert-success">{success}</div>
	{/if}

	{#if showTempWarning}
		<div class="alert alert-warning">
			⚠️ 当前接收温度 ({form.receive_temp}°C) 超出标准范围 ({form.temp_min}~{form.temp_max}°C)，
			入库后将自动进入隔离状态
		</div>
	{/if}

	<div class="card">
		<form on:submit|preventDefault={handleSubmit}>
			<div class="grid grid-cols-2">
				<div class="form-group">
					<label class="form-label">批号 *</label>
					<input
						class="form-input"
						type="text"
						bind:value={form.batch_no}
						placeholder="如：B2024001"
						required
					/>
				</div>

				<div class="form-group">
					<label class="form-label">箱号 *</label>
					<input
						class="form-input"
						type="text"
						bind:value={form.box_no}
						placeholder="如：BOX001"
						required
					/>
				</div>

				<div class="form-group">
					<label class="form-label">药品名称 *</label>
					<select class="form-select" bind:value={form.vaccine_name} required>
						<option value="">请选择</option>
						{#each vaccineOptions as v}
							<option value={v}>{v}</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label class="form-label">生产厂家</label>
					<input
						class="form-input"
						type="text"
						bind:value={form.manufacturer}
						placeholder="如：国药集团"
					/>
				</div>

				<div class="form-group">
					<label class="form-label">数量 *</label>
					<input
						class="form-input"
						type="number"
						bind:value={form.quantity}
						min="1"
						required
					/>
				</div>

				<div class="form-group">
					<label class="form-label">有效期至 *</label>
					<input
						class="form-input"
						type="date"
						bind:value={form.expire_date}
						required
					/>
				</div>

				<div class="form-group">
					<label class="form-label">接收温度 (°C) *</label>
					<input
						class="form-input"
						type="number"
						step="0.1"
						bind:value={form.receive_temp}
						required
					/>
				</div>

				<div class="form-group">
					<label class="form-label">标准温度范围 (°C)</label>
					<div class="flex gap-2 items-center">
						<input
							class="form-input"
							type="number"
							step="0.1"
							bind:value={form.temp_min}
						/>
						<span class="text-gray-400">~</span>
						<input
							class="form-input"
							type="number"
							step="0.1"
							bind:value={form.temp_max}
						/>
					</div>
				</div>
			</div>

			<div class="divider"></div>

			<div class="form-group">
				<label class="form-label">接收人签名 *</label>
				<p class="text-xs text-gray-500 mb-2">接收人：{$user?.name}</p>
				<SignatureInput bind:value={form.signature} width={500} height={160} />
			</div>

			<div class="flex gap-3 mt-6">
				<button class="btn btn-primary" type="submit" disabled={loading}>
					{loading ? '提交中...' : '确认入库'}
				</button>
				<button type="button" class="btn btn-secondary" on:click={() => history.back()}>
					取消
				</button>
			</div>
		</form>
	</div>
</div>

<style>
	.page-header {
		margin-bottom: 1.5rem;
	}
</style>

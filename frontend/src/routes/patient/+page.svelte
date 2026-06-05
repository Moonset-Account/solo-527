<script lang="ts">
	import { publicApi, type Prescription, type PrescriptionItem, type RescheduleRecord } from '$lib/api';

	let prescriptionNo = '';
	let loading = false;
	let error = '';
	let prescription: Prescription | null = null;
	let items: PrescriptionItem[] = [];
	let aheadCount = 0;
	let rescheduleRecords: RescheduleRecord[] = [];

	let showAlternativeModal = false;
	let selectedItem: PrescriptionItem | null = null;
	let selectedAlternativeBatchId = 0;
	let patientPhone = '';
	let confirmLoading = false;
	let confirmSuccess = false;

	let showCancelModal = false;
	let cancelReason = '';
	let cancelLoading = false;
	let cancelSuccess = false;

	async function searchPrescription() {
		if (!prescriptionNo.trim()) {
			error = '请输入处方号';
			return;
		}
		loading = true;
		error = '';
		prescription = null;
		items = [];
		rescheduleRecords = [];
		try {
			const result = await publicApi.getPrescription(prescriptionNo.trim());
			prescription = result.prescription;
			items = result.items;
			aheadCount = result.ahead_count;
			rescheduleRecords = result.reschedule_records || [];
		} catch (e: any) {
			error = e.message || '查询失败';
		} finally {
			loading = false;
		}
	}

	function openAlternativeModal(item: PrescriptionItem) {
		selectedItem = item;
		selectedAlternativeBatchId = item.alternative_batches && item.alternative_batches.length > 0
			? item.alternative_batches[0].id
			: 0;
		patientPhone = '';
		confirmSuccess = false;
		showAlternativeModal = true;
	}

	async function confirmAlternative(accept: boolean) {
		if (!selectedItem) return;
		if (!patientPhone.trim()) {
			alert('请输入联系电话');
			return;
		}
		if (accept && !selectedAlternativeBatchId) {
			alert('请选择替代批次');
			return;
		}
		confirmLoading = true;
		try {
			await publicApi.confirmAlternative(
				selectedItem.id,
				accept ? selectedAlternativeBatchId : 0,
				accept,
				prescription?.patient_name || '',
				patientPhone
			);
			confirmSuccess = true;
			setTimeout(() => {
				showAlternativeModal = false;
				searchPrescription();
			}, 1500);
		} catch (e: any) {
			alert(e.message || '确认失败');
		} finally {
			confirmLoading = false;
		}
	}

	function openCancelModal() {
		cancelReason = '';
		cancelSuccess = false;
		showCancelModal = true;
	}

	async function handleCancel() {
		if (!prescription) return;
		cancelLoading = true;
		try {
			await publicApi.cancelPrescription(
				prescription.prescription_no,
				prescription.patient_name,
				'',
				cancelReason
			);
			cancelSuccess = true;
			setTimeout(() => {
				showCancelModal = false;
				searchPrescription();
			}, 1500);
		} catch (e: any) {
			alert(e.message || '取消失败');
		} finally {
			cancelLoading = false;
		}
	}

	function getStatusText(status: string): string {
		const map: Record<string, string> = {
			pending: '待排队',
			queued: '排队中',
			called: '叫号中',
			dispensed: '已发药',
			cancelled: '已取消',
			expired: '已过期'
		};
		return map[status] || status;
	}

	function getStatusClass(status: string): string {
		const map: Record<string, string> = {
			pending: 'bg-gray-100 text-gray-800',
			queued: 'bg-blue-100 text-blue-800',
			called: 'bg-yellow-100 text-yellow-800',
			dispensed: 'bg-green-100 text-green-800',
			cancelled: 'bg-red-100 text-red-800',
			expired: 'bg-red-100 text-red-800'
		};
		return map[status] || 'bg-gray-100 text-gray-800';
	}
</script>

<div class="max-w-3xl mx-auto">
	<h1 class="text-2xl font-bold text-gray-800 mb-6">处方查询</h1>

	<div class="bg-white rounded-lg shadow p-6 mb-6">
		<div class="flex gap-4">
			<input
				type="text"
				bind:value={prescriptionNo}
				placeholder="请输入处方号"
				class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				on:keydown={(e) => e.key === 'Enter' && searchPrescription()}
			/>
			<button
				on:click={searchPrescription}
				disabled={loading}
				class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{loading ? '查询中...' : '查询'}
			</button>
		</div>
		{#if error}
			<p class="mt-3 text-red-600 text-sm">{error}</p>
		{/if}
	</div>

	{#if prescription}
		<div class="bg-white rounded-lg shadow p-6 mb-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-xl font-semibold text-gray-800">处方信息</h2>
				<span class="px-3 py-1 rounded-full text-sm font-medium {getStatusClass(prescription.status)}">
					{getStatusText(prescription.status)}
				</span>
			</div>

			{#if prescription.is_expired}
				<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
					⚠️ 该处方已过期，无法取药
				</div>
			{/if}

			<div class="grid grid-cols-2 gap-4 mb-4">
				<div>
					<p class="text-gray-500 text-sm">处方号</p>
					<p class="font-medium">{prescription.prescription_no}</p>
				</div>
				<div>
					<p class="text-gray-500 text-sm">患者姓名</p>
					<p class="font-medium">{prescription.patient_name}</p>
				</div>
				<div>
					<p class="text-gray-500 text-sm">取药时段</p>
					<p class="font-medium">{prescription.pick_up_time}</p>
				</div>
				<div>
					<p class="text-gray-500 text-sm">有效期至</p>
					<p class="font-medium">{prescription.expiry_date}</p>
				</div>
				{#if prescription.queue_no}
					<div>
						<p class="text-gray-500 text-sm">排队号</p>
						<p class="font-medium text-2xl text-blue-600">#{prescription.queue_no}</p>
					</div>
					<div>
						<p class="text-gray-500 text-sm">前方等待</p>
						<p class="font-medium text-xl">{aheadCount} 人</p>
					</div>
				{/if}
			</div>

			{#if prescription.is_manual_entry}
				<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
					<p class="text-yellow-800 font-medium mb-2">📝 人工补录记录</p>
					<div class="text-sm text-yellow-700 space-y-1">
						<p>补录人：{prescription.manual_entry_by || '-'}</p>
						<p>补录时间：{prescription.manual_entry_at || '-'}</p>
						<p>补录原因：{prescription.manual_entry_reason || '-'}</p>
					</div>
				</div>
			{/if}

			{#if prescription.status !== 'dispensed' && prescription.status !== 'cancelled'}
				<div class="mt-4 pt-4 border-t border-gray-200">
					<button
						on:click={openCancelModal}
						class="text-sm text-red-600 hover:text-red-800 hover:underline"
					>
						✕ 取消取药
					</button>
				</div>
			{/if}
		</div>

		<div class="bg-white rounded-lg shadow p-6 mb-6">
			<h2 class="text-xl font-semibold text-gray-800 mb-4">药品清单</h2>
			<div class="space-y-4">
				{#each items as item}
					<div class="border border-gray-200 rounded-lg p-4 {item.is_stock_out ? 'border-orange-300 bg-orange-50' : ''}">
						<div class="flex items-start justify-between">
							<div>
								<p class="font-medium text-gray-800">{item.medicine_name}</p>
								<p class="text-sm text-gray-500">规格：{item.medicine_code} | 批次：{item.batch_no}</p>
								<p class="text-sm text-gray-500">数量：{item.quantity}</p>
								<p class="text-sm text-gray-500">当前库存：{item.current_stock ?? '-'}</p>
							</div>
							{#if item.is_stock_out}
								<span class="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">库存不足</span>
							{/if}
						</div>

						{#if item.is_stock_out}
							<div class="mt-3 pt-3 border-t border-orange-200">
								<p class="text-sm text-orange-700 mb-2">
									⚠️ 该药品批次库存不足
									{#if item.alternative_confirmed}
										<span class="ml-2 text-green-600">（已确认替代方案）</span>
									{/if}
								</p>
								{#if item.alternative_batches && item.alternative_batches.length > 0 && !item.alternative_confirmed}
									<p class="text-sm text-gray-600 mb-2">有以下替代批次可选：</p>
									<button
										on:click={() => openAlternativeModal(item)}
										class="text-sm text-blue-600 hover:text-blue-800 underline"
									>
										确认是否接受替代批次 →
									</button>
								{:else if !item.alternative_confirmed}
									<p class="text-sm text-gray-500">暂无替代批次，请等待补货</p>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		{#if rescheduleRecords.length > 0}
			<div class="bg-white rounded-lg shadow p-6">
				<h2 class="text-xl font-semibold text-gray-800 mb-4">改期记录</h2>
				<div class="space-y-3">
					{#each rescheduleRecords as record}
						<div class="bg-gray-50 rounded-lg p-3">
							<div class="flex items-center justify-between">
								<div>
									<p class="text-sm text-gray-600">
										从 <span class="font-medium">{record.old_time}</span> 改期为
										<span class="font-medium">{record.new_time}</span>
									</p>
									{#if record.reason}
										<p class="text-sm text-gray-500 mt-1">原因：{record.reason}</p>
									{/if}
								</div>
								<div class="text-right">
									<p class="text-xs text-gray-500">{record.created_at}</p>
									<p class="text-xs text-gray-500">操作人：{record.user_name || '-'}</p>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}

	{#if showAlternativeModal && selectedItem}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">替代批次确认</h3>

				{#if confirmSuccess}
					<div class="text-center py-8">
						<div class="text-5xl mb-4">✅</div>
						<p class="text-green-600 font-medium">确认成功！</p>
					</div>
				{:else}
					<div class="mb-4">
						<p class="text-gray-600 mb-2">
							药品：<span class="font-medium">{selectedItem.medicine_name}</span>
						</p>
						<p class="text-gray-600 mb-4">
							原批次：<span class="font-medium">{selectedItem.batch_no}</span>（库存不足）
						</p>

						{#if selectedItem.alternative_batches && selectedItem.alternative_batches.length > 0}
							<p class="text-sm text-gray-500 mb-2">请选择替代批次：</p>
							<div class="space-y-2 mb-4">
								{#each selectedItem.alternative_batches as batch}
									<label class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
										<input
											type="radio"
											name="alternative"
											bind:group={selectedAlternativeBatchId}
											value={batch.id}
											class="mr-3"
										/>
										<div>
											<p class="font-medium">批次号：{batch.batch_no}</p>
											<p class="text-sm text-gray-500">库存：{batch.stock} | 有效期：{batch.expiry_date}</p>
										</div>
									</label>
								{/each}
							</div>
						{/if}

						<div class="mb-4">
							<label class="block text-sm text-gray-600 mb-1">联系电话 *</label>
							<input
								type="tel"
								bind:value={patientPhone}
								placeholder="请输入您的联系电话"
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						<div class="flex gap-3">
							<button
								on:click={() => confirmAlternative(false)}
								disabled={confirmLoading}
								class="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
							>
								拒绝替代
							</button>
							<button
								on:click={() => confirmAlternative(true)}
								disabled={confirmLoading || !selectedAlternativeBatchId}
								class="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
							>
								接受替代
							</button>
						</div>

						<button
							on:click={() => (showAlternativeModal = false)}
							disabled={confirmLoading}
							class="w-full mt-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
						>
							取消
						</button>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	{#if showCancelModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">确认取消取药</h3>

				{#if cancelSuccess}
					<div class="text-center py-8">
						<div class="text-5xl mb-4">✅</div>
						<p class="text-green-600 font-medium">取消成功，排队号已释放</p>
					</div>
				{:else}
					<div class="mb-4">
						<div class="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-lg mb-4">
							<p>⚠️ 取消后您的排队号将被释放，如需取药需重新排队。</p>
						</div>

						<div class="mb-4">
							<label class="block text-sm text-gray-600 mb-1">取消原因（可选）</label>
							<textarea
								bind:value={cancelReason}
								placeholder="请输入取消原因"
								rows={3}
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
							/>
						</div>

						<div class="flex gap-3">
							<button
								on:click={() => (showCancelModal = false)}
								disabled={cancelLoading}
								class="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
							>
								返回
							</button>
							<button
								on:click={handleCancel}
								disabled={cancelLoading}
								class="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
							>
								确认取消
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

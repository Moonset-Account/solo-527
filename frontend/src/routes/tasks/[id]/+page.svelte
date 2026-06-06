<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { api } from '$api/client';
	import { auth } from '$stores/auth';
	import { getStatusLabel, getStatusClass, formatDate, isTemperatureNormal } from '$utils/helpers';

	let task = null;
	let temperatureRecords = [];
	let exceptions = [];
	let loading = true;
	let error = '';

	let showSignModal = false;
	let showReturnModal = false;
	let showReviewModal = false;
	let showDemoSection = false;

	let signForm = { temperature: 5.0, attachment: '', note: '' };
	let returnReason = '';
	let reviewNote = '';
	let reviewApproved = true;
	let actionLoading = false;

	$: taskId = $page.params.id;
	$: user = $auth.user;
	$: isDispatcher = user?.role === 'dispatcher' || user?.role === 'admin';
	$: isNurse = user?.role === 'nurse';
	$: isAdmin = user?.role === 'admin';
	$: canSign = isNurse && (task?.status === 'in_transit' || task?.status === 'returned');
	$: canReturn = isNurse && task?.status === 'in_transit';
	$: canResend = isDispatcher && task?.status === 'returned';
	$: canReview = isDispatcher && !task?.reviewed && task?.status === 'exception';
	$: tempNormal = isTemperatureNormal(signForm.temperature);

	async function loadTask() {
		loading = true;
		error = '';
		try {
			const result = await api.getTask(taskId);
			task = result.task;
			temperatureRecords = result.temperatureRecords || [];
			exceptions = result.exceptions || [];
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	async function handleSign() {
		actionLoading = true;
		try {
			if (!signForm.attachment) {
				alert('请上传温度记录附件');
				return;
			}
			await api.signTask(taskId, signForm);
			alert('签收成功！');
			showSignModal = false;
			loadTask();
		} catch (e) {
			alert(e.message);
		} finally {
			actionLoading = false;
		}
	}

	async function handleReturn() {
		actionLoading = true;
		try {
			if (!returnReason) {
				alert('请填写退回原因');
				return;
			}
			await api.returnTask(taskId, returnReason);
			alert('退回成功，箱内库存已锁定');
			showReturnModal = false;
			loadTask();
		} catch (e) {
			alert(e.message);
		} finally {
			actionLoading = false;
		}
	}

	async function handleResend() {
		if (!confirm('确定要重新派送此任务吗？')) return;
		try {
			await api.resendTask(taskId);
			alert('重新派送成功');
			loadTask();
		} catch (e) {
			alert(e.message);
		}
	}

	async function handleReview() {
		actionLoading = true;
		try {
			await api.reviewTask(taskId, reviewApproved, reviewNote);
			alert(reviewApproved ? '复核通过，库存已释放' : '复核不通过');
			showReviewModal = false;
			loadTask();
		} catch (e) {
			alert(e.message);
		} finally {
			actionLoading = false;
		}
	}

	function simulateDemo(type) {
		if (type === 'normal') {
			signForm.temperature = 5.0;
			signForm.attachment = 'demo_temp_normal.jpg';
			signForm.note = '温度正常，验收通过';
			alert('【演示：正常提交】\n温度：5.0℃（正常范围2-8℃）\n已上传附件\n将正常签收');
		} else if (type === 'return') {
			alert('【演示：退回修改】\n温度附件缺失\n将退回给配送员补传\n退回期间箱内库存保持锁定');
			showSignModal = false;
			setTimeout(() => {
				showReturnModal = true;
				returnReason = '温度记录附件缺失，请配送员补传后重新签收';
			}, 300);
		} else if (type === 'forbidden') {
			alert('【演示：权限拦截】\n当前用户非护士角色\n或非本站点护士\n系统拦截签收操作');
		}
	}

	onMount(() => {
		loadTask();
	});
</script>

<div class="space-y-6">
	<div class="flex items-center">
		<button on:click={() => goto('/tasks')} class="mr-4 text-gray-500 hover:text-gray-700">
			← 返回列表
		</button>
		<h1 class="text-2xl font-bold text-gray-900">任务详情</h1>
		<span class="ml-4 px-3 py-1 rounded-full text-sm font-medium {getStatusClass(task?.status)}">
			{getStatusLabel(task?.status)}
		</span>
	</div>

	{#if loading}
		<div class="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-500">加载中...</div>
	{:else if error}
		<div class="bg-white rounded-xl shadow-sm border p-12 text-center text-red-500">{error}</div>
	{:else if task}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<div class="lg:col-span-2 space-y-6">
				<div class="bg-white rounded-xl shadow-sm border p-6">
					<h2 class="text-lg font-semibold mb-4">基本信息</h2>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<span class="text-sm text-gray-500">箱号</span>
							<p class="font-medium text-blue-600">{task.box_number}</p>
						</div>
						<div>
							<span class="text-sm text-gray-500">路线</span>
							<p class="font-medium">{task.route_name}</p>
						</div>
						<div>
							<span class="text-sm text-gray-500">站点</span>
							<p class="font-medium">{task.site_name}</p>
						</div>
						<div>
							<span class="text-sm text-gray-500">调度员</span>
							<p class="font-medium">{task.dispatcher_name}</p>
						</div>
						<div>
							<span class="text-sm text-gray-500">签收护士</span>
							<p class="font-medium">{task.nurse_name || '-'}</p>
						</div>
						<div>
							<span class="text-sm text-gray-500">温度是否正常</span>
							<p class="font-medium">
								{#if task.temperature_ok === true}
									<span class="text-green-600">✓ 正常</span>
								{:else if task.temperature_ok === false}
									<span class="text-red-600">✗ 异常</span>
								{:else}
									-
								{/if}
							</p>
						</div>
						<div>
							<span class="text-sm text-gray-500">预计到达</span>
							<p class="font-medium">{formatDate(task.expected_arrival)}</p>
						</div>
						<div>
							<span class="text-sm text-gray-500">实际到达</span>
							<p class="font-medium">{formatDate(task.actual_arrival)}</p>
						</div>
						<div>
							<span class="text-sm text-gray-500">签收时间</span>
							<p class="font-medium">{formatDate(task.signed_at)}</p>
						</div>
						<div>
							<span class="text-sm text-gray-500">创建时间</span>
							<p class="font-medium">{formatDate(task.created_at)}</p>
						</div>
					</div>

					{#if task.return_reason}
						<div class="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
							<p class="text-sm font-medium text-orange-800">退回原因：</p>
							<p class="text-orange-700">{task.return_reason}</p>
						</div>
					{/if}

					{#if task.reviewed && task.status === 'completed'}
						<div class="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
							<p class="text-sm font-medium text-emerald-800">
								✅ 复核通过：{task.reviewed_by} 于 {formatDate(task.reviewed_at)} 完成复核
							</p>
							<p class="text-sm text-emerald-700 mt-1">
								📦 库存已释放：箱子已恢复空闲状态，可重新分配使用
							</p>
						</div>
					{/if}

					{#if task.reviewed && task.status === 'exception'}
						<div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
							<p class="text-sm font-medium text-red-800">
								❌ 复核不通过：{task.reviewed_by} 于 {formatDate(task.reviewed_at)} 复核
							</p>
							<p class="text-sm text-red-700 mt-1">
								🔒 继续保持异常隔离，库存未释放
							</p>
						</div>
					{/if}

					{#if !task.reviewed && task.status === 'exception' && task.temperature_ok === false}
						<div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
							<p class="text-sm font-medium text-yellow-800">
								⚠️ 温度异常：待复核，当前库存锁定中
							</p>
							<p class="text-sm text-yellow-700 mt-1">
								需管理员或调度员复核通过后，库存才能释放
							</p>
						</div>
					{/if}

					{#if task.status === 'returned'}
						<div class="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
							<p class="text-sm font-medium text-purple-800">
								🔒 库存锁定：任务已退回，等待补传资料后重新派送
							</p>
							<p class="text-sm text-purple-700 mt-1">
								退回期间箱内库存保持锁定，不能被重新分配
							</p>
						</div>
					{/if}
				</div>

				<div class="bg-white rounded-xl shadow-sm border p-6">
					<h2 class="text-lg font-semibold mb-4">温度记录</h2>
					{#if temperatureRecords.length === 0}
						<p class="text-gray-500 text-center py-4">暂无温度记录</p>
					{:else}
						<div class="space-y-3">
							{#each temperatureRecords as tr}
								<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
									<div class="flex items-center space-x-4">
										<div class="text-center">
											<span class="text-2xl font-bold {tr.is_normal ? 'text-green-600' : 'text-red-600'}">
												{tr.temperature}℃
											</span>
											<p class="text-xs text-gray-500">{tr.is_normal ? '正常' : '异常'}</p>
										</div>
										<div>
											<p class="text-sm text-gray-600">记录时间：{formatDate(tr.recorded_at)}</p>
											{#if tr.attachment}
												<p class="text-sm text-blue-600">📎 附件：{tr.attachment}</p>
											{/if}
											{#if tr.note}
												<p class="text-sm text-gray-500">备注：{tr.note}</p>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				{#if exceptions.length > 0}
					<div class="bg-white rounded-xl shadow-sm border p-6">
						<h2 class="text-lg font-semibold mb-4 text-red-600">异常记录</h2>
						<div class="space-y-3">
							{#each exceptions as ex}
								<div class="p-4 bg-red-50 border border-red-200 rounded-lg">
									<div class="flex justify-between items-start">
										<div>
											<p class="font-medium text-red-800">
												{ex.type === 'temperature' ? '温度异常' : ex.type}
											</p>
											<p class="text-sm text-red-700 mt-1">{ex.description}</p>
											{#if ex.temperature}
												<p class="text-sm text-red-600 mt-1">温度：{ex.temperature}℃</p>
											{/if}
										</div>
										<span class="px-2 py-1 text-xs rounded-full {ex.resolved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
											{ex.resolved ? '已解决' : '待处理'}
										</span>
									</div>
									{#if ex.resolved && ex.resolution}
										<p class="text-sm text-green-700 mt-2 pt-2 border-t border-red-200">
											处理结果：{ex.resolution}
										</p>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<div class="bg-yellow-50 rounded-xl border border-yellow-200 p-6">
					<button
						on:click={() => showDemoSection = !showDemoSection}
						class="w-full flex justify-between items-center"
					>
						<h2 class="text-lg font-semibold text-yellow-800">🎯 验收样例演示</h2>
						<span class="text-yellow-600">{showDemoSection ? '收起' : '展开'}</span>
					</button>

					{#if showDemoSection}
						<div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
							<button
								on:click={() => simulateDemo('normal')}
								class="p-4 bg-green-50 border-2 border-green-200 rounded-lg hover:border-green-400 text-left"
							>
								<p class="font-semibold text-green-800">✓ 样例一：正常提交</p>
								<p class="text-sm text-green-600 mt-2">温度在正常范围内，附件齐全，正常签收</p>
							</button>

							<button
								on:click={() => simulateDemo('return')}
								class="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg hover:border-orange-400 text-left"
							>
								<p class="font-semibold text-orange-800">↩ 样例二：退回修改</p>
								<p class="text-sm text-orange-600 mt-2">附件缺失，退回配送员补传，库存锁定</p>
							</button>

							<button
								on:click={() => simulateDemo('forbidden')}
								class="p-4 bg-red-50 border-2 border-red-200 rounded-lg hover:border-red-400 text-left"
							>
								<p class="font-semibold text-red-800">🚫 样例三：权限拦截</p>
								<p class="text-sm text-red-600 mt-2">非本站点护士或非护士角色无法操作</p>
							</button>
						</div>

						<div class="mt-4 p-4 bg-white rounded-lg border">
							<p class="text-sm text-gray-600">
								<strong>说明：</strong>以上演示用于展示系统的三种验收场景。
								实际操作中，系统会根据当前用户角色和任务状态自动判断可用操作。
								温度超标（{'>'}8℃ 或 {'<'}2℃）的箱子会自动进入异常隔离状态，不能继续派送，需复核通过后库存才能释放。
								退回的任务在补传重新派送前，箱内库存保持锁定，不能被重新分配。
							</p>
						</div>
					{/if}
				</div>
			</div>

			<div class="space-y-6">
				<div class="bg-white rounded-xl shadow-sm border p-6">
					<h2 class="text-lg font-semibold mb-4">操作</h2>
					<div class="space-y-3">
						{#if canSign}
							<button
								on:click={() => showSignModal = true}
								class="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
							>
								✓ 签收并上传温度
							</button>
						{/if}

						{#if canReturn}
							<button
								on:click={() => showReturnModal = true}
								class="w-full py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
							>
								↩ 退回（附件缺失等）
							</button>
						{/if}

						{#if canResend}
							<button
								on:click={handleResend}
								class="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
							>
								🔄 重新派送
							</button>
						{/if}

						{#if canReview}
							<button
								on:click={() => showReviewModal = true}
								class="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
							>
								⚖ 复核异常任务
							</button>
						{/if}

						{#if !canSign && !canReturn && !canResend && !canReview}
							<p class="text-center text-gray-500 py-4">当前状态无可用操作</p>
						{/if}
					</div>

					<div class="mt-6 pt-6 border-t">
						<h3 class="text-sm font-medium text-gray-700 mb-3">状态流转说明</h3>
						<div class="space-y-2 text-xs text-gray-500">
							<p>1. 调度员创建任务 → 配送中</p>
							<p>2. 护士签收（温度正常）→ 已签收</p>
							<p>3. 护士签收（温度超标）→ 异常（需复核）</p>
							<p>4. 护士退回 → 已退回（库存锁定）</p>
							<p>5. 调度员重发 → 配送中</p>
							<p>6. 复核通过 → 已完成（库存释放）</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#if showSignModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div class="bg-white rounded-xl p-6 w-full max-w-md">
				<h3 class="text-xl font-bold mb-4">签收任务</h3>
				<form on:submit|preventDefault={handleSign} class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">
							温度 (℃) <span class="text-red-500">*</span>
						</label>
						<input
							type="number"
							step="0.1"
							bind:value={signForm.temperature}
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 {tempNormal ? '' : 'border-red-500'}"
							required
						/>
						<p class="text-xs mt-1 {tempNormal ? 'text-green-600' : 'text-red-600'}">
							{tempNormal ? '✓ 温度正常（2-8℃）' : '⚠ 温度异常！将触发异常隔离'}
						</p>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">
							温度记录附件 <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							bind:value={signForm.attachment}
							placeholder="输入或上传附件文件名"
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
							required
						/>
						<p class="text-xs text-gray-500 mt-1">支持：照片截图、PDF 等文件名</p>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
						<textarea
							bind:value={signForm.note}
							rows="2"
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
							placeholder="可选填备注信息"
						/>
					</div>

					<div class="flex space-x-3 pt-4">
						<button
							type="button"
							on:click={() => showSignModal = false}
							class="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
						>
							取消
						</button>
						<button
							type="submit"
							disabled={actionLoading}
							class="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
						>
							{actionLoading ? '提交中...' : '确认签收'}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	{#if showReturnModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div class="bg-white rounded-xl p-6 w-full max-w-md">
				<h3 class="text-xl font-bold mb-4">退回任务</h3>
				<div class="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
					<p class="text-sm text-orange-800">
						⚠️ 退回后，箱内库存将被锁定，不能重新分配，需等待配送员补传资料后重新派送。
					</p>
				</div>
				<form on:submit|preventDefault={handleReturn} class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">
							退回原因 <span class="text-red-500">*</span>
						</label>
						<textarea
							bind:value={returnReason}
							rows="3"
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
							placeholder="请详细描述退回原因，如：温度记录附件缺失..."
							required
						/>
					</div>

					<div class="flex space-x-3 pt-4">
						<button
							type="button"
							on:click={() => showReturnModal = false}
							class="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
						>
							取消
						</button>
						<button
							type="submit"
							disabled={actionLoading}
							class="flex-1 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
						>
							{actionLoading ? '提交中...' : '确认退回'}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	{#if showReviewModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div class="bg-white rounded-xl p-6 w-full max-w-md">
				<h3 class="text-xl font-bold mb-4">复核异常任务</h3>
				<div class="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
					<p class="text-sm text-purple-800">
						复核通过后，箱子库存将被释放并可重新使用。复核不通过则继续保持异常隔离状态。
					</p>
				</div>
				<form on:submit|preventDefault={handleReview} class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">复核结果</label>
						<div class="flex space-x-4">
							<label class="flex items-center">
								<input type="radio" bind:group={reviewApproved} value={true} class="mr-2" />
								<span class="text-green-700">通过（释放库存）</span>
							</label>
							<label class="flex items-center">
								<input type="radio" bind:group={reviewApproved} value={false} class="mr-2" />
								<span class="text-red-700">不通过</span>
							</label>
						</div>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">复核备注</label>
						<textarea
							bind:value={reviewNote}
							rows="3"
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
							placeholder="请填写复核意见"
						/>
					</div>

					<div class="flex space-x-3 pt-4">
						<button
							type="button"
							on:click={() => showReviewModal = false}
							class="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
						>
							取消
						</button>
						<button
							type="submit"
							disabled={actionLoading}
							class="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
						>
							{actionLoading ? '提交中...' : '确认复核'}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>

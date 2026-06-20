<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { currentUser } from '$stores/user';
  import FormField from '$components/FormField.svelte';
  import DataTable from '$components/DataTable.svelte';
  import StatusBadge from '$components/StatusBadge.svelte';
  import { FlaskConical, Plus, Search, AlertTriangle } from 'lucide-svelte';
  import { formatDate, hazardLevelMap, reagentCategoryMap, cn } from '$utils/format';
  import { mockReagents, mockRequisitions } from '$server/mockData';
  import type { Reagent, Requisition, Column } from '$types';

  let reagents = $state<Reagent[]>([]);
  let requisitions = $state<Requisition[]>([]);
  let loading = $state(true);
  let showForm = $state(false);
  let searchQuery = $state('');

  let form = $state({
    reagentId: '',
    quantity: '',
    purpose: ''
  });
  let formErrors = $state<Record<string, string>>({});
  let submitSuccess = $state(false);

  let user = $derived(get(currentUser));
  let filteredReagents = $derived(reagents.filter(
    (r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()) && r.stock > 0
  ));
  let selectedReagent = $derived(reagents.find((r) => r.id === form.reagentId));

  async function loadRequisitions() {
    try {
      const res = await fetch(`/api/requisitions?userId=${user.id}`);
      const result = await res.json();
      requisitions = result.data || [];
    } catch (e) {
      console.error('Failed to load requisitions:', e);
    }
  }

  onMount(async () => {
    try {
      reagents = [...mockReagents];
      await loadRequisitions();
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      loading = false;
    }
  });

  function validateForm(): boolean {
    formErrors = {};
    if (!form.reagentId) formErrors.reagentId = '请选择试剂';
    if (!form.quantity || parseInt(form.quantity) <= 0) formErrors.quantity = '请输入有效数量';
    if (!form.purpose.trim()) formErrors.purpose = '请填写用途说明';
    if (selectedReagent && parseInt(form.quantity) > selectedReagent.stock) {
      formErrors.quantity = `库存不足，当前库存: ${selectedReagent.stock}${selectedReagent.unit}`;
    }
    return Object.keys(formErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    try {
      const res = await fetch('/api/requisitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reagentId: form.reagentId,
          userId: user.id,
          userName: user.name,
          quantity: parseInt(form.quantity),
          purpose: form.purpose
        })
      });

      if (!res.ok) throw new Error('提交失败');

      await loadRequisitions();
      form = { reagentId: '', quantity: '', purpose: '' };
      showForm = false;
      submitSuccess = true;
      setTimeout(() => (submitSuccess = false), 3000);
    } catch (e) {
      console.error('Failed to submit requisition:', e);
      alert('提交申请失败，请重试');
    }
  }

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'reagentName', label: '试剂名称', required: true },
    { key: 'quantity', label: '数量', required: false },
    { key: 'purpose', label: '用途', required: false },
    { key: 'userName', label: '申请人', required: true },
    { key: 'status', label: '状态', required: true },
    { key: 'createdAt', label: '申请时间', required: false }
  ];

  let tableData = $derived(requisitions.map((r) => ({
    id: r.id,
    reagentName: r.reagent?.name || '-',
    quantity: `${r.quantity}${r.reagent?.unit || ''}`,
    purpose: r.purpose,
    userName: r.userName,
    status: r.status,
    createdAt: formatDate(r.createdAt)
  })));
</script>

<div class="page-container">
  <div class="animate-fade-in">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="font-display text-2xl font-bold text-gray-900 mb-1">试剂领用申请</h1>
        <p class="text-sm text-gray-500">提交试剂领用申请，系统自动记录安全合规</p>
      </div>
      <button
        on:click={() => showForm = !showForm}
        class="btn-primary"
      >
        <Plus class="w-4 h-4" />
        {showForm ? '取消' : '新建申请'}
      </button>
    </div>

    {#if submitSuccess}
      <div class="mb-6 p-4 bg-success-50 border border-success-200 rounded-lg text-success-700 text-sm animate-slide-up">
        ✓ 申请提交成功！已自动记录到安全合规系统。
      </div>
    {/if}

    {#if showForm}
      <div class="card p-6 mb-8 animate-slide-up">
        <h2 class="font-semibold text-lg text-gray-900 mb-6 flex items-center gap-2">
          <FlaskConical class="w-5 h-5 text-primary-600" />
          新建领用申请
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              选择试剂 <span class="text-danger-500">*</span>
            </label>
            <div class="relative mb-2">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                bind:value={searchQuery}
                type="text"
                placeholder="搜索试剂名称..."
                class="input pl-10"
              />
            </div>
            {#if searchQuery && filteredReagents.length > 0}
              <div class="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                {#each filteredReagents as reagent}
                  <button
                    on:click={() => (form.reagentId = reagent.id)}
                    class="w-full px-3 py-2.5 text-left hover:bg-primary-50 transition-colors flex items-center justify-between"
                    class:bg-primary-50={form.reagentId === reagent.id}
                  >
                    <div>
                      <span class="font-medium text-gray-900">{reagent.name}</span>
                      {#if reagent.casNumber}
                        <span class="text-xs text-gray-500 ml-2">CAS: {reagent.casNumber}</span>
                      {/if}
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 text-xs rounded-full {reagentCategoryMap[reagent.category].color}">
                        {reagentCategoryMap[reagent.category].label}
                      </span>
                      {#if reagent.hazardLevel}
                        <span class="px-2 py-0.5 text-xs rounded-full {hazardLevelMap[reagent.hazardLevel].color}">
                          {hazardLevelMap[reagent.hazardLevel].label}
                        </span>
                      {/if}
                      <span class="text-sm font-mono text-gray-600">库存: {reagent.stock}{reagent.unit}</span>
                    </div>
                  </button>
                {/each}
              </div>
            {/if}
            {#if form.reagentId && !searchQuery}
              <div class="p-3 bg-primary-50 border border-primary-200 rounded-lg flex items-center justify-between">
                <span class="font-medium text-primary-900">
                  {selectedReagent?.name} - 库存: {selectedReagent?.stock}{selectedReagent?.unit}
                </span>
                <button
                  on:click={() => (form.reagentId = '')}
                  class="text-xs text-primary-600 hover:text-primary-800"
                >
                  重新选择
                </button>
              </div>
            {/if}
            {#if formErrors.reagentId}
              <p class="text-xs text-danger-600 mt-1">{formErrors.reagentId}</p>
            {/if}

            {#if selectedReagent?.hazardLevel === 'high' || selectedReagent?.hazardLevel === 'critical'}
              <div class="mt-3 p-3 bg-warning-50 border border-warning-200 rounded-lg flex items-start gap-2">
                <AlertTriangle class="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5" />
                <div class="text-sm text-warning-800">
                  <p class="font-medium">危化品领用提醒</p>
                  <p class="text-warning-700">该试剂属于{hazardLevelMap[selectedReagent.hazardLevel].label}，领用后将自动生成风险提醒，请务必规范操作。</p>
                </div>
              </div>
            {/if}
          </div>

          <FormField
            label="领用数量"
            name="quantity"
            type="number"
            placeholder="请输入数量"
            bind:value={form.quantity}
            error={formErrors.quantity}
            required
            helpText={selectedReagent ? `最大可领: ${selectedReagent.stock}${selectedReagent.unit}` : ''}
          />

          <div class="md:col-span-2">
            <FormField
              label="用途说明"
              name="purpose"
              type="textarea"
              placeholder="请详细说明领用用途..."
              bind:value={form.purpose}
              error={formErrors.purpose}
              required
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
          <button on:click={() => showForm = false} class="btn-secondary">
            取消
          </button>
          <button on:click={handleSubmit} class="btn-primary">
            提交申请
          </button>
        </div>
      </div>
    {/if}

    <div class="mb-4">
      <h2 class="font-semibold text-lg text-gray-900">申请记录</h2>
    </div>

    <DataTable
      data={tableData}
      {columns}
      emptyMessage="暂无申请记录"
      {loading}
    />
  </div>
</div>

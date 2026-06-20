<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { currentUser } from '$stores/user';
  import FormField from '$components/FormField.svelte';
  import DataTable from '$components/DataTable.svelte';
  import { Archive, Plus, FileText, Upload } from 'lucide-svelte';
  import { formatDate } from '$utils/format';
  import { mockExperiments } from '$server/mockData';
  import type { Experiment, Column } from '$types';

  let experiments = $state<Experiment[]>([]);
  let loading = $state(true);
  let showForm = $state(false);
  let submitSuccess = $state(false);

  let form = $state({
    title: '',
    data: ''
  });
  let formErrors = $state<Record<string, string>>({});

  let user = $derived(get(currentUser));

  onMount(async () => {
    try {
      experiments = [...mockExperiments];
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      loading = false;
    }
  });

  function validateForm(): boolean {
    formErrors = {};
    if (!form.title.trim()) formErrors.title = '请输入实验标题';
    if (!form.data.trim()) formErrors.data = '请填写实验数据内容';
    return Object.keys(formErrors).length === 0;
  }

  function handleSubmit() {
    if (!validateForm()) return;

    const newExperiment: Experiment = {
      id: `exp-${Date.now()}`,
      userId: user.id,
      title: form.title,
      data: form.data,
      archivedAt: new Date()
    };

    experiments = [newExperiment, ...experiments];
    form = { title: '', data: '' };
    showForm = false;
    submitSuccess = true;
    setTimeout(() => (submitSuccess = false), 3000);
  }

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'title', label: '实验标题', required: true },
    { key: 'archivedBy', label: '归档人', required: true },
    { key: 'archivedAt', label: '归档时间', required: false }
  ];

  let tableData = $derived(experiments.map((e) => ({
    id: e.id,
    title: e.title,
    archivedBy: user.name,
    archivedAt: formatDate(e.archivedAt)
  })));
</script>

<div class="page-container">
  <div class="animate-fade-in">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="font-display text-2xl font-bold text-gray-900 mb-1">实验数据归档</h1>
        <p class="text-sm text-gray-500">归档实验原始数据，自动关联安全合规记录</p>
      </div>
      <button
        on:click={() => showForm = !showForm}
        class="btn-primary"
      >
        <Plus class="w-4 h-4" />
        {showForm ? '取消' : '归档数据'}
      </button>
    </div>

    {#if submitSuccess}
      <div class="mb-6 p-4 bg-success-50 border border-success-200 rounded-lg text-success-700 text-sm animate-slide-up">
        ✓ 数据归档成功！已自动记录到安全合规系统。
      </div>
    {/if}

    {#if showForm}
      <div class="card p-6 mb-8 animate-slide-up">
        <h2 class="font-semibold text-lg text-gray-900 mb-6 flex items-center gap-2">
          <Archive class="w-5 h-5 text-primary-600" />
          归档实验数据
        </h2>

        <div class="space-y-6">
          <FormField
            label="实验标题"
            name="title"
            placeholder="请输入实验标题，如：催化剂合成实验 #042"
            bind:value={form.title}
            error={formErrors.title}
            required
          />

          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-gray-700">
              上传原始数据文件
            </label>
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors cursor-pointer">
              <Upload class="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p class="text-sm text-gray-600 mb-1">点击或拖拽文件到此处上传</p>
              <p class="text-xs text-gray-400">支持 .xlsx, .csv, .txt, .pdf 等格式</p>
            </div>
          </div>

          <FormField
            label="实验数据内容"
            name="data"
            type="textarea"
            placeholder="请填写实验目的、步骤、结果等详细内容..."
            bind:value={form.data}
            error={formErrors.data}
            required
            helpText="请详细记录实验过程和结果，便于后续追溯和合规审查"
          />
        </div>

        <div class="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
          <button on:click={() => showForm = false} class="btn-secondary">
            取消
          </button>
          <button on:click={handleSubmit} class="btn-primary">
            <FileText class="w-4 h-4" />
            确认归档
          </button>
        </div>
      </div>
    {/if}

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div class="card p-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center">
            <FileText class="w-5 h-5" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 font-mono">{experiments.length}</p>
            <p class="text-sm text-gray-500">已归档实验</p>
          </div>
        </div>
      </div>
      <div class="card p-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-success-100 text-success-600 rounded-lg flex items-center justify-center">
            <Archive class="w-5 h-5" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 font-mono">{experiments.length}</p>
            <p class="text-sm text-gray-500">合规关联</p>
          </div>
        </div>
      </div>
      <div class="card p-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
            <FileText class="w-5 h-5" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 font-mono">{user.name}</p>
            <p class="text-sm text-gray-500">当前归档人</p>
          </div>
        </div>
      </div>
    </div>

    <div class="mb-4">
      <h2 class="font-semibold text-lg text-gray-900">归档记录</h2>
    </div>

    <DataTable
      data={tableData}
      {columns}
      emptyMessage="暂无归档记录"
      {loading}
    />
  </div>
</div>

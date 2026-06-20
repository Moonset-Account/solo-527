<script lang="ts">
  import { onMount } from 'svelte';
  import DataTable from '$components/DataTable.svelte';
  import StatusBadge from '$components/StatusBadge.svelte';
  import StatCard from '$components/StatCard.svelte';
  import { Shield, Download, Filter, FileSpreadsheet, CheckCircle, Clock, AlertCircle } from 'lucide-svelte';
  import { formatDate, complianceTypeMap } from '$utils/format';
  import { mockCompliance, getComplianceStats } from '$server/mockData';
  import type { ComplianceRecord, Column, Status, ComplianceType } from '$types';

  let records = $state<ComplianceRecord[]>([]);
  let loading = $state(true);
  let exporting = $state(false);
  let exportSuccess = $state(false);

  let filterStatus = $state<Status | 'all'>('all');
  let filterType = $state<ComplianceType | 'all'>('all');

  let stats = $state(getComplianceStats());

  let filteredRecords = $derived(records.filter((r) => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterType !== 'all' && r.type !== filterType) return false;
    return true;
  }));

  onMount(async () => {
    try {
      records = [...mockCompliance];
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      loading = false;
    }
  });

  async function handleExport() {
    exporting = true;
    try {
      const headers = ['ID', '类型', '关联ID', '状态', '操作人', '操作人ID', '详情', '创建时间', '处理时间'];
      const typeMap: Record<ComplianceType, string> = {
        requisition: '领用申请',
        experiment: '实验数据',
        todo: '待办事项',
        risk: '风险处理'
      };
      const statusMap: Record<Status, string> = {
        pending: '待处理',
        approved: '已批准',
        rejected: '已拒绝',
        completed: '已完成',
        processing: '处理中',
        resolved: '已解决',
        failed: '已失败'
      };

      const rows = filteredRecords.map((r) => [
        r.id,
        typeMap[r.type] || r.type,
        r.referenceId,
        statusMap[r.status] || r.status,
        r.operator,
        r.operatorId,
        `"${r.details.replace(/"/g, '""')}"`,
        formatDate(r.createdAt),
        r.processedAt ? formatDate(r.processedAt) : ''
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `安全合规记录_${formatDate(new Date()).replace(/[/:]/g, '-')}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      exportSuccess = true;
      setTimeout(() => (exportSuccess = false), 3000);
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      exporting = false;
    }
  }

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'type', label: '类型', required: false },
    { key: 'details', label: '详情', required: false },
    { key: 'operator', label: '操作人', required: true },
    { key: 'status', label: '状态', required: true },
    { key: 'createdAt', label: '创建时间', required: false }
  ];

  let tableData = $derived(filteredRecords.map((r) => ({
    id: r.id,
    type: `<span class="${complianceTypeMap[r.type].color} font-medium text-sm">${complianceTypeMap[r.type].label}</span>`,
    details: r.details.length > 50 ? r.details.slice(0, 50) + '...' : r.details,
    operator: r.operator,
    status: r.status,
    createdAt: formatDate(r.createdAt)
  })));

  const statusOptions: { value: Status | 'all'; label: string }[] = [
    { value: 'all', label: '全部状态' },
    { value: 'pending', label: '待处理' },
    { value: 'processing', label: '处理中' },
    { value: 'completed', label: '已完成' },
    { value: 'resolved', label: '已解决' }
  ];

  const typeOptions: { value: ComplianceType | 'all'; label: string }[] = [
    { value: 'all', label: '全部类型' },
    { value: 'requisition', label: '领用申请' },
    { value: 'experiment', label: '实验数据' },
    { value: 'todo', label: '待办事项' },
    { value: 'risk', label: '风险处理' }
  ];
</script>

<div class="page-container">
  <div class="animate-fade-in">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="font-display text-2xl font-bold text-gray-900 mb-1">安全合规</h1>
        <p class="text-sm text-gray-500">查看所有安全合规记录，支持筛选和导出</p>
      </div>
      <div class="flex items-center gap-2">
        {#if exportSuccess}
          <span class="text-sm text-success-600 flex items-center gap-1">
            <CheckCircle class="w-4 h-4" />
            导出成功
          </span>
        {/if}
        <button
          on:click={handleExport}
          disabled={exporting || filteredRecords.length === 0}
          class="btn-success"
        >
          <Download class="w-4 h-4" />
          {exporting ? '导出中...' : '导出CSV'}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        title="合规记录总数"
        value={stats.total}
        icon={Shield}
        color="blue"
      />
      <StatCard
        title="待处理"
        value={stats.pending}
        icon={Clock}
        color="orange"
      />
      <StatCard
        title="已完成"
        value={stats.completed}
        icon={CheckCircle}
        color="green"
      />
      <StatCard
        title="风险处理"
        value={stats.byType.risk}
        icon={AlertCircle}
        color="red"
      />
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {#each Object.entries(stats.byType) as [type, count]}
        <div class="bg-white border border-gray-200 rounded-lg p-3">
          <p class="text-xs text-gray-500 mb-1">{complianceTypeMap[type as ComplianceType].label}</p>
          <p class="text-xl font-bold text-gray-900 font-mono">{count}</p>
        </div>
      {/each}
    </div>

    <div class="card p-4 mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center gap-4">
        <div class="flex items-center gap-2">
          <Filter class="w-4 h-4 text-gray-500" />
          <span class="text-sm font-medium text-gray-700">筛选</span>
        </div>
        <div class="flex flex-wrap gap-3">
          <select
            bind:value={filterStatus}
            class="input text-sm py-1.5"
          >
            {#each statusOptions as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
          <select
            bind:value={filterType}
            class="input text-sm py-1.5"
          >
            {#each typeOptions as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
        </div>
        <div class="flex-1 text-right text-sm text-gray-500">
          共 {filteredRecords.length} 条记录
        </div>
      </div>
    </div>

    <DataTable
      data={tableData}
      {columns}
      emptyMessage="暂无合规记录"
      {loading}
    />
  </div>
</div>

<script lang="ts">
  import { 
    BookOpen, 
    AlertTriangle, 
    Download, 
    FileText,
    Search,
    Filter,
    Clock,
    User,
    Server,
    AlertCircle
  } from 'lucide-svelte';
  import Pagination from '$components/Pagination.svelte';
  import { getOperationLogs, getErrorLogs, getExportTasks } from '$server/services/logs';
  import type { OperationLog, ErrorLog, ExportTask } from '$types';
  import { formatDate, statusLabel, channelLabel } from '$utils';

  export let data: {
    operationLogs: { data: OperationLog[]; total: number; page: number; pageSize: number; totalPages: number };
    errorLogs: { data: ErrorLog[]; total: number; page: number; pageSize: number; totalPages: number };
    exportTasks: { data: ExportTask[]; total: number; page: number; pageSize: number; totalPages: number };
  };

  let activeTab = 'operation';

  const tabs = [
    { key: 'operation', label: '操作日志', icon: BookOpen },
    { key: 'export', label: '导出任务', icon: Download },
    { key: 'error', label: '错误日志', icon: AlertTriangle }
  ];

  $: {
  }

  function getSeverityClass(severity: string) {
    switch (severity) {
      case 'critical': return 'bg-danger-100 text-danger-700';
      case 'error': return 'bg-orange-100 text-orange-700';
      case 'warning': return 'bg-warning-100 text-warning-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  }

  function getStatusClass(status: string) {
    switch (status) {
      case 'completed': return 'bg-accent-100 text-accent-700';
      case 'processing': return 'bg-primary-100 text-primary-700';
      case 'failed': return 'bg-danger-100 text-danger-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  }

  function getTypeLabel(type: string) {
    const map: Record<string, string> = {
      api: '接口错误',
      system: '系统错误',
      push: '推送错误'
    };
    return map[type] || type;
  }
</script>

<svelte:head>
  <title>日志中心 - 后台管理</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">日志中心</h1>
      <p class="mt-1 text-sm text-slate-500">操作记录、导出任务和错误日志查询</p>
    </div>
  </div>

  <div class="card">
    <div class="flex border-b border-slate-200">
      {#each tabs as tab}
        <button 
          class="flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 -mb-px transition-colors"
          class:border-primary-500={activeTab === tab.key}
          class:text-primary-600={activeTab === tab.key}
          class:border-transparent={activeTab !== tab.key}
          class:text-slate-500={activeTab !== tab.key}
          class:hover:text-slate-700={activeTab !== tab.key}
          on:click={() => activeTab = tab.key}
        >
          <svelte:component this={tab.icon} class="w-4 h-4" />
          {tab.label}
        </button>
      {/each}
    </div>

    <div class="p-4 border-b border-slate-200">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex-1 min-w-64">
          <div class="relative">
            <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="搜索..." class="input pl-10" />
          </div>
        </div>
        <input type="date" class="input w-40" />
        <span class="text-slate-400">至</span>
        <input type="date" class="input w-40" />
        {#if activeTab === 'error'}
          <select class="select w-32">
            <option>全部级别</option>
            <option>严重</option>
            <option>错误</option>
            <option>警告</option>
          </select>
        {/if}
        <button class="btn-secondary">
          <Filter class="w-4 h-4 mr-1.5" />
          筛选
        </button>
      </div>
    </div>

    <div class="overflow-x-auto">
      {#if activeTab === 'operation'}
        <table class="w-full">
          <thead class="bg-slate-50">
            <tr>
              <th class="table-header text-left py-3 px-4">时间</th>
              <th class="table-header text-left py-3 px-4">操作</th>
              <th class="table-header text-left py-3 px-4">资源类型</th>
              <th class="table-header text-left py-3 px-4">操作人</th>
              <th class="table-header text-left py-3 px-4">IP地址</th>
            </tr>
          </thead>
          <tbody>
            {#each data.operationLogs.data as log}
              <tr class="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                <td class="table-cell text-slate-500 text-sm">{formatDate(log.createdAt, 'yyyy-MM-dd HH:mm:ss')}</td>
                <td class="table-cell">
                  <span class="badge badge-info">{log.action}</span>
                </td>
                <td class="table-cell">{log.resourceType}</td>
                <td class="table-cell flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                    <User class="w-3 h-3 text-slate-500" />
                  </div>
                  {log.operator}
                </td>
                <td class="table-cell text-slate-500 text-sm font-mono">{log.ip || '-'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else if activeTab === 'export'}
        <table class="w-full">
          <thead class="bg-slate-50">
            <tr>
              <th class="table-header text-left py-3 px-4">任务ID</th>
              <th class="table-header text-left py-3 px-4">类型</th>
              <th class="table-header text-left py-3 px-4">格式</th>
              <th class="table-header text-left py-3 px-4">状态</th>
              <th class="table-header text-left py-3 px-4">创建人</th>
              <th class="table-header text-left py-3 px-4">创建时间</th>
              <th class="table-header text-center py-3 px-4">操作</th>
            </tr>
          </thead>
          <tbody>
            {#each data.exportTasks.data as task}
              <tr class="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                <td class="table-cell font-mono text-sm">{task.id.slice(0, 8)}...</td>
                <td class="table-cell">
                  {task.type === 'metrics' ? '指标数据' : task.type === 'anomalies' ? '异常记录' : '日报摘要'}
                </td>
                <td class="table-cell uppercase">{task.format}</td>
                <td class="table-cell">
                  <span class={`badge ${getStatusClass(task.status)}`}>{statusLabel(task.status)}</span>
                </td>
                <td class="table-cell">{task.createdBy}</td>
                <td class="table-cell text-slate-500 text-sm">{formatDate(task.createdAt, 'yyyy-MM-dd HH:mm')}</td>
                <td class="table-cell text-center">
                  {#if task.status === 'completed'}
                    <button class="text-primary-600 hover:text-primary-700 text-sm">下载</button>
                  {:else if task.status === 'failed'}
                    <button class="text-warning-600 hover:text-warning-700 text-sm">重试</button>
                  {:else}
                    <span class="text-slate-400 text-sm">-</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else if activeTab === 'error'}
        <table class="w-full">
          <thead class="bg-slate-50">
            <tr>
              <th class="table-header text-left py-3 px-4">时间</th>
              <th class="table-header text-left py-3 px-4">类型</th>
              <th class="table-header text-left py-3 px-4">错误信息</th>
              <th class="table-header text-left py-3 px-4">级别</th>
              <th class="table-header text-left py-3 px-4">接口</th>
              <th class="table-header text-left py-3 px-4">告警</th>
            </tr>
          </thead>
          <tbody>
            {#each data.errorLogs.data as log}
              <tr class="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                <td class="table-cell text-slate-500 text-sm">{formatDate(log.createdAt, 'yyyy-MM-dd HH:mm:ss')}</td>
                <td class="table-cell">
                  <span class="badge badge-slate">{getTypeLabel(log.type)}</span>
                </td>
                <td class="table-cell max-w-xs">
                  <p class="truncate text-sm">{log.errorMessage}</p>
                </td>
                <td class="table-cell">
                  <span class={`badge ${getSeverityClass(log.severity)}`}>
                    {log.severity === 'critical' ? '严重' : log.severity === 'error' ? '错误' : '警告'}
                  </span>
                </td>
                <td class="table-cell">
                  {#if log.endpoint}
                    <code class="text-xs bg-slate-100 px-2 py-1 rounded">{log.method} {log.endpoint}</code>
                  {:else}
                    <span class="text-slate-400">-</span>
                  {/if}
                </td>
                <td class="table-cell">
                  {#if log.alertSent}
                    <span class="text-accent-600 text-xs flex items-center gap-1">
                      <AlertCircle class="w-3 h-3" />
                      已告警
                    </span>
                  {:else}
                    <span class="text-slate-400 text-xs">未告警</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>

    <div class="p-4 border-t border-slate-200">
      <Pagination 
        page={1} 
        totalPages={10} 
        total={100}
        pageSize={20}
      />
    </div>
  </div>
</div>

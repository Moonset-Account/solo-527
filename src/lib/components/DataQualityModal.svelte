<script lang="ts">
  import { sensorReadings, sensors } from '$lib/stores/appStore';
  import { validateSensorData } from '$lib/data/validation';
  import { AlertTriangle, CheckCircle, Info, X } from 'lucide-svelte';
  import { derived } from 'svelte/store';
  import type { ValidationIssue } from '$lib/data/validation';

  export let isOpen: boolean;
  export let onClose: () => void;

  const validation = derived(
    [sensorReadings, sensors],
    ([$readings, $sensors]) => {
      return validateSensorData($readings, $sensors);
    }
  );

  function getIcon(severity: string) {
    switch (severity) {
      case 'critical':
      case 'high':
        return AlertTriangle;
      case 'medium':
        return AlertTriangle;
      default:
        return Info;
    }
  }

  function getSeverityColor(severity: string) {
    switch (severity) {
      case 'critical':
        return 'text-gh-danger bg-gh-danger/20';
      case 'high':
        return 'text-gh-danger bg-gh-danger/10';
      case 'medium':
        return 'text-gh-warning bg-gh-warning/10';
      default:
        return 'text-gh-info bg-gh-info/10';
    }
  }

  function getTypeLabel(type: string) {
    const labels: Record<string, string> = {
      range: '范围异常',
      threshold: '阈值超限',
      calibration: '校准提醒',
      consistency: '一致性问题',
      gap: '数据中断'
    };
    return labels[type] || type;
  }

  $: issuesBySeverity = {
    critical: $validation.issues.filter((i) => i.severity === 'critical'),
    high: $validation.issues.filter((i) => i.severity === 'high'),
    medium: $validation.issues.filter((i) => i.severity === 'medium'),
    low: $validation.issues.filter((i) => i.severity === 'low')
  };
</script>

{#if isOpen}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-gh-panel border border-gh-border rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
      <div class="flex items-center justify-between p-4 border-b border-gh-border">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-gh-warning/20 rounded-lg">
            <AlertTriangle size={20} class="text-gh-warning" />
          </div>
          <div>
            <h3 class="font-semibold">数据质量校验报告</h3>
            <p class="text-xs text-gh-muted">
              {$validation.valid
                ? '所有数据通过校验'
                : `发现 ${$validation.issues.length} 个问题`}
            </p>
          </div>
        </div>
        <button class="p-1 hover:bg-gh-border rounded" onclick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div class="p-4 border-b border-gh-border/50">
        <div class="grid grid-cols-4 gap-4">
          <div class="p-3 bg-gh-bg/50 rounded border border-gh-border text-center">
            <div class="text-2xl font-bold text-gh-text">{issuesBySeverity.critical.length}</div>
            <div class="text-xs text-gh-danger">严重</div>
          </div>
          <div class="p-3 bg-gh-bg/50 rounded border border-gh-border text-center">
            <div class="text-2xl font-bold text-gh-danger">{issuesBySeverity.high.length}</div>
            <div class="text-xs text-gh-muted">高优先级</div>
          </div>
          <div class="p-3 bg-gh-bg/50 rounded border border-gh-border text-center">
            <div class="text-2xl font-bold text-gh-warning">{issuesBySeverity.medium.length}</div>
            <div class="text-xs text-gh-muted">中优先级</div>
          </div>
          <div class="p-3 bg-gh-bg/50 rounded border border-gh-border text-center">
            <div class="text-2xl font-bold text-gh-info">{issuesBySeverity.low.length}</div>
            <div class="text-xs text-gh-muted">低优先级</div>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-auto p-4">
        {#if $validation.issues.length > 0}
          <div class="space-y-2">
            {#each $validation.issues.slice(0, 50) as issue (issue.message + issue.timestamp)}
              <div class="p-3 bg-gh-bg/50 rounded border border-gh-border hover:border-gh-border/80 transition-colors">
                <div class="flex items-start gap-3">
                  <div class={`p-1.5 rounded mt-0.5 ${getSeverityColor(issue.severity)}`}>
                    <svelte:component this={getIcon(issue.severity)} size={14} />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium">{issue.message}</div>
                    <div class="flex items-center gap-2 mt-1 text-xs text-gh-muted">
                      <span class="badge badge-muted">{getTypeLabel(issue.type)}</span>
                      {#if issue.sensorId}
                        <span>传感器: {$sensors.find((s) => s.id === issue.sensorId)?.name || issue.sensorId}</span>
                      {/if}
                      {#if issue.timestamp}
                        <span>时间: {new Date(issue.timestamp).toLocaleString()}</span>
                      {/if}
                    </div>
                    {#if issue.value !== undefined && issue.expected}
                      <div class="text-xs text-gh-muted mt-1">
                        当前值: <span class="text-gh-warning">{issue.value.toFixed?.(2) || issue.value}</span>
                        , 期望范围: [{issue.expected.min}, {issue.expected.max}]
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}

            {#if $validation.issues.length > 50}
              <div class="text-center text-xs text-gh-muted py-2">
                显示前 50 个问题，共 {$validation.issues.length} 个
              </div>
            {/if}
          </div>
        {:else}
          <div class="h-full flex items-center justify-center">
            <div class="text-center">
              <CheckCircle size={48} class="mx-auto mb-2 text-gh-success" />
              <p class="text-sm text-gh-muted">数据质量良好，未发现问题</p>
            </div>
          </div>
        {/if}
      </div>

      <div class="p-4 border-t border-gh-border flex justify-end gap-2">
        <button class="btn btn-secondary" onclick={onClose}>关闭</button>
        <button class="btn btn-primary">导出报告</button>
      </div>
    </div>
  </div>
{/if}

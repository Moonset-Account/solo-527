<script lang="ts">
  import type { SalesLoad, ScheduleConflict } from '$lib/types';

  interface Props {
    data: SalesLoad[];
  }

  let { data }: Props = $props();

  function getLoadColor(level: string): string {
    switch (level) {
      case 'low': return '#10b981';
      case 'normal': return '#3b82f6';
      case 'high': return '#f59e0b';
      case 'overloaded': return '#ef4444';
      default: return '#6b7280';
    }
  }

  function getLoadLabel(level: string): string {
    switch (level) {
      case 'low': return '低负载';
      case 'normal': return '正常';
      case 'high': return '高负载';
      case 'overloaded': return '超负荷';
      default: return level;
    }
  }

  let allConflicts: ScheduleConflict[] = $derived(
    data.flatMap(s => s.schedule_conflicts)
  );
</script>

<div class="panel">
  <div class="panel-header">
    <h3>销售负载 & 排班</h3>
    {#if allConflicts.length > 0}
      <div class="conflict-badge">
        <span class="icon">⚠</span> {allConflicts.length} 个排班冲突
      </div>
    {/if}
  </div>

  {#if allConflicts.length > 0}
    <div class="conflict-alert">
      <div class="alert-title">排班冲突提示</div>
      {#each allConflicts as conflict}
        <div class="conflict-item">
          <span class="conflict-type" class:overlap={conflict.conflict_type === 'overlap'} class:backtoback={conflict.conflict_type === 'back_to_back'}>
            {conflict.conflict_type === 'overlap' ? '时间重叠' : '背靠背'}
          </span>
          <span class="conflict-info">
            {conflict.sales_name}: {new Date(conflict.time_1).toLocaleString('zh-CN')} 与 {new Date(conflict.time_2).toLocaleString('zh-CN')}
          </span>
        </div>
      {/each}
    </div>
  {/if}

  <div class="sales-grid">
    {#each data as sales}
      <div class="sales-card">
        <div class="sales-header">
          <span class="sales-name">{sales.sales_name}</span>
          <span class="load-badge" style="background: {getLoadColor(sales.load_level)}20; color: {getLoadColor(sales.load_level)}">
            {getLoadLabel(sales.load_level)}
          </span>
        </div>
        <div class="store-name">{sales.store_name}</div>
        <div class="load-bar">
          <div class="load-fill" style="width: {Math.min(sales.appointment_count / 12 * 100, 100)}%; background: {getLoadColor(sales.load_level)}"></div>
        </div>
        <div class="stats-row">
          <div class="stat">
            <span class="stat-value">{sales.appointment_count}</span>
            <span class="stat-label">预约</span>
          </div>
          <div class="stat">
            <span class="stat-value" style="color: #10b981">{sales.completed_count}</span>
            <span class="stat-label">完成</span>
          </div>
          <div class="stat">
            <span class="stat-value" style="color: #ef4444">{sales.cancelled_count}</span>
            <span class="stat-label">取消</span>
          </div>
          <div class="stat">
            <span class="stat-value" style="color: #f59e0b">{sales.no_show_count}</span>
            <span class="stat-label">爽约</span>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .panel {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    padding: 20px;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .panel-header h3 {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .conflict-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    background: #fef2f2;
    color: #ef4444;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
  }

  .icon {
    font-size: 14px;
  }

  .conflict-alert {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 16px;
  }

  .alert-title {
    font-size: 13px;
    font-weight: 600;
    color: #92400e;
    margin-bottom: 8px;
  }

  .conflict-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    font-size: 12px;
    color: #78350f;
  }

  .conflict-type {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
  }

  .conflict-type.overlap {
    background: #fef2f2;
    color: #ef4444;
  }

  .conflict-type.backtoback {
    background: #fffbeb;
    color: #f59e0b;
  }

  .sales-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
  }

  .sales-card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 14px;
    transition: box-shadow 0.2s;
  }

  .sales-card:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .sales-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .sales-name {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
  }

  .load-badge {
    padding: 2px 10px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 500;
  }

  .store-name {
    font-size: 12px;
    color: #9ca3af;
    margin-bottom: 10px;
  }

  .load-bar {
    height: 4px;
    background: #f3f4f6;
    border-radius: 2px;
    margin-bottom: 12px;
    overflow: hidden;
  }

  .load-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s;
  }

  .stats-row {
    display: flex;
    justify-content: space-between;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .stat-value {
    font-size: 16px;
    font-weight: 600;
    color: #374151;
  }

  .stat-label {
    font-size: 10px;
    color: #9ca3af;
  }
</style>

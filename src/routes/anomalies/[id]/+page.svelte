<script lang="ts">
  import { 
    AlertTriangle, 
    ArrowLeft, 
    Clock, 
    User, 
    FileText,
    MessageSquare,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    XCircle,
    Database,
    Send
  } from 'lucide-svelte';
  import { formatDate, formatNumber, formatPercent, severityLabel, statusLabel } from '$utils';
  import type { AnomalyRecord, AnomalyNote, MetricDefinition } from '$types';

  export let data: {
    anomaly: AnomalyRecord;
    notes: AnomalyNote[];
    metricDefinition?: MetricDefinition;
    relatedAnomalies: AnomalyRecord[];
  };

  let showMetricDefinition = true;
  let newNote = '';
  let submitting = false;

  $: anomaly = data.anomaly;
  $: notes = data.notes;
  $: metricDefinition = data.metricDefinition;

  $: severityColor = {
    low: 'text-slate-600 bg-slate-100',
    medium: 'text-warning-700 bg-warning-100',
    high: 'text-orange-700 bg-orange-100',
    critical: 'text-danger-700 bg-danger-100'
  }[anomaly.severity] || 'text-slate-600 bg-slate-100';

  $: statusColor = {
    open: 'text-danger-700 bg-danger-100',
    investigating: 'text-warning-700 bg-warning-100',
    resolved: 'text-accent-700 bg-accent-100',
    ignored: 'text-slate-600 bg-slate-100'
  }[anomaly.status] || 'text-slate-600 bg-slate-100';

  $: isNegative = anomaly.deviation < 0;

  async function addNote() {
    if (!newNote.trim() || submitting) return;
    
    submitting = true;
    
    try {
      const res = await fetch(`/api/anomalies/${anomaly.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newNote,
          author: '运营负责人'
        })
      });
      
      if (res.ok) {
        newNote = '';
        const note = await res.json();
        data.notes.push(note);
      }
    } catch (e) {
      console.error('Failed to add note:', e);
    } finally {
      submitting = false;
    }
  }

  async function updateStatus(status: AnomalyRecord['status']) {
    try {
      const res = await fetch(`/api/anomalies/${anomaly.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          resolvedBy: '运营负责人'
        })
      });
      
      if (res.ok) {
        data.anomaly = await res.json();
      }
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  }
</script>

<svelte:head>
  <title>异常详情 - {anomaly.metricName}</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-6">
  <div class="flex items-center gap-4">
    <a href="/" class="p-2 hover:bg-white rounded-lg transition-colors">
      <ArrowLeft class="w-5 h-5 text-slate-600" />
    </a>
    <div>
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-bold text-slate-900">{anomaly.metricName} 异常</h1>
        <span class={`badge ${severityColor}`}>{severityLabel(anomaly.severity)}</span>
        <span class={`badge ${statusColor}`}>{statusLabel(anomaly.status)}</span>
      </div>
      <p class="mt-1 text-sm text-slate-500">
        <span class="flex items-center gap-1.5 inline-flex">
          <Clock class="w-4 h-4" />
          检测时间：{formatDate(anomaly.date)}
        </span>
      </p>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="card p-5">
      <p class="text-sm text-slate-500 mb-1">实际值</p>
      <p class="text-3xl font-bold font-mono text-slate-900">
        {anomaly.value >= 1000 
          ? formatNumber(anomaly.value, 0)
          : formatPercent(anomaly.value, 2)
        }
      </p>
      <p class="mt-1 text-xs text-slate-400">当日检测值</p>
    </div>

    <div class="card p-5">
      <p class="text-sm text-slate-500 mb-1">预期值</p>
      <p class="text-3xl font-bold font-mono text-slate-500">
        {anomaly.expectedValue >= 1000 
          ? formatNumber(anomaly.expectedValue, 0)
          : formatPercent(anomaly.expectedValue, 2)
        }
      </p>
      <p class="mt-1 text-xs text-slate-400">基于历史趋势预测</p>
    </div>

    <div class="card p-5 border-l-4" class:border-l-danger-500={isNegative} class:border-l-accent-500={!isNegative}>
      <p class="text-sm text-slate-500 mb-1">波动幅度</p>
      <p class={`text-3xl font-bold font-mono ${isNegative ? 'text-danger-600' : 'text-accent-600'}`}>
        {isNegative ? '-' : '+'}{formatPercent(Math.abs(anomaly.deviationPercent), 2)}
      </p>
      <p class="mt-1 text-xs text-slate-400">
        绝对偏差 {isNegative ? '-' : '+'}{formatNumber(Math.abs(anomaly.deviation), 0)}
      </p>
    </div>
  </div>

  <div class="card p-5">
    <h3 class="font-semibold text-slate-900 mb-4 flex items-center gap-2">
      <AlertTriangle class="w-5 h-5 text-warning-500" />
      异常描述
    </h3>
    <p class="text-slate-700 leading-relaxed">{anomaly.description}</p>
    
    <div class="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4 text-sm">
      <span class="text-slate-500">
        指标维度：<span class="text-slate-700 font-medium">{anomaly.channel || '全部渠道'}</span>
      </span>
      <span class="text-slate-500">
        检测时间：<span class="text-slate-700 font-medium">{formatDate(anomaly.detectedAt, 'yyyy-MM-dd HH:mm')}</span>
      </span>
      {#if anomaly.resolvedAt}
        <span class="text-slate-500">
          解决时间：<span class="text-slate-700 font-medium">{formatDate(anomaly.resolvedAt, 'yyyy-MM-dd HH:mm')}</span>
        </span>
        <span class="text-slate-500">
          处理人：<span class="text-slate-700 font-medium">{anomaly.resolvedBy}</span>
        </span>
      {/if}
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 space-y-6">
      <div class="card p-5">
        <div 
          class="flex items-center justify-between cursor-pointer"
          on:click={() => showMetricDefinition = !showMetricDefinition}
        >
          <h3 class="font-semibold text-slate-900 flex items-center gap-2">
            <Database class="w-5 h-5 text-primary-500" />
            指标口径溯源
          </h3>
          {#if showMetricDefinition}
            <ChevronUp class="w-5 h-5 text-slate-400" />
          {:else}
            <ChevronDown class="w-5 h-5 text-slate-400" />
          {/if}
        </div>

        {#if showMetricDefinition && metricDefinition}
          <div class="mt-4 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-slate-500 mb-1">指标名称</p>
                <p class="text-sm font-medium text-slate-900">{metricDefinition.name}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 mb-1">所属分类</p>
                <p class="text-sm font-medium text-slate-900">{metricDefinition.category}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 mb-1">数据来源</p>
                <p class="text-sm font-medium text-slate-900">{metricDefinition.dataSource || '-'}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 mb-1">更新频率</p>
                <p class="text-sm font-medium text-slate-900">{metricDefinition.updateFrequency}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 mb-1">负责人</p>
                <p class="text-sm font-medium text-slate-900">{metricDefinition.owner || '-'}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 mb-1">创建时间</p>
                <p class="text-sm font-medium text-slate-900">{formatDate(metricDefinition.createdAt)}</p>
              </div>
            </div>
            
            <div>
              <p class="text-xs text-slate-500 mb-1">计算公式</p>
              <div class="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 font-mono">
                {metricDefinition.formula || '-'}
              </div>
            </div>
            
            <div>
              <p class="text-xs text-slate-500 mb-1">指标描述</p>
              <p class="text-sm text-slate-700">{metricDefinition.description || '-'}</p>
            </div>
          </div>
        {/if}
      </div>

      <div class="card p-5">
        <h3 class="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <MessageSquare class="w-5 h-5 text-primary-500" />
          处理记录与备注
          <span class="badge badge-info ml-2">{notes.length} 条</span>
        </h3>

        {#if notes.length > 0}
          <div class="relative pl-6 space-y-6">
            <div class="absolute left-2.5 top-1.5 bottom-1.5 w-0.5 bg-slate-200"></div>
            
            {#each notes as note}
              <div class="relative">
                <div class="absolute -left-[22px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-primary-500 z-10"></div>
                
                <div class="bg-slate-50 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <div class="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
                        <User class="w-3.5 h-3.5 text-primary-600" />
                      </div>
                      <span class="text-sm font-medium text-slate-900">{note.author}</span>
                    </div>
                    <span class="text-xs text-slate-400">{formatDate(note.createdAt, 'yyyy-MM-dd HH:mm')}</span>
                  </div>
                  <p class="text-sm text-slate-700 leading-relaxed">{note.content}</p>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-center py-8">
            <MessageSquare class="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p class="text-sm text-slate-500">暂无处理记录</p>
          </div>
        {/if}

        {#if anomaly.status !== 'resolved' && anomaly.status !== 'ignored'}
          <div class="mt-4 pt-4 border-t border-slate-100">
            <div class="flex gap-3">
              <textarea 
                bind:value={newNote}
                class="input flex-1 min-h-[80px] resize-none"
                placeholder="添加处理备注，记录原因分析和处理过程..."
              ></textarea>
            </div>
            <div class="flex justify-end mt-3 gap-2">
              <button 
                class="btn-secondary"
                on:click={() => updateStatus('ignored')}
              >
                <XCircle class="w-4 h-4 mr-1.5" />
                标记忽略
              </button>
              <button 
                class="btn-success"
                on:click={() => updateStatus('resolved')}
              >
                <CheckCircle class="w-4 h-4 mr-1.5" />
                标记解决
              </button>
              <button 
                class="btn-primary"
                disabled={!newNote.trim() || submitting}
                on:click={addNote}
              >
                <Send class="w-4 h-4 mr-1.5" />
                {submitting ? '发送中...' : '添加备注'}
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <div class="space-y-6">
      <div class="card p-5">
        <h3 class="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <FileText class="w-5 h-5 text-warning-500" />
          相关异常
        </h3>
        
        <div class="space-y-3">
          {#each data.relatedAnomalies as related}
            <a 
              href="/anomalies/{related.id}"
              class="block p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-slate-900">{related.metricName}</span>
                <span 
                  class="text-xs font-medium"
                  class:text-danger-600={related.deviationPercent < 0}
                  class:text-accent-600={related.deviationPercent > 0}
                >
                  {related.deviationPercent > 0 ? '+' : ''}{(related.deviationPercent * 100).toFixed(1)}%
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1">{formatDate(related.date)}</p>
            </a>
          {/each}
        </div>
      </div>

      <div class="card p-5 bg-gradient-to-br from-primary-50 to-white">
        <h3 class="font-semibold text-slate-900 mb-3">快捷操作</h3>
        <div class="space-y-2">
          <button class="w-full btn-secondary justify-start">
            <FileText class="w-4 h-4 mr-2" />
            导出异常报告
          </button>
          <button class="w-full btn-secondary justify-start">
            <Send class="w-4 h-4 mr-2" />
            通知相关人员
          </button>
          <button class="w-full btn-secondary justify-start">
            <Database class="w-4 h-4 mr-2" />
            查看原始数据
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

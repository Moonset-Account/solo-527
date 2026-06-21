<script lang="ts">
  import { AlertTriangle, ChevronRight, Clock, User } from 'lucide-svelte';
  import { formatDate, formatPercent, severityLabel, statusLabel, formatNumber } from '$utils';
  import type { AnomalyRecord } from '$types';

  export let anomaly: AnomalyRecord;
  export let showDetails: boolean = true;

  $: severityClass = {
    low: 'bg-slate-100 text-slate-700',
    medium: 'bg-warning-100 text-warning-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-danger-100 text-danger-700'
  }[anomaly.severity] || 'bg-slate-100 text-slate-700';

  $: statusClass = {
    open: 'bg-danger-100 text-danger-700',
    investigating: 'bg-warning-100 text-warning-700',
    resolved: 'bg-accent-100 text-accent-700',
    ignored: 'bg-slate-100 text-slate-700'
  }[anomaly.status] || 'bg-slate-100 text-slate-700';

  $: isNegative = anomaly.deviation < 0;
</script>

<a 
  href="/anomalies/{anomaly.id}"
  class="card card-hover p-4 block group"
>
  <div class="flex items-start justify-between gap-4">
    <div class="flex items-start gap-3 flex-1 min-w-0">
      <div class={`p-2 rounded-lg flex-shrink-0 ${severityClass}`}>
        <AlertTriangle class="w-5 h-5" />
      </div>
      
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <h4 class="font-medium text-slate-900 truncate">{anomaly.metricName}</h4>
          <span class={`badge ${severityClass}`}>{severityLabel(anomaly.severity)}</span>
        </div>
        
        {#if showDetails}
          <p class="text-sm text-slate-500 line-clamp-2 mb-2">{anomaly.description}</p>
          
          <div class="flex items-center gap-4 text-xs text-slate-500">
            <span class="flex items-center gap-1">
              <Clock class="w-3.5 h-3.5" />
              {formatDate(anomaly.date)}
            </span>
            <span>
              波动：<span class={isNegative ? 'text-danger-600' : 'text-accent-600'}>
                {formatPercent(anomaly.deviationPercent, 1)}
              </span>
            </span>
          </div>
        {/if}
      </div>
    </div>

    <div class="flex items-center gap-2 flex-shrink-0">
      <span class={`badge ${statusClass}`}>{statusLabel(anomaly.status)}</span>
      <ChevronRight class="w-4 h-4 text-slate-400 group-hover:text-primary-500 transition-colors" />
    </div>
  </div>
</a>

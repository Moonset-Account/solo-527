<script lang="ts">
  import { AlertTriangle, User, Clock, CheckCircle, PlayCircle } from 'lucide-svelte';
  import StatusBadge from './StatusBadge.svelte';
  import type { RiskAlert } from '$types';
  import { hazardLevelMap, formatDateShort } from '$utils/format';

  const {
    risk,
    onResolve,
    onProcess
  } = $props<{
    risk: RiskAlert;
    onResolve?: ((id: string, resolution: string) => void);
    onProcess?: ((id: string) => void);
  }>();

  let showResolution = $state(false);
  let resolutionText = $state('');

  let levelConfig = $derived(hazardLevelMap[risk.riskLevel as keyof typeof hazardLevelMap]);
  let isResolved = $derived(risk.status === 'resolved');
  let isProcessing = $derived(risk.status === 'processing');
  let isCritical = $derived(risk.riskLevel === 'critical');
  let isHigh = $derived(risk.riskLevel === 'high' || risk.riskLevel === 'critical');

  function handleResolve() {
    if (resolutionText.trim()) {
      onResolve?.(risk.id, resolutionText);
      showResolution = false;
      resolutionText = '';
    }
  }
</script>

<div
  class="relative overflow-hidden rounded-xl border transition-all duration-300 animate-fade-in {(!isResolved && isHigh) ? 'border-warning-300 bg-warning-50/50' : 'border-gray-200 bg-white'}"
>
  {#if isCritical && !isResolved}
    <div class="absolute inset-0 bg-gradient-to-r from-warning-500/10 via-transparent to-warning-500/10 animate-pulse-slow pointer-events-none"></div>
  {/if}

  <div class="relative p-5">
    <div class="flex items-start gap-4">
      <div
        class="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center {!isResolved ? 'bg-warning-100 text-warning-600' : 'bg-gray-100 text-gray-500'}"
      >
        <AlertTriangle class="w-6 h-6 {(isCritical && !isResolved) ? 'animate-pulse' : ''}" />
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-2 flex-wrap">
          <span class="px-2 py-0.5 text-xs font-medium rounded-full {levelConfig.color}">
            {levelConfig.label}
          </span>
          <StatusBadge value={risk.status} size="sm" />
          <span class="text-xs text-gray-500">{risk.riskType}</span>
        </div>

        <h3 class="text-base font-semibold text-gray-900 mb-1.5">
          {risk.reagentName} - {risk.riskType}
        </h3>

        <p class="text-sm text-gray-600 mb-3">
          {risk.description}
        </p>

        {#if risk.resolution}
          <div class="bg-success-50 border border-success-200 rounded-lg p-3 mb-3">
            <div class="text-xs font-medium text-success-700 mb-1">处理措施</div>
            <p class="text-sm text-success-800">{risk.resolution}</p>
          </div>
        {/if}

        <div class="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <div class="flex items-center gap-1">
            <User class="w-3.5 h-3.5" />
            <span>责任人: {risk.userName}</span>
          </div>
          <div class="flex items-center gap-1">
            <Clock class="w-3.5 h-3.5" />
            <span>{formatDateShort(risk.createdAt)}</span>
          </div>
          {#if risk.resolvedAt}
            <div class="flex items-center gap-1 text-success-600">
              <CheckCircle class="w-3.5 h-3.5" />
              <span>已解决: {formatDateShort(risk.resolvedAt)}</span>
            </div>
          {/if}
        </div>

        {#if !isResolved}
          <div class="flex items-center gap-2">
            {#if !isProcessing && onProcess}
              <button
                on:click={() => onProcess?.(risk.id)}
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
              >
                <PlayCircle class="w-3.5 h-3.5" />
                开始处理
              </button>
            {/if}
            {#if isProcessing && onResolve}
              <button
                on:click={() => showResolution = !showResolution}
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-success-600 hover:bg-success-700 rounded-lg transition-colors"
              >
                <CheckCircle class="w-3.5 h-3.5" />
                提交处理结果
              </button>
            {/if}
          </div>

          {#if showResolution}
            <div class="mt-3 space-y-2">
              <textarea
                bind:value={resolutionText}
                placeholder="请描述处理措施和结果..."
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                rows={3}
              />
              <div class="flex gap-2">
                <button
                  on:click={handleResolve}
                  disabled={!resolutionText.trim()}
                  class="px-4 py-1.5 text-xs font-medium text-white bg-success-600 hover:bg-success-700 disabled:bg-gray-300 rounded-lg transition-colors"
                >
                  确认提交
                </button>
                <button
                  on:click={() => showResolution = false}
                  class="px-4 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
</div>

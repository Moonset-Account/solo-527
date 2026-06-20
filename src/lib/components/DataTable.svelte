<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import StatusBadge from './StatusBadge.svelte';
  import type { Column, CellRenderData, ActionConfig, Status, HazardLevel } from '$types';
  import { cn, reagentCategoryMap, hazardLevelMap, complianceTypeMap } from '$utils/format';
  import type { Snippet } from 'svelte';

  type ItemType = Record<string, unknown>;

  const {
    data = [],
    columns = [],
    emptyMessage = '暂无数据',
    loading = false,
    actions = undefined
  } = $props<{
    data?: ItemType[];
    columns?: Column<ItemType>[];
    emptyMessage?: string;
    loading?: boolean;
    actions?: Snippet<[ItemType]>;
  }>();

  let isMobile = $state(false);
  let resizeObserver: ResizeObserver | null = null;
  let containerRef: HTMLDivElement | undefined = undefined;

  const checkMobile = () => {
    isMobile = window.innerWidth < 768;
  };

  onMount(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);

    if (containerRef) {
      resizeObserver = new ResizeObserver(checkMobile);
      resizeObserver.observe(containerRef);
    }
  });

  onDestroy(() => {
    window.removeEventListener('resize', checkMobile);
    resizeObserver?.disconnect();
  });

  function isCellRenderData(value: unknown): value is CellRenderData {
    return typeof value === 'object' && value !== null && 'text' in value;
  }

  function isActionConfig(value: unknown): value is ActionConfig {
    return typeof value === 'object' && value !== null && (value as ActionConfig).type === 'actions';
  }

  function getCellValue(item: Record<string, unknown>, column: Column<Record<string, unknown>>) {
    if (column.render) {
      return column.render(item);
    }
    const value = item[column.key as string];
    return value ?? '-';
  }

  function getCellDisplayValue(item: Record<string, unknown>, column: Column<Record<string, unknown>>) {
    const value = getCellValue(item, column);
    if (isCellRenderData(value)) {
      return value.text;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }
    return '-';
  }

  function getCellClassName(item: Record<string, unknown>, column: Column<Record<string, unknown>>): string | undefined {
    const value = getCellValue(item, column);
    if (isCellRenderData(value)) {
      return value.className;
    }
    return undefined;
  }

  function isBadgeType(item: Record<string, unknown>, column: Column<Record<string, unknown>>) {
    const value = getCellValue(item, column);
    if (isCellRenderData(value)) {
      return value.type === 'badge';
    }
    return false;
  }

  function isActionsColumn(item: Record<string, unknown>, column: Column<Record<string, unknown>>) {
    if (column.key === 'actions') {
      const value = getCellValue(item, column);
      return isActionConfig(value);
    }
    return false;
  }

  function isStatusKey(key: string | number | symbol) {
    return String(key).toLowerCase().includes('status');
  }

  function isPersonKey(key: string | number | symbol) {
    const k = String(key).toLowerCase();
    return k.includes('operator') || k.includes('assignee') || k.includes('user') || k.includes('负责人');
  }

  function isHazardLevelKey(key: string | number | symbol) {
    return String(key).toLowerCase() === 'hazardlevel' || String(key).toLowerCase() === 'risklevel';
  }

  function isCategoryKey(key: string | number | symbol) {
    return String(key).toLowerCase() === 'category';
  }

  function isTypeKey(key: string | number | symbol) {
    return String(key).toLowerCase() === 'type';
  }

  function isRiskTypeKey(key: string | number | symbol) {
    return String(key).toLowerCase() === 'risktype';
  }

  function isStockKey(key: string | number | symbol) {
    return String(key).toLowerCase() === 'stock';
  }

  function getBadgeConfig(item: Record<string, unknown>, column: Column<Record<string, unknown>>) {
    const key = String(column.key).toLowerCase();
    const value = item[column.key as string];

    if (isHazardLevelKey(key) && value) {
      return hazardLevelMap[value as keyof typeof hazardLevelMap];
    }
    if (isCategoryKey(key) && value) {
      return reagentCategoryMap[value as keyof typeof reagentCategoryMap];
    }
    if (isTypeKey(key) && value) {
      return complianceTypeMap[value as keyof typeof complianceTypeMap];
    }
    if (isRiskTypeKey(key) && value) {
      const riskTypeColors: Record<string, { label: string; color: string }> = {
        '超量领用': { label: '超量领用', color: 'bg-red-100 text-red-700' },
        '存储异常': { label: '存储异常', color: 'bg-orange-100 text-orange-700' },
        '操作不规范': { label: '操作不规范', color: 'bg-yellow-100 text-yellow-700' },
        '过期提醒': { label: '过期提醒', color: 'bg-blue-100 text-blue-700' }
      };
      return riskTypeColors[String(value)] || { label: String(value), color: 'bg-gray-100 text-gray-700' };
    }
    return null;
  }

  function getStockDisplay(item: Record<string, unknown>, column: Column<Record<string, unknown>>) {
    const stock = item[column.key as string] as number;
    const unit = item['unit'] as string;
    const isLow = stock < 100;
    return {
      text: `${stock} ${unit || ''}`,
      className: isLow ? 'text-red-600 font-medium' : 'text-gray-900'
    };
  }
</script>

<div bind:this={containerRef} class="w-full">
  {#if loading}
    <div class="animate-pulse space-y-3">
      {#each Array(5) as _}
        <div class="h-12 bg-gray-100 rounded-md"></div>
      {/each}
    </div>
  {:else if data.length === 0}
    <div class="text-center py-12 text-gray-500">
      <div class="text-4xl mb-2">📭</div>
      <p>{emptyMessage}</p>
    </div>
  {:else if !isMobile}
    <div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            {#each columns as column}
              <th
                class={cn(
                  'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider',
                  column.className
                )}
              >
                {column.label}
              </th>
            {/each}
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each data as item, idx}
            <tr
              class="hover:bg-primary-50/50 transition-colors duration-150 {idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}"
            >
              {#each columns as column}
                <td class={cn('px-4 py-3 whitespace-nowrap text-sm', column.className)}>
                  {#if column.key === 'status'}
                    {@const statusVal = item[column.key] as string}
                    <StatusBadge value={statusVal} size="sm" />
                  {:else if isHazardLevelKey(column.key)}
                    {@const hazardVal = item[column.key] as string}
                    <StatusBadge type="hazard" value={hazardVal} size="sm" />
                  {:else if isCategoryKey(column.key) || isTypeKey(column.key) || isRiskTypeKey(column.key)}
                    {@const badgeConfig = getBadgeConfig(item, column)}
                    {#if badgeConfig}
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {badgeConfig.color}">
                        {badgeConfig.label}
                      </span>
                    {:else}
                      {getCellDisplayValue(item, column)}
                    {/if}
                  {:else if isStockKey(column.key)}
                    {@const stockDisplay = getStockDisplay(item, column)}
                    <span class={stockDisplay.className}>
                      {stockDisplay.text}
                    </span>
                  {:else if isBadgeType(item, column)}
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {getCellClassName(item, column)}">
                      {getCellDisplayValue(item, column)}
                    </span>
                  {:else if isActionsColumn(item, column) && actions}
                    {@render actions?.(item)}
                  {:else}
                    <span class={getCellClassName(item, column)}>
                      {getCellDisplayValue(item, column)}
                    </span>
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="space-y-3">
      {#each data as item}
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow duration-200">
          <div class="flex items-start justify-between gap-3 mb-3">
            {#each columns.filter((c: Column<Record<string, unknown>>) => c.required || isStatusKey(c.key) || isPersonKey(c.key)).slice(0, 2) as column}
              <div>
                {#if column.key === 'status'}
                  {@const statusVal = item[column.key] as string}
                  <StatusBadge value={statusVal} size="md" />
                {:else if isHazardLevelKey(column.key)}
                  {@const hazardVal = item[column.key] as string}
                  <StatusBadge type="hazard" value={hazardVal} size="md" />
                {:else if isCategoryKey(column.key) || isTypeKey(column.key) || isRiskTypeKey(column.key)}
                  {@const badgeConfig = getBadgeConfig(item, column)}
                  <div class="text-xs text-gray-500 mb-1">{column.label}</div>
                  {#if badgeConfig}
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {badgeConfig.color}">
                      {badgeConfig.label}
                    </span>
                  {:else}
                    <div class="text-sm font-medium text-gray-900">
                      {getCellDisplayValue(item, column)}
                    </div>
                  {/if}
                {:else}
                  <div class="text-xs text-gray-500 mb-1">{column.label}</div>
                  <div class="text-sm font-medium text-gray-900">
                    {getCellDisplayValue(item, column)}
                  </div>
                {/if}
              </div>
            {/each}
          </div>

          <div class="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
            {#each columns.filter((c: Column<Record<string, unknown>>) => !c.required && !isStatusKey(c.key) && !isPersonKey(c.key) && c.key !== 'actions') as column}
              <div>
                <div class="text-xs text-gray-500 mb-0.5">{column.label}</div>
                <div class="text-sm text-gray-700">
                  {#if isHazardLevelKey(column.key)}
                    {@const hazardVal = item[column.key] as string}
                    <StatusBadge type="hazard" value={hazardVal} size="sm" />
                  {:else if isCategoryKey(column.key) || isTypeKey(column.key) || isRiskTypeKey(column.key)}
                    {@const badgeConfig = getBadgeConfig(item, column)}
                    {#if badgeConfig}
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {badgeConfig.color}">
                        {badgeConfig.label}
                      </span>
                    {:else}
                      {getCellDisplayValue(item, column)}
                    {/if}
                  {:else if isStockKey(column.key)}
                    {@const stockDisplay = getStockDisplay(item, column)}
                    <span class={stockDisplay.className}>
                      {stockDisplay.text}
                    </span>
                  {:else if isBadgeType(item, column)}
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {getCellClassName(item, column)}">
                      {getCellDisplayValue(item, column)}
                    </span>
                  {:else}
                    <span class={getCellClassName(item, column)}>
                      {getCellDisplayValue(item, column)}
                    </span>
                  {/if}
                </div>
              </div>
            {/each}
          </div>

          {#if columns.some((c: Column<Record<string, unknown>>) => c.key === 'actions') && actions}
            <div class="pt-3 mt-3 border-t border-gray-100">
              {@render actions?.(item)}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

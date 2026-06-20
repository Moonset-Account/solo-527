<script lang="ts">
  import { statusMap, priorityMap, hazardLevelMap } from '$utils/format';
  import type { Status, Priority, HazardLevel } from '$types';

  type BadgeType = 'status' | 'priority' | 'hazard';

  const { type = 'status', value, size = 'md' } = $props<{
    type?: BadgeType;
    value: Status | Priority | HazardLevel | string;
    size?: 'sm' | 'md';
  }>();

  let badgeConfig = $derived<{ label: string; color: string }>(
    (() => {
      const v = value as string;
      if (type === 'status') {
        return statusMap[v as Status] || { label: v, color: 'bg-gray-100 text-gray-700 border-gray-300' };
      }
      if (type === 'priority') {
        return priorityMap[v as Priority] || { label: v, color: 'bg-gray-100 text-gray-700' };
      }
      return hazardLevelMap[v as HazardLevel] || { label: v, color: 'bg-gray-100 text-gray-700' };
    })()
  );

  let sizeClasses = $derived(size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs');
</script>

<span
  class="inline-flex items-center font-medium rounded-full border transition-all duration-200 {sizeClasses} {badgeConfig?.color}"
>
  {badgeConfig?.label}
</span>

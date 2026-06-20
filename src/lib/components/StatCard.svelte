<script lang="ts">
  const {
    title,
    value,
    icon,
    trend,
    trendValue,
    color = 'blue'
  } = $props<{
    title: string;
    value: string | number;
    icon: any;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'indigo';
  }>();

  const colorClasses = {
    blue: {
      bg: 'bg-primary-50',
      icon: 'text-primary-600 bg-primary-100',
      text: 'text-primary-600'
    },
    green: {
      bg: 'bg-success-50',
      icon: 'text-success-600 bg-success-100',
      text: 'text-success-600'
    },
    orange: {
      bg: 'bg-warning-50',
      icon: 'text-warning-600 bg-warning-100',
      text: 'text-warning-600'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600 bg-purple-100',
      text: 'text-purple-600'
    },
    red: {
      bg: 'bg-danger-50',
      icon: 'text-danger-600 bg-danger-100',
      text: 'text-danger-600'
    },
    indigo: {
      bg: 'bg-indigo-50',
      icon: 'text-indigo-600 bg-indigo-100',
      text: 'text-indigo-600'
    }
  };

  let classes = $derived(colorClasses[color as keyof typeof colorClasses]);
</script>

<div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow duration-300 animate-fade-in">
  <div class="flex items-start justify-between">
    <div>
      <p class="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <p class="text-3xl font-bold text-gray-900 font-mono">{value}</p>
      {#if trend && trendValue}
        <p class="text-xs mt-1 {trend === 'up' ? 'text-success-600' : trend === 'down' ? 'text-danger-600' : 'text-gray-500'}">
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
        </p>
      {/if}
    </div>
    <div class="w-12 h-12 rounded-xl flex items-center justify-center {classes.icon}">
      {#if icon}
        {@const Icon = icon}
        <Icon class="w-6 h-6" />
      {/if}
    </div>
  </div>
</div>
